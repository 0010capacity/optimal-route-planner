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
  const [optimizing, setOptimizing] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [favorites, setFavorites] = useState([]); // 즐겨찾기 목록
  const [showFavorites, setShowFavorites] = useState(false); // 즐겨찾기 표시 여부
  const [mapCenter, setMapCenter] = useState({ lat: 37.5665, lng: 126.9780 }); // 지도 중심 좌표
  const [userLocation, setUserLocation] = useState(null); // 사용자 현재 위치
  const [mapInstance, setMapInstance] = useState(null); // 지도 인스턴스
  const mapRef = useRef(null); // 지도 컨테이너 ref
  const markersRef = useRef([]); // 마커들을 저장할 ref

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
      for (const loc of locations) {
        if (loc && loc.trim() !== '') { // 빈 문자열이 아닌 경우만 geocoding
          const coords = await geocodeAddress(loc);
          if (coords) {
            geocoded.push({ name: loc, coords });
          }
        }
      }
      setGeocodedLocations(geocoded);
    };

    geocodeAllLocations();
  }, [locations]);

  // localStorage에서 데이터 불러오기
  useEffect(() => {
    const savedLocations = localStorage.getItem('routeLocations');
    if (savedLocations) {
      try {
        const parsed = JSON.parse(savedLocations);
        if (Array.isArray(parsed) && parsed.length >= 2) {
          setLocations(parsed);
        }
      } catch (error) {
        console.error('Failed to load locations from localStorage:', error);
      }
    }
  }, []);

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

  }, [geocodedLocations, userLocation, searchResults, mapInstance]);

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
    if (geocodedLocations.length < 2) {
      alert('최소 두 개 이상의 장소를 추가해야 경로를 최적화할 수 있습니다.');
      return;
    }

    setOptimizing(true);
    setOptimizedRoute(null);

    const startPoint = geocodedLocations[0];
    const endPoint = geocodedLocations[geocodedLocations.length - 1];
    const waypoints = geocodedLocations.slice(1, geocodedLocations.length - 1);

    let bestRoute = null;
    let minTime = Infinity;

    if (waypoints.length === 0) {
      const route = await getDirections([startPoint.coords, endPoint.coords]);
      if (route) {
        bestRoute = { path: route.path, totalTime: route.totalTime, totalDistance: route.totalDistance, order: [startPoint.name, endPoint.name] };
        minTime = route.totalTime;
      }
    } else {
      const waypointPermutations = getPermutations(waypoints);

      for (const perm of waypointPermutations) {
        const currentOrderCoords = [
          startPoint.coords,
          ...perm.map(wp => wp.coords),
          endPoint.coords,
        ];

        const route = await getDirections(currentOrderCoords);

        if (route && route.totalTime < minTime) {
          minTime = route.totalTime;
          bestRoute = {
            path: route.path,
            totalTime: route.totalTime,
            totalDistance: route.totalDistance,
            order: [startPoint.name, ...perm.map(wp => wp.name), endPoint.name],
          };
        }
      }
    }

    setOptimizedRoute(bestRoute);
    setOptimizing(false);

    // 최적화된 순서로 locations 재정렬
    if (bestRoute) {
      setLocations(bestRoute.order);
    }

    if (!bestRoute) {
      alert('경로를 찾을 수 없습니다. 장소를 확인해주세요.');
    }
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
            >
              + 장소 추가
            </button>
            <button 
              className="optimize-button"
              onClick={handleOptimizeRoute} 
              disabled={optimizing}
            >
              {optimizing ? '최적화 중...' : '경로 최적화'}
            </button>
            {optimizedRoute && (
              <div className="route-summary">
                <div className="route-order">
                  {optimizedRoute.order.join(' → ')}
                </div>
                <div className="route-stats">
                  {(optimizedRoute.totalTime / 60000).toFixed(0)}분 • {(optimizedRoute.totalDistance / 1000).toFixed(1)}km
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
              <button className="back-button" onClick={handleBackToList}>
                ← 뒤로가기
              </button>
              <button 
                className={`favorites-toggle ${showFavorites ? 'active' : ''}`}
                onClick={() => setShowFavorites(!showFavorites)}
              >
                즐겨찾기 {showFavorites ? '숨기기' : '보기'}
              </button>
            </div>
            
            {showFavorites && favorites.length > 0 && (
              <div className="favorites-section">
                <h4>즐겨찾기</h4>
                <ul className="favorites-list">
                  {favorites.map((favorite, index) => (
                    <li key={index} className="favorite-item">
                      <span 
                        onClick={() => selectFromFavorites(favorite)}
                        className="favorite-text"
                      >
                        {favorite}
                      </span>
                      <button 
                        className="remove-favorite-button"
                        onClick={() => removeFromFavorites(favorite)}
                        title="즐겨찾기에서 제거"
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
                placeholder="장소를 입력하세요"
                autoFocus
              />
              
              {loading && <p>검색 중...</p>}
              
              {searchResults.length > 0 && (
                <ul className="search-results">
                  {searchResults.slice(0, 10).map((result, index) => {
                    const locationName = result.title.replace(/<[^>]*>/g, '');
                    const isFavorite = favorites.includes(locationName);
                    const resultNumber = index + 1;
                    
                    return (
                      <li key={index} className="search-result-item">
                        <span className="result-number">{resultNumber}</span>
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
                        >
                          {locationName}
                        </span>
                        <button 
                          className={`favorite-button ${isFavorite ? 'favorited' : ''}`}
                          onClick={() => isFavorite ? removeFromFavorites(locationName) : addToFavorites(locationName)}
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
                <p className="no-results">검색 결과가 없습니다.</p>
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
