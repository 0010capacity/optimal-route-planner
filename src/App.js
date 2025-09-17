import React, { useEffect, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import MapSection from './components/MapSection';
import { Icon } from './components/Icon';
import { useSearch } from './hooks/useSearch';
import { useMap } from './hooks/useMap';
import { useFavorites } from './hooks/useFavorites';
import { useMapMarkers } from './hooks/useMapMarkers';
import { useAppState } from './hooks/useAppState';
import { useRouteCalculation } from './hooks/useRouteCalculation';
import { useAppHandlers } from './hooks/useAppHandlers';
import { WebVitals } from './components/WebVitals';

// Dynamic imports for components to avoid SSR issues
const LocationList = dynamic(() => import('./components/LocationList'), {
  ssr: false,
  loading: () => <div>Loading...</div>
});

const SearchSection = dynamic(() => import('./components/SearchSection'), {
  ssr: false,
  loading: () => <div>Loading...</div>
});

function App() {
  const {
    currentMode,
    editingIndex,
    showFavorites,
    currentPage,
    showMapSelector,
    isOptimizing,
    locations,
    geocodedLocations,
    optimizedRoute,
    setCurrentMode,
    setEditingIndex,
    setShowFavorites,
    setCurrentPage,
    setShowMapSelector,
    setIsOptimizing,
    setGeocodedLocations,
    setOptimizedRoute,
    updateLocation,
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
  }, [memoizedGeocodedLocations, setGeocodedLocations]);

  // Use route calculation hook
  useRouteCalculation(memoizedGeocodedLocations, isOptimizing, setOptimizedRoute);

  // Use handlers hook
  const {
    handleSearchResultSelect,
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
    setCurrentMode,
    setEditingIndex,
    setOptimizedRoute,
    setIsOptimizing,
    markersRef,
    mapInstance,
    clearSearch
  );

  // Handle share route (show modal)
  const handleShareRouteWithModal = () => {
    handleShareRoute();
    setShowMapSelector(true);
  };

  // Handle map select and close modal
  const handleMapSelectAndClose = (mapType) => {
    handleMapSelect(mapType);
    setShowMapSelector(false);
  };

  const handleSelectFromFavorites = (locationName) => {
    selectFromFavorites(locationName, editingIndex, locations, updateLocation, setCurrentMode);
  };

  // Memoized items per page
  const itemsPerPage = 10;

  // Use map markers hook
  useMapMarkers(mapInstance, memoizedGeocodedLocations, userLocation, searchResults, optimizedRoute, markersRef, polylineRef, handleSearchResultSelect, moveMapToLocation, currentMode);

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
          onShareRoute={handleShareRouteWithModal}
        />
      ) : (
        <SearchSection
          searchQuery={searchQuery}
          searchResults={searchResults}
          loading={loading}
          favorites={favorites}
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
          onPageChange={setCurrentPage}
        />
      )}

      <MapSection
        mapRef={mapRef}
        onGetCurrentLocation={getCurrentLocation}
        isGettingLocation={isGettingLocation}
      />

      {/* 지도 선택 모달 */}
      {showMapSelector && (
        <div className="modal-overlay" onClick={() => setShowMapSelector(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>지도 선택</h3>
            <p>어떤 지도로 공유하시겠습니까?</p>
            <div className="modal-buttons">
              <button 
                className="modal-button naver-button"
                onClick={() => handleMapSelectAndClose('naver')}
              >
                <Icon name="map" size={20} />
                <span>네이버 지도</span>
              </button>
              <button 
                className="modal-button kakao-button"
                onClick={() => handleMapSelectAndClose('kakao')}
              >
                <Icon name="map" size={20} />
                <span>카카오맵</span>
              </button>
            </div>
            <button 
              className="modal-close"
              onClick={() => setShowMapSelector(false)}
            >
              <Icon name="close" size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-main">
            <div className="footer-brand">
              <h4>최적 경로 플래너 <span className="beta-badge">BETA</span></h4>
              <p>여러 장소를 효율적으로 방문할 수 있는 최적 경로를 자동으로 계산해주는 웹 애플리케이션입니다.</p>
              <div className="footer-brand-links">
                <a href="https://github.com/0010capacity/optimal-route-planner" target="_blank" rel="noopener noreferrer">
                  GitHub
                </a>
                <a href="mailto:0010capacity@gmail.com">
                  이메일
                </a>
              </div>
            </div>
          </div>
          
          <div className="footer-bottom">
            <div className="footer-license">
              <span>© 2025 최적 경로 플래너. MIT License.</span>
            </div>
            <div className="footer-version">
              <span>Version 0.3.0</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
