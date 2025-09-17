import { useEffect } from 'react';
import { getMarkerColor, getMarkerSymbol, createMarkerIcon, createUserLocationIcon, createSearchMarkerIcon } from '../utils/mapUtils';

export const useMapMarkers = (mapInstance, geocodedLocations, userLocation, searchResults, optimizedRoute, markersRef, polylineRef, handleSearchResultSelect, moveMapToLocation, currentMode, searchMarkers, setSearchMarkers) => {
  // 기본 마커 및 경로 관리 (currentMode 변경 시)
  useEffect(() => {
    if (!mapInstance) return;

    console.log('🔄 useMapMarkers 기본 실행:', {
      currentMode,
      geocodedLocationsCount: geocodedLocations.length,
      hasPolyline: !!polylineRef.current
    });

    // 모드 변경 시 검색 결과 마커만 선택적으로 제거
    if (currentMode === 'list') {
      console.log('🏠 리스트 모드로 전환: 검색 결과 마커만 제거');
      // 검색 결과 마커만 제거 (타이틀이 "숫자. "로 시작하는 마커)
      const originalCount = markersRef.current.length;
      markersRef.current = markersRef.current.filter((marker, index) => {
        if (marker && marker.getTitle && /^\d+\.\s/.test(marker.getTitle())) {
          if (marker.setMap) {
            marker.setMap(null);
            console.log(`🗑️ 검색 결과 마커 ${index} 제거됨: ${marker.getTitle()}`);
          }
          return false; // 필터에서 제거
        }
        return true; // 유지
      });
      const removedCount = originalCount - markersRef.current.length;
      console.log(`🧹 검색 결과 마커 ${removedCount}개 제거됨, ${markersRef.current.length}개 유지됨`);
      return; // 리스트 모드에서는 마커 재생성하지 않음
    }

    // 기존 마커 및 경로 제거 (검색 모드에서는 전체 재생성)
    markersRef.current.forEach(marker => {
      if (marker && marker.setMap) {
        marker.setMap(null);
      }
    });
    markersRef.current = [];

    if (polylineRef.current && polylineRef.current.setMap) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    console.log('🧹 기존 마커 및 경로 모두 제거됨');

    // 경유지 마커 추가 (항상 표시)
    geocodedLocations.forEach((loc, index) => {
      if (!loc.coords) return; // 좌표가 없는 장소는 건너뛰기

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

    console.log(`📍 경유지 마커 ${geocodedLocations.length}개 생성됨`);

    // 사용자 위치 마커 (항상 표시)
    if (userLocation) {
      const userMarker = new window.kakao.maps.Marker({
        position: new window.kakao.maps.LatLng(userLocation.lat, userLocation.lng),
        map: mapInstance,
        title: "내 위치",
        image: createUserLocationIcon()
      });
      markersRef.current.push(userMarker);
      console.log('📍 사용자 위치 마커 생성됨');
    }

    // 최적화된 경로 표시 (항상 표시)
    if (optimizedRoute && optimizedRoute.path && optimizedRoute.path.length > 0) {
      const pathCoords = optimizedRoute.path.map(coord =>
        new window.kakao.maps.LatLng(coord.lat, coord.lng)
      );

      const polyline = new window.kakao.maps.Polyline({
        path: pathCoords,
        strokeColor: '#667eea',
        strokeWeight: 6,
        strokeOpacity: 0.9,
        strokeStyle: 'solid',
        map: mapInstance
      });

      polylineRef.current = polyline;
      console.log('🛣️ 최적화 경로 표시됨');

      // 경로가 보이도록 지도 범위 조정
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
    }

    console.log('✅ useMapMarkers 기본 실행 완료');

  }, [geocodedLocations, userLocation, mapInstance, optimizedRoute, currentMode]);

  // 검색 결과 마커 관리 (searchResults 변경 시)
  useEffect(() => {
    if (!mapInstance || currentMode !== 'search') return;

    console.log('🔍 검색 결과 마커 업데이트:', {
      searchResultsCount: searchResults.length,
      currentMarkersCount: markersRef.current.length
    });

    // 기존 검색 결과 마커 제거
    markersRef.current = markersRef.current.filter((marker, index) => {
      if (marker && marker.getTitle && /^\d+\.\s/.test(marker.getTitle())) {
        if (marker.setMap) {
          marker.setMap(null);
          console.log(`�️ 기존 검색 결과 마커 ${index} 제거됨`);
        }
        return false;
      }
      return true;
    });

    // 새로운 검색 결과 마커 생성
    if (searchResults && searchResults.length > 0) {
      // 검색 결과가 있으면 첫 번째 결과 위치로 지도 이동
      const firstResult = searchResults[0];
      if (firstResult && firstResult.y && firstResult.x) {
        const firstResultCoords = {
          lat: parseFloat(firstResult.y),
          lng: parseFloat(firstResult.x)
        };
        mapInstance.setCenter(new window.kakao.maps.LatLng(firstResultCoords.lat, firstResultCoords.lng));
        mapInstance.setLevel(4);
        console.log('📍 지도 검색 결과 위치로 이동');
      }

      // 검색 결과 마커 생성
      const newSearchMarkers = [];
      
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
          title: `${index + 1}. ${locationName}`
          // image 속성 제거 - 기본 마커 사용
        });

        window.kakao.maps.event.addListener(searchMarker, 'click', () => {
          handleSearchResultSelect(result);
          moveMapToLocation(resultCoords);
        });

        markersRef.current.push(searchMarker);
        newSearchMarkers.push(searchMarker); // 상태 배열에도 추가
      });

      // 검색 마커 상태 업데이트
      setSearchMarkers(newSearchMarkers);
      console.log(`🔍 검색 결과 마커 ${Math.min(searchResults.length, 10)}개 생성 완료, 상태에 ${newSearchMarkers.length}개 저장됨`);
    } else {
      // 검색 결과가 없으면 검색 마커 상태 초기화
      setSearchMarkers([]);
    }

  }, [searchResults, mapInstance, currentMode, handleSearchResultSelect, moveMapToLocation]);
};