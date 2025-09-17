import React, { useState, useEffect, useRef } from 'react';
import { Icon } from './Icon';

const MapSection = ({ mapRef, onGetCurrentLocation, isGettingLocation }) => {
  const [mapHeight, setMapHeight] = useState('400px');
  const [isClient, setIsClient] = useState(false);
  const isInitializedRef = useRef(false); // MapSection 초기화 상태 추적

  useEffect(() => {
    // 이미 초기화되었으면 중복 실행 방지
    if (isInitializedRef.current) {
      return;
    }
    
    setIsClient(true);
    isInitializedRef.current = true;

    if (typeof window !== 'undefined') {
      const updateHeight = () => {
        setMapHeight(window.innerWidth <= 768 ? '300px' : '400px');
      };
      updateHeight();
      window.addEventListener('resize', updateHeight);
      
      return () => window.removeEventListener('resize', updateHeight);
    }
  }, []); // 빈 의존성 배열로 중복 실행 방지

  if (!isClient) {
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
          style={{
            width: '100%',
            height: '400px',
            backgroundColor: '#f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #ddd'
          }}
        >
          지도를 불러오는 중...
        </div>
      </div>
    );
  }

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
          height: mapHeight,
        }}
      />
    </div>
  );
};

export default MapSection;
