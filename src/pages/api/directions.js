import { isValidCoordinateArray } from '../../api/utils.js';

/**
 * Next.js API Route: KAKAO MOBILITY Directions API
 * NAVER 대신 카카오 모빌리티 API 사용
 */
export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONS 요청 처리 (CORS preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // POST 요청만 허용
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { coordsArray, namesArray } = req.body;

    // 입력 검증
    if (!coordsArray || !Array.isArray(coordsArray) || coordsArray.length < 2) {
      return res.status(400).json({ error: 'Invalid coordinates array' });
    }

    if (!isValidCoordinateArray(coordsArray)) {
      return res.status(400).json({ error: 'Invalid coordinate format' });
    }

    // 카카오 모빌리티 API 키 확인
    const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY;
    if (!KAKAO_REST_API_KEY) {
      console.error('KAKAO_REST_API_KEY not configured');
      return res.status(500).json({ error: 'API configuration error' });
    }

    // 카카오 모빌리티 API 요청 준비
    const start = coordsArray[0];
    const goal = coordsArray[coordsArray.length - 1];
    const waypoints = coordsArray.length > 2 ? coordsArray.slice(1, -1) : [];

    // 쿼리 파라미터 구성
    const params = new URLSearchParams({
      origin: `${start.lng},${start.lat}`,
      destination: `${goal.lng},${goal.lat}`,
      priority: 'RECOMMEND',
      car_fuel: 'GASOLINE',
      car_hipass: false,
      alternatives: false,
      road_details: false,
      summary: false
    });

    if (waypoints.length > 0) {
      const waypointsStr = waypoints.map(wp => `${wp.lng},${wp.lat}`).join('|');
      params.append('waypoints', waypointsStr);
    }

    const apiUrl = `https://apis-navi.kakaomobility.com/v1/directions?${params.toString()}`;

    console.log('Calling KAKAO Mobility API:', {
      origin: params.get('origin'),
      destination: params.get('destination'),
      waypoints: params.get('waypoints') || 'none',
      fullUrl: apiUrl
    });

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `KakaoAK ${KAKAO_REST_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('KAKAO API error:', response.status, errorText);
      return res.status(response.status).json({ error: 'KAKAO API error' });
    }

    const data = await response.json();

    // 카카오 API 응답을 기존 포맷으로 변환
    if (!data.routes || !data.routes[0]) {
      return res.status(500).json({ error: 'Invalid KAKAO API response - no routes found' });
    }

    const route = data.routes[0];
    const summary = route.summary;

    // 경로 포인트 추출
    const path = [];
    if (route.sections) {
      route.sections.forEach(section => {
        if (section.roads) {
          section.roads.forEach(road => {
            if (road.vertexes) {
              // 카카오 API는 [경도, 위도, 경도, 위도, ...] 형식
              for (let i = 0; i < road.vertexes.length; i += 2) {
                path.push({
                  lat: road.vertexes[i + 1], // 위도
                  lng: road.vertexes[i]      // 경도
                });
              }
            }
          });
        }
      });
    }

    // 구간별 시간과 거리 계산
    const segmentTimes = [];
    const segmentDistances = [];

    if (route.sections) {
      route.sections.forEach(section => {
        segmentTimes.push(section.duration);
        segmentDistances.push(section.distance);
      });
    } else {
      // 단일 구간인 경우
      segmentTimes.push(summary.duration);
      segmentDistances.push(summary.distance);
    }

    const result = {
      totalTime: summary.duration,
      totalDistance: summary.distance,
      path: path,
      segmentTimes: segmentTimes,
      segmentDistances: segmentDistances,
      tollFare: summary.fare?.toll || 0,
      taxiFare: summary.fare?.taxi || 0,
      fuelPrice: summary.fare?.fuel || 0
    };

    console.log('KAKAO Mobility API success:', {
      totalTime: `${(result.totalTime/60000).toFixed(1)}min`,
      totalDistance: `${(result.totalDistance/1000).toFixed(1)}km`,
      pathPoints: result.path.length,
      segments: result.segmentTimes.length,
      apiResponseCode: data.code,
      apiMessage: data.msg
    });

    res.status(200).json(result);

  } catch (error) {
    console.error('Directions API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
