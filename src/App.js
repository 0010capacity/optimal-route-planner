/* global naver */
import React, { useState, useEffect, useRef } from 'react';
import { searchPlaces, geocodeAddress, getDirections } from './api/naverApi';
import getPermutations from './utils/getPermutations';
import './App.css';

function App() {
  const [locations, setLocations] = useState(['', '']); // 빈 문자열로 시작
  const [currentMode, setCurrentMode] = useState('list'); // 'list' or 'search'
  const [editingIndex, setEditingIndex] = useState(null); // 편집 중인 경유지 인덱스
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [geocodedLocations, setGeocodedLocations] = useState([]);
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [favorites, setFavorites] = useState([]); // 즐겨찾기 목록
  const [showFavorites, setShowFavorites] = useState(false); // 즐겨찾기 표시 여부
  const [mapCenter, setMapCenter] = useState({ lat: 37.5665, lng: 126.9780 }); // 지도 중심 좌표
  const [userLocation, setUserLocation] = useState(null); // 사용자 현재 위치
  const [mapInstance, setMapInstance] = useState(null); // 지도 인스턴스
  const mapRef = useRef(null); // 지도 컨테이너 ref
  const markersRef = useRef([]); // 마커들을 저장할 ref
  const polylineRef = useRef(null); // 경로를 저장할 ref

  const debounceTimeoutRef = useRef(null);

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
      // mapCenter가 유효한지 확인
      const validCenter = (mapCenter && typeof mapCenter.lat === 'number' && typeof mapCenter.lng === 'number') 
        ? mapCenter 
        : { lat: 37.5665, lng: 126.9780 };
      
      console.log('Searching with center:', validCenter, 'query:', searchQuery);
      const results = await searchPlaces(searchQuery, validCenter);
      setSearchResults(results);
      setLoading(false);
    }, 500);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchQuery, currentMode, mapCenter]); // mapCenter 추가

  useEffect(() => {
    const geocodeAllLocations = async () => {
      const geocoded = [];
      console.log('Geocoding locations:', locations);
      for (const loc of locations) {
        if (loc && loc.trim() !== '') { // 빈 문자열이 아닌 경우만 geocoding
          console.log('Geocoding address:', loc);
          const coords = await geocodeAddress(loc);
          console.log('Geocoded result for', loc, ':', coords);
          if (coords) {
            geocoded.push({ name: loc, coords });
          } else {
            console.warn('Failed to geocode:', loc);
          }
        }
      }
      console.log('Final geocoded locations:', geocoded);
      setGeocodedLocations(geocoded);
    };

    geocodeAllLocations();
  }, [locations]);

  // 테스트용: 초기 장소 설정
  useEffect(() => {
    console.log('Initial locations check:', locations);
    if (locations.length === 2 && locations[0] === '' && locations[1] === '') {
      console.log('Setting initial test locations');
      // 테스트용 장소 설정
      setLocations(['서울특별시 용산구 동자동 43-205', '서울특별시 강남구 역삼동 858']);
    }
  }, [locations]); // locations를 dependency에 추가

  // locations 변경 시 localStorage에 저장
  useEffect(() => {
    localStorage.setItem('routeLocations', JSON.stringify(locations));
  }, [locations]);

  // 즐겨찾기 localStorage에서 불러오기
  useEffect(() => {
    const savedFavorites = localStorage.getItem('routeFavorites');
    if (savedFavorites) {
      try {
        const parsed = JSON.parse(savedFavorites);
        if (Array.isArray(parsed)) {
          setFavorites(parsed);
        }
      } catch (error) {
        console.error('Failed to load favorites from localStorage:', error);
      }
    }
  }, []);

  // 지도 중심 변경 시 실제 지도 업데이트
  useEffect(() => {
  }, [mapCenter]);

  // 지도 생성 및 관리
  useEffect(() => {
    if (!mapRef.current || !window.naver || !window.naver.maps) return;

    // 지도 생성
    const map = new window.naver.maps.Map(mapRef.current, {
      center: new window.naver.maps.LatLng(mapCenter.lat, mapCenter.lng),
      zoom: 13,
      minZoom: 7,
      maxZoom: 21
    });

    setMapInstance(map);

    // 지도 중심 변경 이벤트 리스너
    window.naver.maps.Event.addListener(map, 'center_changed', () => {
      const center = map.getCenter();
      const googleCenter = {
        lat: center.lat(),
        lng: center.lng()
      };
      setMapCenter(googleCenter);
    });

    return () => {
      // 클린업
      if (map) {
        // 기존 마커들 제거
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];
        // 기존 경로 제거
        if (polylineRef.current) {
          polylineRef.current.setMap(null);
          polylineRef.current = null;
        }
      }
    };
  }, []); // 빈 dependency array - 컴포넌트 마운트 시 한 번만 실행

  // 지도 중심 업데이트
  useEffect(() => {
    if (mapInstance && mapCenter) {
      mapInstance.setCenter(new window.naver.maps.LatLng(mapCenter.lat, mapCenter.lng));
    }
  }, [mapCenter, mapInstance]);

  // 마커들 업데이트
  useEffect(() => {
    if (!mapInstance) return;

    // 기존 마커들 제거
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // 기존 경로 제거
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    // 경유지 마커들 추가
    geocodedLocations.forEach((loc, index) => {
      // 마커 색상과 심볼 결정
      let markerColor = '#2196f3'; // 기본: 파란색 (경유지)
      let markerSymbol = '●'; // 기본: 경유지 심볼

      if (index === 0) {
        markerColor = '#4caf50'; // 출발지: 녹색
        markerSymbol = '▶';
      } else if (index === geocodedLocations.length - 1) {
        markerColor = '#f44336'; // 도착지: 빨간색
        markerSymbol = '■';
      }

      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(loc.coords.lat, loc.coords.lng),
        map: mapInstance,
        title: loc.name,
        icon: {
          content: `
            <div style="
              background: ${markerColor};
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
              position: relative;
            ">${markerSymbol}</div>
          `,
          size: new window.naver.maps.Size(28, 28),
          anchor: new window.naver.maps.Point(14, 14),
        }
      });
      markersRef.current.push(marker);
    });

    // 최적화된 경로가 있으면 지도에 표시
    if (optimizedRoute && optimizedRoute.path && optimizedRoute.path.length > 0) {
      console.log('Drawing route on map:', optimizedRoute.path);

      const pathCoords = optimizedRoute.path.map(coord =>
        new window.naver.maps.LatLng(coord.lat, coord.lng)
      );

      console.log('Path coordinates for map:', pathCoords);

      const polyline = new window.naver.maps.Polyline({
        path: pathCoords,
        strokeColor: '#667eea',
        strokeWeight: 6,
        strokeOpacity: 0.9,
        strokeStyle: 'solid',
        map: mapInstance
      });

      polylineRef.current = polyline;

      // 경로가 보이도록 지도 범위 조정
      if (pathCoords.length > 0) {
        const bounds = new window.naver.maps.LatLngBounds();
        pathCoords.forEach(coord => bounds.extend(coord));
        mapInstance.fitBounds(bounds);

        // 약간의 패딩 추가
        setTimeout(() => {
          mapInstance.setZoom(mapInstance.getZoom() - 1);
        }, 100);
      }

      console.log('Route polyline created and added to map');
    } else {
      console.log('No route to draw:', optimizedRoute);
    }

    // 사용자 위치 마커 추가
    if (userLocation) {
      const userMarker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(userLocation.lat, userLocation.lng),
        map: mapInstance,
        title: "내 위치",
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="8" fill="#4285F4" stroke="white" stroke-width="2"/>
              <circle cx="12" cy="12" r="3" fill="white"/>
            </svg>
          `),
          size: new window.naver.maps.Size(24, 24),
          anchor: new window.naver.maps.Point(12, 12),
        }
      });
      markersRef.current.push(userMarker);
    }

    // 검색 결과 마커들 추가
    searchResults.slice(0, 10).forEach((result, index) => {
      const resultNumber = index + 1;
      const locationName = result.title.replace(/<[^>]*>/g, '');
      const resultCoords = {
        lat: parseFloat(result.mapy) / 10000000,
        lng: parseFloat(result.mapx) / 10000000
      };

      const searchMarker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(resultCoords.lat, resultCoords.lng),
        map: mapInstance,
        title: `${resultNumber}. ${locationName}`,
        icon: {
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
            ">${resultNumber}</div>
          `,
          size: new window.naver.maps.Size(24, 24),
          anchor: new window.naver.maps.Point(12, 12),
        }
      });

      // 마커 클릭 이벤트
      window.naver.maps.Event.addListener(searchMarker, 'click', () => {
        handleSearchResultSelect(result);
        moveMapToLocation(resultCoords);
      });

      markersRef.current.push(searchMarker);
    });

  }, [geocodedLocations, userLocation, searchResults, mapInstance, optimizedRoute]);

  const handleLocationClick = (index) => {
    setEditingIndex(index);
    setCurrentMode('search');
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSearchResultSelect = (result) => {
    if (editingIndex !== null) {
      const newLocations = [...locations];
      newLocations[editingIndex] = result.title.replace(/<[^>]*>/g, '');
      setLocations(newLocations);
      setCurrentMode('list');
      setEditingIndex(null);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const handleBackToList = () => {
    setCurrentMode('list');
    setEditingIndex(null);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleDragStart = (e, index) => {
    e.stopPropagation();
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, dropIndex) => {
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
    
    // 드래그된 항목 제거
    newLocations.splice(draggedIndex, 1);
    // 드롭 위치에 삽입
    newLocations.splice(dropIndex, 0, draggedItem);
    
    setLocations(newLocations);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // 즐겨찾기 추가
  const addToFavorites = (location) => {
    if (location && !favorites.includes(location)) {
      setFavorites([...favorites, location]);
    }
  };

  // 즐겨찾기 삭제
  const removeFromFavorites = (location) => {
    setFavorites(favorites.filter(fav => fav !== location));
  };

  // 즐겨찾기에서 선택
  const selectFromFavorites = (location) => {
    if (editingIndex !== null) {
      const newLocations = [...locations];
      newLocations[editingIndex] = location;
      setLocations(newLocations);
      setCurrentMode('list');
      setEditingIndex(null);
    }
  };

  // 검색 결과 위치로 지도 이동
  const moveMapToLocation = (coords) => {
    setMapCenter(coords);

    // 직접 mapInstance 사용
    if (mapInstance) {
      try {
        mapInstance.setCenter(new window.naver.maps.LatLng(coords.lat, coords.lng));
      } catch (error) {
        console.error('Error in setCenter:', error);
      }
    } else {
      console.warn('mapInstance is not available');
    }
  };

  // 내 위치 가져오기
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newLocation = { lat: latitude, lng: longitude };
          setUserLocation(newLocation);
          moveMapToLocation(newLocation); // 지도 중심도 내 위치로 이동
        },
        (error) => {
          console.error('Error getting current location:', error);
          alert('현재 위치를 가져올 수 없습니다.');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5분
        }
      );
    } else {
      alert('이 브라우저는 위치 서비스를 지원하지 않습니다.');
    }
  };

  const handleOptimizeRoute = async () => {
    console.log('=== 경로 최적화 버튼 클릭됨 ===');
    console.log('현재 locations:', locations);
    console.log('현재 geocodedLocations:', geocodedLocations);

    if (geocodedLocations.length < 2) {
      alert('최소 두 개 이상의 장소를 추가해야 경로를 최적화할 수 있습니다.');
      return;
    }

    console.log('=== Geocoding 결과 상세 로그 ===');
    geocodedLocations.forEach((location, index) => {
      console.log(`${index + 1}. ${location.name}`);
      console.log(`   좌표: lat=${location.coords.lat}, lng=${location.coords.lng}`);
      console.log(`   좌표 객체:`, location.coords);
    });

    // Directions API 임시 비활성화 - Geocoding 테스트만 수행
    console.log('=== Directions API 임시 비활성화됨 ===');
    console.log('현재는 Geocoding 결과 확인만 수행합니다.');

    // Mock 경로 데이터로 UI 표시 (실제 Directions API 호출 없이)
    const mockRoute = {
      path: geocodedLocations.map(loc => loc.coords),
      totalTime: geocodedLocations.length * 300000, // 5분 per point
      totalDistance: (geocodedLocations.length - 1) * 5000, // 5km per segment
      order: geocodedLocations.map(loc => loc.name)
    };

    console.log('=== Mock 경로 데이터 생성 ===');
    console.log('Mock 경로:', mockRoute);

    setOptimizedRoute(mockRoute);
    setLocations(mockRoute.order);

    alert(`Geocoding 테스트 완료!\n\n좌표 변환 결과:\n${geocodedLocations.map((loc, i) => `${i+1}. ${loc.name}: (${loc.coords.lat}, ${loc.coords.lng})`).join('\n')}\n\n콘솔에서 자세한 로그를 확인하세요.`);
  };

  return (
    <div className="App">
      {currentMode === 'list' ? (
        // 경유지 목록 모드
        <>
          <div className="location-list-section">
            <ul className="location-list">
              {locations.map((location, index) => (
                <li 
                  key={index} 
                  className={`location-item ${index === 0 ? 'start' : index === locations.length - 1 ? 'end' : 'waypoint'} ${draggedIndex === index ? 'dragging' : ''} ${dragOverIndex === index ? 'drag-over' : ''}`}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                >
                  <div className="location-visual">
                    <div 
                      className="location-dot"
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragEnd={handleDragEnd}
                    ></div>
                    <div className="location-line"></div>
                  </div>
                  <button 
                    className="location-button"
                    onClick={() => handleLocationClick(index)}
                  >
                    {location || '장소를 선택하세요'}
                  </button>
                  {locations.length > 2 && index !== 0 && index !== locations.length - 1 && (
                    <button 
                      className="delete-button"
                      onClick={() => {
                        const newLocations = locations.filter((_, i) => i !== index);
                        setLocations(newLocations);
                      }}
                    >
                      ×
                    </button>
                  )}
                </li>
              ))}
            </ul>
            <button 
              className="add-location-button"
              onClick={() => {
                const newLocations = [...locations, '']; // 목록 끝에 새 장소 추가
                setLocations(newLocations);
              }}
              aria-label="새 장소 추가"
              title="새 장소 추가"
            >
              +
            </button>
            <button 
              className="optimize-button"
              onClick={handleOptimizeRoute} 
              disabled={false}
              aria-label="Geocoding 테스트"
            >
              🔍 Geocoding 테스트
            </button>
            {optimizedRoute && (
              <div className="route-summary" role="region" aria-label="최적화된 경로 정보">
                <div className="route-order">
                  �️ 경로 표시됨: {optimizedRoute.order.join(' → ')}
                </div>
                <div className="route-stats">
                  ⏱️ {(() => {
                    const totalMinutes = Math.round(optimizedRoute.totalTime / 60000);
                    const hours = Math.floor(totalMinutes / 60);
                    const minutes = totalMinutes % 60;
                    return hours > 0 ? `${hours}시간 ${minutes}분` : `${minutes}분`;
                  })()} • 📏 {(optimizedRoute.totalDistance / 1000).toFixed(1)}km
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        // 장소 검색 모드
        <>
          <div className="search-section">
            <div className="search-header">
              <button className="back-button" onClick={handleBackToList} aria-label="목록으로 돌아가기">
                ← 뒤로가기
              </button>
              <button 
                className={`favorites-toggle ${showFavorites ? 'active' : ''}`}
                onClick={() => setShowFavorites(!showFavorites)}
                aria-label={showFavorites ? "즐겨찾기 숨기기" : "즐겨찾기 보기"}
              >
                {showFavorites ? '⭐ 즐겨찾기 숨기기' : '☆ 즐겨찾기 보기'}
              </button>
            </div>
            
            {showFavorites && favorites.length > 0 && (
              <div className="favorites-section" role="region" aria-label="즐겨찾기 목록">
                <h4>즐겨찾기</h4>
                <ul className="favorites-list" role="list">
                  {favorites.map((favorite, index) => (
                    <li key={index} className="favorite-item" role="listitem">
                      <span 
                        onClick={() => selectFromFavorites(favorite)}
                        className="favorite-text"
                        role="button"
                        tabIndex={0}
                        aria-label={`${favorite} 선택`}
                      >
                        📍 {favorite}
                      </span>
                      <button 
                        className="remove-favorite-button"
                        onClick={() => removeFromFavorites(favorite)}
                        title="즐겨찾기에서 제거"
                        aria-label={`${favorite} 즐겨찾기에서 제거`}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="search-input-section">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="주소를 입력하세요 (예: 서울특별시 강남구 역삼동 858)"
                autoFocus
                aria-label="주소 검색"
                role="searchbox"
              />
              
              {loading && <p role="status" aria-live="polite">🔍 검색 중...</p>}
              
              {searchResults.length > 0 && (
                <ul className="search-results" role="listbox" aria-label="검색 결과">
                  {searchResults.slice(0, 10).map((result, index) => {
                    const locationName = result.title.replace(/<[^>]*>/g, '');
                    const isFavorite = favorites.includes(locationName);
                    const resultNumber = index + 1;
                    
                    return (
                      <li key={index} className="search-result-item" role="option">
                        <span className="result-number" aria-hidden="true">{resultNumber}</span>
                        <span 
                          onClick={() => {
                            handleSearchResultSelect(result);
                            // 검색 결과 위치로 지도 중심 이동
                            const resultCoords = {
                              lat: parseFloat(result.mapy) / 10000000,
                              lng: parseFloat(result.mapx) / 10000000
                            };
                            moveMapToLocation(resultCoords);
                          }}
                          className="search-result-text"
                          role="button"
                          tabIndex={0}
                          aria-label={`${resultNumber}. ${locationName} 선택`}
                        >
                          {locationName}
                        </span>
                        <button 
                          className={`favorite-button ${isFavorite ? 'favorited' : ''}`}
                          onClick={() => isFavorite ? removeFromFavorites(locationName) : addToFavorites(locationName)}
                          aria-label={isFavorite ? `${locationName} 즐겨찾기에서 제거` : `${locationName} 즐겨찾기에 추가`}
                          title={isFavorite ? '즐겨찾기에서 제거' : '즐겨찾기에 추가'}
                        >
                          {isFavorite ? '★' : '☆'}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              
              {searchQuery && !loading && searchResults.length === 0 && (
                <p className="no-results" role="status" aria-live="polite">❌ 검색 결과가 없습니다. 주소 형식을 확인하세요 (예: 서울특별시 강남구 역삼동 858).</p>
              )}
            </div>
          </div>
        </>
      )}

      <div className="map-section">
        <div className="map-controls">
          <button 
            className="current-location-button"
            onClick={getCurrentLocation}
            title="내 위치로 이동"
            aria-label="현재 위치로 지도 이동"
          >
            📍 내 위치
          </button>
        </div>
        <div
          ref={mapRef}
          style={{
            width: '100%',
            height: window.innerWidth <= 768 ? '300px' : '400px',
          }}
        />
      </div>
    </div>
  );
}

export default App;
