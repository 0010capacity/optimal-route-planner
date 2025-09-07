// API 모듈들의 중앙 집중화된 export
// 각 API별로 분리된 모듈들을 통합 관리

// Kakao Maps API
export { searchPlaces } from './kakaoApi.js';

// NAVER Maps API
export { getDirections } from './naverApi.js';

// 유틸리티 함수들
export { getDistance, isValidCoordinate, isValidCoordinateArray } from './utils.js';

// 기본 export (주요 함수들)
export default {
  // Kakao API
  searchPlaces,

  // NAVER API
  getDirections,

  // Utils
  getDistance,
  isValidCoordinate,
  isValidCoordinateArray,
};
