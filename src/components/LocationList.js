import React from 'react';
import { Icon } from './Icon';

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
  // 경로 순서에 따른 장소 이름 매핑
  const getRouteDisplayNames = () => {
    if (!optimizedRoute || !optimizedRoute.order) return [];
    
    return optimizedRoute.order.map(index => {
      const location = locations[index];
      return location?.name || `Point ${index + 1}`;
    });
  };

  // 예상 도착 시간 계산
  const getEstimatedArrivalTimes = () => {
    if (!optimizedRoute || !optimizedRoute.path || !optimizedRoute.segmentTimes) return [];
    
    const times = [];
    let currentTime = Date.now(); // 현재 시간부터 시작
    
    // 각 구간의 시간을 누적
    for (let i = 0; i < optimizedRoute.segmentTimes.length; i++) {
      currentTime += optimizedRoute.segmentTimes[i] * 1000; // segmentTimes는 초 단위
      times.push(new Date(currentTime));
    }
    
    return times;
  };

  const routeNames = getRouteDisplayNames();
  const arrivalTimes = getEstimatedArrivalTimes();
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
              <div className="location-content">
                <button
                  className="location-button"
                  onClick={() => onLocationClick(index)}
                >
                  {location.name || '장소를 선택하세요'}
                </button>
              </div>
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
          <Icon name="optimize" size={16} />
          경로 최적화
        </button>
        {optimizedRoute && (
          <div className="route-summary" role="region" aria-label="최적화된 경로 정보">
            <div className="route-stops">
              {optimizedRoute.order.map((locationName, stopIndex) => {
                const isFirst = stopIndex === 0;
                const isLast = stopIndex === optimizedRoute.order.length - 1;
                
                return (
                  <React.Fragment key={stopIndex}>
                    <div className={`route-stop ${isFirst ? 'departure' : isLast ? 'arrival' : 'waypoint'}`}>
                      <div className="stop-info">
                        <span className="stop-name">{locationName}</span>
                        <span className="stop-time">
                          {isFirst ? (
                            <>
                              <Icon name="departure" size={12} />
                              출발: {new Date().toLocaleTimeString('ko-KR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </>
                          ) : (
                            <>
                              <Icon name="clock" size={12} />
                              도착: {arrivalTimes[stopIndex - 1] ? arrivalTimes[stopIndex - 1].toLocaleTimeString('ko-KR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : '계산중...'}
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                    {!isLast && optimizedRoute.segmentTimes && optimizedRoute.segmentTimes[stopIndex] && (
                      <div className="route-segment">
                        <Icon name="time" size={10} />
                        {(() => {
                          const segmentMinutes = Math.round(optimizedRoute.segmentTimes[stopIndex] / 60);
                          return segmentMinutes > 0 ? `${segmentMinutes}분` : '<1분';
                        })()}
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
            <div className="route-stats">
              <span className="time-icon">
                <Icon name="time" size={14} />
              </span>
              <span className="time-text">
                {(() => {
                  const totalMinutes = Math.round(optimizedRoute.totalTime / 60000);
                  const hours = Math.floor(totalMinutes / 60);
                  const minutes = totalMinutes % 60;
                  return hours > 0 ? `${hours}시간 ${minutes}분` : `${minutes}분`;
                })()}
              </span>
              <span className="distance-icon">
                <Icon name="distance" size={14} />
              </span>
              <span className="distance-text">
                {(optimizedRoute.totalDistance / 1000).toFixed(1)}km
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default LocationList;
