const NAVER_CLIENT_ID = process.env.REACT_APP_NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.REACT_APP_NAVER_CLIENT_SECRET;

// Google Places API를 사용한 장소 검색 (REST API 사용)
export const searchPlaces = async (query, centerLocation = null) => {
  if (!query) {
    return [];
  }

  try {
    const apiKey = 'AIzaSyCuI4OfM-oPbnKoes_uaYfUWZ2f-btjgtQ';
    const url = 'https://places.googleapis.com/v1/places:searchText';

    const requestBody = {
      textQuery: query,
      maxResultCount: 10,
    };

    // 지도 중심 좌표가 제공되면 locationBias 사용 (Text Search에서는 locationRestriction 대신)
    if (centerLocation && typeof centerLocation.lat === 'number' && typeof centerLocation.lng === 'number') {
      requestBody.locationBias = {
        circle: {
          center: {
            latitude: centerLocation.lat,
            longitude: centerLocation.lng
          },
          radius: 1000, // 1km 반경
        },
      };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location,places.types,places.id'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Places API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.places && data.places.length > 0) {
      return data.places.map((place, index) => {
        const displayName = place.displayName?.text || place.displayName;
        const fullAddress = place.formattedAddress || '';

        let title;
        if (displayName) {
          title = displayName;
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
          mapx: (place.location?.longitude * 10000000).toString(),
          mapy: (place.location?.latitude * 10000000).toString(),
        };
      });
    }

    return [];
  } catch (error) {
    console.error('Error fetching from Google Places API:', error);
    return [];
  }
};export const geocodeAddress = async (address) => {
  if (!address) {
    return null;
  }

  try {
    const apiKey = 'AIzaSyCuI4OfM-oPbnKoes_uaYfUWZ2f-btjgtQ';
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return { lat: location.lat, lng: location.lng };
    }
    return null;
  } catch (error) {
    console.error('Error fetching from Google Geocoding API:', error);
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
