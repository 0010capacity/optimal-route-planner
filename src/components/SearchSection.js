import React from 'react';

const SearchSection = ({
  searchQuery,
  searchResults,
  loading,
  favorites,
  showFavorites,
  onSearchQueryChange,
  onBackToList,
  onSearchResultSelect,
  onToggleFavorites,
  onAddToFavorites,
  onRemoveFromFavorites,
  onSelectFromFavorites
}) => {
  return (
    <>
      <div className="search-section">
        <div className="search-header">
          <button className="back-button" onClick={onBackToList} aria-label="목록으로 돌아가기">
            ← 뒤로가기
          </button>
          <button
            className={`favorites-toggle ${showFavorites ? 'active' : ''}`}
            onClick={onToggleFavorites}
            aria-label={showFavorites ? "즐겨찾기 숨기기" : "즐겨찾기 보기"}
          >
            {showFavorites ? '⭐ 즐겨찾기 숨기기' : '☆ 즐겨찾기 보기'}
          </button>
        </div>

        {showFavorites && favorites.length > 0 && (
          <div className="favorites-section" role="region" aria-label="즐겨찾기 목록">
            <h4>즐겨찾기</h4>
            <ul className="favorites-list" role="list">
              {favorites.map((favorite, index) => (
                <li key={index} className="favorite-item" role="listitem">
                  <span
                    onClick={() => onSelectFromFavorites(favorite)}
                    className="favorite-text"
                    role="button"
                    tabIndex={0}
                    aria-label={`${favorite} 선택`}
                  >
                    📍 {favorite}
                  </span>
                  <button
                    className="remove-favorite-button"
                    onClick={() => onRemoveFromFavorites(favorite)}
                    title="즐겨찾기에서 제거"
                    aria-label={`${favorite} 즐겨찾기에서 제거`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="search-input-section">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="장소를 검색하세요"
            autoFocus
            aria-label="장소 검색"
            role="searchbox"
          />

          {loading && <p role="status" aria-live="polite">🔍 검색 중...</p>}

          {searchResults.length > 0 && (
            <ul className="search-results" role="listbox" aria-label="검색 결과">
              {searchResults.slice(0, 10).map((result, index) => {
                const locationName = result.title.replace(/<[^>]*>/g, '');
                const isFavorite = favorites.includes(locationName);
                const resultNumber = index + 1;

                return (
                  <li key={index} className="search-result-item" role="option">
                    <span className="result-number" aria-hidden="true">{resultNumber}</span>
                    <span
                      onClick={() => onSearchResultSelect(result)}
                      className="search-result-text"
                      role="button"
                      tabIndex={0}
                      aria-label={`${resultNumber}. ${locationName} 선택`}
                    >
                      {locationName}
                    </span>
                    <button
                      className={`favorite-button ${isFavorite ? 'favorited' : ''}`}
                      onClick={() => isFavorite ? onRemoveFromFavorites(locationName) : onAddToFavorites({ name: locationName, address: result.roadAddress || result.address || locationName })}
                      aria-label={isFavorite ? `${locationName} 즐겨찾기에서 제거` : `${locationName} 즐겨찾기에 추가`}
                      title={isFavorite ? '즐겨찾기에서 제거' : '즐겨찾기에 추가'}
                    >
                      {isFavorite ? '★' : '☆'}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {searchQuery && !loading && searchResults.length === 0 && (
            <p className="no-results" role="status" aria-live="polite">❌ 검색 결과가 없습니다. 다른 검색어로 시도해보세요.</p>
          )}
        </div>
      </div>
    </>
  );
};

export default SearchSection;
