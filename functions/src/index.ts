import {setGlobalOptions} from "firebase-functions";
import {onRequest} from "firebase-functions/https";
import * as logger from "firebase-functions/logger";

setGlobalOptions({maxInstances: 10});

interface Coordinate {
  lat: number;
  lng: number;
}

interface RouteStep {
  coords: number[][];
}

interface RouteLeg {
  steps: RouteStep[];
}

interface RouteSummary {
  duration: number;
  distance: number;
}

interface Route {
  summary: RouteSummary;
  legs: RouteLeg[];
}

export const getDirections = onRequest((request, response) => {
  // CORS 허용
  response.set("Access-Control-Allow-Origin", "*");
  response.set("Access-Control-Allow-Methods", "GET, POST");
  response.set("Access-Control-Allow-Headers", "Content-Type");

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  const coordsArray = request.body.coordsArray;
  if (!coordsArray || coordsArray.length < 2) {
    response.status(400).json({error: "At least two coordinates required"});
    return;
  }

  const NAVER_CLIENT_ID = process.env.REACT_APP_NAVER_CLIENT_ID;
  const NAVER_CLIENT_SECRET = process.env.REACT_APP_NAVER_CLIENT_SECRET;

  if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
    response.status(500).json({error: "NAVER API credentials not configured"});
    return;
  }

  const start = `${coordsArray[0].lng},${coordsArray[0].lat}`;
  const goal = `${coordsArray[coordsArray.length - 1].lng},${
    coordsArray[coordsArray.length - 1].lat}`;
  const waypoints = coordsArray.slice(1, coordsArray.length - 1)
    .map((coord: Coordinate) => `${coord.lng},${coord.lat}`).join("|");

  let url = `https://naveropenapi.apigw.ntruss.com/map-direction/v1/driving?start=${start}&goal=${goal}`;
  if (waypoints) {
    url += `&waypoints=${waypoints}`;
  }

  fetch(url, {
    method: "GET",
    headers: {
      "X-NCP-APIGW-API-KEY-ID": NAVER_CLIENT_ID,
      "X-NCP-APIGW-API-KEY": NAVER_CLIENT_SECRET,
    },
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.code === 0 && data.routes && data.routes.length > 0) {
        const route: Route = data.routes[0];
        const totalTime = route.summary.duration;
        const totalDistance = route.summary.distance;
        const fullPath = route.legs.flatMap((leg: RouteLeg) =>
          leg.steps.flatMap((step: RouteStep) =>
            step.coords.map((coord: number[]) => ({
              lat: coord[1],
              lng: coord[0],
            }))
          )
        );
        response.json({
          path: fullPath,
          totalTime,
          totalDistance,
        });
      } else {
        response.status(404).json({error: "No route found"});
      }
    })
    .catch((error) => {
      logger.error("Error fetching from NAVER Directions API:", error);
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

  const url = `https://naveropenapi.apigw.ntruss.com/map-place/v1/search?query=${
    encodeURIComponent(query)}&coordinate=127.1058342,37.359708&display=10`;

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
      logger.error("Error fetching from Naver Search API:", error);
      response.status(500).json({error: "Failed to fetch data"});
    });
});
