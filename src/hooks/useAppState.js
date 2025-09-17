import { useState, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';

export const useAppState = () => {
  const [currentMode, setCurrentMode] = useState('list');
  const [editingIndex, setEditingIndex] = useState(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showMapSelector, setShowMapSelector] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // LocalStorage for locations
  const [storedLocations, setStoredLocations] = useLocalStorage('routeLocations', []);

  // Initialize locations from localStorage or default
  const [locations, setLocations] = useState(() => {
    if (storedLocations && Array.isArray(storedLocations) && storedLocations.length >= 2) {
      return storedLocations;
    }
    return [
      { name: '', address: '', coords: null },
      { name: '', address: '', coords: null }
    ];
  });

  const [geocodedLocations, setGeocodedLocations] = useState([]);
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [distanceMatrix, setDistanceMatrix] = useState(null);

  // Update locations and sync to localStorage
  const updateLocations = useCallback((newLocations) => {
    setLocations(newLocations);
    setStoredLocations(newLocations);
  }, [setStoredLocations]);

  const updateLocation = useCallback((index, location) => {
    const newLocations = [...locations];
    newLocations[index] = location;
    updateLocations(newLocations);
  }, [locations, updateLocations]);

  const addLocation = useCallback(() => {
    updateLocations([...locations, { name: '', address: '', coords: null }]);
  }, [locations, updateLocations]);

  const deleteLocation = useCallback((index) => {
    const newLocations = locations.filter((_, i) => i !== index);
    updateLocations(newLocations);
  }, [locations, updateLocations]);

  const reorderLocations = useCallback((newLocations) => {
    updateLocations(newLocations);
    setOptimizedRoute(null); // Reset optimized route when order changes
  }, [updateLocations]);

  return {
    // State
    currentMode,
    editingIndex,
    showFavorites,
    currentPage,
    showMapSelector,
    isOptimizing,
    locations,
    geocodedLocations,
    optimizedRoute,
    distanceMatrix,

    // Setters
    setCurrentMode,
    setEditingIndex,
    setShowFavorites,
    setCurrentPage,
    setShowMapSelector,
    setIsOptimizing,
    setGeocodedLocations,
    setOptimizedRoute,
    setDistanceMatrix,

    // Actions
    updateLocation,
    updateLocations,
    addLocation,
    deleteLocation,
    reorderLocations,
  };
};
