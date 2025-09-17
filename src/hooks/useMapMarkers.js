import { useEffect, useCallback, useMemo, useRef } from 'react';
import { getMarkerColor, getMarkerSymbol, createMarkerIcon, createUserLocationIcon, createSearchMarkerIcon } from '../utils/mapUtils';

export const useMapMarkers = (mapInstance, geocodedLocations, userLocation, searchResults, optimizedRoute, markersRef, polylineRef, handleSearchResultSelect, moveMapToLocation, currentMode, isOptimizing) => {
  // 폴리라인 객체들을 추적하기 위한 배열
  const polylinesRef = useRef([]);
  // Memoize marker removal condition
  const searchMarkerCondition = useCallback((marker) => marker.getTitle && /^\d+\.\s/.test(marker.getTitle()), []);

  // Helper function to remove markers by condition
  const removeMarkers = useCallback((condition) => {
    const originalCount = markersRef.current.length;
    markersRef.current = markersRef.current.filter((marker, index) => {
      if (marker && condition(marker, index)) {
        if (marker.setMap) {
          marker.setMap(null);
        }
        return false;
      }
      return true;
    });
  }, []);

  // Helper function to clear all polylines
  const clearAllPolylines = useCallback(() => {
    console.log('🧹 모든 폴리라인 제거 시도:', polylinesRef.current.length, '개');
    polylinesRef.current.forEach((polyline, index) => {
      try {
        if (polyline && typeof polyline.setMap === 'function') {
          polyline.setMap(null);
          console.log(`✅ 폴리라인 ${index} 제거 성공`);
        }
      } catch (error) {
        console.error(`❌ 폴리라인 ${index} 제거 실패:`, error);
      }
    });
    polylinesRef.current = [];
    polylineRef.current = null;
    console.log('✅ 모든 폴리라인 제거 완료');
  }, []);

  // Helper function to clear all markers and polylines
  const clearAllMarkersAndPolyline = useCallback(() => {
    console.log('🧹 모든 마커와 폴리라인 제거 시작');
    
    // 모든 마커 제거
    markersRef.current.forEach((marker, index) => {
      try {
        if (marker && marker.setMap) {
          marker.setMap(null);
          console.log(`✅ 마커 ${index} 제거 성공`);
        }
      } catch (error) {
        console.error(`❌ 마커 ${index} 제거 실패:`, error);
      }
    });
    markersRef.current = [];
    
    // 모든 폴리라인 제거
    clearAllPolylines();
    
    console.log('✅ 모든 마커와 폴리라인 제거 완료');
  }, [clearAllPolylines]);

  // Helper function to clear route line
  const clearRouteLine = useCallback(() => {
    if (polylineRef.current && polylineRef.current.setMap) {
      console.log('🗑️ 경로 라인 강제 제거');
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }
  }, []);

  // geocodedLocations이 변경될 때마다 경로 라인 강제 제거
  useEffect(() => {
    console.log('📍 geocodedLocations 변경 감지:', geocodedLocations.length, '개 지점');
    clearAllPolylines();
  }, [geocodedLocations, clearAllPolylines]);

  // Helper function to add waypoint markers
  const addWaypointMarkers = useCallback(() => {
    geocodedLocations.forEach((loc, index) => {
      if (!loc.coords || !loc.coords.lat || !loc.coords.lng) {
        return;
      }

      const markerColor = getMarkerColor(index, geocodedLocations.length);
      const markerSymbol = getMarkerSymbol(index, geocodedLocations.length);

      const marker = new window.kakao.maps.Marker({
        position: new window.kakao.maps.LatLng(loc.coords.lat, loc.coords.lng),
        map: mapInstance,
        title: loc.name,
        image: createMarkerIcon(markerColor, markerSymbol)
      });
      markersRef.current.push(marker);
    });
  }, [geocodedLocations, mapInstance]);

  // Helper function to add user location marker
  const addUserLocationMarker = useCallback(() => {
    if (!userLocation) return;

    const userMarker = new window.kakao.maps.Marker({
      position: new window.kakao.maps.LatLng(userLocation.lat, userLocation.lng),
      map: mapInstance,
      title: "내 위치",
      image: createUserLocationIcon()
    });
    markersRef.current.push(userMarker);
  }, [userLocation, mapInstance]);

  // Helper function to display optimized route
  const displayOptimizedRoute = useCallback(() => {
    console.log('🔄 displayOptimizedRoute 호출됨');
    console.log('📊 현재 상태:', {
      isOptimizing,
      hasOptimizedRoute: !!optimizedRoute,
      hasPath: !!(optimizedRoute?.path),
      pathLength: optimizedRoute?.path?.length,
      hasCurrentPolyline: !!polylineRef.current,
      totalPolylines: polylinesRef.current.length
    });

    // 모든 기존 폴리라인 제거
    clearAllPolylines();

    // 최적화 중이거나 경로가 없으면 라인을 그리지 않음
    if (isOptimizing || !optimizedRoute || !optimizedRoute.path || optimizedRoute.path.length === 0) {
      console.log('🚫 경로 라인 표시 조건 불충족');
      return;
    }

    console.log('🛣️ 새로운 경로 라인 생성 시작');

    try {
      const pathCoords = optimizedRoute.path.map(coord => {
        if (!coord || typeof coord.lat !== 'number' || typeof coord.lng !== 'number') {
          console.warn('⚠️ 유효하지 않은 좌표:', coord);
          return null;
        }
        return new window.kakao.maps.LatLng(coord.lat, coord.lng);
      }).filter(coord => coord !== null);

      if (pathCoords.length === 0) {
        console.warn('⚠️ 유효한 경로 좌표가 없음');
        return;
      }

      console.log('📍 경로 좌표 생성됨:', pathCoords.length, '개');

      const polyline = new window.kakao.maps.Polyline({
        path: pathCoords,
        strokeColor: '#667eea',
        strokeWeight: 6,
        strokeOpacity: 0.9,
        strokeStyle: 'solid',
        map: mapInstance
      });

      // 폴리라인이 제대로 생성되었는지 확인
      if (polyline && typeof polyline.setMap === 'function') {
        polylineRef.current = polyline;
        polylinesRef.current.push(polyline); // 추적 배열에 추가
        console.log('✅ 새로운 폴리라인 생성 및 설정됨 (총:', polylinesRef.current.length, '개)');
      } else {
        console.error('❌ 폴리라인 생성 실패: 유효하지 않은 객체');
      }

      // Adjust map bounds to show the route
      if (pathCoords.length > 0) {
        const bounds = new window.kakao.maps.LatLngBounds();
        pathCoords.forEach(coord => bounds.extend(coord));
        mapInstance.setBounds(bounds);
        setTimeout(() => {
          const level = mapInstance.getLevel();
          if (level > 3) {
            mapInstance.setLevel(level - 1);
          }
        }, 100);
      }
    } catch (error) {
      console.error('❌ 폴리라인 생성 실패:', error);
    }
  }, [optimizedRoute, mapInstance, isOptimizing, clearAllPolylines]);

  // Memoize search results titles for comparison
  const currentSearchTitles = useMemo(() =>
    searchResults?.map(r => r.title).join(',') || '',
    [searchResults]
  );

  // Combined effect for marker and route management
  useEffect(() => {
    if (!mapInstance) return;

    if (currentMode === 'list') {
      // Remove search result markers only, keep geocoded locations
      removeMarkers(searchMarkerCondition);

      // Add waypoint markers for geocoded locations
      addWaypointMarkers();

      // Add user location marker
      addUserLocationMarker();

      // Display optimized route
      displayOptimizedRoute();

      return;
    }

    // Search mode: Clear all and rebuild
    clearAllMarkersAndPolyline();

    // Add waypoint markers
    addWaypointMarkers();

    // Add user location marker
    addUserLocationMarker();

    // Display optimized route
    displayOptimizedRoute();
  }, [mapInstance, geocodedLocations, userLocation, optimizedRoute, currentMode, isOptimizing, removeMarkers, clearAllMarkersAndPolyline, addWaypointMarkers, addUserLocationMarker, displayOptimizedRoute, searchMarkerCondition, clearRouteLine]);

  // Search result markers management
  useEffect(() => {
    if (!mapInstance || currentMode !== 'search') return;

    // Check if search results have actually changed
    const existingSearchTitles = markersRef.current
      .filter(marker => marker.getTitle && /^\d+\.\s/.test(marker.getTitle()))
      .map(marker => marker.getTitle().replace(/^\d+\.\s/, ''))
      .join(',');

    // If search results haven't changed, don't recreate markers
    if (currentSearchTitles === existingSearchTitles && searchResults?.length > 0) {
      return;
    }

    // Remove existing search result markers
    removeMarkers(searchMarkerCondition);

    if (searchResults && searchResults.length > 0) {
      // Move map to first result
      const firstResult = searchResults[0];
      if (firstResult && firstResult.y && firstResult.x) {
        const firstResultCoords = {
          lat: parseFloat(firstResult.y),
          lng: parseFloat(firstResult.x)
        };
        mapInstance.setCenter(new window.kakao.maps.LatLng(firstResultCoords.lat, firstResultCoords.lng));
        mapInstance.setLevel(4);
      }

      // Add search result markers (limit to 10)
      searchResults.slice(0, 10).forEach((result, index) => {
        if (!result.y || !result.x) return;

        const resultCoords = {
          lat: parseFloat(result.y),
          lng: parseFloat(result.x)
        };
        const locationName = result.title.replace(/<[^>]*>/g, '');

        const searchMarker = new window.kakao.maps.Marker({
          position: new window.kakao.maps.LatLng(resultCoords.lat, resultCoords.lng),
          map: mapInstance,
          title: `${index + 1}. ${locationName}`,
          image: createSearchMarkerIcon(index + 1)
        });

        window.kakao.maps.event.addListener(searchMarker, 'click', () => {
          handleSearchResultSelect(result);
          moveMapToLocation(resultCoords);
        });

        markersRef.current.push(searchMarker);
      });
    }
  }, [searchResults, mapInstance, currentMode, handleSearchResultSelect, moveMapToLocation, removeMarkers, searchMarkerCondition, currentSearchTitles]);
};
