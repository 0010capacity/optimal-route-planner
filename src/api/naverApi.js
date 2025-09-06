const NAVER_CLIENT_ID = process.env.REACT_APP_NAVER_CLIENT_ID || 'your_naver_client_id_here';
const NAVER_CLIENT_SECRET = process.env.REACT_APP_NAVER_CLIENT_SECRET || 'your_naver_client_secret_here';

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
    console.log('No address provided to geocode');
    return null;
  }

  console.log('Geocoding address:', address);

  // Firebase Functions를 통한 Naver Geocoding API 호출
  try {
    const firebaseFunctionUrl = `https://geocodeaddress-weu5x3oaea-uc.a.run.app?address=${encodeURIComponent(address)}`;

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

  // Fallback to Google Places API
  console.log('Falling back to Google Places API for geocoding');
  try {
    const apiKey = 'AIzaSyCuI4OfM-oPbnKoes_uaYfUWZ2f-btjgtQ';
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      console.log('Geocoded location via Google:', location);
      return { lat: location.lat, lng: location.lng };
    }
  } catch (error) {
    console.error('Error with Google Places API geocoding:', error);
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
    const firebaseFunctionUrl = `https://getdirections-weu5x3oaea-uc.a.run.app`;

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
