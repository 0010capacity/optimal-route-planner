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

    console.log('✅ Kakao SDK v2 is available, proceeding with search');

    const places = new window.kakao.maps.services.Places();

    // 간소화된 검색 옵션 설정 (location 우선)
    const searchOptions = {
      // 결과 개수 (기본 15)
      size: options.size || 15,

      // 페이지 (기본 1)
      page: options.page || 1,

      // 정렬 옵션 (기본 정확도 순)
      sort: options.sort || window.kakao.maps.services.SortBy.ACCURACY,
    };

    // 중심 좌표 설정 (location만 사용)
    if (options.location) {
      // location: LatLng 객체 또는 "위도,경도" 문자열
      if (options.location instanceof window.kakao.maps.LatLng) {
        searchOptions.location = options.location;
      } else if (typeof options.location === 'string') {
        const [lat, lng] = options.location.split(',').map(coord => parseFloat(coord.trim()));
        searchOptions.location = new window.kakao.maps.LatLng(lat, lng);
      }
      console.log('📍 Using location-based search:', searchOptions.location);
    }

    console.log('🔍 Kakao SDK search options:', searchOptions);

    // 키워드 검색 실행
    places.keywordSearch(query, (data, status, pagination) => {
      console.log('📋 Kakao SDK search status:', status);
      console.log('📊 Kakao SDK search pagination:', pagination);

      if (status === window.kakao.maps.services.Status.OK) {
        const results = data.map(item => ({
          title: item.place_name,
          category: item.category_name || "장소",
          telephone: item.phone || "",
          address: item.address_name || "",
          roadAddress: item.road_address_name || item.address_name || "",
          mapx: item.x || "",
          mapy: item.y || "",
          place_url: item.place_url || "",
          distance: item.distance || "",
        }));

        console.log('✅ Kakao SDK search successful, results:', results.length);
        resolve({
          results,
          pagination: {
            totalCount: pagination.totalCount,
            hasNextPage: pagination.hasNextPage,
            hasPrevPage: pagination.hasPrevPage,
            current: pagination.current,
          }
        });
      } else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
        console.log('⚠️ Kakao SDK search: No results found');
        resolve({ results: [], pagination: null });
      } else {
        console.error('❌ Kakao SDK search failed:', status);
        reject(new Error(`Search failed: ${status}`));
      }
    }, searchOptions);
  });
};
