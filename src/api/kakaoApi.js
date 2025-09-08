// Kakao Maps SDK 관련 API 함수들
// 장소 검색, 지도 관련 기능

// Kakao SDK를 사용한 장소 검색 함수
export const searchPlaces = (query, options = {}) => {
  return new Promise((resolve, reject) => {
    if (!query) {
      console.warn('Query is required for searchPlaces');
      resolve([]);
      return;
    }

    // Kakao SDK v2 확인
    if (!window.kakao || !window.kakao.maps || !window.kakao.maps.services) {
      console.error('❌ Kakao SDK v2 not available');
      resolve([]);
      return;
    }

    const places = new window.kakao.maps.services.Places();

    // Kakao API 제한: size 최대 15, 여러 페이지 호출로 해결
    const maxSizePerPage = 15;
    const totalPages = Math.min(options.totalPages || 2, 3); // 최대 3페이지 (45개 결과)
    let allResults = [];
    let completedRequests = 0;

    const searchPage = (page) => {
      const searchOptions = {
        size: maxSizePerPage,
        page: page,
      };

      // 중심 좌표 설정
      if (options.location) {
        if (options.location instanceof window.kakao.maps.LatLng) {
          searchOptions.location = options.location;
        } else if (typeof options.location === 'string') {
          const [lat, lng] = options.location.split(',').map(coord => parseFloat(coord.trim()));
          searchOptions.location = new window.kakao.maps.LatLng(lat, lng);
        }
      }

      places.keywordSearch(query, (data, status, pagination) => {
        if (status === window.kakao.maps.services.Status.OK) {
          const pageResults = data.map(item => ({
            title: item.place_name,
            category: item.category_name || "장소",
            telephone: item.phone || "",
            address: item.address_name || "",
            roadAddress: item.road_address_name || item.address_name || "",
            x: item.x || "",
            y: item.y || "",
            place_url: item.place_url || "",
            distance: item.distance || "",
          }));

          allResults = [...allResults, ...pageResults];
          completedRequests++;

          // 모든 페이지 요청 완료 시 결과 반환
          if (completedRequests === totalPages) {
            resolve({
              results: allResults,
              pagination: {
                totalCount: pagination.totalCount,
                hasNextPage: pagination.hasNextPage,
                hasPrevPage: pagination.hasPrevPage,
                current: pagination.current,
              }
            });
          }
        } else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
          completedRequests++;
          if (completedRequests === totalPages) {
            resolve({
              results: allResults,
              pagination: null
            });
          }
        } else {
          console.error(`❌ Kakao SDK search failed on page ${page}:`, status);
          completedRequests++;
          if (completedRequests === totalPages) {
            if (allResults.length > 0) {
              resolve({
                results: allResults,
                pagination: null
              });
            } else {
              reject(new Error(`Search failed: ${status}`));
            }
          }
        }
      }, searchOptions);
    };

    // 여러 페이지 요청 시작
    for (let page = 1; page <= totalPages; page++) {
      searchPage(page);
    }
  });
};
