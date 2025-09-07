import React, { useState, useEffect, useCallback } from 'react';
import { geocodeAddress, getDirections, generateNaverMapUrl, generateNaverAppUrl, generateKakaoAppUrl, generateKakaoWebUrl } from './api/naverApi';
import LocationList from './components/LocationList';
import SearchSection from './components/SearchSection';
import MapSection from './components/MapSection';
import { Icon } from './components/Icon';
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
  const [showMapSelector, setShowMapSelector] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);

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
      const geocoded = [];
      for (const loc of locations) {
        // 빈 이름의 장소는 건너뛰기
        if (!loc.name || loc.name.trim() === '') {
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
              // Geocoding 실패 시에도 장소를 추가 (지도에 표시하기 위해)
              geocoded.push({ name: loc.name, coords: { lat: 37.5665, lng: 126.9780 } });
            }
          } catch (error) {
            // 에러 발생 시에도 장소를 추가
            geocoded.push({ name: loc.name, coords: { lat: 37.5665, lng: 126.9780 } });
          }
        } else {
          // 주소가 없어도 이름이 있으면 기본 좌표로 추가
          geocoded.push({ name: loc.name, coords: { lat: 37.5665, lng: 126.9780 } });
        }
      }
      setGeocodedLocations(geocoded);
    };

    geocodeAllLocations();
  }, [locations]);

  // 자동 경로 계산
  useEffect(() => {
    const fetchRoute = async () => {
      if (geocodedLocations.length >= 2) {
        const coordsArray = geocodedLocations.map(loc => loc.coords);
        const namesArray = geocodedLocations.map(loc => loc.name);
        const result = await getDirections(coordsArray, namesArray);
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
        geocodeAddress(address).then(geocodedCoords => {
          if (geocodedCoords) {
            updateLocation(editingIndex, {
              name: locationName,
              address: result.roadAddress || result.address || locationName,
              coords: geocodedCoords
            });
          }
        }).catch(error => {
          // Geocoding 오류는 무시
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

    if (validLocations.length < 2) {
      alert(`최소 두 개 이상의 유효한 장소가 필요합니다.\n현재 유효한 장소: ${validLocations.length}개`);
      return;
    }

    setIsOptimizing(true);

    try {
      const start = validLocations[0];
      const end = validLocations[validLocations.length - 1];
      const waypoints = validLocations.slice(1, -1);

      if (waypoints.length === 0) {
        const coordsArray = validLocations.map(loc => loc.coords);
        const namesArray = validLocations.map(loc => loc.name);
        const result = await getDirections(coordsArray, namesArray);
        if (result) {
          setOptimizedRoute(result);
        }
        return;
      }

      const permutations = getPermutations(waypoints);
      let bestRoute = null;
      let bestTime = Infinity;

      for (const perm of permutations) {
        const coordsArray = [start.coords, ...perm.map(w => w.coords), end.coords];
        const namesArray = [start.name, ...perm.map(w => w.name), end.name];
        const result = await getDirections(coordsArray, namesArray);
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
        setOptimizedRoute({
          ...bestRoute,
          order: [0, ...bestRoute.waypointsOrder.map((_, idx) => idx + 1), bestRoute.waypointsOrder.length + 1]
        });
      } else {
        alert('경로를 계산할 수 없습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      alert('경로 최적화 중 오류가 발생했습니다.');
    } finally {
      setIsOptimizing(false);
    }
  }, [geocodedLocations, locations]);

  const handleShareRoute = useCallback(() => {
    const validLocations = geocodedLocations.filter(loc =>
      loc.coords && loc.coords.lat && loc.coords.lng &&
      !isNaN(loc.coords.lat) && !isNaN(loc.coords.lng)
    );

    if (validLocations.length < 2) {
      alert('최소 두 개의 유효한 장소가 필요합니다.');
      return;
    }

    // 지도 선택 모달 표시
    setShowMapSelector(true);
  }, [geocodedLocations]);

  const handleMapSelect = useCallback((mapType) => {
    const validLocations = geocodedLocations.filter(loc =>
      loc.coords && loc.coords.lat && loc.coords.lng &&
      !isNaN(loc.coords.lat) && !isNaN(loc.coords.lng)
    );

    setShowMapSelector(false);

    if (mapType === 'naver') {
      // 네이버 지도 선택
      const appUrl = generateNaverAppUrl(validLocations);
      if (appUrl) {
        console.log('Trying Naver App URL:', appUrl);
        
        if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
          window.location.href = appUrl;
          setTimeout(() => {
            const webUrl = generateNaverMapUrl(validLocations);
            if (webUrl) {
              console.log('Fallback to Naver web URL:', webUrl);
              window.open(webUrl, '_blank');
            }
          }, 2000);
        } else {
          const webUrl = generateNaverMapUrl(validLocations);
          if (webUrl) {
            console.log('Desktop: Using Naver web URL:', webUrl);
            window.open(webUrl, '_blank');
          }
        }
      }
    } else if (mapType === 'kakao') {
      // 카카오맵 선택
      const appUrl = generateKakaoAppUrl(validLocations);
      if (appUrl) {
        console.log('Trying Kakao App URL:', appUrl);
        
        if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
          window.location.href = appUrl;
          setTimeout(() => {
            const webUrl = generateKakaoWebUrl(validLocations);
            if (webUrl) {
              console.log('Fallback to Kakao web URL:', webUrl);
              window.open(webUrl, '_blank');
            }
          }, 2000);
        } else {
          const webUrl = generateKakaoWebUrl(validLocations);
          if (webUrl) {
            console.log('Desktop: Using Kakao web URL:', webUrl);
            window.open(webUrl, '_blank');
          }
        }
      }
    }
  }, [geocodedLocations]);

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
          isOptimizing={isOptimizing}
          onShareRoute={handleShareRoute}
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

      {/* 지도 선택 모달 */}
      {showMapSelector && (
        <div className="modal-overlay" onClick={() => setShowMapSelector(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>지도 선택</h3>
            <p>어떤 지도로 공유하시겠습니까?</p>
            <div className="modal-buttons">
              <button 
                className="modal-button naver-button"
                onClick={() => handleMapSelect('naver')}
              >
                <Icon name="map" size={20} />
                <span>네이버 지도</span>
              </button>
              <button 
                className="modal-button kakao-button"
                onClick={() => handleMapSelect('kakao')}
              >
                <Icon name="map" size={20} />
                <span>카카오맵</span>
              </button>
            </div>
            <button 
              className="modal-close"
              onClick={() => setShowMapSelector(false)}
            >
              <Icon name="close" size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-main">
            <div className="footer-brand">
              <h4>최적 경로 플래너 <span className="beta-badge">BETA</span></h4>
              <p>여러 장소를 효율적으로 방문할 수 있는 최적 경로를 자동으로 계산해주는 웹 애플리케이션입니다.</p>
            </div>
            
            <div className="footer-links-section">
              <div className="footer-links">
                <a href="https://github.com/0010capacity/optimal-route-planner" target="_blank" rel="noopener noreferrer">
                  GitHub
                </a>
                <a href="mailto:0010capacity@gmail.com">
                  이메일
                </a>
              </div>
            </div>
          </div>
          
          <div className="footer-bottom">
            <div className="footer-license">
              <span>© 2025 최적 경로 플래너. MIT License.</span>
            </div>
            <div className="footer-version">
              <span>Version 0.1.0</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
