/* global naver */
import React, { useState, useEffect, useRef } from 'react';
import { NaverMap, Container, Marker, Polyline } from 'react-naver-maps';
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
      const results = await searchPlaces(searchQuery);
      setSearchResults(results);
      setLoading(false);
    }, 500);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchQuery, currentMode]);

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

    if (!bestRoute) {
      alert('경로를 찾을 수 없습니다. 장소를 확인해주세요.');
    }
  };

  return (
    <div className="App">
      <h1>Optimal Route Planner</h1>

      {currentMode === 'list' ? (
        // 경유지 목록 모드
        <>
          <div className="location-list-section">
            <h2>경유지 목록</h2>
            <ul className="location-list">
              {locations.map((location, index) => (
                <li key={index} className="location-item">
                  <span className="location-label">
                    {index === 0 ? '출발' : index === locations.length - 1 ? '도착' : `경유지 ${index}`}
                  </span>
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
              <li className="location-item">
                <button 
                  className="add-waypoint-button"
                  onClick={() => {
                    const newLocations = [...locations];
                    newLocations.splice(locations.length - 1, 0, ''); // 도착지 앞에 삽입
                    setLocations(newLocations);
                  }}
                >
                  + 경유지 추가
                </button>
              </li>
            </ul>
            <button 
              className="optimize-button"
              onClick={handleOptimizeRoute} 
              disabled={optimizing}
            >
              {optimizing ? '최적화 중...' : '경로 최적화'}
            </button>
            {optimizedRoute && (
              <div className="optimized-route-info">
                <h3>최적화된 경로</h3>
                <p>순서: {optimizedRoute.order.join(' → ')}</p>
                <p>총 시간: {(optimizedRoute.totalTime / 60000).toFixed(2)} 분</p>
                <p>총 거리: {(optimizedRoute.totalDistance / 1000).toFixed(2)} km</p>
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
              <h2>
                {editingIndex === 0 ? '출발지' : 
                 editingIndex === locations.length - 1 ? '도착지' : 
                 `경유지 ${editingIndex}`} 검색
              </h2>
            </div>
            
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
                  {searchResults.map((result, index) => (
                    <li 
                      key={index} 
                      onClick={() => handleSearchResultSelect(result)}
                      className="search-result-item"
                    >
                      {result.title.replace(/<[^>]*>/g, '')}
                    </li>
                  ))}
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
        <h2>지도</h2>
        <Container
          style={{
            width: '100%',
            height: '400px',
          }}
        >
          <NaverMap
            defaultCenter={{
              lat: 37.5665,
              lng: 126.9780,
            }}
            defaultZoom={11}
          >
            {geocodedLocations.map((loc, index) => (
              <Marker
                key={index}
                position={new naver.maps.LatLng(loc.coords.lat, loc.coords.lng)}
                title={loc.name}
              />
            ))}
            {optimizedRoute && (
              <Polyline
                path={optimizedRoute.path.map(p => new naver.maps.LatLng(p.lat, p.lng))}
                strokeColor="#5347AA"
                strokeOpacity={0.8}
                strokeWeight={6}
              />
            )}
          </NaverMap>
        </Container>
      </div>
    </div>
  );
}

export default App;
