import { useState, useEffect, useCallback } from 'react';
import { getDirections } from '../api/naverApi';
import getPermutations from '../utils/getPermutations';

export const useLocations = () => {
  const [locations, setLocations] = useState([
    { name: '', address: '', coords: null },
    { name: '', address: '', coords: null }
  ]);
  const [geocodedLocations, setGeocodedLocations] = useState([]);
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [distanceMatrix, setDistanceMatrix] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Geocoding 로직
  useEffect(() => {
    const geocodeAllLocations = async () => {
      const geocoded = [];
      for (const loc of locations) {
        if (loc.coords && loc.coords.lat && loc.coords.lng) {
          geocoded.push({ name: loc.name, coords: loc.coords });
        }
        // 좌표가 없는 장소는 건너뜀 (Kakao 검색에서 이미 좌표 제공됨)
      }
      setGeocodedLocations(geocoded);
    };

    geocodeAllLocations();
  }, [locations]);

  // 자동 경로 계산
  useEffect(() => {
    const fetchRoute = async () => {
      if (geocodedLocations.length >= 2) {
        const coordsArray = geocodedLocations.map(loc => loc.coords);
        const result = await getDirections(coordsArray);
        if (result) {
          setOptimizedRoute(result);
        }
      } else {
        setOptimizedRoute(null);
      }
    };

    fetchRoute();
  }, [geocodedLocations]);

  const handleAddLocation = useCallback(() => {
    // 전체 장소 최대 개수 제한 (12개)
    if (locations.length >= 12) {
      console.warn('장소 개수가 너무 많습니다. 최대 12개까지 지원합니다.');
      alert('장소 개수가 너무 많습니다. 최대 12개까지 지원합니다.');
      return;
    }
    
    setLocations([...locations, { name: '', address: '', coords: null }]);
  }, [locations]);  const handleDeleteLocation = useCallback((index) => {
    const newLocations = locations.filter((_, i) => i !== index);
    setLocations(newLocations);
  }, [locations]);

  const handleDragStart = useCallback((e, index) => {
    e.stopPropagation();
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  }, []);

  const handleDragOver = useCallback((e, index) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback((e, dropIndex) => {
    e.preventDefault();
    e.stopPropagation();
    const draggedIndexStr = e.dataTransfer.getData('text/plain');
    const draggedIndex = parseInt(draggedIndexStr, 10);

    if (isNaN(draggedIndex) || draggedIndex === dropIndex) {
      setDragOverIndex(null);
      return;
    }

    const newLocations = [...locations];
    const draggedItem = newLocations[draggedIndex];
    newLocations.splice(draggedIndex, 1);
    newLocations.splice(dropIndex, 0, draggedItem);

    setLocations(newLocations);
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, [locations]);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  const handleOptimizeRoute = useCallback(async () => {
    if (geocodedLocations.length < 2) {
      console.warn('최소 두 개 이상의 장소를 추가해야 경로를 최적화할 수 있습니다.');
      return;
    }

    // 전체 장소 최대 개수 제한 확인
    if (geocodedLocations.length > 12) {
      console.error('장소 개수가 너무 많습니다. 최대 12개까지 지원합니다.');
      alert('장소 개수가 너무 많습니다. 최대 12개까지 지원합니다.');
      return;
    }

    try {
      // 새로운 HybridOptimizer 사용
      const { HybridOptimizer } = await import('../utils/routeOptimizer.js');
      const optimizationResult = await HybridOptimizer.optimize(geocodedLocations, getDirections);

      if (optimizationResult) {
        if (optimizationResult.error === 'TOO_MANY_WAYPOINTS') {
          console.error(optimizationResult.message);
          alert(optimizationResult.message);
          return;
        }

        // 최적화된 경로로 위치 업데이트
        setLocations(optimizationResult.optimizedLocations);
        setOptimizedRoute(optimizationResult.routeData);
        setDistanceMatrix(optimizationResult.distanceMatrix);

        const totalMinutes = Math.round(optimizationResult.routeData.totalTime / 60000);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        const timeString = hours > 0 ? `${hours}시간 ${minutes}분` : `${minutes}분`;

      } else {
        console.error('경로를 계산할 수 없습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('❌ 경로 최적화 오류:', error);
      console.error('경로 최적화 중 오류가 발생했습니다.');
    }
  }, [geocodedLocations]);

  const updateLocation = useCallback((index, location) => {
    const newLocations = [...locations];
    newLocations[index] = location;
    setLocations(newLocations);
  }, [locations]);

  return {
    locations,
    geocodedLocations,
    optimizedRoute,
    distanceMatrix,
    draggedIndex,
    dragOverIndex,
    handleAddLocation,
    handleDeleteLocation,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    handleOptimizeRoute,
    updateLocation
  };
};
