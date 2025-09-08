/**
 * 경로 최적화 알고리즘 모음
 * TSP 문제 해결을 위한 다양한 접근법 제공
 */

import getPermutations from './getPermutations.js';
import { performanceMonitor } from './performanceMonitor.js';

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
  
  console.log(`Euclidean filtering: ${validPairs.size}/${n*(n-1)} pairs valid (threshold: ${threshold.toFixed(2)}km, avg: ${avgDist.toFixed(2)}km)`);
  
  return { distances, validPairs, threshold, avgDist };
};

/**
 * 거리 행렬을 기반으로 한 2-opt 최적화 알고리즘
 * API 호출 횟수를 O(n²)으로 줄임
 */
export class TwoOptOptimizer {
  constructor(distanceMatrix, locations) {
    this.distanceMatrix = distanceMatrix;
    this.locations = locations;
  }

  /**
   * 2-opt 알고리즘으로 경로 최적화
   * @param {number[]} route - 초기 경로 (인덱스 배열)
   * @param {number} maxIterations - 최대 반복 횟수
   * @returns {Object} 최적화된 경로와 총 거리
   */
  optimize(route, maxIterations = 100) {
    let bestRoute = [...route];
    let bestDistance = this.calculateRouteDistance(bestRoute);
    let improved = true;
    let iterations = 0;

    while (improved && iterations < maxIterations) {
      improved = false;
      iterations++;

      for (let i = 1; i < route.length - 2; i++) {
        for (let j = i + 1; j < route.length - 1; j++) {
          const newRoute = this.twoOptSwap(bestRoute, i, j);
          const newDistance = this.calculateRouteDistance(newRoute);

          if (newDistance < bestDistance) {
            bestRoute = newRoute;
            bestDistance = newDistance;
            improved = true;
          }
        }
      }
    }

    console.log(`2-opt completed in ${iterations} iterations`);
    return {
      route: bestRoute,
      totalDistance: bestDistance,
      iterations
    };
  }

  /**
   * 2-opt 스왑 연산
   */
  twoOptSwap(route, i, j) {
    const newRoute = [...route];
    // i부터 j까지 구간을 뒤집음
    while (i < j) {
      [newRoute[i], newRoute[j]] = [newRoute[j], newRoute[i]];
      i++;
      j--;
    }
    return newRoute;
  }

  /**
   * 경로의 총 거리 계산
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
 * 가장 가까운 이웃 알고리즘 (Nearest Neighbor)
 * 빠른 초기 해 생성용
 */
export class NearestNeighborOptimizer {
  constructor(distanceMatrix, locations) {
    this.distanceMatrix = distanceMatrix;
    this.locations = locations;
  }

  /**
   * 가장 가까운 이웃 알고리즘으로 초기 경로 생성
   * @param {number} startIndex - 시작점 인덱스
   * @param {number} endIndex - 끝점 인덱스
   * @returns {number[]} 경로 인덱스 배열
   */
  generateInitialRoute(startIndex, endIndex) {
    const unvisited = new Set();
    const route = [startIndex];

    // 시작점과 끝점을 제외한 모든 점을 unvisited에 추가
    for (let i = 0; i < this.locations.length; i++) {
      if (i !== startIndex && i !== endIndex) {
        unvisited.add(i);
      }
    }

    let currentIndex = startIndex;

    // 가장 가까운 미방문 노드를 찾아 방문
    while (unvisited.size > 0) {
      let nearestIndex = -1;
      let nearestDistance = Infinity;

      for (const index of unvisited) {
        const distance = this.distanceMatrix[currentIndex][index];
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      }

      if (nearestIndex !== -1) {
        route.push(nearestIndex);
        unvisited.delete(nearestIndex);
        currentIndex = nearestIndex;
      } else {
        break;
      }
    }

    // 끝점 추가
    route.push(endIndex);
    return route;
  }
}

/**
 * 혼합 최적화 전략
 * 소규모: 완전탐색, 중규모: 2-opt, 대규모: Nearest Neighbor + 2-opt
 */
export class HybridOptimizer {
  /**
   * 경유지 수에 따른 최적 알고리즘 선택
   * @param {Array} locations - 위치 배열
   * @param {Function} getDirections - API 호출 함수
   * @returns {Object} 최적화 결과
   */
  static async optimize(locations, getDirections) {
    const operationId = `optimize_${Date.now()}`;
    performanceMonitor.startTimer(operationId);
    performanceMonitor.trackMemoryUsage('start');

    const waypointCount = locations.length - 2; // 출발지, 도착지 제외

    console.log(`Starting optimization for ${locations.length} locations (${waypointCount} waypoints)`);

    let result = null;
    let apiCalls = 0;
    let method = '';

    try {
      if (waypointCount <= 0) {
        // 2개 지점만 있는 경우
        result = await HybridOptimizer.optimizeTwoPoints(locations, getDirections);
        method = 'direct';
        apiCalls = 1;
      } else if (waypointCount <= 6) {
        // 완전탐색 (6! = 720 combinations)
        console.log('Using brute force optimization (≤6 waypoints)');
        result = await HybridOptimizer.optimizeBruteForce(locations, getDirections);
        method = 'brute_force';
        apiCalls = result?.apiCalls || 0;
      } else if (waypointCount <= 8) {
        // TSP DP 최적화 (정확한 최적해 보장)
        console.log('Using TSP DP optimization (7-8 waypoints)');
        result = await HybridOptimizer.optimizeTSPDP(locations, getDirections);
        method = 'tsp_dp';
        apiCalls = result?.apiCalls || 0;
      } else if (waypointCount <= 15) {
        // 2-opt 최적화
        console.log('Using 2-opt optimization (9-15 waypoints)');
        result = await HybridOptimizer.optimize2Opt(locations, getDirections);
        method = '2-opt';
        apiCalls = result?.apiCalls || 0;
      } else {
        // 휴리스틱 + 2-opt
        console.log('Using heuristic + 2-opt optimization (>12 waypoints)');
        result = await HybridOptimizer.optimizeHeuristic(locations, getDirections);
        method = 'heuristic';
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
        result?.iterations || 0
      );

      performanceMonitor.trackMemoryUsage('end');
    }
  }

  /**
   * 2개 지점 최적화
   */
  static async optimizeTwoPoints(locations, getDirections) {
    const coordsArray = locations.map(loc => loc.coords);
    const namesArray = locations.map(loc => loc.name);
    
    const result = await getDirections(coordsArray, namesArray);
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
   * 완전탐색 최적화 (유클리드 거리 기반 필터링 적용)
   */
  static async optimizeBruteForce(locations, getDirections) {
    const start = locations[0];
    const end = locations[locations.length - 1];
    const waypoints = locations.slice(1, -1);

    // 유클리드 거리 기반 필터링 적용
    console.log('Applying Euclidean distance filtering for brute force...');
    const { validPairs, threshold, avgDist } = filterByEuclideanDistance(locations, 2.0);

    // 필터링된 순열 생성 (유효한 쌍만 포함)
    const filteredPermutations = getPermutations(waypoints).filter(perm => {
      // 순열 내 모든 연속 쌍이 유효한지 확인
      const currentLocations = [start, ...perm, end];
      for (let i = 0; i < currentLocations.length - 1; i++) {
        const fromIndex = locations.indexOf(currentLocations[i]);
        const toIndex = locations.indexOf(currentLocations[i + 1]);
        const pairKey = `${Math.min(fromIndex, toIndex)}-${Math.max(fromIndex, toIndex)}`;
        if (!validPairs.has(pairKey)) {
          return false; // 유효하지 않은 쌍이 있으면 제외
        }
      }
      return true;
    });

    console.log(`Filtered ${getPermutations(waypoints).length} -> ${filteredPermutations.length} permutations (threshold: ${threshold.toFixed(2)}km, avg: ${avgDist.toFixed(2)}km)`);

    let bestRoute = null;
    let bestTime = Infinity;
    let apiCallCount = 0;

    console.log(`Testing ${filteredPermutations.length} filtered permutations...`);

    for (const perm of filteredPermutations) {
      const currentLocations = [start, ...perm, end];
      const coordsArray = currentLocations.map(loc => loc.coords);
      const namesArray = currentLocations.map(loc => loc.name);

      const result = await getDirections(coordsArray, namesArray);
      apiCallCount++;

      if (result && result.totalTime < bestTime) {
        bestTime = result.totalTime;
        bestRoute = {
          optimizedLocations: currentLocations,
          routeData: result,
          waypointsOrder: perm
        };
      }
    }

    if (bestRoute) {
      return {
        ...bestRoute,
        optimizationMethod: 'brute_force',
        apiCalls: apiCallCount
      };
    }
    return null;
  }

  /**
   * TSP DP 최적화 (유클리드 거리 기반 필터링 적용)
   */
  static async optimizeTSPDP(locations, getDirections) {
    const n = locations.length;

    // 유클리드 거리 기반 필터링 적용
    console.log('Applying Euclidean distance filtering for TSP DP...');
    const { validPairs, threshold, avgDist } = filterByEuclideanDistance(locations, 2.0);

    // 필터링된 위치들로 새로운 위치 배열 생성
    const filteredIndices = new Set();
    filteredIndices.add(0); // 시작점
    filteredIndices.add(n - 1); // 끝점

    // 유효한 쌍에 포함된 중간 지점들 추가
    for (const pair of validPairs) {
      const [i, j] = pair.split('-').map(Number);
      if (i > 0 && i < n - 1) filteredIndices.add(i);
      if (j > 0 && j < n - 1) filteredIndices.add(j);
    }

    const filteredLocations = Array.from(filteredIndices).sort((a, b) => a - b).map(idx => locations[idx]);
    const filteredN = filteredLocations.length;

    console.log(`TSP DP filtering: ${n} -> ${filteredN} locations (threshold: ${threshold.toFixed(2)}km, avg: ${avgDist.toFixed(2)}km)`);

    if (filteredN < n) {
      console.log('Using filtered locations for TSP DP');
    }

    // 1단계: 거리 행렬 구축 (O(n²) API 호출)
    console.log('Building distance matrix for TSP DP...');
    const distanceMatrix = await HybridOptimizer.buildDistanceMatrix(filteredLocations, getDirections);
    const apiCallsForMatrix = filteredN * (filteredN - 1) / 2; // 대칭이므로 절반만

    // 2단계: TSP DP 알고리즘 적용
    const tspOptimizer = new TSPOptimizer(distanceMatrix, filteredLocations);
    const tspResult = tspOptimizer.optimize();

    if (!tspResult) {
      console.error('TSP DP optimization failed');
      return null;
    }

    // 3단계: 최적 경로로 실제 데이터 가져오기 (1번의 API 호출)
    const finalLocations = tspResult.route.map(index => filteredLocations[index]);
    const coordsArray = finalLocations.map(loc => loc.coords);
    const namesArray = finalLocations.map(loc => loc.name);

    const finalResult = await getDirections(coordsArray, namesArray);

    return {
      optimizedLocations: finalLocations,
      routeData: finalResult,
      optimizationMethod: 'tsp_dp',
      apiCalls: apiCallsForMatrix + 1,
      iterations: 0 // DP는 반복이 없음
    };
  }

  /**
   * 2-opt 최적화 (유클리드 거리 기반 필터링 적용)
   */
  static async optimize2Opt(locations, getDirections) {
    const n = locations.length;

    // 유클리드 거리 기반 필터링 적용
    console.log('Applying Euclidean distance filtering for 2-opt...');
    const { validPairs, threshold, avgDist } = filterByEuclideanDistance(locations, 2.0);

    // 필터링된 위치들로 새로운 위치 배열 생성
    const filteredIndices = new Set();
    filteredIndices.add(0); // 시작점
    filteredIndices.add(n - 1); // 끝점

    // 유효한 쌍에 포함된 중간 지점들 추가
    for (const pair of validPairs) {
      const [i, j] = pair.split('-').map(Number);
      if (i > 0 && i < n - 1) filteredIndices.add(i);
      if (j > 0 && j < n - 1) filteredIndices.add(j);
    }

    const filteredLocations = Array.from(filteredIndices).sort((a, b) => a - b).map(idx => locations[idx]);
    const filteredN = filteredLocations.length;

    console.log(`2-opt filtering: ${n} -> ${filteredN} locations (threshold: ${threshold.toFixed(2)}km, avg: ${avgDist.toFixed(2)}km)`);

    if (filteredN < n) {
      console.log('Using filtered locations for 2-opt');
    }

    // 1단계: 필터링된 위치들에 대한 거리 행렬 구축
    console.log('Building distance matrix...');
    const distanceMatrix = await HybridOptimizer.buildDistanceMatrix(filteredLocations, getDirections);
    const apiCallsForMatrix = filteredN * (filteredN - 1) / 2; // 대칭이므로 절반만

    // 2단계: Nearest Neighbor로 초기 경로 생성
    const nnOptimizer = new NearestNeighborOptimizer(distanceMatrix, filteredLocations);
    const initialRoute = nnOptimizer.generateInitialRoute(0, filteredN - 1);

    // 3단계: 2-opt로 개선
    const twoOptOptimizer = new TwoOptOptimizer(distanceMatrix, filteredLocations);
    const optimized = twoOptOptimizer.optimize(initialRoute);

    // 4단계: 최적 경로로 실제 데이터 가져오기 (1번의 API 호출)
    const finalLocations = optimized.route.map(index => filteredLocations[index]);
    const coordsArray = finalLocations.map(loc => loc.coords);
    const namesArray = finalLocations.map(loc => loc.name);
    
    const finalResult = await getDirections(coordsArray, namesArray);
    
    return {
      optimizedLocations: finalLocations,
      routeData: finalResult,
      optimizationMethod: '2-opt',
      apiCalls: apiCallsForMatrix + 1,
      iterations: optimized.iterations
    };
  }

  /**
   * 휴리스틱 최적화 (유클리드 거리 기반 필터링 적용)
   */
  static async optimizeHeuristic(locations, getDirections) {
    const n = locations.length;

    // 유클리드 거리 기반 필터링 적용
    console.log('Applying Euclidean distance filtering for heuristic...');
    const { validPairs, threshold, avgDist } = filterByEuclideanDistance(locations, 2.0);

    // 필터링된 위치들로 새로운 위치 배열 생성
    const filteredIndices = new Set();
    filteredIndices.add(0); // 시작점
    filteredIndices.add(n - 1); // 끝점

    // 유효한 쌍에 포함된 중간 지점들 추가
    for (const pair of validPairs) {
      const [i, j] = pair.split('-').map(Number);
      if (i > 0 && i < n - 1) filteredIndices.add(i);
      if (j > 0 && j < n - 1) filteredIndices.add(j);
    }

    const filteredLocations = Array.from(filteredIndices).sort((a, b) => a - b).map(idx => locations[idx]);
    const filteredN = filteredLocations.length;

    console.log(`Heuristic filtering: ${n} -> ${filteredN} locations (threshold: ${threshold.toFixed(2)}km, avg: ${avgDist.toFixed(2)}km)`);

    // 대용량의 경우 샘플링과 클러스터링 적용
    console.log('Using heuristic approach for large dataset...');
    
    // 간단한 구현: Nearest Neighbor만 사용
    const sampleSize = Math.min(filteredN, 15); // 최대 15개 지점만 샘플링
    
    // 거리 기반 샘플링 (시작/끝점 포함)
    const sampledLocations = HybridOptimizer.sampleLocations(filteredLocations, sampleSize);
    
    // 샘플에 대해 2-opt 적용
    return await HybridOptimizer.optimize2Opt(sampledLocations, getDirections);
  }

  /**
   * 거리 행렬 구축 (대칭성 이용하여 API 호출 최소화)
   */
  static async buildDistanceMatrix(locations, getDirections) {
    const n = locations.length;
    const matrix = Array(n).fill().map(() => Array(n).fill(0));
    let apiCallCount = 0;

    // 대각선은 0으로 설정
    for (let i = 0; i < n; i++) {
      matrix[i][i] = 0;
    }

    // 상삼각 행렬만 계산하고 대칭 복사
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const coordsArray = [locations[i].coords, locations[j].coords];
        const namesArray = [locations[i].name, locations[j].name];
        
        const result = await getDirections(coordsArray, namesArray);
        apiCallCount++;
        
        if (result) {
          matrix[i][j] = result.totalTime;
          matrix[j][i] = result.totalTime; // 대칭 복사
        } else {
          matrix[i][j] = Infinity;
          matrix[j][i] = Infinity;
        }
      }
    }

    console.log(`Distance matrix built with ${apiCallCount} API calls`);
    return matrix;
  }

  /**
   * 위치 샘플링 (거리 기반)
   */
  static sampleLocations(locations, sampleSize) {
    if (locations.length <= sampleSize) {
      return locations;
    }

    const sampled = [locations[0]]; // 시작점 포함
    const remaining = locations.slice(1, -1); // 중간점들
    const end = locations[locations.length - 1]; // 끝점

    // 거리 기반 샘플링 (간단한 구현)
    const step = Math.max(1, Math.floor(remaining.length / (sampleSize - 2)));
    for (let i = 0; i < remaining.length; i += step) {
      if (sampled.length < sampleSize - 1) {
        sampled.push(remaining[i]);
      }
    }

    sampled.push(end); // 끝점 포함
    return sampled;
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

    console.log(`TSP DP 시작: ${n}개 지점 최적화`);

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

    console.log(`TSP DP 완료: ${duration.toFixed(2)}ms, ${operations} 연산, 최적 비용: ${minCost}`);

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
