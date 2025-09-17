import { useLocalStorage } from './useLocalStorage';

const MAX_RECENT_SEARCHES = 5;

export const useRecentSearches = () => {
  const [recentSearches, setRecentSearches] = useLocalStorage('recentSearches', []);

  const addRecentSearch = (searchItem) => {
    if (!searchItem || !searchItem.query) return;

    // 중복 제거 및 최신 항목을 맨 앞으로 이동 (query 기준)
    const filtered = recentSearches.filter(item =>
      item.query !== searchItem.query
    );

    // 새 항목을 맨 앞에 추가
    const updated = [searchItem, ...filtered];

    // 최대 5개까지만 유지
    const limited = updated.slice(0, MAX_RECENT_SEARCHES);

    setRecentSearches(limited);
  };

  const removeRecentSearch = (searchItem) => {
    const filtered = recentSearches.filter(item =>
      item.query !== searchItem.query
    );
    setRecentSearches(filtered);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
  };

  return {
    recentSearches,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches
  };
};
