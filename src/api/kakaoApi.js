// Kakao Maps SDK 관련 API 함수들
// 장소 검색, 지도 관련 기능

// 검색 의도 분석 함수
const analyzeSearchIntent = (query) => {
  const intent = {
    isSpecificPlace: false,
    isCategory: false,
    priority: 'accuracy' // accuracy | distance | popularity
  };

  const trimmedQuery = query.trim();

  // 특정 장소 패턴 (역, 터미널, 공항, 학교, 병원 등)
  if (/역$|터미널$|공항$|대학교$|병원$|센터$|아파트$|빌딩$|호텔$|모텔$|마트$|백화점$|쇼핑몰$/.test(trimmedQuery)) {
    intent.isSpecificPlace = true;
    intent.priority = 'accuracy';
  }

  // 카테고리 검색 패턴 (카페, 음식점, 은행 등)
  if (/카페$|음식점$|식당$|은행$|약국$|편의점$|주유소$|주차장$|화장실$|ATM$/.test(trimmedQuery)) {
    intent.isCategory = true;
    intent.priority = 'distance';
  }

  // 주소 검색 패턴 (도로명, 동/읍/면)
  if (/로$|길$|동$|읍$|면$|리$|구$|시$|도$/.test(trimmedQuery)) {
    intent.isSpecificPlace = true;
    intent.priority = 'accuracy';
  }

  return intent;
};

// 검색 옵션 결정 함수
const getSearchOptions = (query, options, page) => {
  const intent = analyzeSearchIntent(query);
  const searchOptions = {
    size: 15, // 최대 15개
    page: page,
  };

  // 의도에 따른 옵션 설정
  if (intent.priority === 'distance' && options.location) {
    // 카테고리 검색: 거리 우선 (location 지정)
    if (options.location instanceof window.kakao.maps.LatLng) {
      searchOptions.location = options.location;
    } else if (typeof options.location === 'string') {
      const [lat, lng] = options.location.split(',').map(coord => parseFloat(coord.trim()));
      searchOptions.location = new window.kakao.maps.LatLng(lat, lng);
    }
  }
  // 특정 장소나 주소 검색: 정확도 우선 (location 미지정)

  return searchOptions;
};

// 검색 결과 재정렬 함수
const reorderSearchResults = (results, query) => {
  const trimmedQuery = query.trim();

  // 검색 의도 분석
  const intent = analyzeSearchIntent(query);

  console.log('🔍 검색 분석 결과:', {
    query: trimmedQuery,
    intent: intent,
    isSpecificPlace: intent.isSpecificPlace,
    resultsCount: results.length
  });

  // 특정 장소 검색인 경우에만 재정렬 적용
  if (!intent.isSpecificPlace) {
    console.log('🚫 특정 장소 검색이 아니므로 재정렬 생략');
    return results;
  }

  console.log('✅ 특정 장소 검색으로 재정렬 시작');

  const exactMatches = [];
  const startsWithMatches = [];
  const otherMatches = [];

  results.forEach((result, index) => {
    const title = result.title.toLowerCase();
    const searchQuery = trimmedQuery.toLowerCase();

    console.log(`📋 결과 ${index + 1}: "${result.title}" (검색어: "${searchQuery}")`);

    if (title === searchQuery) {
      // 정확히 일치하는 경우 (최우선)
      console.log('🎯 정확히 일치:', result.title);
      exactMatches.push(result);
    } else if (title.startsWith(searchQuery)) {
      // 검색어로 시작하는 경우 (중우선)
      console.log('🔸 시작 일치:', result.title);
      startsWithMatches.push(result);
    } else {
      // 그 외 경우
      console.log('➖ 기타:', result.title);
      otherMatches.push(result);
    }
  });

  const reorderedResults = [...exactMatches, ...startsWithMatches, ...otherMatches];

  console.log('📊 재정렬 결과:', {
    원본: results.length,
    정확일치: exactMatches.length,
    시작일치: startsWithMatches.length,
    기타: otherMatches.length,
    최종: reorderedResults.length
  });

  // 재정렬된 결과 반환
  return reorderedResults;
};

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
    const totalPages = Math.min(options.totalPages || 2, 3); // 최대 3페이지 (45개 결과)
    let allResults = [];
    let completedRequests = 0;

    const searchPage = (page) => {
      const searchOptions = getSearchOptions(query, options, page);

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
            // 검색 결과 재정렬 적용
            const reorderedResults = reorderSearchResults(allResults, query);

            resolve({
              results: reorderedResults,
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
