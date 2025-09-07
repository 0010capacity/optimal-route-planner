import { useState, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';

export const useFavorites = () => {
  const [favorites, setFavorites] = useLocalStorage('routeFavorites', []);

  const addToFavorites = useCallback((location) => {
    if (location?.name && !favorites.includes(location.name)) {
      setFavorites([...favorites, location.name]);
    }
  }, [favorites, setFavorites]);

  const removeFromFavorites = useCallback((locationName) => {
    setFavorites(favorites.filter(fav => fav !== locationName));
  }, [favorites, setFavorites]);

    const selectFromFavorites = useCallback((locationName, editingIndex, locations, updateLocation, setCurrentMode) => {
    if (editingIndex === null) return;

    updateLocation(editingIndex, {
      name: locationName,
      address: locationName,
      coords: null  // 좌표가 없으므로 Geocoding 필요
    });
    setCurrentMode('list');
  }, []);

  return {
    favorites,
    addToFavorites,
    removeFromFavorites,
    selectFromFavorites
  };
};
