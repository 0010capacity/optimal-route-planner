import { isValidCoordinateArray } from './utils.js';
import { MapUrlGenerator } from '../utils/mapUrlGenerator.js';

// NAVER Directions 5 API 사용
const NAVER_CLIENT_ID = process.env.REACT_APP_NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.REACT_APP_NAVER_CLIENT_SECRET;

/**
 * 개선된 Directions API 호출 함수
 * 에러 처리와 재시도 로직 강화
 */
export const getDirections = async (coordsArray, namesArray, retryCount = 3) => {
  if (!isValidCoordinateArray(coordsArray)) {
    console.error('Invalid coordinates array:', coordsArray);
    return null;
  }

  const firebaseUrl = 'https://asia-northeast3-my-optimal-route-planner.cloudfunctions.net/getDirections';
  
  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      console.log(`Getting directions (attempt ${attempt}/${retryCount}) for coords:`, coordsArray);
      
      const response = await fetch(firebaseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          coordsArray: coordsArray,
          namesArray: namesArray
        }),
        timeout: 10000 // 10초 타임아웃
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Firebase Function error (attempt ${attempt}):`, response.status, response.statusText, errorText);
        
        // 4xx 에러는 재시도하지 않음
        if (response.status >= 400 && response.status < 500) {
          return null;
        }
        
        // 마지막 시도가 아니면 재시도
        if (attempt < retryCount) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // 지수 백오프
          continue;
        }
        return null;
      }

      const data = await response.json();
      
      // 응답 데이터 유효성 검증
      if (!data || typeof data.totalTime !== 'number' || typeof data.totalDistance !== 'number') {
        console.error('Invalid response data:', data);
        if (attempt < retryCount) {
          continue;
        }
        return null;
      }

      console.log('Firebase Function directions response:', {
        totalTime: `${(data.totalTime/60000).toFixed(1)}min`,
        totalDistance: `${(data.totalDistance/1000).toFixed(1)}km`,
        pathPoints: data.path?.length || 0,
        segments: data.segmentTimes?.length || 0
      });

      return data;
      
    } catch (error) {
      console.error(`Error getting directions (attempt ${attempt}):`, error);
      
      // 네트워크 에러 등은 재시도
      if (attempt < retryCount) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }
      return null;
    }
  }
  
  return null;
};

/**
 * 통합 지도 URL 생성 함수들 (기존 함수명 유지하면서 새로운 구현 사용)
 */

// 네이버 지도 웹 URL 생성
export const generateNaverMapUrl = (locations) => {
  return MapUrlGenerator.generateUrl('naver', 'web', locations);
};

// 네이버 지도 앱 URL 생성
export const generateNaverAppUrl = (locations) => {
  return MapUrlGenerator.generateUrl('naver', 'app', locations);
};

// 카카오맵 앱 URL 생성
export const generateKakaoAppUrl = (locations) => {
  return MapUrlGenerator.generateUrl('kakao', 'app', locations);
};

// 카카오맵 웹 URL 생성
export const generateKakaoWebUrl = (locations) => {
  return MapUrlGenerator.generateUrl('kakao', 'web', locations);
};

/**
 * 스마트 지도 공유 함수
 * 플랫폼을 자동으로 감지하여 최적의 URL을 반환
 */
export const shareToMap = (mapType, locations) => {
  const urls = MapUrlGenerator.generateSmartUrls(mapType, locations);
  
  if (MapUrlGenerator.isMobile() && urls.primaryUrl) {
    // 모바일: 앱 URL 시도 후 웹 URL로 폴백
    console.log(`Trying ${mapType} App URL:`, urls.primaryUrl);
    window.location.href = urls.primaryUrl;
    
    if (urls.fallbackUrl) {
      setTimeout(() => {
        console.log(`Fallback to ${mapType} web URL:`, urls.fallbackUrl);
        window.open(urls.fallbackUrl, '_blank');
      }, 2000);
    }
  } else if (urls.primaryUrl) {
    // 데스크톱: 웹 URL로 바로 이동
    console.log(`Desktop: Using ${mapType} web URL:`, urls.primaryUrl);
    window.open(urls.primaryUrl, '_blank');
  } else {
    console.error(`Failed to generate ${mapType} URL`);
  }
};
