const functions = require('firebase-functions');
const express = require('express');
const app = express();

// CORS 설정
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  next();
});

// 공통 유틸리티 함수들
const getDistance = (point1, point2) => {
  const R = 6371; // 지구 반지름 (km)
  const dLat = (point2.lat - point1.lat) * Math.PI / 180;
  const dLng = (point2.lng - point1.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const isValidCoordinate = (coord) => {
  return coord && typeof coord.lat === 'number' && typeof coord.lng === 'number' &&
         coord.lat >= -90 && coord.lat <= 90 && coord.lng >= -180 && coord.lng <= 180;
};

const isValidCoordinateArray = (coordsArray) => {
  return Array.isArray(coordsArray) && coordsArray.length >= 2 &&
         coordsArray.every(coord => isValidCoordinate(coord));
};

/**
 * Directions API Route
 */
app.post('/api/directions', async (req, res) => {
  const startTime = Date.now();
  console.log(`[${new Date().toISOString()}] Directions API called`);

  try {
    const { coordsArray, namesArray } = req.body;

    // 입력 검증
    if (!coordsArray || !Array.isArray(coordsArray) || coordsArray.length < 2) {
      console.log(`[${new Date().toISOString()}] Invalid coordinates array:`, coordsArray);
      return res.status(400).json({ error: 'Invalid coordinates array - must have at least 2 points' });
    }

    if (!isValidCoordinateArray(coordsArray)) {
      console.log(`[${new Date().toISOString()}] Invalid coordinate format:`, coordsArray);
      return res.status(400).json({ error: 'Invalid coordinate format' });
    }

    // 카카오 모빌리티 API 키 확인
    const KAKAO_REST_API_KEY = functions.config().kakao?.rest_api_key || process.env.KAKAO_REST_API_KEY;
    if (!KAKAO_REST_API_KEY) {
      console.error('KAKAO_REST_API_KEY not configured');
      return res.status(500).json({ error: 'API configuration error' });
    }

    console.log(`[${new Date().toISOString()}] Processing ${coordsArray.length} locations`);

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
    console.log(`[${new Date().toISOString()}] Calling Kakao API: ${apiUrl.substring(0, 100)}...`);

    const kakaoStartTime = Date.now();
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `KakaoAK ${KAKAO_REST_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    const kakaoEndTime = Date.now();
    const kakaoDuration = kakaoEndTime - kakaoStartTime;
    console.log(`[${new Date().toISOString()}] Kakao API response time: ${kakaoDuration}ms`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${new Date().toISOString()}] KAKAO API error:`, response.status, errorText);
      return res.status(response.status).json({ error: 'KAKAO API error' });
    }

    const data = await response.json();
    console.log(`[${new Date().toISOString()}] Kakao API response received, processing data...`);

    // 카카오 API 응답을 기존 포맷으로 변환
    if (!data.routes || !data.routes[0]) {
      console.error(`[${new Date().toISOString()}] Invalid KAKAO API response - no routes found`);
      return res.status(500).json({ error: 'Invalid KAKAO API response - no routes found' });
    }

    const route = data.routes[0];
    const summary = route.summary;

    // summary가 없는 경우 처리 (출발지와 도착지가 같은 경우 등)
    if (!summary) {
      console.warn(`[${new Date().toISOString()}] KAKAO API returned no summary, using default values`);
      const endTime = Date.now();
      const totalDuration = endTime - startTime;
      console.log(`[${new Date().toISOString()}] Total processing time: ${totalDuration}ms`);
      return res.status(200).json({
        totalTime: 0,
        totalDistance: 0,
        path: [],
        segmentTimes: [],
        segmentDistances: [],
        tollFare: 0,
        taxiFare: 0,
        fuelPrice: 0
      });
    }

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

    if (route.sections && route.sections.length > 0) {
      route.sections.forEach(section => {
        segmentTimes.push(section.duration || 0);
        segmentDistances.push(section.distance || 0);
      });
    } else {
      // 단일 구간인 경우 또는 sections가 없는 경우
      segmentTimes.push(summary.duration || 0);
      segmentDistances.push(summary.distance || 0);
    }

    const result = {
      totalTime: summary.duration || 0,
      totalDistance: summary.distance || 0,
      path: path,
      segmentTimes: segmentTimes,
      segmentDistances: segmentDistances,
      tollFare: summary.fare?.toll || 0,
      taxiFare: summary.fare?.taxi || 0,
      fuelPrice: summary.fare?.fuel || 0
    };

    const endTime = Date.now();
    const totalDuration = endTime - startTime;
    console.log(`[${new Date().toISOString()}] Directions API completed in ${totalDuration}ms`);

    res.status(200).json(result);

  } catch (error) {
    const endTime = Date.now();
    const totalDuration = endTime - startTime;
    console.error(`[${new Date().toISOString()}] Directions API error after ${totalDuration}ms:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Firebase Functions export
exports.api = functions.region('asia-northeast3').https.onRequest(app);
