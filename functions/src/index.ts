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

interface RouteSummary {
  duration: number;
  distance: number;
}

interface Route {
  summary: RouteSummary;
  path: number[][]; // NAVER API에서 직접 제공되는 path (좌표 배열)
  section?: object[]; // 선택: 도로 정보
  guide?: object[]; // 선택: 분기점 안내
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
        const namesArray = request.body.namesArray;
        if (!coordsArray || coordsArray.length < 2) {
            response.status(400).json({error: "At least two coordinates required"});
            return;
        }

        const naverClientId = await NAVER_CLIENT_ID.value();
        const naverClientSecret = await NAVER_CLIENT_SECRET.value();

        const start =
    `${coordsArray[0].lng}%2C${coordsArray[0].lat}`;
        const goal =
    `${coordsArray[coordsArray.length - 1].lng}%2C${coordsArray[coordsArray.length - 1].lat}`;
        const waypoints = coordsArray.slice(1, coordsArray.length - 1)
            .map((coord: Coordinate) => `${coord.lng}%2C${coord.lat}`).join("|");

        let url = `https://maps.apigw.ntruss.com/map-direction-15/v1/driving?start=${start}&goal=${goal}`;
        if (waypoints) {
            url += `&waypoints=${waypoints}`;
        }

        logger.info("Calling NAVER Directions API:", url);

        fetch(url, {
            method: "GET",
            headers: {
                "x-ncp-apigw-api-key-id": naverClientId,
                "x-ncp-apigw-api-key": naverClientSecret,
            },
        })
            .then((res) => res.json())
            .then((data) => {
                logger.info("NAVER API Response:", data);

                if (data.code === 0 && data.route && data.route.traoptimal && data.route.traoptimal.length > 0) {
                    const route: Route = data.route.traoptimal[0];
                    const totalTime = route.summary.duration;
                    const totalDistance = route.summary.distance;

                    // Extract path directly from NAVER response (path is [lng, lat])
                    let fullPath: Coordinate[] = [];
                    if (route.path && route.path.length > 0) {
                        fullPath = route.path.map((coord: number[]) => ({
                            lat: coord[1], // NAVER: [lng, lat] -> [lat, lng]
                            lng: coord[0],
                        }));
                    }

                    // If no detailed path, create simple path from waypoints
                    if (fullPath.length === 0) {
                        fullPath = coordsArray.map((coord: Coordinate) => ({
                            lat: coord.lat,
                            lng: coord.lng,
                        }));
                    }

                    // Extract segment times from sections
                    let segmentTimes: number[] = [];
                    if (route.section && route.section.length > 0) {
                        segmentTimes = route.section.map((section: any) =>
                            section.distance / 1000 / 30 * 3600
                        ); // Estimate time based on distance and avg speed 30km/h
                    } else {
                        // Fallback: divide total time equally
                        const numSegments = coordsArray.length - 1;
                        const segmentTime = totalTime / numSegments;
                        segmentTimes = Array(numSegments).fill(segmentTime);
                    }

                    response.json({
                        path: fullPath,
                        totalTime,
                        totalDistance,
                        segmentTimes,
                        order: namesArray || coordsArray.map(
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
