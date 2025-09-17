/**
 * API 호출 캐싱 유틸리티
 * 중복 API 호출을 방지하고 성능을 최적화
 */

class ApiCache {
  constructor(maxSize = 100, ttl = 5 * 60 * 1000) { // 5분 TTL
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  /**
   * 캐시 키 생성
   */
  generateKey(endpoint, params) {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${JSON.stringify(params[key])}`)
      .join('|');
    return `${endpoint}:${sortedParams}`;
  }

  /**
   * 캐시에서 데이터 가져오기
   */
  get(endpoint, params) {
    const key = this.generateKey(endpoint, params);
    const entry = this.cache.get(key);

    if (!entry) return null;

    // TTL 체크
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * 캐시에 데이터 저장
   */
  set(endpoint, params, data) {
    const key = this.generateKey(endpoint, params);

    // 최대 크기 초과 시 가장 오래된 항목 제거
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * 캐시 초기화
   */
  clear() {
    this.cache.clear();
  }

  /**
   * 캐시 크기 반환
   */
  size() {
    return this.cache.size;
  }
}

// 전역 API 캐시 인스턴스
export const apiCache = new ApiCache();

/**
 * 캐시된 API 호출을 위한 래퍼 함수
 */
export const cachedApiCall = async (apiFunction, endpoint, params, cacheKey) => {
  // 캐시 키 생성 (제공되지 않은 경우 자동 생성)
  const finalCacheKey = cacheKey || `${endpoint}_${JSON.stringify(params)}`;

  // 캐시에서 먼저 확인
  const cachedResult = apiCache.get(endpoint, params);
  if (cachedResult) {
    return { ...cachedResult, fromCache: true };
  }

  // 캐시에 없는 경우 실제 API 호출
  try {
    const result = await apiFunction(params);

    // 성공한 경우에만 캐시에 저장
    if (result && !result.error) {
      apiCache.set(endpoint, params, result);
    }

    return { ...result, fromCache: false };
  } catch (error) {
    console.error('API 호출 실패:', error);
    throw error;
  }
};

/**
 * 경로 최적화 캐시 키 생성
 */
export const generateRouteCacheKey = (locations) => {
  return locations
    .map(loc => `${loc.name}_${loc.coords?.lat}_${loc.coords?.lng}`)
    .sort()
    .join('|');
};

/**
 * 거리 행렬 캐시 키 생성
 */
export const generateDistanceMatrixCacheKey = (locations) => {
  const coords = locations
    .map(loc => `${loc.coords?.lat}_${loc.coords?.lng}`)
    .sort();
  return `distance_matrix_${coords.join('_')}`;
};
