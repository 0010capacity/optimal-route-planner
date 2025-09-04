const NAVER_CLIENT_ID = process.env.REACT_APP_NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.REACT_APP_NAVER_CLIENT_SECRET;

export const searchPlaces = async (query) => {
  if (!query) {
    return [];
  }

  const url = `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(query)}&display=5`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Naver-Client-Id': NAVER_CLIENT_ID,
        'X-Naver-Client-Secret': NAVER_CLIENT_SECRET,
      },
    });

    if (!response.ok) {
      throw new Error(`Naver API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.items;
  } catch (error) {
    console.error('Error fetching from Naver Search API:', error);
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