import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import { Icon } from './Icon';

// 개별 위치 아이템 컴포넌트
const SortableLocationItem = ({ 
  location, 
  index, 
  isFirst, 
  isLast, 
  onLocationClick, 
  onDeleteLocation, 
  isOptimizing,
  totalLocations
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({id: `location-${index}`});

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
  };

  const locationItemClass = `location-item ${isFirst ? 'start' : isLast ? 'end' : 'waypoint'} ${isDragging ? 'dragging' : ''}`;

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={locationItemClass}
    >
      <div className="location-visual">
        <div
          className="location-dot"
          {...attributes}
          {...listeners}
          style={{ 
            cursor: 'grab',
            touchAction: 'none' // 스크롤 완전 차단
          }}
          title="드래그하여 순서 변경"
        >
          {!isFirst && !isLast && (
            <span className="waypoint-number">{index}</span>
          )}
        </div>
        <div className="location-line"></div>
      </div>
      <div className="location-content">
        <button
          className="location-button"
          onClick={() => onLocationClick(index)}
          disabled={isOptimizing}
        >
          {location.name || '장소를 선택하세요'}
        </button>
      </div>
      {onDeleteLocation && (
        <button
          className="delete-button"
          onClick={() => onDeleteLocation(index)}
          disabled={isOptimizing}
        >
          ×
        </button>
      )}
    </li>
  );
};

const LocationList = ({
  locations,
  optimizedRoute,
  onLocationClick,
  onAddLocation,
  onOptimizeRoute,
  onDeleteLocation,
  isOptimizing,
  onShareRoute,
  onReorderLocations
}) => {
  // 드래그 센서 설정 - 터치와 마우스 모두 지원, 즉시 반응
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3, // 3px만 이동해도 드래그 시작 (더 민감하게)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event) => {
    console.log('드래그 시작:', event);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = parseInt(active.id.replace('location-', ''));
      const newIndex = parseInt(over.id.replace('location-', ''));
      
      console.log('드래그 완료:', oldIndex, '->', newIndex);
      
      // 부모 컴포넌트에 순서 변경 알림
      if (onReorderLocations) {
        const newLocations = arrayMove(locations, oldIndex, newIndex);
        onReorderLocations(newLocations);
      }
    }
  };

  return (
    <>
      {isOptimizing && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <div className="loading-text">경로를 최적화하고 있습니다...</div>
          </div>
        </div>
      )}
      <div className="location-list-section">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={locations.map((_, index) => `location-${index}`)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="location-list">
              {locations.map((location, index) => (
                <SortableLocationItem
                  key={`location-${index}`}
                  location={location}
                  index={index}
                  isFirst={index === 0}
                  isLast={index === locations.length - 1}
                  onLocationClick={onLocationClick}
                  onDeleteLocation={locations.length > 2 ? onDeleteLocation : null}
                  isOptimizing={isOptimizing}
                  totalLocations={locations.length}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
        
        <button
          className="add-location-button"
          onClick={onAddLocation}
          disabled={isOptimizing}
          aria-label="새 장소 추가"
          title="새 장소 추가"
        >
          +
        </button>
        
        <button
          className="optimize-button"
          onClick={onOptimizeRoute}
          disabled={isOptimizing || locations.length < 2 || locations.some(loc => !loc.name)}
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
        
        {optimizedRoute && (
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
        )}
      </div>
    </>
  );
};

export default LocationList;
