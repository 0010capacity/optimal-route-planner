import { useCallback } from 'react';
import { HybridOptimizer } from '../utils/routeOptimizer';
import { getDirections } from '../api/naverApi';
import { shareToMap } from '../api/naverApi';
import { useEffect } from 'react';

export const useAppHandlers = (
  editingIndex,
  locations,
  geocodedLocations,
  updateLocation,
  updateLocations,
  setCurrentMode,
  setEditingIndex,
  setOptimizedRoute,
  setIsOptimizing,
  setDistanceMatrix,
  markersRef,
  mapInstance,
  clearSearch,
  onProgressUpdate
) => {
  // Geocoding logic
  const geocodeLocations = useCallback(() => {
    const geocoded = [];
    const cache = new Map();

    for (const loc of locations) {
      const key = `${loc.name}_${loc.address || ''}`;
      let cached = cache.get(key);

      if (!cached) {
        // geocode new location via Kakao
        cached = { coords: null, address: loc.address || loc.name };
        cache.set(key, cached);
      }

      geocoded.push({
        ...loc,
        coords: cached.coords,
        address: cached.address
      });
    }
    return geocoded;
  }, [locations]);

  const handleSearchResultSelect = useCallback((result) => {
    if (editingIndex === null || editingIndex < 0 || editingIndex >= locations.length) {
      return;
    }
    const newLocation = {
      name: result.place_name,
      address: result.address_name || result.road_address_name || '',
      coords: { lat: parseFloat(result.y), lng: parseFloat(result.x) }
    };
    updateLocation(editingIndex, newLocation);
    setCurrentMode('list');
    setEditingIndex(null);
    clearSearch();
    markersRef.current = markersRef.current || [];
  }, [editingIndex, updateLocation, setCurrentMode, setEditingIndex, clearSearch, markersRef, mapInstance]);

  const handleLocationClick = useCallback((index) => {
    setEditingIndex(index);
    setCurrentMode('search');
    clearSearch();
  }, [setEditingIndex, setCurrentMode, clearSearch]);

  const handleOptimizeRoute = useCallback(async () => {
    // Filter locations with valid coordinates
    const validLocations = geocodedLocations.filter(loc =>
      loc.coords && loc.coords.lat && loc.coords.lng &&
      !isNaN(loc.coords.lat) && !isNaN(loc.coords.lng)
    );

    if (validLocations.length < 2) {
      console.warn(`Need at least two valid locations. Currently: ${validLocations.length}`);
      return;
    }

    const waypointCount = validLocations.length - 2;
    // 비대칭 거리 행렬 n(n-1) + 최종 1회. 직행은 1회.
    const expectedApiCalls = waypointCount <= 0
      ? 1
      : validLocations.length * (validLocations.length - 1) + 1;
    const method = waypointCount <= 0 ? '직접 계산' : '분기 한정';

    setIsOptimizing(true);

    try {
      const onProgress = onProgressUpdate ? (current = 1, total = 1) => {
        if (typeof window !== 'undefined') {
          onProgressUpdate({
            current,
            total,
            message: `${method}으로 최적화 중... (${current}/${total} API 호출 완료)`
          });
        }
      } : null;

      const result = await HybridOptimizer.optimize(validLocations, getDirections, onProgress);

      if (!result) {
        console.error('Unable to calculate route. Check network connection and try again.');
        return;
      }

      // TOO_MANY_LOCATIONS 등 가드 응답을 사용자에게 가시화
      if (result.error === 'TOO_MANY_LOCATIONS') {
        const message = `최대 ${result.maxLocations}개 장소까지 지원합니다 (현재 ${result.currentLocations}개). 장소 수를 줄여주세요.`;
        console.error(`❌ ${message}`);
        onProgressUpdate?.({ current: 0, total: 0, message });
        return;
      }

      const { optimizedLocations, routeData } = result;

      // 출발/도착 고정, 중간 경유지만 재배열
      const startLocation = locations[0];
      const endLocation = locations[locations.length - 1];
      const optimizedWaypoints = optimizedLocations.slice(1, -1);
      const newLocations = [startLocation, ...optimizedWaypoints, endLocation];
      updateLocations(newLocations);

      if (result.distanceMatrix) {
        setDistanceMatrix(result.distanceMatrix);
      }

      const totalMinutes = Math.round(routeData.totalTime / 60);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      const timeString = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

      const methodName = {
        direct: 'Direct calculation',
        branch_and_bound: 'Branch and Bound'
      }[result.optimizationMethod] || result.optimizationMethod;

      console.log(`✅ ${methodName} completed: ${timeString} (${result.apiCalls || expectedApiCalls} API calls)`);
    } catch (error) {
      console.error('❌ Route optimization error:', error);
    } finally {
      setIsOptimizing(false);
      if (onProgressUpdate) {
        onProgressUpdate({ current: 0, total: 0, message: '' });
      }
    }
  }, [geocodedLocations, locations, setOptimizedRoute, setIsOptimizing, setDistanceMatrix, updateLocations, onProgressUpdate]);

  const handleShareRoute = useCallback(() => {
    const validLocations = geocodedLocations.filter(loc =>
      loc.coords && loc.coords.lat && loc.coords.lng &&
      !isNaN(loc.coords.lat) && !isNaN(loc.coords.lng)
    );

    if (validLocations.length < 2) {
      console.warn('Need at least two valid locations to share');
      return;
    }

    const routeUrl = shareToMap('naver', validLocations);
    if (routeUrl) {
      window.open(routeUrl, '_blank');
    }
  }, [geocodedLocations]);

  const handleMapSelect = useCallback((mapType) => {
    const validLocations = geocodedLocations.filter(loc =>
      loc.coords && loc.coords.lat && loc.coords.lng &&
      !isNaN(loc.coords.lat) && !isNaN(loc.coords.lng)
    );

    if (validLocations.length < 2) {
      console.warn('Need at least two valid locations to share');
      return;
    }

    const routeUrl = shareToMap(mapType, validLocations);
    if (routeUrl) {
      window.open(routeUrl, '_blank');
    }
  }, [geocodedLocations]);

  const handleBackToList = useCallback(() => {
    setCurrentMode('list');
    setEditingIndex(null);
    clearSearch();
    markersRef.current = markersRef.current || [];
    if (mapInstance && mapInstance.setCenter) {
      const bounds = mapInstance.getBounds();
      // best-effort fit
    }
  }, [setCurrentMode, setEditingIndex, clearSearch, markersRef, mapInstance]);

  // eslint-disable-next-line no-unused-vars
  useEffect(() => {
    // placeholder for future side-effects
  }, []);

  return {
    geocodeLocations,
    handleSearchResultSelect,
    handleLocationClick,
    handleOptimizeRoute,
    handleShareRoute,
    handleMapSelect,
    handleBackToList
  };
};
