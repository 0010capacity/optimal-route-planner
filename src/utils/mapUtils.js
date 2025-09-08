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
export const createMarkerIcon = (color, symbol) => ({
  content: `
    <div style="
      background: ${color};
      border-radius: 50%;
      width: 20px;
      height: 20px;
      border: 2px solid white;
      box-shadow: 0 1px 3px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 10px;
      font-weight: bold;
    ">${symbol}</div>
  `,
  size: new window.naver.maps.Size(20, 20),
  anchor: new window.naver.maps.Point(10, 10)
});

// 사용자 위치 아이콘 생성
export const createUserLocationIcon = () => ({
  url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="8" fill="#4285F4" stroke="white" stroke-width="3"/>
      <circle cx="12" cy="12" r="3" fill="white"/>
      <circle cx="12" cy="12" r="10" fill="none" stroke="#4285F4" stroke-width="1" opacity="0.3"/>
    </svg>
  `),
  size: new window.naver.maps.Size(28, 28),
  anchor: new window.naver.maps.Point(14, 14)
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
