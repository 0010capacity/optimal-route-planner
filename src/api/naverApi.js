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

  console.log('Geocoding address:', address);

  // Firebase Functions를 통한 NAVER Geocoding API 호출
  try {
    const firebaseFunctionUrl = `https://geocodeaddress-weu5x3oaea-uc.a.run.app?address=${encodeURIComponent(address)}`;
    console.log('Calling Firebase Function for geocoding:', firebaseFunctionUrl);

    const response = await fetch(firebaseFunctionUrl);

    if (response.ok) {
      const data = await response.json();
      console.log('Firebase Function geocoding response:', data);

      if (data.lat && data.lng) {
        return { lat: data.lat, lng: data.lng };
      } else {
        console.log('Invalid geocoding response, using fallback');
        return { lat: 37.5665, lng: 126.9780 }; // 서울 시청 좌표
      }
    } else {
      console.log('Firebase Function geocoding response status:', response.status);
      return { lat: 37.5665, lng: 126.9780 };
    }
  } catch (error) {
    console.error('Geocoding error:', error);
    return { lat: 37.5665, lng: 126.9780 };
  }
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
    const firebaseFunctionUrl = `https://getdirections-weu5x3oaea-uc.a.run.app/`;
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


