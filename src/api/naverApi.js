const NAVER_CLIENT_ID = process.env.REACT_APP_NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.REACT_APP_NAVER_CLIENT_SECRET;

// Google Places API를 사용한 장소 검색 (클라이언트 사이드)
export const searchPlaces = async (query, centerLocation = null) => {
  console.log('searchPlaces called with centerLocation:', centerLocation);
  if (!query) {
    return [];
  }

  try {
    // Google Maps API가 로드될 때까지 대기
    let attempts = 0;
    while (!window.google || !window.google.maps || !window.google.maps.importLibrary || !window.googleMapsLoaded) {
      if (attempts > 100) { // 10초 타임아웃
        console.warn('Google Maps API loading timeout');
        return [];
      }
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    const { Place } = await window.google.maps.importLibrary("places");
    
    const request = {
      textQuery: query,
      fields: ['displayName', 'formattedAddress', 'location', 'id', 'types', 'businessStatus'],
      maxResultCount: 10,
    };

        // 지도 중심 좌표가 제공되면 locationBias 추가
    if (centerLocation && typeof centerLocation.lat === 'number' && typeof centerLocation.lng === 'number') {
      console.log('Center location provided but skipping locationBias for now:', centerLocation);
      // 임시로 locationBias 제거하여 기본 검색 테스트
      // Google Places API v3의 locationBias 형식이 아직 호환되지 않음
      // request.locationBias = {
      //   circle: {
      //     center: { lat: centerLocation.lat, lng: centerLocation.lng },
      //     radius: 5000, // 5km 반경
      //   },
      // };
    } else {
      console.log('Skipping locationBias - invalid centerLocation:', centerLocation);
    }

    const { places } = await Place.searchByText(request);

    console.log('Places API response:', places); // 디버깅용

    if (places && places.length > 0) {
      return places.map((place, index) => {
        // 다양한 이름 필드 확인
        const displayName = place.displayName?.text || place.displayName;
        const name = place.name;
        const fullAddress = place.formattedAddress || '';
        
        console.log(`Place ${index} details:`, {
          displayName,
          name,
          fullAddress,
          types: place.types,
          raw: place
        });
        
        let title;
        if (displayName) {
          title = displayName;
        } else if (name) {
          title = name;
        } else {
          // 검색어 + 간단한 주소 조합
          const cleanAddress = fullAddress.replace(/^대한민국\s*/, '');
          const addressParts = cleanAddress.split(' ');
          
          if (addressParts.length >= 2) {
            title = `${query} (${addressParts[0]} ${addressParts[1]})`;
          } else {
            title = `${query} (${cleanAddress})`;
          }
        }
        
        return {
          title: title,
          category: "장소",
          telephone: "",
          address: fullAddress,
          roadAddress: fullAddress,
          mapx: (place.location?.lng * 10000000).toString(),
          mapy: (place.location?.lat * 10000000).toString(),
        };
      });
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching from Google Places API:', error);
    return [];
  }
};

export const geocodeAddress = async (address) => {
  if (!address) {
    return null;
  }

  const url = `https://us-central1-my-optimal-route-planner.cloudfunctions.net/geocodeAddress?address=${encodeURIComponent(address)}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.addresses && data.addresses.length > 0) {
      const { x, y } = data.addresses[0];
      return { lat: parseFloat(y), lng: parseFloat(x) };
    }
    return null;
  } catch (error) {
    console.error('Error fetching from Geocoding API:', error);
    return null;
  }
};

export const getDirections = async (coordsArray) => {
  if (!coordsArray || coordsArray.length < 2) {
    console.error('Directions API requires at least two coordinates (start and end).');
    return null;
  }

  const start = `${coordsArray[0].lng},${coordsArray[0].lat}`;
  const goal = `${coordsArray[coordsArray.length - 1].lng},${coordsArray[coordsArray.length - 1].lat}`;
  const waypoints = coordsArray.slice(1, coordsArray.length - 1).map(coord => `${coord.lng},${coord.lat}`).join('|');

  let url = `https://naveropenapi.apigw.ntruss.com/map-direction/v1/driving?start=${start}&goal=${goal}`;
  if (waypoints) {
    url += `&waypoints=${waypoints}`;
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-NCP-APIGW-API-KEY-ID': NAVER_CLIENT_ID,
        'X-NCP-APIGW-API-KEY': NAVER_CLIENT_SECRET,
      },
    });

    if (!response.ok) {
      throw new Error(`Naver Directions API error: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.code === 0 && data.routes && data.routes.length > 0) {
      // Assuming the first route is the primary one
      const route = data.routes[0];
      // const path = route.summary.bbox.map(bbox => ({ lat: bbox[1], lng: bbox[0] })); // This is a simplified path, actual path is in `guide` or `legs`
      const totalTime = route.summary.duration; // in milliseconds
      const totalDistance = route.summary.distance; // in meters

      // For detailed path, you might need to iterate through legs and sections
      const fullPath = route.legs.flatMap(leg =>
        leg.steps.flatMap(step =>
          step.coords.map(coord => ({ lat: coord[1], lng: coord[0] }))
        )
      );

      return {
        path: fullPath,
        totalTime,
        totalDistance,
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching from Naver Directions API:', error);
    return null;
  }
};
