import React, { useState, useEffect, useRef } from 'react';
import { NaverMap, Container, Marker, Polyline } from 'react-naver-maps';
import { searchPlaces, geocodeAddress, getDirections } from './api/naverApi';
import getPermutations from './utils/getPermutations';
import './App.css';

function App() {
  const [locations, setLocations] = useState([]);
  const [newLocation, setNewLocation] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  const [geocodedLocations, setGeocodedLocations] = useState([]);
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [optimizing, setOptimizing] = useState(false);

  const debounceTimeoutRef = useRef(null);

  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (newLocation.trim() === '') {
      setSearchResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceTimeoutRef.current = setTimeout(async () => {
      const results = await searchPlaces(newLocation);
      setSearchResults(results);
      setLoading(false);
    }, 500);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [newLocation]);

  useEffect(() => {
    const geocodeAllLocations = async () => {
      const geocoded = [];
      for (const loc of locations) {
        const coords = await geocodeAddress(loc);
        if (coords) {
          geocoded.push({ name: loc, coords });
        }
      }
      setGeocodedLocations(geocoded);
    };

    geocodeAllLocations();
  }, [locations]);

  const handleAddLocation = () => {
    if (selectedResult) {
      setLocations([...locations, selectedResult.title.replace(/<[^>]*>/g, '')]); // Remove HTML tags
      setNewLocation('');
      setSearchResults([]);
      setSelectedResult(null);
    } else if (newLocation.trim() !== '') {
      setLocations([...locations, newLocation.trim()]);
      setNewLocation('');
      setSearchResults([]);
    }
  };

  const handleSelectResult = (result) => {
    setSelectedResult(result);
    setNewLocation(result.title.replace(/<[^>]*>/g, '')); // Display selected title in input
    setSearchResults([]); // Clear search results after selection
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
      // Only start and end, no waypoints to permute
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

      <div className="location-input-section">
        <input
          type="text"
          value={newLocation}
          onChange={(e) => {
            setNewLocation(e.target.value);
            setSelectedResult(null); // Clear selected result on new input
          }}
          placeholder="장소를 입력하세요"
        />
        <button onClick={handleAddLocation}>추가</button>

        {loading && <p>검색 중...</p>}
        {searchResults.length > 0 && (
          <ul className="search-results">
            {searchResults.map((result, index) => (
              <li key={index} onClick={() => handleSelectResult(result)}>
                {result.title.replace(/<[^>]*>/g, '')} ({result.address})
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="location-list-section">
        <h2>경유지 목록</h2>
        {locations.length === 0 ? (
          <p>장소를 추가해주세요.</p>
        ) : (
          <ul>
            {locations.map((loc, index) => (
              <li key={index}>{loc}</li>
            ))}
          </ul>
        )}
        <button onClick={handleOptimizeRoute} disabled={optimizing || locations.length < 2}>
          {optimizing ? '최적화 중...' : '경로 최적화'}
        </button>
        {optimizedRoute && (
          <div className="optimized-route-info">
            <h3>최적화된 경로</h3>
            <p>순서: {optimizedRoute.order.join(' -> ')}</p>
            <p>총 시간: {(optimizedRoute.totalTime / 60000).toFixed(2)} 분</p>
            <p>총 거리: {(optimizedRoute.totalDistance / 1000).toFixed(2)} km</p>
          </div>
        )}
      </div>

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
