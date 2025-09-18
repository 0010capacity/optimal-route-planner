/**
 * 경로 최적화 알고리즘 모음
 * TSP 문제 해결을 위한 다양한 접근법 제공
 */

import getPermutations from './getPermutations.js';
import { performanceMonitor } from './performanceMonitor.js';
import { apiCache, generateDistanceMatrixCacheKey } from './apiCache.js';

/**
 * 좌표 기반 유클리드 거리 계산 (단위: km)
 * @param {Object} coord1 - {lat, lng}
 * @param {Object} coord2 - {lat, lng}
 * @returns {number} 거리 (km)
 */
export const calculateEuclideanDistance = (coord1, coord2) => {
  const R = 6371; // 지구 반지름 (km)
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
  const dLon = (coord2.lng - coord1.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * 좌표 기반 거리 필터링 (API 호출 전 사전 제외)
 * @param {Array} locations - 위치 배열
 * @param {number} thresholdMultiplier - 임계값 배수 (기본: 1.5)
 * @returns {Object} 필터링 결과 {validPairs, threshold, distances}
 */
export const filterByEuclideanDistance = (locations, thresholdMultiplier = 1.5) => {
  const n = locations.length;
  const distances = Array(n).fill().map(() => Array(n).fill(0));
  
  // 모든 쌍의 유클리드 거리 계산
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        distances[i][j] = 0;
      } else {
        distances[i][j] = calculateEuclideanDistance(locations[i].coords, locations[j].coords);
      }
    }
  }
  
  // 평균 거리 계산 (대각선 제외)
  let totalDist = 0;
  let count = 0;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      totalDist += distances[i][j];
      count++;
    }
  }
  const avgDist = totalDist / count;
  const threshold = avgDist * thresholdMultiplier;
  
  // 유효한 쌍 필터링 (임계값 이하인 쌍만 유지)
  const validPairs = new Set();
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i !== j && distances[i][j] <= threshold) {
        validPairs.add(`${i}-${j}`);
      }
    }
  }
  
  return { distances, validPairs, threshold, avgDist };
};

/**
 * 혼합 최적화 전략
 * 소규모: 직접 계산, 중규모: 완전탐색, 대규모: Branch & Bound
 */
export class HybridOptimizer {
  /**
   * 경유지 수에 따른 최적 알고리즘 선택
   * @param {Array} locations - 위치 배열
   * @param {Function} getDirections - API 호출 함수
   * @param {Function} onProgress - 진행률 콜백 함수
   * @returns {Object} 최적화 결과
   */
  static async optimize(locations, getDirections, onProgress = null) {
    const operationId = `optimize_${Date.now()}`;
    performanceMonitor.startTimer(operationId);
    performanceMonitor.trackMemoryUsage('start');

    const waypointCount = locations.length - 2; // 출발지, 도착지 제외

    // 전체 장소 최대 개수 제한 (12개)
    if (locations.length > 12) {
      console.error(`장소 개수가 너무 많습니다. 최대 12개까지 지원합니다. (현재: ${locations.length}개)`);
      return {
        error: 'TOO_MANY_LOCATIONS',
        message: `장소 개수가 너무 많습니다. 최대 12개까지 지원합니다. (현재: ${locations.length}개)`,
        maxLocations: 12,
        currentLocations: locations.length
      };
    }

    let result = null;
    let apiCalls = 0;
    let method = '';

    try {
      if (waypointCount <= 0) {
        // 2개 지점만 있는 경우
        result = await HybridOptimizer.optimizeTwoPoints(locations, getDirections, onProgress);
        method = 'direct';
        apiCalls = 1;
      } else if (waypointCount <= 3) {
        // Brute Force 최적화 (완전 탐색으로 정확한 최적해 보장) - 3개 경유지까지만
        result = await HybridOptimizer.optimizeBruteForce(locations, getDirections, onProgress);
        method = 'brute_force';
        apiCalls = result?.apiCalls || 0;
      } else if (waypointCount <= 10) {
        // Branch and Bound 최적화 (정확한 최적해 보장) - 4-10개 경유지
        result = await HybridOptimizer.optimizeBranchAndBound(locations, getDirections, onProgress);
        method = 'branch_and_bound';
        apiCalls = result?.apiCalls || 0;
      }

      return result;
    } finally {
      // 성능 모니터링
      const duration = performanceMonitor.endTimer(operationId, {
        locationCount: locations.length,
        waypointCount,
        method,
        apiCalls
      })?.duration || 0;

      performanceMonitor.trackOptimization(
        locations.length,
        waypointCount,
        method,
        apiCalls,
        duration,
        result?.iterations || result?.nodesExplored || 0
      );

      performanceMonitor.trackMemoryUsage('end');
    }
  }

  /**
   * 2개 지점 최적화
   */
  static async optimizeTwoPoints(locations, getDirections, onProgress = null) {
    const coordsArray = locations.map(loc => loc.coords);
    const namesArray = locations.map(loc => loc.name);
    
    const result = await getDirections(coordsArray, namesArray, 3, onProgress);
    if (result) {
      return {
        optimizedLocations: locations,
        routeData: result,
        optimizationMethod: 'direct',
        apiCalls: 1
      };
    }
    return null;
  }

  /**
   * Branch and Bound 최적화 (정확한 최적해 보장)
   */
  static async optimizeBranchAndBound(locations, getDirections, onProgress = null) {
    const n = locations.length;

    // 유클리드 필터링 제거 - 최적해 보장을 위해 모든 지점 사용
    const filteredLocations = locations; // 모든 지점 사용
    const filteredN = filteredLocations.length;

    // 1단계: 거리 행렬 구축 (O(n²) API 호출)
    const distanceMatrix = await HybridOptimizer.buildDistanceMatrix(filteredLocations, getDirections, onProgress);
    const apiCallsForMatrix = filteredN * (filteredN - 1) / 2; // 대칭이므로 절반만

    // 2단계: Branch and Bound 알고리즘 적용
    const bbOptimizer = new BranchAndBoundOptimizer(distanceMatrix, filteredLocations);
    const bbResult = bbOptimizer.optimize(0, filteredN - 1);

    if (!bbResult) {
      console.error('Branch and Bound optimization failed');
      return null;
    }

    // 3단계: 거리 행렬 데이터로 최종 결과 구성 (API 호출 없음)
    const finalLocations = bbResult.route.map(index => filteredLocations[index]);
    const totalTime = bbResult.totalDistance; // Branch & Bound에서 계산된 총 시간
    const totalDistance = bbResult.totalDistance;
    
    // 경로 포인트는 각 지점의 좌표로 구성
    const path = finalLocations.map(loc => loc.coords);
    
    // 구간별 시간과 거리 계산
    const segmentTimes = [];
    const segmentDistances = [];
    
    for (let i = 0; i < bbResult.route.length - 1; i++) {
      const from = bbResult.route[i];
      const to = bbResult.route[i + 1];
      const segmentTime = distanceMatrix[from][to] || 0;
      segmentTimes.push(segmentTime);
      segmentDistances.push(segmentTime); // 시간을 거리로 사용
    }

    const finalResult = {
      totalTime: totalTime,
      totalDistance: totalDistance,
      path: path,
      segmentTimes: segmentTimes,
      segmentDistances: segmentDistances,
      tollFare: 0,
      taxiFare: 0,
      fuelPrice: 0
    };

    return {
      optimizedLocations: finalLocations,
      routeData: finalResult,
      optimizationMethod: 'branch_and_bound',
      apiCalls: apiCallsForMatrix,  // API 호출은 거리 행렬 구축용만
      nodesExplored: bbResult.nodesExplored,
      duration: bbResult.duration,
      distanceMatrix: distanceMatrix
    };
  }

  /**
   * 완전탐색 최적화 (거리 행렬 기반)
   */
  static async optimizeBruteForce(locations, getDirections, onProgress = null) {
    const n = locations.length;
    const filteredLocations = locations; // 모든 지점 사용
    const filteredN = filteredLocations.length;

    // 1단계: 거리 행렬 구축 (O(n²) API 호출)
    const distanceMatrix = await HybridOptimizer.buildDistanceMatrix(filteredLocations, getDirections, onProgress);
    const apiCallsForMatrix = filteredN * (filteredN - 1) / 2; // 대칭이므로 절반만

    // 2단계: 모든 순열에 대해 거리 행렬을 이용하여 비용 계산
    const waypoints = filteredLocations.slice(1, -1); // 시작점과 끝점 제외한 경유지들
    const filteredPermutations = getPermutations(waypoints);
    
    let bestRoute = null;
    let bestTime = Infinity;
    let bestRouteIndices = null;

    for (const perm of filteredPermutations) {
      // 순열에 시작점(0)과 끝점(n-1) 추가
      const routeIndices = [0, ...perm.map(loc => filteredLocations.indexOf(loc)), filteredN - 1];
      
      // 거리 행렬을 사용하여 총 시간 계산
      let totalTime = 0;
      for (let i = 0; i < routeIndices.length - 1; i++) {
        const from = routeIndices[i];
        const to = routeIndices[i + 1];
        totalTime += distanceMatrix[from][to] || Infinity;
      }

      // 진행률 업데이트
      if (onProgress) {
        const currentProgress = apiCallsForMatrix + (filteredPermutations.indexOf(perm) + 1);
        const totalProgress = apiCallsForMatrix + filteredPermutations.length;
        onProgress(currentProgress, totalProgress);
      }

      if (totalTime < bestTime) {
        bestTime = totalTime;
        bestRouteIndices = routeIndices;
        bestRoute = routeIndices.map(index => filteredLocations[index]);
      }
    }

    if (!bestRoute) {
      console.error('Brute force optimization failed');
      return null;
    }

    // 3단계: 거리 행렬 데이터로 최종 결과 구성 (API 호출 없음)
    const totalTime = bestTime;
    const totalDistance = bestTime; // 시간을 거리로 사용 (실제로는 시간 기반)
    
    // 경로 포인트는 각 지점의 좌표로 구성
    const path = bestRoute.map(loc => loc.coords);
    
    // 구간별 시간과 거리 계산
    const segmentTimes = [];
    const segmentDistances = [];
    
    for (let i = 0; i < bestRouteIndices.length - 1; i++) {
      const from = bestRouteIndices[i];
      const to = bestRouteIndices[i + 1];
      const segmentTime = distanceMatrix[from][to] || 0;
      segmentTimes.push(segmentTime);
      segmentDistances.push(segmentTime); // 시간을 거리로 사용
    }

    const finalResult = {
      totalTime: totalTime,
      totalDistance: totalDistance,
      path: path,
      segmentTimes: segmentTimes,
      segmentDistances: segmentDistances,
      tollFare: 0,
      taxiFare: 0,
      fuelPrice: 0
    };

    return {
      optimizedLocations: bestRoute,
      routeData: finalResult,
      optimizationMethod: 'brute_force',
      apiCalls: apiCallsForMatrix,  // API 호출은 거리 행렬 구축용만
      iterations: filteredPermutations.length,
      distanceMatrix: distanceMatrix
    };
  }

  /**
   * TSP DP 최적화 (유클리드 거리 기반 필터링 적용)
   */
  static async optimizeTSPDP(locations, getDirections, onProgress = null) {
    const n = locations.length;

    // 유클리드 필터링 제거 - 최적해 보장을 위해 모든 지점 사용
    const filteredLocations = locations; // 모든 지점 사용
    const filteredN = filteredLocations.length;

    // 1단계: 거리 행렬 구축 (O(n²) API 호출)
    const distanceMatrix = await HybridOptimizer.buildDistanceMatrix(filteredLocations, getDirections, onProgress);
    const apiCallsForMatrix = filteredN * (filteredN - 1) / 2; // 대칭이므로 절반만

    // 2단계: TSP DP 알고리즘 적용
    const tspOptimizer = new TSPOptimizer(distanceMatrix, filteredLocations);
    const tspResult = tspOptimizer.optimize();

    if (!tspResult) {
      console.error('TSP DP optimization failed');
      return null;
    }

    // 3단계: 거리 행렬 데이터로 최종 결과 구성 (API 호출 없음)
    const finalLocations = tspResult.route.map(index => filteredLocations[index]);
    const totalTime = tspResult.totalDistance;
    const totalDistance = tspResult.totalDistance;
    
    // 경로 포인트는 각 지점의 좌표로 구성
    const path = finalLocations.map(loc => loc.coords);
    
    // 구간별 시간과 거리 계산
    const segmentTimes = [];
    const segmentDistances = [];
    
    for (let i = 0; i < tspResult.route.length - 1; i++) {
      const from = tspResult.route[i];
      const to = tspResult.route[i + 1];
      const segmentTime = distanceMatrix[from][to] || 0;
      segmentTimes.push(segmentTime);
      segmentDistances.push(segmentTime);
    }

    const finalResult = {
      totalTime: totalTime,
      totalDistance: totalDistance,
      path: path,
      segmentTimes: segmentTimes,
      segmentDistances: segmentDistances,
      tollFare: 0,
      taxiFare: 0,
      fuelPrice: 0
    };

    return {
      optimizedLocations: finalLocations,
      routeData: finalResult,
      optimizationMethod: 'tsp_dp',
      apiCalls: apiCallsForMatrix,  // API 호출은 거리 행렬 구축용만
      iterations: 0, // DP는 반복이 없음
      distanceMatrix: distanceMatrix
    };
  }





  /**
   * 거리 행렬 구축 (배치 처리로 API 호출 최적화)
   */
  static async buildDistanceMatrix(locations, getDirections, onProgress = null) {
    const n = locations.length;
    const cacheKey = generateDistanceMatrixCacheKey(locations);

    // 캐시에서 거리 행렬 확인
    const cachedMatrix = apiCache.get('distance_matrix', { locations: cacheKey });
    if (cachedMatrix) {
      return cachedMatrix;
    }

    const matrix = Array(n).fill().map(() => Array(n).fill(0));
    const batchSize = 10; // 배치 크기
    let apiCallCount = 0;

    // 대각선은 0으로 설정
    for (let i = 0; i < n; i++) {
      matrix[i][i] = 0;
    }

    // 상삼각 행렬의 모든 API 호출을 수집
    const apiCalls = [];
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        apiCalls.push({ i, j });
      }
    }

    const totalCalls = apiCalls.length;

    // 배치별로 API 호출 처리
    for (let batchStart = 0; batchStart < apiCalls.length; batchStart += batchSize) {
      const batchEnd = Math.min(batchStart + batchSize, apiCalls.length);
      const batch = apiCalls.slice(batchStart, batchEnd);

      // 현재 배치의 모든 API 호출을 Promise.all로 병렬 처리
      const promises = batch.map(async ({ i, j }) => {
        const coordsArray = [locations[i].coords, locations[j].coords];
        const namesArray = [locations[i].name, locations[j].name];
        
        try {
          const result = await getDirections(coordsArray, namesArray, 3, onProgress);
          return { i, j, result };
        } catch (error) {
          console.warn(`API call failed for ${i}-${j}:`, error);
          return { i, j, result: null };
        }
      });

      // 배치 처리 완료 대기
      const results = await Promise.all(promises);

      // 결과를 매트릭스에 반영
      results.forEach(({ i, j, result }) => {
        apiCallCount++;
        
        if (result) {
          matrix[i][j] = result.totalTime;
          matrix[j][i] = result.totalTime; // 대칭 복사
        } else {
          matrix[i][j] = Infinity;
          matrix[j][i] = Infinity;
        }
      });

      // 진행률 업데이트
      if (onProgress) {
        onProgress(apiCallCount, totalCalls);
      }

      // 배치 간 짧은 지연 (API 서버 부하 방지)
      if (batchEnd < apiCalls.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // 계산된 행렬을 캐시에 저장
    apiCache.set('distance_matrix', { locations: cacheKey }, matrix);

    return matrix;
  }

}

/**
 * TSP DP(Dynamic Programming) 최적화 알고리즘
 * 정확한 최적해를 보장하지만 n이 클 경우 계산 시간이 오래 걸림
 */
export class TSPOptimizer {
  constructor(distanceMatrix, locations) {
    this.distanceMatrix = distanceMatrix;
    this.locations = locations;
    this.n = locations.length;
  }

  /**
   * TSP DP 알고리즘으로 최적 경로 계산
   * 시작점(0)과 끝점(n-1)을 고려한 TSP
   * @returns {Object} 최적화된 경로와 총 거리
   */
  optimize() {
    const startTime = performance.now();
    const n = this.n;
    const INF = Infinity;

    // DP 테이블: dp[mask][pos] = mask 집합을 방문하고 현재 pos에 있을 때의 최소 비용
    const dp = Array(1 << n).fill().map(() => Array(n).fill(INF));
    const prev = Array(1 << n).fill().map(() => Array(n).fill(-1)); // 경로 복원을 위한 이전 상태

    // 시작점 초기화
    dp[1 << 0][0] = 0;

    // DP 테이블 채우기
    let operations = 0;
    for (let mask = 0; mask < (1 << n); mask++) {
      for (let pos = 0; pos < n; pos++) {
        if (dp[mask][pos] === INF) continue;

        // 다음 방문할 도시들
        for (let next = 0; next < n; next++) {
          if ((mask & (1 << next)) !== 0) continue; // 이미 방문한 도시

          const newMask = mask | (1 << next);
          const cost = this.distanceMatrix[pos][next];

          if (cost < INF && dp[mask][pos] + cost < dp[newMask][next]) {
            dp[newMask][next] = dp[mask][pos] + cost;
            prev[newMask][next] = pos;
          }
          operations++;
        }
      }
    }

    // 최적 경로 찾기 (끝점이 n-1이어야 함)
    const fullMask = (1 << n) - 1;
    const endPos = n - 1;

    if (dp[fullMask][endPos] === INF) {
      console.error('TSP DP: No valid path found to end point');
      return null;
    }

    const minCost = dp[fullMask][endPos];

    // 경로 복원
    const route = this.reconstructPath(prev, fullMask, endPos);

    const endTime = performance.now();
    const duration = endTime - startTime;

    return {
      route: route,
      totalDistance: minCost,
      method: 'tsp_dp',
      operations: operations,
      duration: duration
    };
  }

  /**
   * DP 테이블에서 최적 경로 복원
   */
  reconstructPath(prev, mask, pos) {
    const path = [];
    let currentMask = mask;
    let currentPos = pos;

    while (currentPos !== -1) {
      path.unshift(currentPos);
      const nextPos = prev[currentMask][currentPos];

      if (nextPos === -1) break;

      currentMask ^= (1 << currentPos); // 현재 위치 비트 제거
      currentPos = nextPos;
    }

    return path;
  }

  /**
   * 경로의 총 거리 계산 (디버깅용)
   */
  calculateRouteDistance(route) {
    let totalDistance = 0;
    for (let i = 0; i < route.length - 1; i++) {
      const from = route[i];
      const to = route[i + 1];
      totalDistance += this.distanceMatrix[from][to] || Infinity;
    }
    return totalDistance;
  }
}

/**
 * Branch and Bound 최적화 알고리즘
 * 정확한 최적해를 보장하면서 TSP DP보다 효율적인 가지치기 사용
 */
export class BranchAndBoundOptimizer {
  constructor(distanceMatrix, locations) {
    this.distanceMatrix = distanceMatrix;
    this.locations = locations;
    this.n = locations.length;
    this.bestCost = Infinity;
    this.bestRoute = null;
    this.nodesExplored = 0;
  }

  /**
   * Branch and Bound 알고리즘으로 최적 경로 계산
   * @param {number} startIndex - 시작점 인덱스
   * @param {number} endIndex - 끝점 인덱스
   * @returns {Object} 최적화된 경로와 총 거리
   */
  optimize(startIndex, endIndex) {
    const startTime = performance.now();
    this.bestCost = Infinity;
    this.bestRoute = null;
    this.nodesExplored = 0;

    // 방문하지 않은 노드들 초기화
    const unvisited = new Set();
    for (let i = 0; i < this.n; i++) {
      if (i !== startIndex && i !== endIndex) {
        unvisited.add(i);
      }
    }

    // Branch and Bound 재귀 탐색 시작
    this.branchAndBound([startIndex], unvisited, endIndex, 0);

    const endTime = performance.now();
    const duration = endTime - startTime;

    if (this.bestRoute) {
      return {
        route: this.bestRoute,
        totalDistance: this.bestCost,
        method: 'branch_and_bound',
        nodesExplored: this.nodesExplored,
        duration: duration
      };
    } else {
      console.error('Branch and Bound: No valid path found');
      return null;
    }
  }

  /**
   * Branch and Bound 재귀 함수
   * @param {number[]} currentRoute - 현재까지의 경로
   * @param {Set} unvisited - 방문하지 않은 노드들
   * @param {number} endIndex - 끝점 인덱스
   * @param {number} currentCost - 현재까지의 비용
   */
  branchAndBound(currentRoute, unvisited, endIndex, currentCost) {
    this.nodesExplored++;

    // 가지치기 1: 현재 비용이 이미 찾은 최적 비용보다 크면 중단
    if (this.bestCost !== Infinity && currentCost >= this.bestCost) {
      return;
    }

    const currentPos = currentRoute[currentRoute.length - 1];

    // 종료 조건: 모든 지점을 방문한 경우
    if (unvisited.size === 0) {
      const finalCost = currentCost + this.distanceMatrix[currentPos][endIndex];
      if (finalCost < this.bestCost) {
        this.bestCost = finalCost;
        this.bestRoute = [...currentRoute, endIndex];
      }
      return;
    }

    // 가지치기 2: 하한 계산으로 더 이상 탐색할 필요가 없으면 중단
    if (this.bestCost !== Infinity) {
      const lowerBound = this.calculateLowerBound(currentRoute, unvisited, endIndex, currentCost);
      if (lowerBound >= this.bestCost) {
        return;
      }
    }

    // 다음 방문할 노드들 탐색 (가장 가까운 노드부터 우선 탐색)
    const candidates = Array.from(unvisited).sort((a, b) => {
      const costA = this.distanceMatrix[currentPos][a];
      const costB = this.distanceMatrix[currentPos][b];
      return costA - costB;
    });

    for (const next of candidates) {
      const newUnvisited = new Set(unvisited);
      newUnvisited.delete(next);

      const newCost = currentCost + this.distanceMatrix[currentPos][next];
      const newRoute = [...currentRoute, next];

      this.branchAndBound(newRoute, newUnvisited, endIndex, newCost);
    }
  }

  /**
   * 하한 계산 (Lower Bound)
   * MST(Minimum Spanning Tree) 기반 + 남은 최소 비용 추정
   */
  calculateLowerBound(currentRoute, unvisited, endIndex, currentCost) {
    if (unvisited.size === 0) {
      return currentCost + this.distanceMatrix[currentRoute[currentRoute.length - 1]][endIndex];
    }

    // 1. 현재 위치에서 끝점까지의 최소 비용
    const currentPos = currentRoute[currentRoute.length - 1];
    const toEndCost = this.distanceMatrix[currentPos][endIndex];

    // 2. 방문하지 않은 노드들 간의 MST 비용 계산
    const remainingNodes = Array.from(unvisited);
    let mstCost = 0;

    if (remainingNodes.length > 1) {
      // Prim's 알고리즘으로 MST 계산
      mstCost = this.calculateMSTCost(remainingNodes);
    }

    // 3. 방문하지 않은 각 노드에서 가장 가까운 방문한 노드까지의 비용
    let minConnectionCost = 0;
    for (const node of remainingNodes) {
      let minCost = Infinity;
      for (const visited of currentRoute) {
        minCost = Math.min(minCost, this.distanceMatrix[visited][node]);
      }
      // 끝점과의 거리도 고려
      minCost = Math.min(minCost, this.distanceMatrix[node][endIndex]);
      minConnectionCost += minCost;
    }

    // 하한 = 현재 비용 + MST 비용 + 연결 비용 + 끝점까지 비용
    const lowerBound = currentCost + mstCost + minConnectionCost + toEndCost;

    return lowerBound;
  }

  /**
   * 방문하지 않은 노드들의 MST(Minimum Spanning Tree) 비용 계산
   * Prim's 알고리즘 사용
   */
  calculateMSTCost(nodes) {
    if (nodes.length <= 1) return 0;

    const n = nodes.length;
    const visited = new Set([0]); // 첫 번째 노드를 시작점으로
    const distances = new Array(n).fill(Infinity);
    distances[0] = 0;

    let totalCost = 0;

    for (let i = 1; i < n; i++) {
      // 방문하지 않은 노드 중 가장 가까운 노드 찾기
      let minDist = Infinity;
      let minIndex = -1;

      for (let j = 0; j < n; j++) {
        if (!visited.has(j) && distances[j] < minDist) {
          minDist = distances[j];
          minIndex = j;
        }
      }

      if (minIndex === -1) break;

      visited.add(minIndex);
      totalCost += minDist;

      // 다른 방문하지 않은 노드들의 거리 업데이트
      for (let j = 0; j < n; j++) {
        if (!visited.has(j)) {
          const actualNodeA = nodes[minIndex]; // 실제 distanceMatrix 인덱스
          const actualNodeB = nodes[j];       // 실제 distanceMatrix 인덱스
          const dist = this.distanceMatrix[actualNodeA][actualNodeB];
          if (dist < distances[j]) {
            distances[j] = dist;
          }
        }
      }
    }

    return totalCost;
  }
}
