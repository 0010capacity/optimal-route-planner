import React from 'react';
import { Icon } from './Icon';

const MapSection = ({ mapRef, onGetCurrentLocation, isGettingLocation }) => {
  return (
    <div className="map-section">
      <div className="map-controls">
        <button
          className="current-location-button"
          onClick={onGetCurrentLocation}
          disabled={isGettingLocation}
          title={isGettingLocation ? "위치 정보 가져오는 중..." : "내 위치로 이동"}
          aria-label="현재 위치로 지도 이동"
        >
          <Icon name={isGettingLocation ? "loading" : "location"} size={20} />
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
