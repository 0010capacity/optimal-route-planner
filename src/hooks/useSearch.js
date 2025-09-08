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

        // 중복 제거 (title + address 기준)
        const uniqueResults = results.filter((result, index, self) => {
          const key = `${result.title}_${result.address}`;
          return self.findIndex(r => `${r.title}_${r.address}` === key) === index;
        });

        console.log(`🔄 중복 제거: ${results.length} → ${uniqueResults.length}`);

        // 검색 의도에 따른 정렬 적용
        const isSpecificPlaceQuery = (query) => {
          const placePatterns = [
            /역$/, /터미널$/, /공항$/, /대학교$/, /병원$/, /센터$/, /아파트$/, /빌딩$/, /호텔$/, /모텔$/, /마트$/, /백화점$/, /쇼핑몰$/,
            /로$/, /길$/, /동$/, /읍$/, /면$/, /리$/, /구$/, /시$/, /도$/
          ];
          return placePatterns.some(pattern => pattern.test(query.trim()));
        };

        let finalResults;
        if (isSpecificPlaceQuery(searchQuery)) {
          // 특정 장소 검색: API에서 재정렬된 결과 그대로 사용
          console.log('🎯 특정 장소 검색: 재정렬된 결과 사용');
          finalResults = uniqueResults;
        } else {
          // 카테고리 검색: 거리순 정렬 적용
          console.log('📍 카테고리 검색: 거리순 정렬 적용');
          finalResults = uniqueResults
            .map(result => ({
              ...result,
              distance: calculateDistance(validCenter, {
                lat: parseFloat(result.y),
                lng: parseFloat(result.x)
              })
            }))
            .sort((a, b) => a.distance - b.distance);
        }

        setSearchResults(finalResults);
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
