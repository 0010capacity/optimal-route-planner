/* global naver */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { searchPlaces } from './api/kakaoApi';
import { geocodeAddress, getDirections } from './api/naverApi';
import LocationList from './components/LocationList';
import SearchSection from './components/SearchSection';
import MapSection from './components/MapSection';
import './App.css';

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.9780 };
const DEBOUNCE_DELAY = 500;
const GEOLOCATION_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 300000
};

function App() {
  const [locations, setLocations] = useState([
    { name: '', address: '', coords: null },
    { name: '', address: '', coords: null }
  ]);
  const [currentMode, setCurrentMode] = useState('list');
  const [editingIndex, setEditingIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [geocodedLocations, setGeocodedLocations] = useState([]);
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [userLocation, setUserLocation] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);

  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const polylineRef = useRef(null);
  const debounceTimeoutRef = useRef(null);

  // Kakao SDK 초기화 모니터링
  useEffect(() => {
    const checkKakaoReady = () => {
      if (window.kakaoSdkReady) return;
      setTimeout(checkKakaoReady, 500);
    };
    checkKakaoReady();
  }, []);

  // 검색 로직
  useEffect(() => {
    if (currentMode !== 'search') return;

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (searchQuery.trim() === '') {
      setSearchResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        const validCenter = mapCenter && typeof mapCenter.lat === 'number' && typeof mapCenter.lng === 'number'
          ? mapCenter
          : DEFAULT_CENTER;

        const searchResponse = await searchPlaces(searchQuery, { location: validCenter });
        const results = searchResponse.results || [];

        // 거리순 정렬
        const sortedResults = results
          .map(result => ({
            ...result,
            distance: calculateDistance(validCenter, {
              lat: parseFloat(result.y),
              lng: parseFloat(result.x)
            })
          }))
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 10);

        setSearchResults(sortedResults);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_DELAY);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchQuery, currentMode, mapCenter]);

  // 거리 계산 유틸리티
  const calculateDistance = (point1, point2) => {
    const R = 6371;
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Geocoding 로직 - Kakao 좌표가 있는 경우 생략
  useEffect(() => {
    const geocodeAllLocations = async () => {
      const geocoded = [];
      for (const loc of locations) {
        // 이미 Kakao에서 좌표를 받은 경우 Geocoding 생략
        if (loc.coords && loc.coords.lat && loc.coords.lng) {
          geocoded.push({ name: loc.name, coords: loc.coords });
        }
        // 주소가 있고 좌표가 없는 경우에만 Geocoding
        else if (loc.address && loc.address.trim() !== '') {
          try {
            const coords = await geocodeAddress(loc.address);
            if (coords) {
              geocoded.push({ name: loc.name, coords });
            }
          } catch (error) {
            console.error('Geocoding failed for:', loc.address, error);
          }
        }
      }
      setGeocodedLocations(geocoded);
    };

    geocodeAllLocations();
  }, [locations]);

  // LocalStorage 관리
  useEffect(() => {
    localStorage.setItem('routeLocations', JSON.stringify(locations));
  }, [locations]);

  useEffect(() => {
    const savedLocations = localStorage.getItem('routeLocations');
    const savedFavorites = localStorage.getItem('routeFavorites');

    if (savedLocations) {
      try {
        const parsed = JSON.parse(savedLocations);
        if (Array.isArray(parsed) && parsed.length >= 2) {
          setLocations(parsed);
        }
      } catch (error) {
        console.error('Failed to load locations:', error);
      }
    }

    if (savedFavorites) {
      try {
        const parsed = JSON.parse(savedFavorites);
        if (Array.isArray(parsed)) {
          setFavorites(parsed);
        }
      } catch (error) {
        console.error('Failed to load favorites:', error);
      }
    }
  }, []);

  // 즐겨찾기 LocalStorage 저장
  useEffect(() => {
    localStorage.setItem('routeFavorites', JSON.stringify(favorites));
  }, [favorites]);

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

  }, [geocodedLocations, userLocation, searchResults, mapInstance, optimizedRoute]);

  // 마커 색상 결정
  const getMarkerColor = (index, total) => {
    if (index === 0) return '#4caf50'; // 출발지: 녹색
    if (index === total - 1) return '#f44336'; // 도착지: 빨간색
    return '#2196f3'; // 경유지: 파란색
  };

  // 마커 심볼 결정
  const getMarkerSymbol = (index, total) => {
    if (index === 0) return '▶';
    if (index === total - 1) return '■';
    return '●';
  };

  // 마커 아이콘 생성
  const createMarkerIcon = (color, symbol) => ({
    content: `
      <div style="
        background: ${color};
        color: white;
        border-radius: 50%;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: bold;
        border: 3px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      ">${symbol}</div>
    `,
    size: new window.naver.maps.Size(28, 28),
    anchor: new window.naver.maps.Point(14, 14)
  });

  // 사용자 위치 아이콘 생성
  const createUserLocationIcon = () => ({
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="8" fill="#4285F4" stroke="white" stroke-width="2"/>
        <circle cx="12" cy="12" r="3" fill="white"/>
      </svg>
    `),
    size: new window.naver.maps.Size(24, 24),
    anchor: new window.naver.maps.Point(12, 12)
  });

  // 검색 마커 아이콘 생성
  const createSearchMarkerIcon = (number) => ({
    content: `
      <div style="
        background: #4285F4;
        color: white;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: bold;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      ">${number}</div>
    `,
    size: new window.naver.maps.Size(24, 24),
    anchor: new window.naver.maps.Point(12, 12)
  });

  // 이벤트 핸들러들
  const handleLocationClick = useCallback((index) => {
    setEditingIndex(index);
    setCurrentMode('search');
    setSearchQuery('');
    setSearchResults([]);
  }, []);

  const handleSearchResultSelect = useCallback((result) => {
    if (editingIndex === null) return;

    const locationName = result.title.replace(/<[^>]*>/g, '');
    
    // 더 robust한 좌표 검증
    const validateAndParseCoords = (x, y) => {
      if (!x || !y) return null;
      
      // 빈 문자열이나 undefined 체크
      const xStr = String(x).trim();
      const yStr = String(y).trim();
      
      if (!xStr || !yStr || xStr === '' || yStr === '') return null;
      
      const lat = parseFloat(yStr);
      const lng = parseFloat(xStr);
      
      // 유효한 좌표 범위 체크 (대한민국 범위)
      if (isNaN(lat) || isNaN(lng)) return null;
      if (lat < 33 || lat > 39 || lng < 124 || lng > 132) return null;
      
      return { lat, lng };
    };
    
    const coords = validateAndParseCoords(result.x, result.y);

    // 선택된 장소 정보 출력 (좌표 검증 결과 포함)
    console.log('🎯 선택된 장소 정보:', {
      원본결과: result,
      장소명: locationName,
      주소: result.roadAddress || result.address || '주소 정보 없음',
      좌표: coords ? `${coords.lat}, ${coords.lng}` : '좌표 정보 없음 (Geocoding 필요)',
      원본좌표값: { x: result.x, y: result.y },
      좌표유효성: coords ? '✅ 유효' : '❌ 유효하지 않음',
      카테고리: result.category || '카테고리 없음',
      전화번호: result.telephone || '전화번호 없음',
      거리: result.distance || '거리 정보 없음',
      위치인덱스: editingIndex
    });

    const newLocations = [...locations];
    newLocations[editingIndex] = {
      name: locationName,
      address: result.roadAddress || result.address || locationName,
      coords
    };

    setLocations(newLocations);
    setCurrentMode('list');
    setEditingIndex(null);
    setSearchQuery('');
    setSearchResults([]);

    // 좌표가 없는 경우 백그라운드에서 Geocoding 시도
    if (!coords) {
      const address = result.roadAddress || result.address || locationName;
      if (address && address.trim()) {
        console.log('📍 좌표 없는 장소, Geocoding 시도:', address);
        geocodeAddress(address).then(geocodedCoords => {
          if (geocodedCoords) {
            console.log('✅ Geocoding 성공:', geocodedCoords);
            const updatedLocations = [...locations];
            updatedLocations[editingIndex] = {
              name: locationName,
              address: result.roadAddress || result.address || locationName,
              coords: geocodedCoords
            };
            setLocations(updatedLocations);
          } else {
            console.log('❌ Geocoding 실패 - 좌표 정보 없음');
          }
        }).catch(error => {
          console.error('❌ Geocoding 오류:', error);
        });
      }
    }
  }, [editingIndex, locations]);

  const handleBackToList = useCallback(() => {
    setCurrentMode('list');
    setEditingIndex(null);
    setSearchQuery('');
    setSearchResults([]);
  }, []);

  const handleDragStart = useCallback((e, index) => {
    e.stopPropagation();
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  }, []);

  const handleDragOver = useCallback((e, index) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback((e, dropIndex) => {
    e.preventDefault();
    e.stopPropagation();
    const draggedIndexStr = e.dataTransfer.getData('text/plain');
    const draggedIndex = parseInt(draggedIndexStr, 10);

    if (isNaN(draggedIndex) || draggedIndex === dropIndex) {
      setDragOverIndex(null);
      return;
    }

    const newLocations = [...locations];
    const draggedItem = newLocations[draggedIndex];
    newLocations.splice(draggedIndex, 1);
    newLocations.splice(dropIndex, 0, draggedItem);

    setLocations(newLocations);
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, [locations]);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  // 삭제 핸들러
  const handleDeleteLocation = useCallback((index) => {
    const newLocations = locations.filter((_, i) => i !== index);
    setLocations(newLocations);
  }, [locations]);

  // 즐겨찾기 관리
  const addToFavorites = useCallback((location) => {
    if (location?.name && !favorites.includes(location.name)) {
      setFavorites([...favorites, location.name]);
    }
  }, [favorites]);

  const removeFromFavorites = useCallback((locationName) => {
    setFavorites(favorites.filter(fav => fav !== locationName));
  }, [favorites]);

  const selectFromFavorites = useCallback((locationName) => {
    if (editingIndex === null) return;

    const newLocations = [...locations];
    newLocations[editingIndex] = {
      name: locationName,
      address: locationName,
      coords: null  // 좌표가 없으므로 Geocoding 필요
    };
    setLocations(newLocations);
    setCurrentMode('list');
    setEditingIndex(null);
  }, [editingIndex, locations]);

  // 지도 이동
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

  // 현재 위치 가져오기
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('이 브라우저는 위치 서비스를 지원하지 않습니다.');
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
        console.error('Error getting current location:', error);
        alert('현재 위치를 가져올 수 없습니다.');
      },
      GEOLOCATION_OPTIONS
    );
  }, [moveMapToLocation]);

  // 경로 최적화
  const handleOptimizeRoute = useCallback(async () => {
    if (geocodedLocations.length < 2) {
      alert('최소 두 개 이상의 장소를 추가해야 경로를 최적화할 수 있습니다.');
      return;
    }

    console.log('🚀 경로 최적화 시작:', {
      장소수: geocodedLocations.length,
      장소목록: geocodedLocations.map(loc => ({ 이름: loc.name, 좌표: loc.coords }))
    });

    try {
      const coordsArray = geocodedLocations.map(loc => loc.coords);
      console.log('📍 Directions API 호출 좌표:', coordsArray);

      const directionsResult = await getDirections(coordsArray);
      console.log('📊 Directions API 응답:', directionsResult);

      if (directionsResult) {
        setOptimizedRoute(directionsResult);

        // 경로 최적화 결과에 따라 locations 재정렬 제거
        // 원래 목적지 목록 유지 (path는 경로 표시용으로만 사용)

        const totalMinutes = Math.round(directionsResult.totalTime / 60000);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        const timeString = hours > 0 ? `${hours}시간 ${minutes}분` : `${minutes}분`;

        console.log('✅ 경로 최적화 완료:', {
          총시간: totalMinutes,
          시간문자열: timeString,
          총거리: directionsResult.totalDistance,
          경로포인트수: directionsResult.path.length
        });

        alert(`경로 최적화 완료!\n\n총 거리: ${(directionsResult.totalDistance / 1000).toFixed(1)}km\n예상 시간: ${timeString}`);
      } else {
        console.log('❌ Directions API 실패');
        alert('경로를 계산할 수 없습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('❌ Directions API 오류:', error);
      alert('경로 최적화 중 오류가 발생했습니다.');
    }
  }, [geocodedLocations]);

  return (
    <div className="App">
      {currentMode === 'list' ? (
        <LocationList
          locations={locations}
          optimizedRoute={optimizedRoute}
          onLocationClick={handleLocationClick}
          onAddLocation={() => setLocations([...locations, { name: '', address: '', coords: null }])}
          onOptimizeRoute={handleOptimizeRoute}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onDragEnd={handleDragEnd}
          draggedIndex={draggedIndex}
          dragOverIndex={dragOverIndex}
          onDeleteLocation={handleDeleteLocation}
        />
      ) : (
        <SearchSection
          searchQuery={searchQuery}
          searchResults={searchResults}
          loading={loading}
          favorites={favorites}
          showFavorites={showFavorites}
          onSearchQueryChange={setSearchQuery}
          onBackToList={handleBackToList}
          onSearchResultSelect={handleSearchResultSelect}
          onToggleFavorites={() => setShowFavorites(!showFavorites)}
          onAddToFavorites={addToFavorites}
          onRemoveFromFavorites={removeFromFavorites}
          onSelectFromFavorites={selectFromFavorites}
        />
      )}

      <MapSection
        mapRef={mapRef}
        onGetCurrentLocation={getCurrentLocation}
      />
    </div>
  );
}

export default App;
