import React, { useState } from 'react';
import './App.css';

function App() {
  const [locations, setLocations] = useState([]);
  const [newLocation, setNewLocation] = useState('');

  const handleAddLocation = () => {
    if (newLocation.trim() !== '') {
      setLocations([...locations, newLocation.trim()]);
      setNewLocation('');
    }
  };

  return (
    <div className="App">
      <h1>Optimal Route Planner</h1>

      <div className="location-input-section">
        <input
          type="text"
          value={newLocation}
          onChange={(e) => setNewLocation(e.target.value)}
          placeholder="장소를 입력하세요"
        />
        <button onClick={handleAddLocation}>추가</button>
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
        {/* Naver Map will be rendered here */}
        <div style={{ width: '100%', height: '400px', backgroundColor: '#f0f0f0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <p>네이버 지도가 표시될 영역</p>
        </div>
      </div>
    </div>
  );
}

export default App;
