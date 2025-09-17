import { isValidCoordinateArray } from '../../api/utils.js';

/**
 * Next.js API Route: NAVER Directions API
 * Firebase Functions 대신 Next.js API Route 사용
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

    // NAVER Directions 5 API 호출
    const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
    const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;

    if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
      console.error('NAVER API credentials not configured');
      return res.status(500).json({ error: 'API configuration error' });
    }

    // API 요청 준비
    const start = coordsArray[0];
    const goal = coordsArray[coordsArray.length - 1];
    const waypoints = coordsArray.length > 2 ? coordsArray.slice(1, -1) : [];

    const requestBody = {
      start: `${start.lng},${start.lat}`,
      goal: `${goal.lng},${goal.lat}`,
      option: 'trafast' // 실시간 빠른길
    };

    if (waypoints.length > 0) {
      requestBody.waypoints = waypoints.map(wp => `${wp.lng},${wp.lat}`).join('|');
    }

    console.log('Calling NAVER Directions API:', {
      start: requestBody.start,
      goal: requestBody.goal,
      waypoints: requestBody.waypoints || 'none'
    });

    const response = await fetch('https://naveropenapi.apigw.ntruss.com/map-direction/v1/driving', {
      method: 'POST',
      headers: {
        'X-NCP-APIGW-API-KEY-ID': NAVER_CLIENT_ID,
        'X-NCP-APIGW-API-KEY': NAVER_CLIENT_SECRET,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('NAVER API error:', response.status, errorText);
      return res.status(response.status).json({ error: 'NAVER API error' });
    }

    const data = await response.json();

    // NAVER API 응답을 기존 포맷으로 변환
    if (!data.route || !data.route.trafast || !data.route.trafast[0]) {
      return res.status(500).json({ error: 'Invalid NAVER API response' });
    }

    const route = data.route.trafast[0];
    const summary = route.summary;

    // 경로 포인트 추출
    const path = [];
    if (route.path) {
      route.path.forEach(coord => {
        path.push({ lat: coord[1], lng: coord[0] });
      });
    }

    // 구간별 시간과 거리 계산
    const segmentTimes = [];
    const segmentDistances = [];

    if (route.section) {
      route.section.forEach(section => {
        segmentTimes.push(section.time);
        segmentDistances.push(section.distance);
      });
    } else {
      // 단일 구간인 경우
      segmentTimes.push(summary.time);
      segmentDistances.push(summary.distance);
    }

    const result = {
      totalTime: summary.time,
      totalDistance: summary.distance,
      path: path,
      segmentTimes: segmentTimes,
      segmentDistances: segmentDistances,
      tollFare: summary.tollFare || 0,
      taxiFare: summary.taxiFare || 0,
      fuelPrice: summary.fuelPrice || 0
    };

    console.log('NAVER Directions API success:', {
      totalTime: `${(result.totalTime/60000).toFixed(1)}min`,
      totalDistance: `${(result.totalDistance/1000).toFixed(1)}km`,
      pathPoints: result.path.length,
      segments: result.segmentTimes.length
    });

    res.status(200).json(result);

  } catch (error) {
    console.error('Directions API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
