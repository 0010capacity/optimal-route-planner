// API 모듈들의 중앙 집중화된 export
// 각 API별로 분리된 모듈들을 통합 관리

import { searchPlaces } from './kakaoApi.js';
import { getDirections, getBatchDirections, getOptimalDirections } from './naverApi.js';
import { getDistance, isValidCoordinate, isValidCoordinateArray } from './utils.js';

// Kakao Maps API
export { searchPlaces };

// NAVER Maps API
export { getDirections, getBatchDirections, getOptimalDirections };

// 유틸리티 함수들
export { getDistance, isValidCoordinate, isValidCoordinateArray };

// 기본 export (주요 함수들)
const api = {
  // Kakao API
  searchPlaces,

  // NAVER API
  getDirections,
  getBatchDirections,
  getOptimalDirections,

  // Utils
  getDistance,
  isValidCoordinate,
  isValidCoordinateArray,
};

export default api;
