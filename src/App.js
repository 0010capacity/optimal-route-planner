import React, { useState, useEffect, useCallback } from 'react';
import { geocodeAddress, getDirections } from './api/naverApi';
import LocationList from './components/LocationList';
import SearchSection from './components/SearchSection';
import MapSection from './components/MapSection';
import { useSearch } from './hooks/useSearch';
import { useMap } from './hooks/useMap';
import { useFavorites } from './hooks/useFavorites';
import { useMapMarkers } from './hooks/useMapMarkers';
import { useLocalStorage } from './hooks/useLocalStorage';
import getPermutations from './utils/getPermutations';
import './App.css';

function App() {
  const [currentMode, setCurrentMode] = useState('list');
  const [editingIndex, setEditingIndex] = useState(null);
  const [showFavorites, setShowFavorites] = useState(false);

  // LocalStorage for locations
  const [storedLocations, setStoredLocations] = useLocalStorage('routeLocations', []);

  // Initialize locations from localStorage or default
  const [locations, setLocations] = useState(() => {
    if (storedLocations && Array.isArray(storedLocations) && storedLocations.length >= 2) {
      return storedLocations;
    }
    return [
      { name: '', address: '', coords: null },
      { name: '', address: '', coords: null }
    ];
  });
  const [geocodedLocations, setGeocodedLocations] = useState([]);
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const {
    mapRef,
    mapCenter,
    setMapCenter,
    userLocation,
    mapInstance,
    markersRef,
    polylineRef,
    moveMapToLocation,
    getCurrentLocation
  } = useMap();

  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    loading,
    clearSearch
  } = useSearch(currentMode, mapCenter);

  const {
    favorites,
    addToFavorites,
    removeFromFavorites,
    selectFromFavorites
  } = useFavorites();

  // Geocoding 로직
  useEffect(() => {
    const geocodeAllLocations = async () => {
      console.log('🔄 Geocoding 시작:', locations);
      const geocoded = [];
      for (const loc of locations) {
        // 빈 이름의 장소는 건너뛰기
        if (!loc.name || loc.name.trim() === '') {
          console.log('⚠️ 빈 이름의 장소 건너뛰기:', loc);
          continue;
        }

        if (loc.coords && loc.coords.lat && loc.coords.lng) {
          geocoded.push({ name: loc.name, coords: loc.coords });
        } else if (loc.address && loc.address.trim() !== '') {
          try {
            const coords = await geocodeAddress(loc.address);
            if (coords) {
              geocoded.push({ name: loc.name, coords });
            } else {
              console.log('⚠️ Geocoding 실패, 기본 좌표 사용:', loc);
              // Geocoding 실패 시에도 장소를 추가 (지도에 표시하기 위해)
              geocoded.push({ name: loc.name, coords: { lat: 37.5665, lng: 126.9780 } });
            }
          } catch (error) {
            console.error('Geocoding failed for:', loc.address, error);
            // 에러 발생 시에도 장소를 추가
            geocoded.push({ name: loc.name, coords: { lat: 37.5665, lng: 126.9780 } });
          }
        } else {
          console.log('⚠️ 주소 정보 없음:', loc);
          // 주소가 없어도 이름이 있으면 기본 좌표로 추가
          geocoded.push({ name: loc.name, coords: { lat: 37.5665, lng: 126.9780 } });
        }
      }
      console.log('✅ Geocoding 완료:', geocoded);
      setGeocodedLocations(geocoded);
    };

    geocodeAllLocations();
  }, [locations]);

  // 자동 경로 계산
  useEffect(() => {
    const fetchRoute = async () => {
      if (geocodedLocations.length >= 2) {
        const coordsArray = geocodedLocations.map(loc => loc.coords);
        const result = await getDirections(coordsArray);
        if (result) {
          setOptimizedRoute(result);
        }
      } else {
        setOptimizedRoute(null);
      }
    };

    fetchRoute();
  }, [geocodedLocations]);

  // 이벤트 핸들러들
  const updateLocation = useCallback((index, location) => {
    const newLocations = [...locations];
    newLocations[index] = location;
    setLocations(newLocations);
  }, [locations]);

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

    updateLocation(editingIndex, {
      name: locationName,
      address: result.roadAddress || result.address || locationName,
      coords: coords || { lat: 37.5665, lng: 126.9780 } // 좌표가 없으면 기본 좌표 사용
    });

    setCurrentMode('list');
    setEditingIndex(null);
    clearSearch();

    // 좌표가 없는 경우 백그라운드에서 Geocoding 시도
    if (!coords) {
      const address = result.roadAddress || result.address || locationName;
      if (address && address.trim()) {
        console.log('📍 좌표 없는 장소, Geocoding 시도:', address);
        geocodeAddress(address).then(geocodedCoords => {
          if (geocodedCoords) {
            console.log('✅ Geocoding 성공:', geocodedCoords);
            updateLocation(editingIndex, {
              name: locationName,
              address: result.roadAddress || result.address || locationName,
              coords: geocodedCoords
            });
          } else {
            console.log('❌ Geocoding 실패 - 좌표 정보 없음');
          }
        }).catch(error => {
          console.error('❌ Geocoding 오류:', error);
        });
      }
    }
  }, [editingIndex, updateLocation, clearSearch]);

  // Use map markers hook
  useMapMarkers(mapInstance, geocodedLocations, userLocation, searchResults, optimizedRoute, markersRef, polylineRef, handleSearchResultSelect, moveMapToLocation);

  const handleLocationClick = useCallback((index) => {
    setEditingIndex(index);
    setCurrentMode('search');
    clearSearch();
  }, [clearSearch]);

  const handleAddLocation = useCallback(() => {
    setLocations([...locations, { name: '', address: '', coords: null }]);
  }, [locations]);

  const handleDeleteLocation = useCallback((index) => {
    const newLocations = locations.filter((_, i) => i !== index);
    setLocations(newLocations);
  }, [locations]);

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

  const handleOptimizeRoute = useCallback(async () => {
    // 유효한 좌표를 가진 장소만 필터링
    const validLocations = geocodedLocations.filter(loc =>
      loc.coords && loc.coords.lat && loc.coords.lng &&
      !isNaN(loc.coords.lat) && !isNaN(loc.coords.lng)
    );

    console.log('🚀 경로 최적화 시도:', {
      totalLocations: locations.length,
      geocodedLocations: geocodedLocations.length,
      validLocations: validLocations.length,
      validLocationsData: validLocations
    });

    if (validLocations.length < 2) {
      alert(`최소 두 개 이상의 유효한 장소가 필요합니다.\n현재 유효한 장소: ${validLocations.length}개`);
      return;
    }

    console.log('🚀 경로 최적화 시작:', {
      장소수: validLocations.length,
      장소목록: validLocations.map(loc => ({ 이름: loc.name, 좌표: loc.coords }))
    });

    try {
      const start = validLocations[0];
      const end = validLocations[validLocations.length - 1];
      const waypoints = validLocations.slice(1, -1);

      if (waypoints.length === 0) {
        const coordsArray = validLocations.map(loc => loc.coords);
        const result = await getDirections(coordsArray);
        if (result) {
          setOptimizedRoute(result);
          const totalMinutes = Math.round(result.totalTime / 60000);
          const hours = Math.floor(totalMinutes / 60);
          const minutes = totalMinutes % 60;
          const timeString = hours > 0 ? `${hours}시간 ${minutes}분` : `${minutes}분`;
          alert(`경로 계산 완료!\n\n총 거리: ${(result.totalDistance / 1000).toFixed(1)}km\n예상 시간: ${timeString}`);
        }
        return;
      }

      const permutations = getPermutations(waypoints);
      let bestRoute = null;
      let bestTime = Infinity;

      for (const perm of permutations) {
        const coordsArray = [start.coords, ...perm.map(w => w.coords), end.coords];
        const result = await getDirections(coordsArray);
        if (result && result.totalTime < bestTime) {
          bestTime = result.totalTime;
          bestRoute = {
            ...result,
            waypointsOrder: perm
          };
        }
      }

      if (bestRoute) {
        const newLocations = [start, ...bestRoute.waypointsOrder, end];
        setLocations(newLocations);
        setOptimizedRoute(bestRoute);

        const totalMinutes = Math.round(bestRoute.totalTime / 60000);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        const timeString = hours > 0 ? `${hours}시간 ${minutes}분` : `${minutes}분`;

        alert(`경로 최적화 완료!\n\n총 거리: ${(bestRoute.totalDistance / 1000).toFixed(1)}km\n예상 시간: ${timeString}`);
      } else {
        alert('경로를 계산할 수 없습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('❌ Directions API 오류:', error);
      alert('경로 최적화 중 오류가 발생했습니다.');
    }
  }, [geocodedLocations, locations]);

  const handleBackToList = useCallback(() => {
    setCurrentMode('list');
    setEditingIndex(null);
    clearSearch();
  }, [clearSearch]);

  const handleSelectFromFavorites = useCallback((locationName) => {
    selectFromFavorites(locationName, editingIndex, locations, updateLocation, setCurrentMode);
  }, [selectFromFavorites, editingIndex, locations, updateLocation]);

  return (
    <div className="App">
      {currentMode === 'list' ? (
        <LocationList
          locations={locations}
          optimizedRoute={optimizedRoute}
          onLocationClick={handleLocationClick}
          onAddLocation={handleAddLocation}
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
          onSelectFromFavorites={handleSelectFromFavorites}
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
