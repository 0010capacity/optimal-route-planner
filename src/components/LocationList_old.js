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
  onDeleteLocation,
  isOptimizing,
  onShareRoute
}) => {
  // 내부 드래그 모드 상태 관리
  const [isDragMode, setIsDragMode] = useState(false);
  const [touchDragState, setTouchDragState] = useState(null);

  // 모바일 감지
  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
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

  const arrivalTimes = getEstimatedArrivalTimes();

  // 간단한 모바일 드래그 상태
  const [mobileDragState, setMobileDragState] = useState({
    isDragging: false,
    startIndex: null,
    startY: 0
  });

  useEffect(() => {
    const checkMobile = () => {
      const mobileCheck = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                         (window.innerWidth <= 768 && window.innerHeight <= 1024);
      console.log('모바일 체크 결과:', mobileCheck, '화면 크기:', window.innerWidth, 'x', window.innerHeight);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 모바일 터치 시작 - 완전히 새로운 접근
  const handleMobileTouchStart = (e, index) => {
    if (!isMobile || isOptimizing) return;
    
    // 드래그 핸들(.location-dot)에서만 드래그 시작
    if (!e.target.classList.contains('location-dot')) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    console.log('모바일 터치 시작:', index); // 디버깅용
    
    const touch = e.touches[0];
    
    setMobileDragState({
      isDragging: true,
      startIndex: index,
      startY: touch.clientY
    });

    // 진동 피드백
    if (navigator.vibrate) {
      navigator.vibrate([50]);
    }
    
    // 드래그 중임을 시각적으로 표시
    const element = e.target.closest('.location-item');
    if (element) {
      element.style.opacity = '0.7';
      element.style.transform = 'scale(0.95)';
    }
  };

  // 모바일 터치 이동 - 완전히 새로운 접근
  const handleMobileTouchMove = useCallback((e) => {
    if (!mobileDragState.isDragging || !isMobile) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    console.log('모바일 터치 이동 중'); // 디버깅용
    
    const touch = e.touches[0];
    
    // 현재 터치 위치에서 요소 찾기
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    const targetItem = elementBelow?.closest('.location-item');
    
    // 모든 아이템의 하이라이트 제거
    document.querySelectorAll('.location-item').forEach(item => {
      item.classList.remove('drag-hover');
    });
    
    // 현재 호버중인 아이템 하이라이트
    if (targetItem && !targetItem.classList.contains('touch-dragging')) {
      targetItem.classList.add('drag-hover');
    }
  }, [mobileDragState.isDragging, isMobile]);

  // 모바일 터치 종료 - 완전히 새로운 접근
  const handleMobileTouchEnd = useCallback((e) => {
    if (!mobileDragState.isDragging || !isMobile) return;
    
    console.log('모바일 터치 종료'); // 디버깅용
    
    const touch = e.changedTouches[0];
    
    // 터치 종료 위치에서 요소 찾기
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    const targetItem = elementBelow?.closest('.location-item');
    
    if (targetItem) {
      const allItems = Array.from(document.querySelectorAll('.location-item'));
      const targetIndex = allItems.indexOf(targetItem);
      
      if (targetIndex !== -1 && targetIndex !== mobileDragState.startIndex) {
        console.log('순서 변경:', mobileDragState.startIndex, '->', targetIndex); // 디버깅용
        
        // 순서 변경 실행
        const mockEvent = {
          dataTransfer: {
            getData: () => mobileDragState.startIndex.toString()
          }
        };
        onDrop(mockEvent, targetIndex);
      }
    }
    
    // 모든 시각적 효과 제거
    document.querySelectorAll('.location-item').forEach(item => {
      item.style.opacity = '';
      item.style.transform = '';
      item.classList.remove('drag-hover');
    });
    
    // 상태 초기화
    setMobileDragState({
      isDragging: false,
      startIndex: null,
      startY: 0
    });
  }, [mobileDragState, isMobile, onDrop]);

  // 모바일 터치 이벤트 리스너
  useEffect(() => {
    console.log('이벤트 리스너 설정:', '모바일 상태:', isMobile()); 
    if (isMobile()) {
      document.addEventListener('touchmove', handleMobileTouchMove, { passive: false });
      document.addEventListener('touchend', handleMobileTouchEnd, { passive: false });

      return () => {
        document.removeEventListener('touchmove', handleMobileTouchMove);
        document.removeEventListener('touchend', handleMobileTouchEnd);
      };
    }
  }, [isMobile, handleMobileTouchMove, handleMobileTouchEnd]);

  // PC용 드래그 핸들러
  const handleDotMouseDown = (e, index) => {
    if (isMobile) return;
    
    e.stopPropagation();
    if (!isDragMode && !isOptimizing) {
      setIsDragMode(true);
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
        <ul className="location-list">
          {locations.map((location, index) => (
            <li
              key={index}
              className={`location-item ${index === 0 ? 'start' : index === locations.length - 1 ? 'end' : 'waypoint'} ${draggedIndex === index ? 'dragging' : ''} ${dragOverIndex === index ? 'drag-over' : ''} ${isDragMode ? 'drag-mode' : ''} ${mobileDragState.isDragging && mobileDragState.startIndex === index ? 'touch-dragging' : ''}`}
              onDragOver={!isMobile() ? (e) => onDragOver(e, index) : undefined}
              onDragLeave={!isMobile() ? onDragLeave : undefined}
              onDrop={!isMobile() ? (e) => onDrop(e, index) : undefined}
            >
              <div className="location-visual">
                <div
                  className={`location-dot ${isDragMode ? 'drag-enabled' : ''} ${mobileDragState.isDragging && mobileDragState.startIndex === index ? 'touch-dragging' : ''}`}
                  draggable={!isMobile && !isOptimizing}
                  onDragStart={!isMobile ? (e) => onDragStart(e, index) : undefined}
                  onDragEnd={!isMobile() ? onDragEnd : undefined}
                  onMouseDown={!isMobile() ? (e) => handleDotMouseDown(e, index) : undefined}
                  onTouchStart={isMobile() ? (e) => handleMobileTouchStart(e, index) : undefined}
                  style={{ cursor: isDragMode ? 'grab' : 'pointer' }}
                  title={isMobile() ? '터치하여 드래그' : (isDragMode ? '드래그하여 순서 변경' : '클릭하여 드래그 모드 활성화')}
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
              </div>
              {locations.length > 2 && (
                <button
                  className="delete-button"
                  onClick={() => onDeleteLocation(index)}
                  disabled={isOptimizing}
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
          disabled={isOptimizing}
        >
          +
        </button>
        <button
          className="optimize-button"
          onClick={onOptimizeRoute}
          disabled={isOptimizing}
          aria-label="경로 최적화"
        >
          <Icon name="optimize" size={16} />
          {isOptimizing ? '최적화 중...' : '경로 최적화'}
        </button>
        <button
          className="share-button"
          onClick={onShareRoute}
          disabled={isOptimizing || locations.length < 2}
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
