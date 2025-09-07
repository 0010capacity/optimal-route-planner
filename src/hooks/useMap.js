import { useState, useEffect, useRef, useCallback } from 'react';

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.9780 };
const GEOLOCATION_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 300000
};

export const useMap = () => {
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [userLocation, setUserLocation] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
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
    if (!navigator.geolocation) {
      console.warn('이 브라우저는 위치 서비스를 지원하지 않습니다.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newLocation = { lat: latitude, lng: longitude };
        setUserLocation(newLocation);
        moveMapToLocation(newLocation);
      },
      (error) => {
        console.error('위치 서비스 오류:', error);
        console.warn('현재 위치를 가져올 수 없습니다.');
      },
      GEOLOCATION_OPTIONS
    );
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
    getCurrentLocation
  };
};
