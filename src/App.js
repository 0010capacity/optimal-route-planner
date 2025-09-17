import React, { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { getDirections, shareToMap } from './api/naverApi';
import MapSection from './components/MapSection';
import { Icon } from './components/Icon';
import { useSearch } from './hooks/useSearch';
import { useMap } from './hooks/useMap';
import { useFavorites } from './hooks/useFavorites';
import { useMapMarkers } from './hooks/useMapMarkers';
import { useLocalStorage } from './hooks/useLocalStorage';
import { WebVitals } from './components/WebVitals';

// Dynamic imports for components to avoid SSR issues
const LocationList = dynamic(() => import('./components/LocationList'), {
  ssr: false,
  loading: () => <div>Loading...</div>
});

const SearchSection = dynamic(() => import('./components/SearchSection'), {
  ssr: false,
  loading: () => <div>Loading...</div>
});

function App() {
  const [currentMode, setCurrentMode] = useState('list');
  const [editingIndex, setEditingIndex] = useState(null);
  const [showFavorites, setShowFavorites] = useState(false);

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
  const [showMapSelector, setShowMapSelector] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  
  // 테스트용 마커 상태
  const [testMarker, setTestMarker] = useState(null);
  
  // 검색 결과 마커들을 별도로 관리
  const [searchMarkers, setSearchMarkers] = useState([]);

  const mapRef = useRef(null);

  const {
    mapCenter,
    userLocation,
    mapInstance,
    markersRef,
    polylineRef,
    moveMapToLocation,
    getCurrentLocation,
    isGettingLocation
  } = useMap(() => mapRef.current);

  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    loading,
    clearSearch
  } = useSearch(currentMode, mapCenter);

  // 검색어가 변경될 때 페이지를 1로 리셋
  useEffect(() => {
    if (searchQuery) {
      setCurrentPage(1);
    }
  }, [searchQuery]);

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
        }
        // 좌표가 없는 장소는 건너뜀 (Kakao 검색에서 이미 좌표 제공됨)
      }
      setGeocodedLocations(geocoded);
    };

    geocodeAllLocations();
  }, [locations]);

  // 자동 경로 계산 (개별 구간 계산만 사용)
  useEffect(() => {
    const fetchRoute = async () => {
      if (isOptimizing) return; // 최적화 중일 때는 자동 계산 건너뛰기
      
      if (geocodedLocations.length >= 2) {
        // 개별 구간 계산으로만 경로 데이터 생성
        const actualSegmentTimes = [];
        const actualSegmentDistances = [];
        let fullPath = [];

        console.log('Auto route: Getting individual segment data only...');
        
        for (let i = 0; i < geocodedLocations.length - 1; i++) {
          const segmentStart = geocodedLocations[i];
          const segmentEnd = geocodedLocations[i + 1];
          
          const segmentCoordsArray = [segmentStart.coords, segmentEnd.coords];
          const segmentNamesArray = [segmentStart.name, segmentEnd.name];
          
          console.log(`Auto route segment ${i}: ${segmentStart.name} → ${segmentEnd.name}`);
          
          const segmentResult = await getDirections(segmentCoordsArray, segmentNamesArray);
          if (segmentResult) {
            actualSegmentTimes.push(segmentResult.totalTime);
            actualSegmentDistances.push(segmentResult.totalDistance);
            // 경로 포인트 합치기 (첫 번째 구간이 아니면 첫 포인트 제외)
            if (i === 0) {
              fullPath = [...segmentResult.path];
            } else {
              fullPath = [...fullPath, ...segmentResult.path.slice(1)];
            }
            console.log(`Auto route segment ${i}: ${(segmentResult.totalTime/60000).toFixed(1)}min, ${(segmentResult.totalDistance/1000).toFixed(1)}km`);
          } else {
            console.log(`Auto route segment ${i}: API call failed`);
            return; // 실패시 전체 계산 중단
          }
        }

        // 총 시간과 거리 계산
        const totalActualTime = actualSegmentTimes.reduce((sum, time) => sum + time, 0);
        const totalActualDistance = actualSegmentDistances.reduce((sum, dist) => sum + dist, 0);
        
        console.log(`Auto route actual totals: ${(totalActualTime/60000).toFixed(1)}min, ${(totalActualDistance/1000).toFixed(1)}km`);

        setOptimizedRoute({
          path: fullPath,
          segmentTimes: actualSegmentTimes,
          segmentDistances: actualSegmentDistances,
          totalTime: totalActualTime,
          totalDistance: totalActualDistance,
          order: geocodedLocations.map((_, index) => index) // 순서대로 인덱스 배열 생성
        });
      } else {
        setOptimizedRoute(null);
      }
    };

    fetchRoute();
  }, [geocodedLocations, isOptimizing]);

  // 검색 결과 마커들을 모두 제거하는 함수 (테스트 방식 적용)
  const clearAllSearchMarkers = useCallback(() => {
    console.log('🔍 clearAllSearchMarkers 호출됨, searchMarkers 길이:', searchMarkers.length);
    console.log('🔍 searchMarkers 배열:', searchMarkers);
    
    if (searchMarkers.length === 0) {
      console.log('❌ 삭제할 검색 결과 마커가 없습니다');
      return;
    }

    try {
      console.log(`🗑️ 검색 결과 마커 ${searchMarkers.length}개 삭제 시작`);
      
      searchMarkers.forEach((marker, index) => {
        console.log(`🔍 마커 ${index} 검사:`, marker);
        console.log(`🔍 마커 ${index} setMap 함수:`, typeof marker?.setMap);
        
        if (marker && marker.setMap) {
          console.log(`🗑️ 마커 ${index} setMap(null) 호출 전`);
          marker.setMap(null);
          console.log(`🗑️ 마커 ${index} setMap(null) 호출 후`);
        } else {
          console.log(`❌ 마커 ${index} setMap 함수 없음`);
        }
      });

      // 상태 초기화
      console.log('🔄 searchMarkers 상태 초기화');
      setSearchMarkers([]);
      
      // 강제 새로고침
      if (mapInstance && mapInstance.relayout) {
        setTimeout(() => {
          mapInstance.relayout();
          console.log('🔄 검색 마커 삭제 후 지도 새로고침');
        }, 100);
      }
      
      console.log('✅ 모든 검색 결과 마커 삭제 완료');
    } catch (error) {
      console.error('❌ 검색 결과 마커 삭제 실패:', error);
    }
  }, [searchMarkers, mapInstance]);

  // 이벤트 핸들러들
  const updateLocation = useCallback((index, location) => {
    const newLocations = [...locations];
    newLocations[index] = location;
    setLocations(newLocations);
  }, [locations]);

  const handleSearchResultSelect = useCallback((result) => {
    if (editingIndex === null) return;

    console.log('📍 검색 결과 선택됨:', result.title);

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

    console.log('🔙 장소 선택 후 리스트로 돌아감 - 지도 컨트롤 복원');
    setCurrentMode('list');
    setEditingIndex(null);
    clearSearch();

    // 새로운 방식으로 검색 결과 마커 삭제
    clearAllSearchMarkers();
  }, [editingIndex, updateLocation, clearSearch, markersRef, mapInstance]);

  // Use map markers hook
  useMapMarkers(mapInstance, geocodedLocations, userLocation, searchResults, optimizedRoute, markersRef, polylineRef, handleSearchResultSelect, moveMapToLocation, currentMode, searchMarkers, setSearchMarkers);

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

  // @dnd-kit을 위한 새로운 순서 변경 핸들러
  const handleReorderLocations = useCallback((newLocations) => {
    setLocations(newLocations);
    setOptimizedRoute(null); // 순서가 바뀌면 최적화 결과 초기화
  }, []);

  const handleOptimizeRoute = useCallback(async () => {
    // 유효한 좌표를 가진 장소만 필터링
    const validLocations = geocodedLocations.filter(loc =>
      loc.coords && loc.coords.lat && loc.coords.lng &&
      !isNaN(loc.coords.lat) && !isNaN(loc.coords.lng)
    );

    if (validLocations.length < 2) {
      console.warn(`최소 두 개 이상의 유효한 장소가 필요합니다. 현재 유효한 장소: ${validLocations.length}개`);
      return;
    }

    setIsOptimizing(true);

    try {
      console.log('🚀 새로운 최적화 알고리즘 시작:', {
        총장소수: validLocations.length,
        경유지수: validLocations.length - 2
      });

      // HybridOptimizer 사용 (API 호출 최소화)
      const result = await HybridOptimizer.optimize(validLocations, getDirections);

      if (result) {
        const { optimizedLocations, routeData, optimizationMethod, apiCalls, iterations } = result;
        
        console.log('✅ 최적화 완료:', {
          방법: optimizationMethod,
          API호출수: apiCalls,
          반복횟수: iterations,
          총시간: `${(routeData.totalTime/60000).toFixed(1)}분`,
          총거리: `${(routeData.totalDistance/1000).toFixed(1)}km`
        });

        // 최적화된 순서로 locations 업데이트
        setLocations(optimizedLocations);
        setOptimizedRoute({
          ...routeData,
          order: optimizedLocations.map((_, index) => index),
          optimizationStats: {
            method: optimizationMethod,
            apiCalls,
            iterations: iterations || 0
          }
        });

        // 사용자에게 결과 알림 (콘솔로만 출력)
        const totalMinutes = Math.round(routeData.totalTime / 60000);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        const timeString = hours > 0 ? `${hours}시간 ${minutes}분` : `${minutes}분`;
        
        const methodName = {
          'direct': '직접 계산',
          'brute_force': '완전 탐색',
          '2-opt': '2-opt 최적화',
          'heuristic': '휴리스틱 최적화'
        }[optimizationMethod] || optimizationMethod;

        console.log(`✅ 경로 최적화 완료! (${methodName})`, {
          총거리: `${(routeData.totalDistance / 1000).toFixed(1)}km`,
          예상시간: timeString,
          API호출: `${apiCalls}회`,
          최적화반복: iterations ? `${iterations}회` : '없음'
        });
      } else {
        console.error('경로를 계산할 수 없습니다. 네트워크 연결을 확인하고 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('❌ 경로 최적화 오류:', error);
    } finally {
      setIsOptimizing(false);
    }
  }, [geocodedLocations]);

  const handleShareRoute = useCallback(() => {
    const validLocations = geocodedLocations.filter(loc =>
      loc.coords && loc.coords.lat && loc.coords.lng &&
      !isNaN(loc.coords.lat) && !isNaN(loc.coords.lng)
    );

    if (validLocations.length < 2) {
      console.warn('지도 공유: 최소 두 개의 유효한 장소가 필요합니다.');
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

    if (validLocations.length < 2) {
      console.warn('지도 선택: 최소 두 개의 유효한 장소가 필요합니다.');
      return;
    }

    // 새로운 통합 지도 공유 함수 사용
    shareToMap(mapType, validLocations);
  }, [geocodedLocations]);

  const handleBackToList = useCallback(() => {
    console.log('🔙 검색 화면에서 리스트로 돌아감');
    setCurrentMode('list');
    setEditingIndex(null);
    clearSearch();

    // 새로운 방식으로 검색 결과 마커 삭제
    clearAllSearchMarkers();
  }, [clearSearch, clearAllSearchMarkers]);

  const handleSelectFromFavorites = useCallback((locationName) => {
    selectFromFavorites(locationName, editingIndex, locations, updateLocation, setCurrentMode);
  }, [selectFromFavorites, editingIndex, locations, updateLocation]);

  // 테스트용 마커 생성
  const createTestMarker = useCallback(() => {
    if (!mapInstance) {
      console.log('❌ 지도 인스턴스가 없습니다');
      return;
    }

    // 기존 테스트 마커가 있으면 제거
    if (testMarker) {
      testMarker.setMap(null);
      console.log('🗑️ 기존 테스트 마커 제거');
    }

    // 현재 지도 중심에 테스트 마커 생성
    const center = mapInstance.getCenter();
    const marker = new window.kakao.maps.Marker({
      position: center,
      map: mapInstance,
      title: "TEST_MARKER"
    });

    setTestMarker(marker);
    console.log('✅ 테스트 마커 생성 완료:', {
      lat: center.getLat(),
      lng: center.getLng()
    });
  }, [mapInstance, testMarker]);

  // 테스트용 마커 삭제
  const removeTestMarker = useCallback(() => {
    if (!testMarker) {
      console.log('❌ 삭제할 테스트 마커가 없습니다');
      return;
    }

    try {
      console.log('🗑️ 테스트 마커 삭제 시작');
      testMarker.setMap(null);
      setTestMarker(null);
      
      // 강제 새로고침
      if (mapInstance && mapInstance.relayout) {
        setTimeout(() => {
          mapInstance.relayout();
          console.log('🔄 테스트 마커 삭제 후 지도 새로고침');
        }, 100);
      }
      
      console.log('✅ 테스트 마커 삭제 완료');
    } catch (error) {
      console.error('❌ 테스트 마커 삭제 실패:', error);
    }
  }, [testMarker, mapInstance]);

  return (
    <div className="App">
      <WebVitals />
      {currentMode === 'list' ? (
        <LocationList
          locations={locations}
          optimizedRoute={optimizedRoute}
          onLocationClick={handleLocationClick}
          onAddLocation={handleAddLocation}
          onOptimizeRoute={handleOptimizeRoute}
          onReorderLocations={handleReorderLocations}
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
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          onSearchQueryChange={setSearchQuery}
          onBackToList={handleBackToList}
          onSearchResultSelect={handleSearchResultSelect}
          onToggleFavorites={() => setShowFavorites(!showFavorites)}
          onAddToFavorites={addToFavorites}
          onRemoveFromFavorites={removeFromFavorites}
          onSelectFromFavorites={handleSelectFromFavorites}
          onPageChange={setCurrentPage}
        />
      )}

      {/* 테스트용 버튼들 */}
      <div style={{ 
        padding: '10px 20px', 
        backgroundColor: '#f0f0f0', 
        margin: '10px 20px',
        borderRadius: '8px',
        border: '2px solid #ff6b6b'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#ff6b6b' }}>🧪 마커 삭제 테스트</h4>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={createTestMarker}
            style={{
              padding: '8px 16px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            테스트 마커 생성
          </button>
          <button
            onClick={removeTestMarker}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            테스트 마커 삭제
          </button>
          <span style={{ 
            padding: '8px 16px', 
            backgroundColor: testMarker ? '#4CAF50' : '#ccc',
            color: 'white',
            borderRadius: '4px',
            fontSize: '12px'
          }}>
            상태: {testMarker ? '마커 있음' : '마커 없음'}
          </span>
        </div>
        <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#666' }}>
          현재 지도 중심에 마커를 생성하고 삭제할 수 있는지 테스트합니다.
        </p>
      </div>

      <MapSection
        mapRef={mapRef}
        onGetCurrentLocation={getCurrentLocation}
        isGettingLocation={isGettingLocation}
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
              <div className="footer-brand-links">
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
              <span>Version 0.3.0</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
