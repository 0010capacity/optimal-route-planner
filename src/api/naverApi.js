import { isValidCoordinateArray } from './utils.js';
import { MapUrlGenerator } from '../utils/mapUrlGenerator.js';

// Next.js 환경 변수 사용
const NAVER_CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID;

/**
 * 개선된 Directions API 호출 함수
 * 에러 처리와 재시도 로직 강화
 */
export const getDirections = async (coordsArray, namesArray, retryCount = 3, onProgress = null) => {
  const startTime = Date.now();
  console.log(`[Client] Starting directions API call for ${coordsArray.length} locations`);

  if (!isValidCoordinateArray(coordsArray)) {
    console.error('Invalid coordinates array:', coordsArray);
    return null;
  }

  const nextJsUrl = '/api/directions';

  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      console.log(`[Client] Attempt ${attempt}/${retryCount} - Calling Firebase Functions`);

      const fetchStartTime = Date.now();
      const response = await fetch(nextJsUrl, {
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
      const fetchEndTime = Date.now();
      const fetchDuration = fetchEndTime - fetchStartTime;
      console.log(`[Client] Firebase Functions response time: ${fetchDuration}ms`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Next.js API error (attempt ${attempt}):`, response.status, response.statusText, errorText);

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
      const endTime = Date.now();
      const totalDuration = endTime - startTime;
      console.log(`[Client] Total API call completed in ${totalDuration}ms`);

      // 응답 데이터 유효성 검증
      if (!data || typeof data.totalTime !== 'number' || typeof data.totalDistance !== 'number') {
        console.error('Invalid response data:', data);
        if (attempt < retryCount) {
          continue;
        }
        return null;
      }

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
 * 배치 Directions API 호출 함수
 * 여러 경로를 동시에 계산하여 성능 향상
 */
export const getBatchDirections = async (routesArray, retryCount = 3, onProgress = null) => {
  const startTime = Date.now();
  console.log(`[Client] Starting batch directions API call for ${routesArray.length} routes`);

  if (!Array.isArray(routesArray) || routesArray.length === 0) {
    console.error('Invalid routes array:', routesArray);
    return null;
  }

  // 각 경로 유효성 검증
  for (let i = 0; i < routesArray.length; i++) {
    const route = routesArray[i];
    if (!route.coordsArray || !route.namesArray || !isValidCoordinateArray(route.coordsArray)) {
      console.error(`Invalid route at index ${i}:`, route);
      return null;
    }
  }

  const nextJsUrl = '/api/directions';

  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      console.log(`[Client] Batch attempt ${attempt}/${retryCount} - Calling Firebase Functions`);

      const fetchStartTime = Date.now();
      const response = await fetch(nextJsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          routesArray: routesArray
        }),
        timeout: 30000 // 배치 처리는 더 긴 타임아웃 (30초)
      });
      const fetchEndTime = Date.now();
      const fetchDuration = fetchEndTime - fetchStartTime;
      console.log(`[Client] Batch Firebase Functions response time: ${fetchDuration}ms`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Batch Next.js API error (attempt ${attempt}):`, response.status, response.statusText, errorText);

        // 4xx 에러는 재시도하지 않음
        if (response.status >= 400 && response.status < 500) {
          return null;
        }

        // 마지막 시도가 아니면 재시도
        if (attempt < retryCount) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          continue;
        }
        return null;
      }

      const data = await response.json();
      const endTime = Date.now();
      const totalDuration = endTime - startTime;
      console.log(`[Client] Batch API call completed in ${totalDuration}ms`);

      // 배치 응답 유효성 검증
      if (!data || !data.batch || !Array.isArray(data.results)) {
        console.error('Invalid batch response data:', data);
        if (attempt < retryCount) {
          continue;
        }
        return null;
      }

      // 진행률 콜백 호출
      if (onProgress) {
        onProgress(data.results.length, data.routeCount);
      }

      return data;

    } catch (error) {
      console.error(`Error getting batch directions (attempt ${attempt}):`, error);

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
 * 스마트 배치/단일 경로 선택 함수
 * 경로 개수에 따라 자동으로 적절한 함수 선택
 */
export const getOptimalDirections = async (routesOrCoords, namesArray = null, retryCount = 3, onProgress = null) => {
  // 단일 경로인 경우
  if (Array.isArray(routesOrCoords) && routesOrCoords.length > 0 && typeof routesOrCoords[0] === 'object' && routesOrCoords[0].coordsArray) {
    // routesArray 형식 (배치)
    return await getBatchDirections(routesOrCoords, retryCount, onProgress);
  } else if (Array.isArray(routesOrCoords) && namesArray) {
    // coordsArray + namesArray 형식 (단일)
    return await getDirections(routesOrCoords, namesArray, retryCount, onProgress);
  } else {
    console.error('Invalid parameters for getOptimalDirections');
    return null;
  }
};

// 진행률 콜백을 호출하는 헬퍼 함수
export const callProgressCallback = (onProgress, current, total) => {
  if (onProgress && typeof onProgress === 'function') {
    onProgress(current, total);
  }
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
    window.location.href = urls.primaryUrl;
    
    if (urls.fallbackUrl) {
      setTimeout(() => {
        window.open(urls.fallbackUrl, '_blank');
      }, 2000);
    }
  } else if (urls.primaryUrl) {
    // 데스크톱: 웹 URL로 바로 이동
    window.open(urls.primaryUrl, '_blank');
  } else {
    console.error(`Failed to generate ${mapType} URL`);
  }
};
