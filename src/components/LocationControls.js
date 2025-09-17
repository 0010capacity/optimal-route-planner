import React from 'react';
import { Icon } from './Icon';

/**
 * 위치 목록 컨트롤 컴포넌트 (추가, 최적화, 공유 버튼들)
 */
const LocationControls = ({
  locations,
  isOptimizing,
  optimizedRoute,
  onAddLocation,
  onOptimizeRoute,
  onShareRoute
}) => {
  return (
    <>
      <button
        className={`add-location-button ${locations.length >= 12 ? 'disabled' : ''}`}
        onClick={onAddLocation}
        disabled={isOptimizing || locations.length >= 12}
        aria-label="새 장소 추가"
        title={locations.length >= 12 ? "최대 12개 장소까지 추가할 수 있습니다" : "새 장소 추가"}
      >
        +
      </button>

      <button
        className={`optimize-button ${locations.length > 12 ? 'disabled' : ''}`}
        onClick={onOptimizeRoute}
        disabled={isOptimizing || locations.length < 2 || locations.length > 12 || locations.some(loc => !loc.name)}
        aria-label="경로 최적화"
      >
        <Icon name="optimize" size={16} />
        {isOptimizing ? '최적화 중...' : '경로 최적화'}
      </button>

      <button
        className="share-button"
        onClick={onShareRoute}
        disabled={!optimizedRoute || isOptimizing}
        aria-label="지도 앱/웹으로 공유"
        title="지도 앱/웹으로 공유"
      >
        <Icon name="share" size={16} />
        지도 공유
      </button>
    </>
  );
};

export default LocationControls;
