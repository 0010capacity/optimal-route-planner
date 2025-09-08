import { useState, useEffect, useRef, useCallback } from 'react';

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.9780 };

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

export const useMap = () => {
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [userLocation, setUserLocation] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const polylineRef = useRef(null);

  // 지도 초기화
  useEffect(() => {
    if (!mapRef.current || !window.naver || !window.naver.maps) return;

    const map = new window.naver.maps.Map(mapRef.current, {
      center: new window.naver.maps.LatLng(mapCenter.lat, mapCenter.lng),
      zoom: 13,
      minZoom: 7,
      maxZoom: 21
    });

    setMapInstance(map);

    window.naver.maps.Event.addListener(map, 'center_changed', () => {
      const center = map.getCenter();
      setMapCenter({
        lat: center.lat(),
        lng: center.lng()
      });
    });

    return () => {
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
    };
  }, []);

  // 지도 중심 업데이트
  useEffect(() => {
    if (mapInstance && mapCenter) {
      mapInstance.setCenter(new window.naver.maps.LatLng(mapCenter.lat, mapCenter.lng));
    }
  }, [mapCenter, mapInstance]);

  const moveMapToLocation = useCallback((coords) => {
    setMapCenter(coords);
    if (mapInstance) {
      try {
        mapInstance.setCenter(new window.naver.maps.LatLng(coords.lat, coords.lng));
      } catch (error) {
        console.error('Error moving map:', error);
      }
    }
  }, [mapInstance]);

  const getCurrentLocation = useCallback(() => {
    // HTTPS 확인 (Geolocation API는 HTTPS에서만 작동)
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      alert('위치 서비스는 HTTPS 환경에서만 사용할 수 있습니다.');
      return;
    }

    if (!navigator.geolocation) {
      console.warn('이 브라우저는 위치 서비스를 지원하지 않습니다.');
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
          console.log('위치 정보 획득 성공:', { latitude, longitude, accuracy });
          
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
            console.log('정확도 낮춰서 재시도...');
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
                  console.error('재시도 실패:', retryError);
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
    mapRef,
    mapCenter,
    setMapCenter,
    userLocation,
    mapInstance,
    markersRef,
    polylineRef,
    moveMapToLocation,
    getCurrentLocation,
    isGettingLocation
  };
};
