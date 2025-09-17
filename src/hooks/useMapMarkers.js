import { useEffect, useCallback } from 'react';
import { getMarkerColor, getMarkerSymbol, createMarkerIcon, createUserLocationIcon, createSearchMarkerIcon } from '../utils/mapUtils';

export const useMapMarkers = (mapInstance, geocodedLocations, userLocation, searchResults, optimizedRoute, markersRef, polylineRef, handleSearchResultSelect, moveMapToLocation, currentMode) => {
  // Helper function to remove markers by condition
  const removeMarkers = useCallback((condition) => {
    const originalCount = markersRef.current.length;
    markersRef.current = markersRef.current.filter((marker, index) => {
      if (marker && condition(marker, index)) {
        if (marker.setMap) {
          marker.setMap(null);
        }
        return false;
      }
      return true;
    });
  }, []);

  // Helper function to clear all markers and polyline
  const clearAllMarkersAndPolyline = useCallback(() => {
    markersRef.current.forEach(marker => {
      if (marker && marker.setMap) {
        marker.setMap(null);
      }
    });
    markersRef.current = [];

    if (polylineRef.current && polylineRef.current.setMap) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }
  }, []);

  // Helper function to add waypoint markers
  const addWaypointMarkers = useCallback(() => {
    geocodedLocations.forEach((loc, index) => {
      if (!loc.coords || !loc.coords.lat || !loc.coords.lng) {
        return;
      }

      const markerColor = getMarkerColor(index, geocodedLocations.length);
      const markerSymbol = getMarkerSymbol(index, geocodedLocations.length);

      const marker = new window.kakao.maps.Marker({
        position: new window.kakao.maps.LatLng(loc.coords.lat, loc.coords.lng),
        map: mapInstance,
        title: loc.name,
        image: createMarkerIcon(markerColor, markerSymbol)
      });
      markersRef.current.push(marker);
    });
  }, [geocodedLocations, mapInstance]);  // Helper function to add user location marker
  const addUserLocationMarker = useCallback(() => {
    if (!userLocation) return;

    const userMarker = new window.kakao.maps.Marker({
      position: new window.kakao.maps.LatLng(userLocation.lat, userLocation.lng),
      map: mapInstance,
      title: "내 위치",
      image: createUserLocationIcon()
    });
    markersRef.current.push(userMarker);
  }, [userLocation, mapInstance]);

  // Helper function to display optimized route
  const displayOptimizedRoute = useCallback(() => {
    if (!optimizedRoute || !optimizedRoute.path || optimizedRoute.path.length === 0) return;

    const pathCoords = optimizedRoute.path.map(coord =>
      new window.kakao.maps.LatLng(coord.lat, coord.lng)
    );

    const polyline = new window.kakao.maps.Polyline({
      path: pathCoords,
      strokeColor: '#667eea',
      strokeWeight: 6,
      strokeOpacity: 0.9,
      strokeStyle: 'solid',
      map: mapInstance
    });

    polylineRef.current = polyline;

    // Adjust map bounds to show the route
    if (pathCoords.length > 0) {
      const bounds = new window.kakao.maps.LatLngBounds();
      pathCoords.forEach(coord => bounds.extend(coord));
      mapInstance.setBounds(bounds);
      setTimeout(() => {
        const level = mapInstance.getLevel();
        if (level > 3) {
          mapInstance.setLevel(level - 1);
        }
      }, 100);
    }
  }, [optimizedRoute, mapInstance]);

  // Main marker and route management (triggers on currentMode change)
  useEffect(() => {
    if (!mapInstance) return;

    if (currentMode === 'list') {
      // Remove search result markers only, keep geocoded locations
      removeMarkers((marker) => marker.getTitle && /^\d+\.\s/.test(marker.getTitle()));

      // Add waypoint markers for geocoded locations
      addWaypointMarkers();

      // Add user location marker
      addUserLocationMarker();

      // Display optimized route
      displayOptimizedRoute();

      return;
    }

    // Search mode: Clear all and rebuild
    clearAllMarkersAndPolyline();

    // Add waypoint markers
    addWaypointMarkers();

    // Add user location marker
    addUserLocationMarker();

    // Display optimized route
    displayOptimizedRoute();
  }, [mapInstance, geocodedLocations, userLocation, optimizedRoute, currentMode, removeMarkers, clearAllMarkersAndPolyline, addWaypointMarkers, addUserLocationMarker, displayOptimizedRoute]);

  // Search result markers management (triggers on searchResults change)
  useEffect(() => {
    if (!mapInstance || currentMode !== 'search') return;

    // Check if search results have actually changed
    const currentSearchTitles = searchResults?.map(r => r.title).join(',') || '';
    const existingSearchTitles = markersRef.current
      .filter(marker => marker.getTitle && /^\d+\.\s/.test(marker.getTitle()))
      .map(marker => marker.getTitle().replace(/^\d+\.\s/, ''))
      .join(',');

    // If search results haven't changed, don't recreate markers
    if (currentSearchTitles === existingSearchTitles && searchResults?.length > 0) {
      return;
    }

    // Remove existing search result markers
    removeMarkers((marker) => marker.getTitle && /^\d+\.\s/.test(marker.getTitle()));

    if (searchResults && searchResults.length > 0) {
      // Move map to first result
      const firstResult = searchResults[0];
      if (firstResult && firstResult.y && firstResult.x) {
        const firstResultCoords = {
          lat: parseFloat(firstResult.y),
          lng: parseFloat(firstResult.x)
        };
        mapInstance.setCenter(new window.kakao.maps.LatLng(firstResultCoords.lat, firstResultCoords.lng));
        mapInstance.setLevel(4);
      }

      // Add search result markers (limit to 10)
      searchResults.slice(0, 10).forEach((result, index) => {
        if (!result.y || !result.x) return;

        const resultCoords = {
          lat: parseFloat(result.y),
          lng: parseFloat(result.x)
        };
        const locationName = result.title.replace(/<[^>]*>/g, '');

        const searchMarker = new window.kakao.maps.Marker({
          position: new window.kakao.maps.LatLng(resultCoords.lat, resultCoords.lng),
          map: mapInstance,
          title: `${index + 1}. ${locationName}`,
          image: createSearchMarkerIcon(index + 1)
        });

        window.kakao.maps.event.addListener(searchMarker, 'click', () => {
          handleSearchResultSelect(result);
          moveMapToLocation(resultCoords);
        });

        markersRef.current.push(searchMarker);
      });
    }
  }, [searchResults, mapInstance, currentMode, handleSearchResultSelect, moveMapToLocation, removeMarkers]);
};
