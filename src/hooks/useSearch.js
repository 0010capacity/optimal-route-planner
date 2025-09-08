import { useState, useEffect, useRef, useCallback } from 'react';
import { searchPlaces } from '../api/kakaoApi';

const DEBOUNCE_DELAY = 500;

export const useSearch = (currentMode, mapCenter) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceTimeoutRef = useRef(null);

  const DEFAULT_CENTER = { lat: 37.5665, lng: 126.9780 };

  // 거리 계산 유틸리티
  const calculateDistance = (point1, point2) => {
    const R = 6371;
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // 검색 로직
  useEffect(() => {
    if (currentMode !== 'search') return;

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (searchQuery.trim() === '') {
      setSearchResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        const validCenter = mapCenter && typeof mapCenter.lat === 'number' && typeof mapCenter.lng === 'number'
          ? mapCenter
          : DEFAULT_CENTER;

        const searchResponse = await searchPlaces(searchQuery, { location: validCenter });
        const results = searchResponse.results || [];

        // 거리순 정렬 (여러 페이지 결과 모두 사용)
        const sortedResults = results
          .map(result => ({
            ...result,
            distance: calculateDistance(validCenter, {
              lat: parseFloat(result.y),
              lng: parseFloat(result.x)
            })
          }))
          .sort((a, b) => a.distance - b.distance);

        setSearchResults(sortedResults);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_DELAY);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchQuery, currentMode, mapCenter]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setLoading(false);
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    loading,
    clearSearch
  };
};
