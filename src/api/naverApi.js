const NAVER_CLIENT_ID = process.env.REACT_APP_NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.REACT_APP_NAVER_CLIENT_SECRET;

// Google Places API를 사용한 장소 검색 (클라이언트 사이드)
export const searchPlaces = async (query) => {
  if (!query) {
    return [];
  }

  try {
    // Google Maps API가 로드될 때까지 대기
    let attempts = 0;
    while (!window.google || !window.google.maps || !window.google.maps.importLibrary) {
      if (attempts > 50) { // 5초 타임아웃
        console.warn('Google Maps API loading timeout');
        return [];
      }
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    const { Place } = await window.google.maps.importLibrary("places");
    
    const request = {
      textQuery: query,
      fields: ['displayName', 'formattedAddress', 'location', 'id'],
      maxResultCount: 10,
    };

    const { places } = await Place.searchByText(request);

    if (places && places.length > 0) {
      return places.map(place => ({
        title: place.displayName?.text || place.formattedAddress,
        category: "장소",
        telephone: "",
        address: place.formattedAddress,
        roadAddress: place.formattedAddress,
        mapx: (place.location?.lng * 10000000).toString(),
        mapy: (place.location?.lat * 10000000).toString(),
      }));
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
