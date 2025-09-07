import { isValidCoordinateArray } from './utils.js';

const NAVER_CLIENT_ID = process.env.REACT_APP_NAVER_CLIENT_ID || 'your_naver_client_id_here';
const NAVER_CLIENT_SECRET = process.env.REACT_APP_NAVER_CLIENT_SECRET || 'your_naver_client_secret_here';

// NAVER Maps API 관련 함수들
// 지오코딩, 경로 탐색 기능

// WGS84 좌표를 TM128 좌표로 변환 (네이버 지도용)
const wgs84ToTm128 = (lat, lng) => {
  const RE = 6378137; // 지구 반경 (m)
  const GRID = 5; // 격자 간격 (m)
  const ORG_LAT = 38; // 기준 위도 (도)
  const ORG_LNG = 127; // 기준 경도 (도)
  const xo = 200000; // x 오프셋
  const yo = 500000; // y 오프셋

  const lat_rad = lat * Math.PI / 180;
  const lng_rad = lng * Math.PI / 180;
  const org_lat_rad = ORG_LAT * Math.PI / 180;
  const org_lng_rad = ORG_LNG * Math.PI / 180;

  const delta_lng = lng_rad - org_lng_rad;
  const sin_lat = Math.sin(lat_rad);
  const cos_lat = Math.cos(lat_rad);

  const e = Math.sqrt(1 - (6356752.3142 / RE) ** 2); // 편심률
  const e2 = e * e;
  const n = RE / Math.sqrt(1 - e2 * sin_lat * sin_lat);
  const t = Math.tan(lat_rad);
  const c = e2 * cos_lat * cos_lat / (1 - e2);

  const a = delta_lng * cos_lat;
  const m = RE * ((1 - e2/4 - 3*e2*e2/64 - 5*e2*e2*e2/256) * lat_rad -
                  (3*e2/8 + 3*e2*e2/32 + 45*e2*e2*e2/1024) * Math.sin(2*lat_rad) +
                  (15*e2*e2/256 + 45*e2*e2*e2/1024) * Math.sin(4*lat_rad) -
                  (35*e2*e2*e2/3072) * Math.sin(6*lat_rad));

  const x = xo + GRID * (m + n * t * (a*a/2 + (5 - t*t + 9*c + 4*c*c) * a*a*a*a/24 +
                                      (61 - 58*t*t + t*t*t*t) * a*a*a*a*a*a/720));
  const y = yo + GRID * (n * (a + (1 - t*t + c) * a*a*a/6 +
                              (5 - 18*t*t + t*t*t*t + 14*c - 58*c*t*t) * a*a*a*a*a/120));

  // 더 정밀한 소수점 이하 자리수 유지 (최소 7자리)
  const xStr = x.toFixed(7);
  const yStr = y.toFixed(7);
  return { x: parseFloat(xStr), y: parseFloat(yStr) };
};

// 네이버 지도 자동차 길찾기 URL 생성
export const generateNaverMapUrl = (locations) => {
  if (!locations || locations.length < 2) {
    console.error('최소 두 개의 장소가 필요합니다.');
    return null;
  }

  console.log('Generating Naver Map URL for locations:', locations);

  const waypoints = locations.map((loc, index) => {
    if (!loc.coords || !loc.coords.lat || !loc.coords.lng) {
      console.error('유효하지 않은 좌표:', loc);
      return null;
    }

    const tm = wgs84ToTm128(loc.coords.lat, loc.coords.lng);
    // 이름 인코딩 (네이버 지도 URL에 맞게)
    const name = encodeURIComponent(loc.name || loc.address || `장소 ${index + 1}`);
    
    // 네이버 지도 URL 형식에 맞게 조정 (POI ID 포함)
    const waypoint = `${tm.x},${tm.y},${name},0,PLACE_POI`;
    console.log(`Waypoint ${index}:`, waypoint);
    
    return waypoint;
  }).filter(Boolean);

  if (waypoints.length < 2) {
    console.error('유효한 장소가 부족합니다.');
    return null;
  }

  const waypointsStr = waypoints.join('/');
  const url = `https://map.naver.com/p/directions/${waypointsStr}/car?c=9.00,0,0,0,dh`;
  
  console.log('Generated URL:', url);
  return url;
};

// 네이버 지도 앱 자동차 길찾기 URL Scheme 생성
export const generateNaverAppUrl = (locations) => {
  if (!locations || locations.length < 2) {
    console.error('최소 두 개의 장소가 필요합니다.');
    return null;
  }

  console.log('Generating Naver App URL for locations:', locations);

  const validLocations = locations.filter(loc =>
    loc.coords && loc.coords.lat && loc.coords.lng &&
    !isNaN(loc.coords.lat) && !isNaN(loc.coords.lng)
  );

  if (validLocations.length < 2) {
    console.error('유효한 장소가 부족합니다.');
    return null;
  }

  // 출발지 (첫 번째 장소)
  const start = validLocations[0];
  // 도착지 (마지막 장소)
  const end = validLocations[validLocations.length - 1];
  // 경유지 (중간 장소들)
  const waypoints = validLocations.slice(1, -1);

  // 기본 파라미터
  let params = [
    `slat=${start.coords.lat}`,
    `slng=${start.coords.lng}`,
    `sname=${encodeURIComponent(start.name || start.address || '출발지')}`,
    `dlat=${end.coords.lat}`,
    `dlng=${end.coords.lng}`,
    `dname=${encodeURIComponent(end.name || end.address || '도착지')}`,
    `appname=com.example.optimalrouteplanner` // 앱 식별자
  ];

  // 경유지 추가 (최대 5개)
  waypoints.slice(0, 5).forEach((waypoint, index) => {
    const vIndex = index + 1;
    params.push(`v${vIndex}lat=${waypoint.coords.lat}`);
    params.push(`v${vIndex}lng=${waypoint.coords.lng}`);
    params.push(`v${vIndex}name=${encodeURIComponent(waypoint.name || waypoint.address || `경유지${vIndex}`)}`);
  });

  const url = `nmap://route/car?${params.join('&')}`;
  console.log('Generated Naver App URL:', url);
  return url;
};

// 카카오맵 앱 자동차 길찾기 URL Scheme 생성
export const generateKakaoAppUrl = (locations) => {
  if (!locations || locations.length < 2) {
    console.error('최소 두 개의 장소가 필요합니다.');
    return null;
  }

  console.log('Generating Kakao App URL for locations:', locations);

  const validLocations = locations.filter(loc =>
    loc.coords && loc.coords.lat && loc.coords.lng &&
    !isNaN(loc.coords.lat) && !isNaN(loc.coords.lng)
  );

  if (validLocations.length < 2) {
    console.error('유효한 장소가 부족합니다.');
    return null;
  }

  // 출발지 (첫 번째 장소)
  const start = validLocations[0];
  // 도착지 (마지막 장소)
  const end = validLocations[validLocations.length - 1];
  // 경유지 (중간 장소들)
  const waypoints = validLocations.slice(1, -1);

  // 기본 파라미터
  let params = [
    `sp=${start.coords.lat},${start.coords.lng}`,
    `ep=${end.coords.lat},${end.coords.lng}`,
    `by=car`
  ];

  // 경유지 추가 (최대 5개)
  waypoints.slice(0, 5).forEach((waypoint, index) => {
    params.push(`vp${index === 0 ? '' : index + 1}=${waypoint.coords.lat},${waypoint.coords.lng}`);
  });

  const url = `kakaomap://route?${params.join('&')}`;
  console.log('Generated Kakao App URL:', url);
  return url;
};

// 카카오맵 웹 길찾기 URL 생성
export const generateKakaoWebUrl = (locations) => {
  if (!locations || locations.length < 2) {
    console.error('최소 두 개의 장소가 필요합니다.');
    return null;
  }

  console.log('Generating Kakao Web URL for locations:', locations);

  const validLocations = locations.filter(loc =>
    loc.coords && loc.coords.lat && loc.coords.lng &&
    !isNaN(loc.coords.lat) && !isNaN(loc.coords.lng)
  );

  if (validLocations.length < 2) {
    console.error('유효한 장소가 부족합니다.');
    return null;
  }

  // 출발지 (첫 번째 장소)
  const start = validLocations[0];
  // 도착지 (마지막 장소)
  const end = validLocations[validLocations.length - 1];
  // 경유지 (중간 장소들)
  const waypoints = validLocations.slice(1, -1);

  // 기본 파라미터
  let params = [
    `sp=${start.coords.lat},${start.coords.lng}`,
    `ep=${end.coords.lat},${end.coords.lng}`,
    `by=car`
  ];

  // 경유지 추가 (최대 5개)
  waypoints.slice(0, 5).forEach((waypoint, index) => {
    params.push(`vp${index === 0 ? '' : index + 1}=${waypoint.coords.lat},${waypoint.coords.lng}`);
  });

  const url = `http://m.map.kakao.com/scheme/route?${params.join('&')}`;
  console.log('Generated Kakao Web URL:', url);
  return url;
};

// NAVER Directions API를 사용한 경로 탐색
export const getDirections = async (coordsArray, namesArray) => {
  if (!isValidCoordinateArray(coordsArray)) {
    console.error('Directions API requires at least two valid coordinates (start and end).');
    return null;
  }

  console.log('Getting directions for coords:', coordsArray);

  // Firebase Functions를 통한 NAVER Directions API 호출
  try {
    const firebaseFunctionUrl = `https://asia-northeast3-my-optimal-route-planner.cloudfunctions.net/getDirections`;
    console.log('Calling Firebase Function for directions:', firebaseFunctionUrl);

    const response = await fetch(firebaseFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ coordsArray, namesArray }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Firebase Function directions response:', data);

      if (data.path && data.totalTime && data.totalDistance) {
        return data;
      } else {
        console.log('Invalid response from Firebase Function');
        return null;
      }
    } else {
      console.log('Firebase Function response status:', response.status);
      return null;
    }
  } catch (error) {
    console.error('Directions error:', error);
    return null;
  }
};


