import { useState, useEffect, useRef, useCallback } from 'react';

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.9780 };

// 전역 싱글톤 변수들 - 앱 전체에서 지도를 한 번만 초기화하기 위해
let globalMapInstance = null;
let globalIsInitialized = false;
let globalMapContainer = null; // DOM element를 직접 저장
let globalMarkersRef = [];
let globalPolylineRef = null;

// 모바일 기기 감지
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         window.innerWidth <= 768;
};

// 모바일에 최적화된 위치 옵션
const getGeolocationOptions = () => {
  const isMobile = isMobileDevice();
  
  return {
    enableHighAccuracy: !isMobile, // 모바일에서는 정확도 낮춰서 속도 향상
    timeout: isMobile ? 20000 : 10000, // 모바일에서는 더 긴 타임아웃
    maximumAge: 300000
  };
};

export const useMap = (mapContainerCallback) => {
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [userLocation, setUserLocation] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // 지도 초기화 - 싱글톤 패턴 적용
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    // 이미 전역에서 초기화되었으면 기존 인스턴스 사용
    if (globalIsInitialized && globalMapInstance) {
      setMapInstance(globalMapInstance);
      return;
    }

    // 이미 초기화 중이면 중복 실행 방지
    if (globalIsInitialized === 'initializing') {
      return;
    }

    // 초기화 시작 표시
    globalIsInitialized = 'initializing';

    // 지도 컨테이너가 준비될 때까지 기다림
    let waitCount = 0;
    const maxWaitCount = 50; // 최대 5초 대기
    
    const waitForMapContainer = () => {
      waitCount++;
      
      // 콜백을 통해 컨테이너를 가져옴
      const container = mapContainerCallback ? mapContainerCallback() : null;
      
      if (!container) {
        if (waitCount > maxWaitCount) {
          console.error('지도 컨테이너 대기 시간 초과');
          globalIsInitialized = false;
          return;
        }
        setTimeout(waitForMapContainer, 100);
        return;
      }

      // 전역 컨테이너에 저장
      globalMapContainer = container;

      // Kakao 지도 SDK가 로드될 때까지 기다림
      let sdkWaitCount = 0;
      const maxSdkWaitCount = 100; // 최대 10초 대기
      
      const initMap = () => {
        sdkWaitCount++;
        
        if (!window.kakao || !window.kakao.maps) {
          if (sdkWaitCount > maxSdkWaitCount) {
            console.error('Kakao 지도 SDK 로드 시간 초과');
            globalIsInitialized = false;
            return;
          }
          setTimeout(initMap, 100);
          return;
        }

        // 이미 초기화되었는지 다시 확인
        if (globalIsInitialized === true) {
          setMapInstance(globalMapInstance);
          return;
        }

        try {
          const map = new window.kakao.maps.Map(globalMapContainer, {
            center: new window.kakao.maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng),
            level: 5 // Kakao 지도에서는 level 사용 (1-14, 숫자가 클수록 확대)
          });

          // 전역 변수에 저장
          globalMapInstance = map;
          globalIsInitialized = true;
          globalMarkersRef = [];
          globalPolylineRef = null;
          
          setMapInstance(map);

          // 지도 중심 변경 이벤트 리스너
          window.kakao.maps.event.addListener(map, 'center_changed', () => {
            const center = map.getCenter();
            setMapCenter({
              lat: center.getLat(),
              lng: center.getLng()
            });
          });
        } catch (error) {
          console.error('지도 초기화 오류:', error);
          globalIsInitialized = false; // 에러 시 초기화 상태 리셋
        }
      };

      // 약간의 지연 후 초기화 시작
      setTimeout(initMap, 100);
    };

    waitForMapContainer();

    // 클린업 함수 - 마지막 컴포넌트가 언마운트될 때만 정리
    return () => {
      // Strict Mode에서는 정리하지 않음
    };
  }, []); // 빈 의존성 배열

  // 지도 중심 업데이트
  useEffect(() => {
    if (mapInstance && mapCenter) {
      mapInstance.setCenter(new window.kakao.maps.LatLng(mapCenter.lat, mapCenter.lng));
    }
  }, [mapCenter, mapInstance]);

  const moveMapToLocation = useCallback((coords) => {
    setMapCenter(coords);
    if (globalMapInstance) {
      try {
        globalMapInstance.setCenter(new window.kakao.maps.LatLng(coords.lat, coords.lng));
      } catch (error) {
        console.error('Error moving map:', error);
      }
    }
  }, []);

  const getCurrentLocation = useCallback(() => {
    // HTTPS 확인 (Geolocation API는 HTTPS에서만 작동)
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      alert('위치 서비스는 HTTPS 환경에서만 사용할 수 있습니다.');
      return;
    }

    if (!navigator.geolocation) {
      alert('이 브라우저는 위치 서비스를 지원하지 않습니다.');
      return;
    }

    setIsGettingLocation(true);
    const options = getGeolocationOptions();
    const isMobile = isMobileDevice();

    // 모바일에서는 사용자에게 위치 권한 요청 안내
    if (isMobile && navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'denied') {
          alert('위치 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.');
          setIsGettingLocation(false);
          return;
        }
      }).catch(() => {
        // 권한 API를 지원하지 않는 브라우저에서는 무시
      });
    }

    const getLocation = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          
          const newLocation = { lat: latitude, lng: longitude };
          setUserLocation(newLocation);
          moveMapToLocation(newLocation);
          setIsGettingLocation(false);
        },
        (error) => {
          console.error('위치 서비스 오류:', error);
          setIsGettingLocation(false);
          
          let errorMessage = '현재 위치를 가져올 수 없습니다.';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = '위치 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = '위치 정보를 사용할 수 없습니다. GPS 신호를 확인해주세요.';
              break;
            case error.TIMEOUT:
              errorMessage = '위치 정보 요청이 시간 초과되었습니다. 다시 시도해주세요.';
              break;
            default:
              errorMessage = `위치 정보 오류: ${error.message}`;
              break;
          }
          
          alert(errorMessage);
          
          // 모바일에서는 정확도 낮춰서 재시도
          if (isMobile && options.enableHighAccuracy && error.code === error.TIMEOUT) {
            setTimeout(() => {
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  const { latitude, longitude } = position.coords;
                  const newLocation = { lat: latitude, lng: longitude };
                  setUserLocation(newLocation);
                  moveMapToLocation(newLocation);
                  setIsGettingLocation(false);
                },
                (retryError) => {
                  setIsGettingLocation(false);
                },
                { ...options, enableHighAccuracy: false, timeout: 15000 }
              );
            }, 1000);
          }
        },
        options
      );
    };

    getLocation();
  }, [moveMapToLocation]);

  return {
    mapCenter,
    setMapCenter,
    userLocation,
    mapInstance,
    markersRef: { current: globalMarkersRef }, // 전역 markers ref 반환
    polylineRef: { current: globalPolylineRef }, // 전역 polyline ref 반환
    moveMapToLocation,
    getCurrentLocation,
    isGettingLocation
  };
};
