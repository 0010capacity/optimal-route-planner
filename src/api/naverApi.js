const NAVER_CLIENT_ID = process.env.REACT_APP_NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.REACT_APP_NAVER_CLIENT_SECRET;

export const searchPlaces = async (query) => {
  if (!query) {
    return [];
  }

  const url = `https://us-central1-optimal-route-planner-0010.cloudfunctions.net/searchPlaces?query=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Search API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('Error fetching from Search API:', error);
    return [];
  }
};

export const geocodeAddress = async (address) => {
  if (!address) {
    return null;
  }

  const url = `https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(address)}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-NCP-APIGW-API-KEY-ID': NAVER_CLIENT_ID,
        'X-NCP-APIGW-API-KEY': NAVER_CLIENT_SECRET,
      },
    });

    if (!response.ok) {
      throw new Error(`Naver Geocoding API error: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.addresses && data.addresses.length > 0) {
      const { x, y } = data.addresses[0];
      return { lat: parseFloat(y), lng: parseFloat(x) };
    }
    return null;
  } catch (error) {
    console.error('Error fetching from Naver Geocoding API:', error);
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
