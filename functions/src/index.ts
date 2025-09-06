import {setGlobalOptions} from "firebase-functions";
import {onRequest} from "firebase-functions/https";
import * as logger from "firebase-functions/logger";

setGlobalOptions({maxInstances: 10});

export const searchPlaces = onRequest((request, response) => {
  // CORS 허용
  response.set("Access-Control-Allow-Origin", "*");
  response.set("Access-Control-Allow-Methods", "GET, POST");
  response.set("Access-Control-Allow-Headers", "Content-Type");

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  const query = request.query.query as string;
  if (!query) {
    response.status(400).json({error: "Query parameter is required"});
    return;
  }

  const NAVER_CLIENT_ID = process.env.REACT_APP_NAVER_CLIENT_ID;
  const NAVER_CLIENT_SECRET = process.env.REACT_APP_NAVER_CLIENT_SECRET;

  if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
    response.status(500).json({error: "NAVER API credentials not configured"});
    return;
  }

  const url = `https://openapi.naver.com/v1/search/local.json?query=${
    encodeURIComponent(query)}&display=5`;

  fetch(url, {
    method: "GET",
    headers: {
      "X-Naver-Client-Id": NAVER_CLIENT_ID,
      "X-Naver-Client-Secret": NAVER_CLIENT_SECRET,
    },
  })
    .then((res) => res.json())
    .then((data) => {
      response.json(data);
    })
    .catch((error) => {
      logger.error("Error fetching from Naver Search API:", error);
      response.status(500).json({error: "Failed to fetch data"});
    });
});

export const geocodeAddress = onRequest((request, response) => {
  // CORS 허용
  response.set("Access-Control-Allow-Origin", "*");
  response.set("Access-Control-Allow-Methods", "GET, POST");
  response.set("Access-Control-Allow-Headers", "Content-Type");

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  const address = request.query.address as string;
  if (!address) {
    response.status(400).json({error: "Address parameter is required"});
    return;
  }

  const NAVER_CLIENT_ID = process.env.REACT_APP_NAVER_CLIENT_ID;
  const NAVER_CLIENT_SECRET = process.env.REACT_APP_NAVER_CLIENT_SECRET;

  if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
    response.status(500).json({error: "NAVER API credentials not configured"});
    return;
  }

  const url = `https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode?query=${
    encodeURIComponent(address)}`;

  fetch(url, {
    method: "GET",
    headers: {
      "X-NCP-APIGW-API-KEY-ID": NAVER_CLIENT_ID,
      "X-NCP-APIGW-API-KEY": NAVER_CLIENT_SECRET,
    },
  })
    .then((res) => res.json())
    .then((data) => {
      response.json(data);
    })
    .catch((error) => {
      logger.error("Error fetching from Naver Geocoding API:", error);
      response.status(500).json({error: "Failed to fetch data"});
    });
});
