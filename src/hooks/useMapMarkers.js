import { useEffect } from 'react';
import { getMarkerColor, getMarkerSymbol, createMarkerIcon, createUserLocationIcon, createSearchMarkerIcon } from '../utils/mapUtils';

export const useMapMarkers = (mapInstance, geocodedLocations, userLocation, searchResults, optimizedRoute, markersRef, polylineRef, handleSearchResultSelect, moveMapToLocation) => {
  // 마커 및 경로 관리
  useEffect(() => {
    if (!mapInstance) return;

    // 기존 마커 및 경로 제거
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    // 경유지 마커 추가
    geocodedLocations.forEach((loc, index) => {
      const markerColor = getMarkerColor(index, geocodedLocations.length);
      const markerSymbol = getMarkerSymbol(index, geocodedLocations.length);

      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(loc.coords.lat, loc.coords.lng),
        map: mapInstance,
        title: loc.name,
        icon: createMarkerIcon(markerColor, markerSymbol)
      });
      markersRef.current.push(marker);
    });

    // 최적화된 경로 표시
    if (optimizedRoute && optimizedRoute.path && optimizedRoute.path.length > 0) {
      console.log('🛣️ 경로 표시 시작:', {
        경로포인트수: optimizedRoute.path.length,
        전체시간: optimizedRoute.totalTime,
        총거리: optimizedRoute.totalDistance,
        경로데이터: optimizedRoute.path.slice(0, 5) // 처음 5개 포인트만 로그
      });

      const pathCoords = optimizedRoute.path.map(coord =>
        new window.naver.maps.LatLng(coord.lat, coord.lng)
      );

      console.log('🗺️ 변환된 경로 좌표:', pathCoords.slice(0, 3)); // 처음 3개만 로그

      const polyline = new window.naver.maps.Polyline({
        path: pathCoords,
        strokeColor: '#667eea',
        strokeWeight: 6,
        strokeOpacity: 0.9,
        strokeStyle: 'solid',
        map: mapInstance
      });

      polylineRef.current = polyline;
      console.log('✅ 폴리라인 생성 완료');

      // 경로가 보이도록 지도 범위 조정
      if (pathCoords.length > 0) {
        const bounds = new window.naver.maps.LatLngBounds();
        pathCoords.forEach(coord => bounds.extend(coord));
        mapInstance.fitBounds(bounds);
        setTimeout(() => {
          mapInstance.setZoom(mapInstance.getZoom() - 1);
          console.log('📍 지도 줌 레벨 조정 완료');
        }, 100);
      }
    } else {
      console.log('❌ 경로 데이터 없음:', optimizedRoute);
    }

    // 사용자 위치 마커
    if (userLocation) {
      const userMarker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(userLocation.lat, userLocation.lng),
        map: mapInstance,
        title: "내 위치",
        icon: createUserLocationIcon()
      });
      markersRef.current.push(userMarker);
    }

    // 검색 결과 마커
    searchResults.slice(0, 10).forEach((result, index) => {
      const resultCoords = {
        lat: parseFloat(result.y),
        lng: parseFloat(result.x)
      };
      const locationName = result.title.replace(/<[^>]*>/g, '');

      const searchMarker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(resultCoords.lat, resultCoords.lng),
        map: mapInstance,
        title: `${index + 1}. ${locationName}`,
        icon: createSearchMarkerIcon(index + 1)
      });

      window.naver.maps.Event.addListener(searchMarker, 'click', () => {
        handleSearchResultSelect(result);
        moveMapToLocation(resultCoords);
      });

      markersRef.current.push(searchMarker);
    });

  }, [geocodedLocations, userLocation, searchResults, mapInstance, optimizedRoute, markersRef, polylineRef, handleSearchResultSelect, moveMapToLocation]);
};
