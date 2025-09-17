import React, { memo } from 'react';
import { Icon } from './Icon';

const SearchSection = memo(({
  searchQuery,
  searchResults,
  loading,
  favorites,
  recentSearches,
  showFavorites,
  currentPage,
  itemsPerPage,
  onSearchQueryChange,
  onBackToList,
  onSearchResultSelect,
  onToggleFavorites,
  onAddToFavorites,
  onRemoveFromFavorites,
  onSelectFromFavorites,
  onSelectFromRecent,
  onRemoveFromRecent,
  onPageChange
}) => {
  return (
    <>
      <div className="search-section">
        <div className="search-header">
          <button className="back-button" onClick={onBackToList} aria-label="목록으로 돌아가기">
            <Icon name="back" size={16} />
          </button>
          <button
            className={`favorites-toggle ${showFavorites ? 'active' : ''}`}
            onClick={onToggleFavorites}
            aria-label={showFavorites ? "즐겨찾기 숨기기" : "즐겨찾기 보기"}
          >
            <Icon name="star" size={16} />
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
                    <Icon name="location" size={14} />
                    {favorite}
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

        {recentSearches && recentSearches.length > 0 && (
          <div className="recent-searches-section" role="region" aria-label="최근 검색 목록">
            <h4>최근 검색</h4>
            <ul className="recent-searches-list" role="list">
              {recentSearches.map((recent, index) => (
                <li key={index} className="recent-search-item" role="listitem">
                  <span
                    onClick={() => onSelectFromRecent(recent)}
                    className="recent-search-text"
                    role="button"
                    tabIndex={0}
                    aria-label={`"${recent.query}" 검색`}
                  >
                    <Icon name="search" size={14} />
                    {recent.query}
                  </span>
                  <button
                    className="remove-recent-button"
                    onClick={() => onRemoveFromRecent(recent)}
                    title="최근 검색에서 제거"
                    aria-label={`"${recent.query}" 최근 검색에서 제거`}
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

          {loading && <p role="status" aria-live="polite" className="loading-status"><Icon name="search" size={16} /> 검색 중...</p>}

          {searchResults.length > 0 && (
            <>
              <ul className="search-results" role="listbox" aria-label="검색 결과">
                {searchResults
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((result, index) => {
                  const locationName = result.title.replace(/<[^>]*>/g, '');
                  const isFavorite = favorites.includes(locationName);
                  const resultNumber = (currentPage - 1) * itemsPerPage + index + 1;

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

              {/* 페이지네이션 컨트롤 */}
              {searchResults.length > itemsPerPage && (
                <div className="pagination-controls" role="navigation" aria-label="검색 결과 페이지네이션">
                  <button
                    className="pagination-button prev-button"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    aria-label="이전 페이지"
                  >
                    ‹
                  </button>

                  <span className="pagination-info" aria-live="polite">
                    {currentPage} / {Math.ceil(searchResults.length / itemsPerPage)}
                  </span>

                  <button
                    className="pagination-button next-button"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === Math.ceil(searchResults.length / itemsPerPage)}
                    aria-label="다음 페이지"
                  >
                    ›
                  </button>
                </div>
              )}
            </>
          )}

          {searchQuery && !loading && searchResults.length === 0 && (
            <p className="no-results" role="status" aria-live="polite">검색 결과가 없습니다. 다른 검색어로 시도해보세요.</p>
          )}
        </div>
      </div>
    </>
  );
});

export default SearchSection;
