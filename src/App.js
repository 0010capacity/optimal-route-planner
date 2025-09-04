import React, { useState, useEffect, useRef } from 'react';
import { NaverMap, Container } from 'react-naver-maps';
import { searchPlaces } from './api/naverApi';
import './App.css';

function App() {
  const [locations, setLocations] = useState([]);
  const [newLocation, setNewLocation] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);

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
          />
        </Container>
      </div>
    </div>
  );
}

export default App;
