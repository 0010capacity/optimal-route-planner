// 마커 색상 결정
export const getMarkerColor = (index, total) => {
  if (index === 0) return '#4caf50'; // 출발지: 녹색
  if (index === total - 1) return '#f44336'; // 도착지: 빨간색
  return '#2196f3'; // 경유지: 파란색
};

// 마커 심볼 결정
export const getMarkerSymbol = (index, total) => {
  if (index === 0) return '▶';
  if (index === total - 1) return '■';
  return (index).toString(); // 경유지: 순서 번호 (1부터 시작)
};

// 마커 아이콘 생성
export const createMarkerIcon = (color, symbol) => {
  return new window.kakao.maps.MarkerImage(
    'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
      <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
        <circle cx="10" cy="10" r="9" fill="${color}" stroke="white" stroke-width="2"/>
        <text x="10" y="14" text-anchor="middle" fill="white" font-size="10" font-weight="bold">${symbol}</text>
      </svg>
    `),
    new window.kakao.maps.Size(20, 20),
    { offset: new window.kakao.maps.Point(10, 10) }
  );
};

// 사용자 위치 아이콘 생성
export const createUserLocationIcon = () => {
  return new window.kakao.maps.MarkerImage(
    'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="8" fill="#4285F4" stroke="white" stroke-width="3"/>
        <circle cx="12" cy="12" r="3" fill="white"/>
        <circle cx="12" cy="12" r="10" fill="none" stroke="#4285F4" stroke-width="1" opacity="0.3"/>
      </svg>
    `),
    new window.kakao.maps.Size(28, 28),
    { offset: new window.kakao.maps.Point(14, 14) }
  );
};

// 검색 마커 아이콘 생성
export const createSearchMarkerIcon = (number) => {
  return new window.kakao.maps.MarkerImage(
    'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
      <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
        <circle cx="9" cy="9" r="8" fill="#4285F4" stroke="white" stroke-width="2"/>
        <text x="9" y="12" text-anchor="middle" fill="white" font-size="9" font-weight="bold">${number}</text>
      </svg>
    `),
    new window.kakao.maps.Size(18, 18),
    { offset: new window.kakao.maps.Point(9, 9) }
  );
};
