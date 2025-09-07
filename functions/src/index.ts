// Force redeploy - updated on 2025-09-07 for NAVER Geocoding API fix
import {setGlobalOptions} from "firebase-functions";
import {onRequest} from "firebase-functions/https";
import {defineSecret} from "firebase-functions/params";
import * as logger from "firebase-functions/logger";

// Force redeploy - updated on 2025-09-07

setGlobalOptions({maxInstances: 10});

// Define secrets
const NAVER_CLIENT_ID = defineSecret("NAVER_CLIENT_ID");
const NAVER_CLIENT_SECRET = defineSecret("NAVER_CLIENT_SECRET");

interface Coordinate {
  lat: number;
  lng: number;
}

interface RouteStep {
  path: number[][];
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

export const getDirections = onRequest(
    {secrets: [NAVER_CLIENT_ID, NAVER_CLIENT_SECRET]},
    async (request, response) => {
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

        const naverClientId = await NAVER_CLIENT_ID.value();
        const naverClientSecret = await NAVER_CLIENT_SECRET.value();

        const start =
    `${coordsArray[0].lng},${coordsArray[0].lat}`;
        const goal =
    `${coordsArray[coordsArray.length - 1].lng},${coordsArray[coordsArray.length - 1].lat}`;
        const waypoints = coordsArray.slice(1, coordsArray.length - 1)
            .map((coord: Coordinate) => `${coord.lng},${coord.lat}`).join("|");

        let url = `https://naveropenapi.apigw.ntruss.com/map-direction/v1/driving?start=${start}&goal=${goal}`;
        if (waypoints) {
            url += `&waypoints=${waypoints}`;
        }

        logger.info("Calling NAVER Directions API:", url);

        fetch(url, {
            method: "GET",
            headers: {
                "X-NCP-APIGW-API-KEY-ID": naverClientId,
                "X-NCP-APIGW-API-KEY": naverClientSecret,
            },
        })
            .then((res) => res.json())
            .then((data) => {
                logger.info("NAVER API Response:", data);

                if (data.code === 0 && data.routes && data.routes.length > 0) {
                    const route: Route = data.routes[0];
                    const totalTime = route.summary.duration;
                    const totalDistance = route.summary.distance;

                    // Extract path from route data
                    let fullPath: Coordinate[] = [];
                    if (route.legs && route.legs.length > 0) {
                        fullPath = route.legs.flatMap((leg: RouteLeg) =>
                            leg.steps ? leg.steps.flatMap((step: RouteStep) =>
                                step.path ? step.path.map((coord: number[]) => ({
                                    lat: coord[1],
                                    lng: coord[0],
                                })) : []
                            ) : []
                        );
                    }

                    // If no detailed path, create simple path from waypoints
                    if (fullPath.length === 0) {
                        fullPath = coordsArray.map((coord: Coordinate) => ({
                            lat: coord.lat,
                            lng: coord.lng,
                        }));
                    }

                    response.json({
                        path: fullPath,
                        totalTime,
                        totalDistance,
                        order: coordsArray.map(
                            (coord: Coordinate, index: number) => `Point ${index + 1}`,
                        ),
                    });
                } else {
                    logger.warn("No valid route found in response:", data);
                    response.status(404).json({error: "No route found"});
                }
            })
            .catch((error) => {
                logger.error("Error fetching from NAVER Directions API:", error);
                response.status(500).json({error: "Failed to fetch data"});
            });
    });

export const testGeocode = onRequest((request, response) => {
    response.set("Access-Control-Allow-Origin", "*");
    response.set("Access-Control-Allow-Methods", "GET, POST");
    response.set("Access-Control-Allow-Headers", "Content-Type");

    const address = request.query.address as string;
    logger.info("Test function called with address:", address);

    response.json({
        message: "Test function working",
        address: address,
        timestamp: new Date().toISOString(),
    });
});

export const geocodeAddress = onRequest(
    {secrets: [NAVER_CLIENT_ID, NAVER_CLIENT_SECRET]},
    async (request, response) => {
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

        const naverClientId = await NAVER_CLIENT_ID.value();
        const naverClientSecret = await NAVER_CLIENT_SECRET.value();

        const url = `https://maps.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(address)}`;

        logger.info("Calling NAVER Geocoding API:", url);
        // Log the full URL for Postman testing
        logger.info("Full NAVER Geocoding API URL for Postman:", url);
        logger.info("Headers for Postman: X-NCP-APIGW-API-KEY-ID =", naverClientId,
            ", X-NCP-APIGW-API-KEY =", naverClientSecret);

        fetch(url, {
            method: "GET",
            headers: {
                "x-ncp-apigw-api-key-id": naverClientId,
                "x-ncp-apigw-api-key": naverClientSecret,
                "Accept": "application/json",
            },
        })
            .then((res) => res.json())
            .then((data) => {
                logger.info("NAVER Geocoding Response:", data);

                if (data.status === "OK" && data.addresses && data.addresses.length > 0) {
                    const location = data.addresses[0];
                    response.json({
                        lat: parseFloat(location.y),
                        lng: parseFloat(location.x),
                    });
                } else {
                    logger.warn("No valid result found in response:", data);
                    response.status(404).json({error: "Address not found"});
                }
            })
            .catch((error) => {
                logger.error("Error fetching from NAVER Geocoding API:", error);
                response.status(500).json({error: "Failed to fetch data"});
            });
    });
