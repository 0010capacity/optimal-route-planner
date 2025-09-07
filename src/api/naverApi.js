const NAVER_CLIENT_ID = process.env.REACT_APP_NAVER_CLIENT_ID || 'your_naver_client_id_here';
const NAVER_CLIENT_SECRET = process.env.REACT_APP_NAVER_CLIENT_SECRET || 'your_naver_client_secret_here';

// Kakao SDK를 사용한 장소 검색 함수 (개선된 버전)
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

    console.log('🔍 Simplified Kakao SDK search options:', searchOptions);

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

// 두 지점 간 거리 계산 함수
const getDistance = (point1, point2) => {
  const R = 6371; // 지구 반지름 (km)
  const dLat = (point2.lat - point1.lat) * Math.PI / 180;
  const dLng = (point2.lng - point1.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export const geocodeAddress = async (address) => {
  if (!address) {
    console.log('No address provided to geocode');
    return null;
  }

  console.log('Geocoding address:', address);

  // Firebase Functions를 통한 Naver Geocoding API 호출
  try {
    const firebaseFunctionUrl = `https://us-central1-my-optimal-route-planner.cloudfunctions.net/geocodeAddress?address=${encodeURIComponent(address)}`;

    console.log('Calling Firebase Function for geocoding:', firebaseFunctionUrl);

    const response = await fetch(firebaseFunctionUrl);
    console.log('Firebase Function response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('Firebase Function geocoding response:', data);

      if (data.lat && data.lng) {
        console.log('Geocoded location via Firebase:', data);
        return { lat: data.lat, lng: data.lng };
      }
    }
  } catch (error) {
    console.error('Error with Firebase Function geocoding:', error);
  }

  // Return mock data as last resort
  console.log('Using mock data for geocoding');
  return { lat: 37.5665, lng: 126.9780 }; // Seoul coordinates
};

export const getDirections = async (coordsArray) => {
  if (!coordsArray || coordsArray.length < 2) {
    console.error('Directions API requires at least two coordinates (start and end).');
    return null;
  }

  console.log('Getting directions for coords:', coordsArray);

  // Firebase Functions를 통한 Naver Directions API 호출
  try {
    const firebaseFunctionUrl = `https://us-central1-my-optimal-route-planner.cloudfunctions.net/getDirections`;

    console.log('Calling Firebase Function for directions:', firebaseFunctionUrl);

    const response = await fetch(firebaseFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ coordsArray }),
    });

    console.log('Firebase Function response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('Firebase Function directions response:', data);

      if (data.path && data.totalTime && data.totalDistance) {
        console.log('Real directions received via Firebase:', data);
        return data;
      }
    }
  } catch (error) {
    console.error('Error with Firebase Function directions:', error);
  }

  // Fallback to mock data
  console.log('Using mock directions data');
  const mockPath = coordsArray.map((coord, index) => ({
    lat: coord.lat + (Math.random() - 0.5) * 0.01,
    lng: coord.lng + (Math.random() - 0.5) * 0.01,
  }));

  return {
    path: mockPath,
    totalTime: 1800, // 30 minutes
    totalDistance: 15000, // 15km
    order: coordsArray.map((coord, index) => `Point ${index + 1}`)
  };
};
