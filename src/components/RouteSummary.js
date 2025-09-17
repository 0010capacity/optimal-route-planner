import React from 'react';
import { Icon } from './Icon';

/**
 * 최적화된 경로 요약 컴포넌트
 */
const RouteSummary = ({ optimizedRoute, locations }) => {
  if (!optimizedRoute) return null;

  return (
    <div className="route-summary" role="region" aria-label="최적화된 경로 정보">
      <div className="route-stops">
        {optimizedRoute.order.map((locationIndex, stopIndex) => {
          const isFirst = stopIndex === 0;
          const isLast = stopIndex === optimizedRoute.order.length - 1;
          const locationName = locations[locationIndex]?.name || `위치 ${locationIndex + 1}`;

          return (
            <React.Fragment key={stopIndex}>
              <div className={`route-stop ${isFirst ? 'departure' : isLast ? 'arrival' : 'waypoint'}`}>
                <div className="stop-info">
                  <span className="stop-name">{locationName}</span>
                </div>
              </div>
              {!isLast && optimizedRoute.segmentTimes && optimizedRoute.segmentTimes[stopIndex] && (
                <div className="route-segment">
                  <Icon name="time" size={10} />
                  {(() => {
                    const segmentMinutes = Math.round(optimizedRoute.segmentTimes[stopIndex] / 60);
                    return segmentMinutes > 0 ? `${segmentMinutes}분` : '<1분';
                  })()}
                  <span className="segment-separator">•</span>
                  <Icon name="distance" size={10} />
                  {(() => {
                    const segmentDistance = optimizedRoute.segmentDistances ?
                      optimizedRoute.segmentDistances[stopIndex] / 1000 :
                      (optimizedRoute.totalDistance / 1000) / (optimizedRoute.order.length - 1);
                    return segmentDistance.toFixed(1) + 'km';
                  })()}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="route-stats">
        <div className="stat-item">
          <Icon name="time" size={14} />
          <span>총 시간: {Math.round(optimizedRoute.totalTime / 60)}분</span>
        </div>
        <div className="stat-item">
          <Icon name="distance" size={14} />
          <span>총 거리: {(optimizedRoute.totalDistance / 1000).toFixed(1)}km</span>
        </div>
      </div>
    </div>
  );
};

export default RouteSummary;
