import React, { useEffect, useState } from 'react';
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
  arrivalTime,
  isDragMode,
  setIsDragMode
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

  const handleDotClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isDragMode) {
      setIsDragMode(true);
      setTimeout(() => {
        setIsDragMode(false);
      }, 5000);
    }
  };

  const locationItemClass = `location-item ${isFirst ? 'start' : isLast ? 'end' : 'waypoint'} ${isDragMode ? 'drag-mode' : ''} ${isDragging ? 'dragging' : ''}`;

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={locationItemClass}
    >
      <div className="location-visual">
        <div
          className="location-dot"
          onClick={handleDotClick}
          {...attributes}
          {...listeners}
          style={{ cursor: isDragMode ? 'grab' : 'pointer' }}
          title={isDragMode ? '드래그하여 순서 변경' : '클릭하여 드래그 모드 활성화'}
        ></div>
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
        {arrivalTime && (
          <div className="arrival-time">
            예상 도착: {arrivalTime.toLocaleTimeString('ko-KR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        )}
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
  onReorderLocations // 새로운 prop
}) => {
  const [isDragMode, setIsDragMode] = useState(false);

  // 예상 도착 시간 계산
  const getEstimatedArrivalTimes = () => {
    if (!optimizedRoute || !optimizedRoute.path || !optimizedRoute.segmentTimes) return [];
    
    const times = [];
    let currentTime = Date.now(); // 현재 시간부터 시작
    
    // 각 구간의 시간을 누적
    for (let i = 0; i < optimizedRoute.segmentTimes.length; i++) {
      currentTime += optimizedRoute.segmentTimes[i] * 60 * 1000; // 분을 밀리초로 변환
      times.push(new Date(currentTime));
    }
    
    return times;
  };

  const arrivalTimes = getEstimatedArrivalTimes();

  // 드래그 센서 설정 - 터치와 마우스 모두 지원
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px 이동 후 드래그 시작
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
                  arrivalTime={arrivalTimes[index]}
                  isDragMode={isDragMode}
                  setIsDragMode={setIsDragMode}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
        
        <button
          className="add-location-button"
          onClick={onAddLocation}
          disabled={isOptimizing}
        >
          <Icon name="plus" size={16} />
          경유지 추가
        </button>
        
        <button
          className="optimize-button"
          onClick={onOptimizeRoute}
          disabled={isOptimizing || locations.length < 2 || locations.some(loc => !loc.name)}
        >
          <Icon name="route" size={16} />
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
              {optimizedRoute.order.map((locationName, stopIndex) => {
                const isFirst = stopIndex === 0;
                const isLast = stopIndex === optimizedRoute.order.length - 1;
                
                return (
                  <React.Fragment key={stopIndex}>
                    <div className={`route-stop ${isFirst ? 'departure' : isLast ? 'arrival' : 'waypoint'}`}>
                      <span className="stop-number">{stopIndex + 1}</span>
                      <span className="stop-name">{locationName}</span>
                      {arrivalTimes[stopIndex] && (
                        <span className="stop-time">
                          {arrivalTimes[stopIndex].toLocaleTimeString('ko-KR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      )}
                    </div>
                    {!isLast && (
                      <div className="route-arrow">
                        <Icon name="arrow-down" size={12} />
                        {optimizedRoute.segmentTimes && optimizedRoute.segmentTimes[stopIndex] && (
                          <span className="segment-time">
                            {Math.round(optimizedRoute.segmentTimes[stopIndex])}분
                          </span>
                        )}
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
            
            <div className="route-stats">
              <div className="stat-item">
                <Icon name="clock" size={14} />
                <span>총 시간: {Math.round(optimizedRoute.totalTime)}분</span>
              </div>
              <div className="stat-item">
                <Icon name="map" size={14} />
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
