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
  return '●';
};

// 마커 아이콘 생성
export const createMarkerIcon = (color, symbol) => ({
  content: `
    <div style="
      background: ${color};
      border-radius: 50%;
      width: 16px;
      height: 16px;
      border: 2px solid white;
      box-shadow: 0 1px 3px rgba(0,0,0,0.3);
    "></div>
  `,
  size: new window.naver.maps.Size(16, 16),
  anchor: new window.naver.maps.Point(8, 8)
});

// 사용자 위치 아이콘 생성
export const createUserLocationIcon = () => ({
  url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="6" fill="#4285F4" stroke="white" stroke-width="2"/>
      <circle cx="12" cy="12" r="2" fill="white"/>
    </svg>
  `),
  size: new window.naver.maps.Size(18, 18),
  anchor: new window.naver.maps.Point(9, 9)
});

// 검색 마커 아이콘 생성
export const createSearchMarkerIcon = (number) => ({
  content: `
    <div style="
      background: #4285F4;
      color: white;
      border-radius: 50%;
      width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: bold;
      border: 2px solid white;
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    ">${number}</div>
  `,
  size: new window.naver.maps.Size(18, 18),
  anchor: new window.naver.maps.Point(9, 9)
});
