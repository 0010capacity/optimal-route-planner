import React from 'react';

const LocationList = ({
  locations,
  optimizedRoute,
  onLocationClick,
  onAddLocation,
  onOptimizeRoute,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  draggedIndex,
  dragOverIndex,
  onDeleteLocation
}) => {
  return (
    <>
      <div className="location-list-section">
        <ul className="location-list">
          {locations.map((location, index) => (
            <li
              key={index}
              className={`location-item ${index === 0 ? 'start' : index === locations.length - 1 ? 'end' : 'waypoint'} ${draggedIndex === index ? 'dragging' : ''} ${dragOverIndex === index ? 'drag-over' : ''}`}
              onDragOver={(e) => onDragOver(e, index)}
              onDragLeave={onDragLeave}
              onDrop={(e) => onDrop(e, index)}
            >
              <div className="location-visual">
                <div
                  className="location-dot"
                  draggable
                  onDragStart={(e) => onDragStart(e, index)}
                  onDragEnd={onDragEnd}
                ></div>
                <div className="location-line"></div>
              </div>
              <button
                className="location-button"
                onClick={() => onLocationClick(index)}
              >
                {location.name || '장소를 선택하세요'}
              </button>
              {locations.length > 2 && index !== 0 && index !== locations.length - 1 && (
                <button
                  className="delete-button"
                  onClick={() => onDeleteLocation(index)}
                >
                  ×
                </button>
              )}
            </li>
          ))}
        </ul>
        <button
          className="add-location-button"
          onClick={onAddLocation}
          aria-label="새 장소 추가"
          title="새 장소 추가"
        >
          +
        </button>
        <button
          className="optimize-button"
          onClick={onOptimizeRoute}
          disabled={false}
          aria-label="경로 최적화"
        >
          🚀 경로 최적화
        </button>
        {optimizedRoute && (
          <div className="route-summary" role="region" aria-label="최적화된 경로 정보">
            <div className="route-order">
              🗺️ 경로 표시됨: {optimizedRoute.order.join(' → ')}
            </div>
            <div className="route-stats">
              ⏱️ {(() => {
                const totalMinutes = Math.round(optimizedRoute.totalTime / 60000);
                const hours = Math.floor(totalMinutes / 60);
                const minutes = totalMinutes % 60;
                return hours > 0 ? `${hours}시간 ${minutes}분` : `${minutes}분`;
              })()} • 📏 {(optimizedRoute.totalDistance / 1000).toFixed(1)}km
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default LocationList;
