/**
 * 지도 URL 생성 유틸리티
 * 네이버 지도와 카카오맵의 URL 생성 로직을 통합하여 중복 제거
 */

/**
 * 기본 위치 검증 함수
 */
const validateLocations = (locations, minCount = 2) => {
  if (!locations || !Array.isArray(locations)) {
    console.error('Invalid locations array:', locations);
    return { valid: false, error: 'Invalid locations array' };
  }

  if (locations.length < minCount) {
    console.error(`최소 ${minCount}개의 장소가 필요합니다.`);
    return { valid: false, error: `최소 ${minCount}개의 장소가 필요합니다.` };
  }

  const validLocations = locations.filter(loc =>
    loc.coords && loc.coords.lat && loc.coords.lng &&
    !isNaN(loc.coords.lat) && !isNaN(loc.coords.lng)
  );

  if (validLocations.length < minCount) {
    console.error('유효한 장소가 부족합니다.');
    return { valid: false, error: '유효한 장소가 부족합니다.', validCount: validLocations.length };
  }

  return { valid: true, validLocations };
};

/**
 * 좌표 변환: WGS84 -> TM128 (네이버 지도용)
 */
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

  return { x: parseFloat(x.toFixed(7)), y: parseFloat(y.toFixed(7)) };
};

/**
 * 네이버 지도 URL 생성기
 */
export class NaverMapUrlGenerator {
  /**
   * 네이버 지도 웹 길찾기 URL 생성
   */
  static generateWebUrl(locations) {
    const validation = validateLocations(locations);
    if (!validation.valid) {
      return null;
    }

    console.log('Generating Naver Map URL for locations:', validation.validLocations);

    const waypoints = validation.validLocations.map((loc, index) => {
      const tm = wgs84ToTm128(loc.coords.lat, loc.coords.lng);
      const name = encodeURIComponent(loc.name || loc.address || `장소 ${index + 1}`);
      return `${tm.x},${tm.y},${name},0,PLACE_POI`;
    });

    const waypointsStr = waypoints.join('/');
    const url = `https://map.naver.com/p/directions/${waypointsStr}/car?c=9.00,0,0,0,dh`;
    
    console.log('Generated Naver Web URL:', url);
    return url;
  }

  /**
   * 네이버 지도 앱 URL Scheme 생성
   */
  static generateAppUrl(locations) {
    const validation = validateLocations(locations);
    if (!validation.valid) {
      return null;
    }

    console.log('Generating Naver App URL for locations:', validation.validLocations);

    const { validLocations } = validation;
    const start = validLocations[0];
    const end = validLocations[validLocations.length - 1];
    const waypoints = validLocations.slice(1, -1);

    const params = [
      `slat=${start.coords.lat}`,
      `slng=${start.coords.lng}`,
      `sname=${encodeURIComponent(start.name || start.address || '출발지')}`,
      `dlat=${end.coords.lat}`,
      `dlng=${end.coords.lng}`,
      `dname=${encodeURIComponent(end.name || end.address || '도착지')}`,
      `appname=com.example.optimalrouteplanner`
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
  }
}

/**
 * 카카오맵 URL 생성기
 */
export class KakaoMapUrlGenerator {
  /**
   * 카카오맵 앱 URL Scheme 생성
   */
  static generateAppUrl(locations) {
    const validation = validateLocations(locations);
    if (!validation.valid) {
      return null;
    }

    console.log('Generating Kakao App URL for locations:', validation.validLocations);

    const { validLocations } = validation;
    const start = validLocations[0];
    const end = validLocations[validLocations.length - 1];
    const waypoints = validLocations.slice(1, -1);

    const params = [
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
  }

  /**
   * 카카오맵 웹 길찾기 URL 생성
   */
  static generateWebUrl(locations) {
    const validation = validateLocations(locations);
    if (!validation.valid) {
      return null;
    }

    console.log('Generating Kakao Web URL for locations:', validation.validLocations);

    const { validLocations } = validation;
    const start = validLocations[0];
    const end = validLocations[validLocations.length - 1];
    const waypoints = validLocations.slice(1, -1);

    const params = [
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
  }
}

/**
 * 통합 지도 URL 생성기
 */
export class MapUrlGenerator {
  /**
   * 지도 유형과 플랫폼에 따른 URL 생성
   * @param {string} mapType - 'naver' | 'kakao'
   * @param {string} platform - 'app' | 'web'
   * @param {Array} locations - 위치 배열
   * @returns {string|null} 생성된 URL
   */
  static generateUrl(mapType, platform, locations) {
    try {
      if (mapType === 'naver') {
        return platform === 'app' 
          ? NaverMapUrlGenerator.generateAppUrl(locations)
          : NaverMapUrlGenerator.generateWebUrl(locations);
      } else if (mapType === 'kakao') {
        return platform === 'app'
          ? KakaoMapUrlGenerator.generateAppUrl(locations)
          : KakaoMapUrlGenerator.generateWebUrl(locations);
      } else {
        console.error('Unsupported map type:', mapType);
        return null;
      }
    } catch (error) {
      console.error(`Error generating ${mapType} ${platform} URL:`, error);
      return null;
    }
  }

  /**
   * 모바일 환경 감지
   */
  static isMobile() {
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  /**
   * 스마트 URL 생성 (모바일/데스크톱 자동 감지)
   * @param {string} mapType - 'naver' | 'kakao'
   * @param {Array} locations - 위치 배열
   * @returns {Object} { primaryUrl, fallbackUrl }
   */
  static generateSmartUrls(mapType, locations) {
    const isMobile = MapUrlGenerator.isMobile();
    
    if (isMobile) {
      return {
        primaryUrl: MapUrlGenerator.generateUrl(mapType, 'app', locations),
        fallbackUrl: MapUrlGenerator.generateUrl(mapType, 'web', locations)
      };
    } else {
      return {
        primaryUrl: MapUrlGenerator.generateUrl(mapType, 'web', locations),
        fallbackUrl: null
      };
    }
  }
}
