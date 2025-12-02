import React, { useState, useEffect, useRef, memo } from 'react';
import { Icon } from './Icon';

const MapSection = memo(({ mapRef, onGetCurrentLocation, isGettingLocation }) => {
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
        const viewportWidth = window.innerWidth;

        if (viewportWidth <= 768) {
          setMapHeight('320px');
          return;
        }

        if (viewportWidth <= 1024) {
          const viewportHeight = window.innerHeight;
          const calculatedHeight = Math.min(
            Math.max(viewportHeight - 220, 420),
            640,
          );
          setMapHeight(`${calculatedHeight}px`);
          return;
        }

  const viewportHeight = window.innerHeight;
        const isLargeDesktop = viewportWidth >= 1440;
  const desktopPadding = isLargeDesktop ? 180 : 240;
  const maxHeight = isLargeDesktop ? 920 : 780;
        const calculatedHeight = Math.min(
          Math.max(viewportHeight - desktopPadding, 480),
          maxHeight,
        );

        setMapHeight(`${calculatedHeight}px`);
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
            height: mapHeight,
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
});

export default MapSection;
