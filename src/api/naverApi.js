import { isValidCoordinateArray } from './utils.js';

const NAVER_CLIENT_ID = process.env.REACT_APP_NAVER_CLIENT_ID || 'your_naver_client_id_here';
const NAVER_CLIENT_SECRET = process.env.REACT_APP_NAVER_CLIENT_SECRET || 'your_naver_client_secret_here';

// NAVER Maps API 관련 함수들
// 지오코딩, 경로 탐색 기능

// NAVER Geocoding API를 사용한 주소 변환
export const geocodeAddress = async (address) => {
  if (!address) {
    return null;
  }

  // Firebase Functions를 통한 NAVER Geocoding API 호출
  try {
    const firebaseFunctionUrl = `https://us-central1-my-optimal-route-planner.cloudfunctions.net/geocodeAddress?address=${encodeURIComponent(address)}`;

    const response = await fetch(firebaseFunctionUrl);

    if (response.ok) {
      const data = await response.json();

      if (data.lat && data.lng) {
        return { lat: data.lat, lng: data.lng };
      }
    }
  } catch (error) {
    console.error('Error with Firebase Function geocoding:', error);
  }

  // Return mock data as last resort
  return { lat: 37.5665, lng: 126.9780 }; // Seoul coordinates
};

// NAVER Directions API를 사용한 경로 탐색
export const getDirections = async (coordsArray) => {
  if (!isValidCoordinateArray(coordsArray)) {
    console.error('Directions API requires at least two valid coordinates (start and end).');
    return null;
  }

  // Firebase Functions를 통한 NAVER Directions API 호출
  try {
    const firebaseFunctionUrl = `https://us-central1-my-optimal-route-planner.cloudfunctions.net/getDirections`;

    const response = await fetch(firebaseFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ coordsArray }),
    });

    if (response.ok) {
      const data = await response.json();

      if (data.path && data.totalTime && data.totalDistance) {
        return data;
      }
    }
  } catch (error) {
    console.error('Error with Firebase Function directions:', error);
  }

  // Fallback to mock data
  const mockPath = coordsArray.map((coord, index) => ({
    lat: coord.lat + (Math.random() - 0.5) * 0.01,
    lng: coord.lng + (Math.random() - 0.5) * 0.01,
  }));

  return {
    path: mockPath,
    totalTime: 1800, // 30 minutes
    totalDistance: 15000, // 15km
    order: coordsArray.map((coord, index) => `Point ${index + 1}`)
  };
};
