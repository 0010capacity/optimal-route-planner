import React from 'react';

const MapSection = ({ mapRef, onGetCurrentLocation }) => {
  return (
    <div className="map-section">
      <div className="map-controls">
        <button
          className="current-location-button"
          onClick={onGetCurrentLocation}
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
  );
};

export default MapSection;
