// 공통 유틸리티 함수들

// 두 지점 간 거리 계산 함수 (Haversine formula)
export const getDistance = (point1, point2) => {
  const R = 6371; // 지구 반지름 (km)
  const dLat = (point2.lat - point1.lat) * Math.PI / 180;
  const dLng = (point2.lng - point1.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// 좌표 유효성 검증
export const isValidCoordinate = (coord) => {
  return coord && typeof coord.lat === 'number' && typeof coord.lng === 'number' &&
         coord.lat >= -90 && coord.lat <= 90 && coord.lng >= -180 && coord.lng <= 180;
};

// 좌표 배열 유효성 검증
export const isValidCoordinateArray = (coordsArray) => {
  return Array.isArray(coordsArray) && coordsArray.length >= 2 &&
         coordsArray.every(coord => isValidCoordinate(coord));
};
