/**
 * 경로 최적화 알고리즘 모음
 * TSP 문제 해결을 위한 다양한 접근법 제공
 */

import getPermutations from './getPermutations.js';
import { performanceMonitor } from './performanceMonitor.js';

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
      } else if (waypointCount <= 12) {
        // 2-opt 최적화
        console.log('Using 2-opt optimization (7-12 waypoints)');
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
   * 완전탐색 최적화 (기존 방식과 동일하지만 개선)
   */
  static async optimizeBruteForce(locations, getDirections) {
    const start = locations[0];
    const end = locations[locations.length - 1];
    const waypoints = locations.slice(1, -1);

    const permutations = getPermutations(waypoints);
    let bestRoute = null;
    let bestTime = Infinity;
    let apiCallCount = 0;

    console.log(`Testing ${permutations.length} permutations...`);

    for (const perm of permutations) {
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
   * 2-opt 최적화 (API 호출 최소화)
   */
  static async optimize2Opt(locations, getDirections) {
    const n = locations.length;
    
    // 1단계: 거리 행렬 구축 (O(n²) API 호출)
    console.log('Building distance matrix...');
    const distanceMatrix = await HybridOptimizer.buildDistanceMatrix(locations, getDirections);
    const apiCallsForMatrix = n * (n - 1) / 2; // 대칭이므로 절반만

    // 2단계: Nearest Neighbor로 초기 경로 생성
    const nnOptimizer = new NearestNeighborOptimizer(distanceMatrix, locations);
    const initialRoute = nnOptimizer.generateInitialRoute(0, n - 1);

    // 3단계: 2-opt로 개선
    const twoOptOptimizer = new TwoOptOptimizer(distanceMatrix, locations);
    const optimized = twoOptOptimizer.optimize(initialRoute);

    // 4단계: 최적 경로로 실제 데이터 가져오기 (1번의 API 호출)
    const finalLocations = optimized.route.map(index => locations[index]);
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
   * 휴리스틱 최적화 (대용량 데이터용)
   */
  static async optimizeHeuristic(locations, getDirections) {
    // 대용량의 경우 샘플링과 클러스터링 적용
    console.log('Using heuristic approach for large dataset...');
    
    // 간단한 구현: Nearest Neighbor만 사용
    const n = locations.length;
    const sampleSize = Math.min(n, 15); // 최대 15개 지점만 샘플링
    
    // 거리 기반 샘플링 (시작/끝점 포함)
    const sampledLocations = HybridOptimizer.sampleLocations(locations, sampleSize);
    
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
