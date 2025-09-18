import React, { useEffect, useRef, useMemo, useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import { Icon } from './components/Icon';
import { useSearch } from './hooks/useSearch';
import { useMap } from './hooks/useMap';
import { useFavorites } from './hooks/useFavorites';
import { useRecentSearches } from './hooks/useRecentSearches';
import { useMapMarkers } from './hooks/useMapMarkers';
import { useAppState } from './hooks/useAppState';
import { useRouteCalculation } from './hooks/useRouteCalculation';
import { useAppHandlers } from './hooks/useAppHandlers';
import { WebVitals } from './components/WebVitals';
import ToastContainer from './components/Toast';

// Dynamic imports for components to avoid SSR issues and enable code splitting
const LocationList = dynamic(() => import('./components/LocationList'), {
  ssr: false,
  loading: () => <div>Loading...</div>
});

const SearchSection = dynamic(() => import('./components/SearchSection'), {
  ssr: false,
  loading: () => <div>Loading...</div>
});

const MapSection = dynamic(() => import('./components/MapSection'), {
  ssr: false,
  loading: () => <div>Loading...</div>
});

const MapSelectorModal = dynamic(() => import('./components/MapSelectorModal'), {
  ssr: false,
  loading: () => <div>Loading...</div>
});

const Footer = dynamic(() => import('./components/Footer'), {
  ssr: false,
  loading: () => <div>Loading...</div>
});

const PatchNotesModal = dynamic(() => import('./components/PatchNotesModal'), {
  ssr: false,
  loading: () => null
});

function App() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // 패치노트 훅 사용
  const {
    showPatchNotes,
    openPatchNotes,
    closePatchNotes
  } = usePatchNotes();

  const {
    currentMode,
    editingIndex,
    showFavorites,
    currentPage,
    showMapSelector,
    isOptimizing,
    optimizationProgress,
    locations,
    geocodedLocations,
    optimizedRoute,
    distanceMatrix,
    setCurrentMode,
    setEditingIndex,
    setShowFavorites,
    setCurrentPage,
    setShowMapSelector,
    setIsOptimizing,
    setOptimizationProgress,
    setGeocodedLocations,
    setOptimizedRoute,
    setDistanceMatrix,
    updateLocation,
    updateLocations,
    addLocation,
    deleteLocation,
    reorderLocations,
  } = useAppState();

  const mapRef = useRef(null);

  const {
    mapCenter,
    userLocation,
    mapInstance,
    markersRef,
    polylineRef,
    moveMapToLocation,
    getCurrentLocation,
    isGettingLocation
  } = useMap(() => mapRef.current);

  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    loading,
    clearSearch
  } = useSearch(currentMode, mapCenter);

  // Reset page when search query changes
  useEffect(() => {
    if (searchQuery) {
      setCurrentPage(1);
    }
  }, [searchQuery, setCurrentPage]);

  const {
    favorites,
    addToFavorites,
    removeFromFavorites,
    selectFromFavorites
  } = useFavorites();

  const {
    recentSearches,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches
  } = useRecentSearches();

  // Memoized geocoded locations
  const memoizedGeocodedLocations = useMemo(() => {
    return locations
      .filter(loc => loc.name && loc.name.trim() !== '')
      .map(loc => ({
        name: loc.name,
        coords: loc.coords
      }))
      .filter(loc => loc.coords && loc.coords.lat && loc.coords.lng);
  }, [locations]);

  // Update geocoded locations state
  useEffect(() => {
    setGeocodedLocations(memoizedGeocodedLocations);
    // 경유지가 변경되면 최적화된 경로를 리셋 (수동 변경시에만)
    if (!isOptimizing) {
      setOptimizedRoute(null);
    }
  }, [memoizedGeocodedLocations, setGeocodedLocations, setOptimizedRoute, isOptimizing]);

  // Use route calculation hook - only when no optimized route exists
  useRouteCalculation(memoizedGeocodedLocations, isOptimizing, setOptimizedRoute, optimizedRoute);

    // Use handlers hook
  const {
    geocodeLocations,
    handleSearchResultSelect: baseHandleSearchResultSelect,
    handleLocationClick,
    handleOptimizeRoute,
    handleShareRoute,
    handleMapSelect,
    handleBackToList,
  } = useAppHandlers(
    editingIndex,
    locations,
    memoizedGeocodedLocations,
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
    (progress) => setOptimizationProgress(progress),
    addToast
  );

  // Override handleSearchResultSelect to add recent search functionality
  const handleSearchResultSelect = useCallback((result) => {
    // Add current search query to recent searches (not the location name)
    if (searchQuery.trim()) {
      addRecentSearch({
        query: searchQuery.trim(),
        selectedLocation: result.title.replace(/<[^>]*>/g, ''),
        address: result.roadAddress || result.address || ''
      });
    }

    // Call the base handler
    baseHandleSearchResultSelect(result);
  }, [searchQuery, addRecentSearch, baseHandleSearchResultSelect]);

  // Handle share route (show modal)
  const handleShareRouteWithModal = () => {
    handleShareRoute();
    setShowMapSelector(true);
  };

  const handleSelectFromFavorites = useCallback((locationName) => {
    setSearchQuery(locationName);
    setCurrentPage(1); // Reset to first page
  }, [setSearchQuery, setCurrentPage]);

  // Handle selecting from recent searches - set search query instead of direct selection
  const handleSelectFromRecent = useCallback((recentItem) => {
    setSearchQuery(recentItem.query);
    setCurrentPage(1); // Reset to first page
  }, [setSearchQuery, setCurrentPage]);

  // Memoized items per page
  const itemsPerPage = 10;

  // Use map markers hook
  useMapMarkers(mapInstance, memoizedGeocodedLocations, userLocation, searchResults, optimizedRoute, markersRef, polylineRef, handleSearchResultSelect, moveMapToLocation, currentMode, isOptimizing);

  return (
    <div className="App">
      <WebVitals />
      {currentMode === 'list' ? (
        <LocationList
          locations={locations}
          optimizedRoute={optimizedRoute}
          onLocationClick={handleLocationClick}
          onAddLocation={addLocation}
          onOptimizeRoute={handleOptimizeRoute}
          onReorderLocations={reorderLocations}
          onDeleteLocation={deleteLocation}
          isOptimizing={isOptimizing}
          optimizationProgress={optimizationProgress}
          onShareRoute={handleShareRouteWithModal}
          distanceMatrix={distanceMatrix}
          geocodedLocations={memoizedGeocodedLocations}
        />
      ) : (
        <SearchSection
          searchQuery={searchQuery}
          searchResults={searchResults}
          loading={loading}
          favorites={favorites}
          recentSearches={recentSearches}
          showFavorites={showFavorites}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          onSearchQueryChange={setSearchQuery}
          onBackToList={handleBackToList}
          onSearchResultSelect={handleSearchResultSelect}
          onToggleFavorites={() => setShowFavorites(!showFavorites)}
          onAddToFavorites={addToFavorites}
          onRemoveFromFavorites={removeFromFavorites}
          onSelectFromFavorites={handleSelectFromFavorites}
          onSelectFromRecent={handleSelectFromRecent}
          onRemoveFromRecent={removeRecentSearch}
          onPageChange={setCurrentPage}
        />
      )}

      <MapSection
        mapRef={mapRef}
        onGetCurrentLocation={getCurrentLocation}
        isGettingLocation={isGettingLocation}
      />

      <MapSelectorModal
        showMapSelector={showMapSelector}
        onClose={() => setShowMapSelector(false)}
        onMapSelect={handleMapSelect}
      />

      <Footer onPatchNotesClick={openPatchNotes} />

      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <PatchNotesModal
        isOpen={showPatchNotes}
        onClose={closePatchNotes}
      />
    </div>
  );
}

export default App;