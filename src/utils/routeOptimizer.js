/**
 * 경로 최적화 알고리즘 — 비대칭 TSP (방향성 거리)
 *
 * 외부 API는 카카오 모빌리티 Directions로, A→B와 B→A의 totalTime이 다르다
 * (일방통행, 회전 금지 등). 따라서 거리 행렬은 비대칭으로 채우고,
 * Branch and Bound로 정확한 최적해를 보장한다.
 *
 * 알고리즘 분기:
 *   - 경유지 0개 (출발/도착만): 1회 API 호출로 직행 경로 산출 (direct)
 *   - 경유지 1개 이상: 비대칭 거리 행렬(n(n-1)회) + Branch and Bound + 최종 경로 1회
 *
 * 비대칭 행렬을 쓰므로 MST 기반 하한(LB)은 비대칭에서 valid하지 않다.
 * 본 구현의 LB는 단순 · 안전한 형태: unvisited 노드 각각에서 가장 싼
 * outgoing edge와 끝점까지의 비용 합. 과대평가할 위험이 없으므로
 * 가지치기 안전성이 보장된다.
 */

import { performanceMonitor } from './performanceMonitor.js';
import { apiCache, generateDistanceMatrixCacheKey } from './apiCache.js';
import { getOptimalDirections } from '../api/naverApi.js';

/**
 * 좌표 기반 유클리드 거리 계산 (단위: km)
 * @param {Object} coord1 - {lat, lng}
 * @param {Object} coord2 - {lat, lng}
 * @returns {number} 거리 (km)
 */
export const calculateEuclideanDistance = (coord1, coord2) => {
  const R = 6371;
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
  const dLon = (coord2.lng - coord1.lng) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * 비대칭 TSP를 위한 Branch and Bound.
 *
 * 시작/끝 노드 고정, 가운데 노드들의 최적 순열을 탐색한다.
 * LB(lower bound)는 각 unvisited 노드에서 가능한 가장 싼 outgoing 비용의 합.
 * 이 LB는 실제 비용보다 작거나 같음이 보장되어(LB ≤ 실제 최적해),
 * LB ≥ bestCost일 때 가지치기하면 최적해를 절대 놓치지 않는다.
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
   * @param {number} startIndex - 시작점 인덱스
   * @param {number} endIndex - 끝점 인덱스
   * @returns {Object|null} { route, totalDistance, nodesExplored, duration }
   */
  optimize(startIndex, endIndex) {
    const startTime = performance.now();
    this.bestCost = Infinity;
    this.bestRoute = null;
    this.nodesExplored = 0;

    const unvisited = new Set();
    for (let i = 0; i < this.n; i++) {
      if (i !== startIndex && i !== endIndex) {
        unvisited.add(i);
      }
    }

    this.branchAndBound([startIndex], unvisited, endIndex, 0);

    const duration = performance.now() - startTime;

    if (this.bestRoute) {
      return {
        route: this.bestRoute,
        totalDistance: this.bestCost,
        method: 'branch_and_bound',
        nodesExplored: this.nodesExplored,
        duration
      };
    }
    console.error('Branch and Bound: No valid path found');
    return null;
  }

  branchAndBound(currentRoute, unvisited, endIndex, currentCost) {
    this.nodesExplored++;

    // 가지치기 1: 누적 비용이 이미 best 이상이면 컷
    if (this.bestCost !== Infinity && currentCost >= this.bestCost) {
      return;
    }

    const currentPos = currentRoute[currentRoute.length - 1];

    // 종료 조건: 모든 경유지 방문 → 끝점까지 비용으로 best 갱신
    if (unvisited.size === 0) {
      const finalCost = currentCost + this.distanceMatrix[currentPos][endIndex];
      if (finalCost < this.bestCost) {
        this.bestCost = finalCost;
        this.bestRoute = [...currentRoute, endIndex];
      }
      return;
    }

    // 가지치기 2: 비대칭-valid LB로 컷
    if (this.bestCost !== Infinity) {
      const lowerBound = this.calculateLowerBound(currentPos, unvisited, endIndex);
      if (lowerBound >= this.bestCost) {
        return;
      }
    }

    // 후보 정렬: 가까운 노드 먼저 → 좋은 해를 빨리 찾고 LB가 일찍 발동
    const candidates = Array.from(unvisited).sort((a, b) =>
      this.distanceMatrix[currentPos][a] - this.distanceMatrix[currentPos][b]
    );

    for (const next of candidates) {
      const newUnvisited = new Set(unvisited);
      newUnvisited.delete(next);
      const newCost = currentCost + this.distanceMatrix[currentPos][next];
      this.branchAndBound([...currentRoute, next], newUnvisited, endIndex, newCost);
    }
  }

  /**
   * 비대칭 TSP에서 valid한 LB.
   *
   * 각 unvisited 노드 u에 대해:
   *   - min over v∈(unvisited ∪ {currentPos, endIndex}) of distanceMatrix[u][v] ... (1)
   * 단, (1)만으로는 시작점 이후로 다시 u로 돌아갈 수 없는 경로가 있을 수 있어
   * 약한 bound가 된다. 그러나 LB ≤ 실제 최적해가 보장되므로 가지치기 안전.
   *
   * 추가로 끝점까지의 비용 distanceMatrix[currentPos][endIndex]를 더한다.
   */
  calculateLowerBound(currentPos, unvisited, endIndex) {
    let outgoingSum = 0;
    for (const u of unvisited) {
      let minOut = Infinity;
      for (const v of unvisited) {
        if (u === v) continue;
        if (this.distanceMatrix[u][v] < minOut) minOut = this.distanceMatrix[u][v];
      }
      // unvisited에서 outgoing이 없으면 endIndex로의 비용도 후보
      const toEnd = this.distanceMatrix[u][endIndex];
      outgoingSum += Math.min(minOut, toEnd);
    }
    // 시작 위치 → endIndex 비용 (이미 카운트된 마지막 이동)
    const tailToEnd = this.distanceMatrix[currentPos][endIndex];
    return outgoingSum + tailToEnd;
  }
}

/**
 * 혼합 최적화 진입점.
 *
 * 비대칭 TSP의 정확한 최적해를 보장하는 단일 알고리즘(B&B)으로 통일.
 * - 경유지 0개: direct 1회
 * - 경유지 1+ 개: 비대칭 거리 행렬 + Branch and Bound + 최종 1회
 */
export class HybridOptimizer {
  /**
   * @param {Array} locations - 좌표 있는 location 배열
   * @param {Function} getDirections - 단일 경로 API
   * @param {Function} onProgress - (current, total) 콜백
   * @returns {Object} { optimizedLocations, routeData, optimizationMethod, apiCalls, nodesExplored, distanceMatrix }
   *          또는 { error, message, maxLocations, currentLocations } (TOO_MANY_LOCATIONS)
   *          또는 null (실패)
   */
  static async optimize(locations, getDirections, onProgress = null) {
    const operationId = `optimize_${Date.now()}`;
    performanceMonitor.startTimer(operationId);
    performanceMonitor.trackMemoryUsage('start');

    const MAX_LOCATIONS = 12;
    if (locations.length > MAX_LOCATIONS) {
      performanceMonitor.endTimer(operationId, {
        locationCount: locations.length,
        waypointCount: locations.length - 2,
        method: 'rejected',
        apiCalls: 0
      });
      performanceMonitor.trackMemoryUsage('end');
      console.error(`장소 개수가 너무 많습니다. 최대 ${MAX_LOCATIONS}개까지 지원합니다. (현재: ${locations.length}개)`);
      return {
        error: 'TOO_MANY_LOCATIONS',
        message: `장소 개수가 너무 많습니다. 최대 ${MAX_LOCATIONS}개까지 지원합니다. (현재: ${locations.length}개)`,
        maxLocations: MAX_LOCATIONS,
        currentLocations: locations.length
      };
    }

    const waypointCount = locations.length - 2;
    let result = null;
    let method = '';
    let apiCalls = 0;

    try {
      if (waypointCount <= 0) {
        result = await HybridOptimizer.optimizeTwoPoints(locations, getDirections, onProgress);
        method = 'direct';
        apiCalls = 1;
      } else {
        result = await HybridOptimizer.optimizeBranchAndBound(locations, getDirections, onProgress);
        method = 'branch_and_bound';
        apiCalls = result?.apiCalls || 0;
      }

      return result;
    } finally {
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
        result?.nodesExplored || 0
      );

      performanceMonitor.trackMemoryUsage('end');
    }
  }

  /**
   * 2개 지점 직행 (출발/도착 1쌍)
   */
  static async optimizeTwoPoints(locations, getDirections, onProgress = null) {
    const coordsArray = locations.map(loc => loc.coords);
    const namesArray = locations.map(loc => loc.name);
    const result = await getOptimalDirections(coordsArray, namesArray, 3, onProgress);
    if (!result) return null;
    return {
      optimizedLocations: locations,
      routeData: result,
      optimizationMethod: 'direct',
      apiCalls: 1
    };
  }

  /**
   * 비대칭 거리 행렬 + Branch and Bound
   *
   * 비대칭이므로 거리 행렬은 n(n-1) 호출로 구축한다 (대칭 강제 복사 안 함).
   */
  static async optimizeBranchAndBound(locations, getDirections, onProgress = null) {
    const n = locations.length;

    // 1단계: 비대칭 거리 행렬 (i≠j 모든 방향)
    const distanceMatrix = await HybridOptimizer.buildDistanceMatrix(locations, getDirections, onProgress);
    const apiCallsForMatrix = n * (n - 1);

    // 2단계: Branch and Bound (in-memory, 외부 호출 0)
    const bbOptimizer = new BranchAndBoundOptimizer(distanceMatrix, locations);
    const bbResult = bbOptimizer.optimize(0, n - 1);
    if (!bbResult) return null;

    // 3단계: 최적 경로로 실제 도로 경로 1회 호출
    const finalLocations = bbResult.route.map(index => locations[index]);
    const coordsArray = finalLocations.map(loc => loc.coords);
    const namesArray = finalLocations.map(loc => loc.name);
    const finalResult = await getOptimalDirections(coordsArray, namesArray, 3, onProgress);
    if (!finalResult) return null;

    return {
      optimizedLocations: finalLocations,
      routeData: finalResult,
      optimizationMethod: 'branch_and_bound',
      apiCalls: apiCallsForMatrix + 1,
      nodesExplored: bbResult.nodesExplored,
      duration: bbResult.duration,
      distanceMatrix
    };
  }

  /**
   * 비대칭 거리 행렬 구축.
   *
   * i≠j 모든 방향을 호출 (i<j만 부르고 대칭 복사하던 기존 코드와 다름).
   * 카카오 모빌리티 Directions는 방향성이 있어 A→B ≠ B→A일 수 있으므로
   * 대칭 가정이 최적해 보장을 깨뜨린다.
   *
   * API 호출 = n(n-1).
   * 배치 크기 10개씩 묶어 호출한다.
   */
  static async buildDistanceMatrix(locations, getDirections, onProgress = null) {
    const n = locations.length;
    const cacheKey = generateDistanceMatrixCacheKey(locations);
    const cachedMatrix = apiCache.get('distance_matrix', { locations: cacheKey });
    if (cachedMatrix) return cachedMatrix;

    const matrix = Array(n).fill().map(() => Array(n).fill(0));
    let apiCallCount = 0;

    // 비대칭: i≠j 모든 방향 호출
    const routePairs = [];
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        routePairs.push({
          index: routePairs.length,
          i,
          j,
          coordsArray: [locations[i].coords, locations[j].coords],
          namesArray: [locations[i].name, locations[j].name]
        });
      }
    }

    const batchSize = 10;
    const totalBatches = Math.ceil(routePairs.length / batchSize);

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIdx = batchIndex * batchSize;
      const endIdx = Math.min(startIdx + batchSize, routePairs.length);
      const currentBatch = routePairs.slice(startIdx, endIdx);

      const batchRoutesArray = currentBatch.map(pair => ({
        coordsArray: pair.coordsArray,
        namesArray: pair.namesArray
      }));

      const batchResult = await getOptimalDirections(batchRoutesArray, 3, (completed, total) => {
        if (onProgress) {
          const batchProgress = (batchIndex * batchSize + completed) / routePairs.length;
          onProgress(Math.round(batchProgress * 100), 100);
        }
      });

      if (batchResult && batchResult.batch && batchResult.results) {
        batchResult.results.forEach((result, resultIndex) => {
          const pair = currentBatch[resultIndex];
          apiCallCount++;
          if (result.success && result.result) {
            matrix[pair.i][pair.j] = result.result.totalTime;
          } else {
            console.warn(`[RouteOptimizer] Failed to get directions for pair (${pair.i}, ${pair.j}):`, result.error);
            matrix[pair.i][pair.j] = Infinity;
          }
        });
      } else {
        // 배치 실패 시 개별 처리로 폴백
        for (const pair of currentBatch) {
          try {
            const result = await getOptimalDirections(pair.coordsArray, pair.namesArray, 3, onProgress);
            apiCallCount++;
            matrix[pair.i][pair.j] = result ? result.totalTime : Infinity;
          } catch (error) {
            console.error(`[RouteOptimizer] Individual fallback failed for pair (${pair.i}, ${pair.j}):`, error);
            matrix[pair.i][pair.j] = Infinity;
          }
        }
      }

      if (batchIndex < totalBatches - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    apiCache.set('distance_matrix', { locations: cacheKey }, matrix);
    return matrix;
  }
}
