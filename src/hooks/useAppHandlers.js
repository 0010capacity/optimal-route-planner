import { useCallback } from 'react';
import { HybridOptimizer } from '../utils/routeOptimizer';
import { getDirections } from '../api/naverApi';
import { shareToMap } from '../api/naverApi';
import getPermutations from '../utils/getPermutations';
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
    for (const loc of locations) {
      // Skip empty names
      if (!loc.name || loc.name.trim() === '') {
        continue;
      }

      if (loc.coords && loc.coords.lat && loc.coords.lng) {
        geocoded.push({ name: loc.name, coords: loc.coords });
      }
      // Skip locations without coords (already provided by Kakao search)
    }
    return geocoded;
  }, [locations]);

  const handleSearchResultSelect = useCallback((result) => {
    if (editingIndex === null) return;

    const locationName = result.title.replace(/<[^>]*>/g, '');

    // Robust coordinate validation
    const validateAndParseCoords = (x, y) => {
      if (!x || !y) return null;

      const xStr = String(x).trim();
      const yStr = String(y).trim();

      if (!xStr || !yStr || xStr === '' || yStr === '') return null;

      const lat = parseFloat(yStr);
      const lng = parseFloat(xStr);

      // Validate coordinate range (South Korea)
      if (isNaN(lat) || isNaN(lng)) return null;
      if (lat < 33 || lat > 39 || lng < 124 || lng > 132) return null;

      return { lat, lng };
    };

    const coords = validateAndParseCoords(result.x, result.y);

    updateLocation(editingIndex, {
      name: locationName,
      address: result.roadAddress || result.address || locationName,
      coords: coords || { lat: 37.5665, lng: 126.9780 } // Use default coords if none
    });

    setCurrentMode('list');
    setEditingIndex(null);
    clearSearch();

    // Remove search result markers after selection
    if (markersRef.current && mapInstance) {
      const remainingMarkers = [];
      markersRef.current.forEach((marker) => {
        if (marker && marker.getTitle) {
          const title = marker.getTitle();
          // Remove search result markers (numbered format)
          if (/^\d+\.\s/.test(title)) {
            if (marker.setMap) {
              marker.setMap(null);
            }
          } else {
            // Keep other markers
            remainingMarkers.push(marker);
          }
        } else if (marker) {
          // Keep markers without title
          remainingMarkers.push(marker);
        }
      });
      markersRef.current = remainingMarkers;
    }

    // Move map to selected location
    if (coords && mapInstance) {
      setTimeout(() => {
        mapInstance.setCenter(new window.kakao.maps.LatLng(coords.lat, coords.lng));
        mapInstance.setLevel(6);
      }, 100);
    }
  }, [editingIndex, updateLocation, setCurrentMode, setEditingIndex, clearSearch, markersRef, mapInstance]);

  const handleLocationClick = useCallback((index) => {
    setEditingIndex(index);
    setCurrentMode('search');
    clearSearch();
  }, [setEditingIndex, setCurrentMode, clearSearch]);

  const handleOptimizeRoute = useCallback(async () => {
    // Filter locations with valid coordinates
    const validLocations = geocodedLocations.filter(loc => {
      if (!loc.coords || !loc.coords.lat || !loc.coords.lng) return false;
      if (isNaN(loc.coords.lat) || isNaN(loc.coords.lng)) return false;
      // 한국 대략적 범위 검증
      if (loc.coords.lat < 32 || loc.coords.lat > 40) return false;
      if (loc.coords.lng < 123 || loc.coords.lng > 133) return false;
      return true;
    });

    if (validLocations.length < 2) {
      console.warn(`Need at least two valid locations. Currently: ${validLocations.length}`);
      alert('최소 2개의 유효한 위치가 필요합니다.');
      return;
    }

    // 12개 위치 제한 확인
    if (validLocations.length > 12) {
      alert(`위치가 너무 많습니다. 최대 12개까지 지원합니다. (현재: ${validLocations.length}개)`);
      return;
    }

    // Calculate expected API calls
    const waypointCount = validLocations.length - 2;
    let expectedApiCalls = 0;
    let method = '';

    if (waypointCount <= 0) {
      expectedApiCalls = 1;
      method = '직접 계산';
    } else if (waypointCount <= 3) {
      // Brute force: 모든 순열에 대해 API 호출 (3개 경유지까지만)
      const permutations = getPermutations(validLocations.slice(1, -1));
      expectedApiCalls = permutations.length;
      method = '완전 탐색';
    } else if (waypointCount <= 10) {
      // Branch and Bound: 거리 행렬 구축 + 최적 경로 1회
      expectedApiCalls = validLocations.length * (validLocations.length - 1) / 2 + 1;
      method = '분기 한정';
    }

    // Set optimization progress (only on client side)
    // Temporarily disabled due to prerendering issues
    // if (typeof window !== 'undefined') {
    //   setOptimizationProgress({
    //     current: 0,
    //     total: expectedApiCalls,
    //     message: `${method}으로 최적화 중... (예상 ${expectedApiCalls}회 API 호출)`
    //   });
    // }

    setIsOptimizing(true);

    try {
      // 진행률 콜백 함수 - onProgressUpdate 콜백 사용
      const onProgress = onProgressUpdate ? (current = 1, total = 1) => {
        if (typeof window !== 'undefined') {
          onProgressUpdate({
            current,
            total,
            message: `${method}으로 최적화 중... (${current}/${total} API 호출 완료)`
          });
        }
      } : null;

      // Use HybridOptimizer (minimize API calls)
      const result = await HybridOptimizer.optimize(validLocations, getDirections, onProgress);

      if (result) {
        const { optimizedLocations, routeData, optimizationMethod, apiCalls, iterations } = result;

        // Update locations with optimized order
        // 출발점과 도착점을 고정하고 중간 경유지만 재배열
        const startLocation = locations[0];
        const endLocation = locations[locations.length - 1];
        
        // 최적화 결과에서 중간 경유지만 추출 (첫 번째와 마지막은 무시)
        const optimizedWaypoints = optimizedLocations.slice(1, -1);
        
        // 새로운 locations 구성: [출발점, ...최적화된 경유지, 도착점]
        const newLocations = [startLocation, ...optimizedWaypoints, endLocation];
        
        // locations 업데이트
        updateLocations(newLocations);
        
        // geocodedLocations는 useAppState의 useEffect에서 자동으로 업데이트됨
        setDistanceMatrix(result.distanceMatrix);

        // Log results (console only)
        const totalMinutes = Math.round(routeData.totalTime / 60);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        const timeString = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

        const methodName = {
          'direct': 'Direct calculation',
          'brute_force': 'Brute force',
          '2-opt': '2-opt optimization',
          'heuristic': 'Heuristic optimization'
        }[optimizationMethod] || optimizationMethod;

      } else {
        console.error('Unable to calculate route. Check network connection and try again.');
      }
    } catch (error) {
      console.error('❌ Route optimization error:', error);
    } finally {
      setIsOptimizing(false);
      // Reset optimization progress
      if (onProgressUpdate) {
        onProgressUpdate({ current: 0, total: 0, message: '' });
      }
    }
  }, [geocodedLocations, locations, setOptimizedRoute, setIsOptimizing, setDistanceMatrix, updateLocations]);

  const handleShareRoute = useCallback(() => {
    const validLocations = geocodedLocations.filter(loc =>
      loc.coords && loc.coords.lat && loc.coords.lng &&
      !isNaN(loc.coords.lat) && !isNaN(loc.coords.lng)
    );

    if (validLocations.length < 2) {
      console.warn('Map sharing: Need at least two valid locations.');
      return;
    }

    // Show map selector modal
    // This will be handled in the component
  }, [geocodedLocations]);

  const handleMapSelect = useCallback((mapType) => {
    const validLocations = geocodedLocations.filter(loc =>
      loc.coords && loc.coords.lat && loc.coords.lng &&
      !isNaN(loc.coords.lat) && !isNaN(loc.coords.lng)
    );

    if (validLocations.length < 2) {
      console.warn('Map selection: Need at least two valid locations.');
      return;
    }

    // Use integrated map sharing function
    shareToMap(mapType, validLocations);
  }, [geocodedLocations]);

  const handleBackToList = useCallback(() => {
    setCurrentMode('list');
    setEditingIndex(null);
    clearSearch();

    // Remove search result markers on back
    if (markersRef.current && mapInstance) {
      const remainingMarkers = [];
      markersRef.current.forEach((marker) => {
        if (marker && marker.getTitle) {
          const title = marker.getTitle();
          // Remove search result markers (numbered format)
          if (/^\d+\.\s/.test(title)) {
            if (marker.setMap) {
              marker.setMap(null);
            }
          } else {
            // Keep other markers
            remainingMarkers.push(marker);
          }
        } else if (marker) {
          // Keep markers without title
          remainingMarkers.push(marker);
        }
      });
      markersRef.current = remainingMarkers;
    }

    // Redraw map (force refresh)
    if (mapInstance) {
      setTimeout(() => {
        if (mapInstance.relayout) {
          mapInstance.relayout();
        }
      }, 100);
    }
  }, [setCurrentMode, setEditingIndex, clearSearch, markersRef, mapInstance]);

  return {
    geocodeLocations,
    handleSearchResultSelect,
    handleLocationClick,
    handleOptimizeRoute,
    handleShareRoute,
    handleMapSelect,
    handleBackToList,
  };
};
