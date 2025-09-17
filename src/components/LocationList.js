import React, { memo } from 'react';
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
import LoadingOverlay from './LoadingOverlay';
import RouteSummary from './RouteSummary';
import LocationControls from './LocationControls';

// 개별 위치 아이템 컴포넌트 - 메모이제이션 적용
const SortableLocationItem = memo(({ 
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
});

const LocationList = ({
  locations,
  optimizedRoute,
  onLocationClick,
  onAddLocation,
  onOptimizeRoute,
  onDeleteLocation,
  isOptimizing,
  onShareRoute,
  onReorderLocations,
  distanceMatrix,
  geocodedLocations
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
    // 드래그 시작 이벤트 처리
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = parseInt(active.id.replace('location-', ''));
      const newIndex = parseInt(over.id.replace('location-', ''));
      
      // 부모 컴포넌트에 순서 변경 알림
      if (onReorderLocations) {
        const newLocations = arrayMove(locations, oldIndex, newIndex);
        onReorderLocations(newLocations);
      }
    }
  };

  return (
    <>
      <LoadingOverlay isOptimizing={isOptimizing} />
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
        
        <LocationControls
          locations={locations}
          isOptimizing={isOptimizing}
          optimizedRoute={optimizedRoute}
          onAddLocation={onAddLocation}
          onOptimizeRoute={onOptimizeRoute}
          onShareRoute={onShareRoute}
        />
        
        <RouteSummary optimizedRoute={optimizedRoute} locations={locations} />
      </div>
    </>
  );
};

export default memo(LocationList);
