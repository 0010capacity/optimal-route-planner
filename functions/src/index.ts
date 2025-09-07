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
const NAVER_SEARCH_CLIENT_ID = defineSecret("NAVER_SEARCH_CLIENT_ID");
const NAVER_SEARCH_CLIENT_SECRET = defineSecret("NAVER_SEARCH_CLIENT_SECRET");
const KAKAO_API_KEY = defineSecret("KAKAO_API_KEY");

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
                "X-NCP-APIGW-API-KEY-ID": naverClientId,
                "X-NCP-APIGW-API-KEY": naverClientSecret,
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

export const searchPlaces = onRequest(
    {secrets: [NAVER_SEARCH_CLIENT_ID, NAVER_SEARCH_CLIENT_SECRET]},
    async (request, response) => {
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

        const naverClientId = await NAVER_SEARCH_CLIENT_ID.value();
        const naverClientSecret = await NAVER_SEARCH_CLIENT_SECRET.value();

        const url = `https://openapi.naver.com/v1/search/local?query=${encodeURIComponent(query)}` +
            "&display=10&start=1&sort=random";

        logger.info("Calling NAVER Search API:", url);

        fetch(url, {
            method: "GET",
            headers: {
                "X-Naver-Client-Id": naverClientId,
                "X-Naver-Client-Secret": naverClientSecret,
                "Accept": "application/json",
            },
        })
            .then((res) => res.json())
            .then((data) => {
                logger.info("NAVER Search Response:", data);

                if (data.items && data.items.length > 0) {
                    const results = data.items.map((item: any) => {
                        // HTML 태그 제거
                        const cleanTitle = item.title.replace(/<[^>]*>/g, "");

                        return {
                            title: cleanTitle,
                            category: item.category || "장소",
                            telephone: item.telephone || "",
                            address: item.address || "",
                            roadAddress: item.roadAddress || item.address || "",
                            mapx: item.mapx || "",
                            mapy: item.mapy || "",
                        };
                    });
                    response.json(results);
                } else {
                    response.json([]);
                }
            })
            .catch((error) => {
                logger.error("Error fetching from NAVER Search API:", error);
                response.status(500).json({error: "Failed to fetch data"});
            });
    });

export const searchPlacesKakao = onRequest(
    {secrets: [KAKAO_API_KEY]},
    async (request, response) => {
        // CORS 허용
        response.set("Access-Control-Allow-Origin", "*");
        response.set("Access-Control-Allow-Methods", "GET, POST");
        response.set("Access-Control-Allow-Headers", "Content-Type");

        if (request.method === "OPTIONS") {
            response.status(204).send("");
            return;
        }

        const query = request.query.query as string;
        const x = request.query.x as string;
        const y = request.query.y as string;
        const radius = request.query.radius as string;

        if (!query) {
            response.status(400).json({error: "Query parameter is required"});
            return;
        }

        const kakaoApiKey = await KAKAO_API_KEY.value();

        // Kakao REST API 직접 호출 (curl 명령어와 동일한 방식)
        const baseUrl = "https://dapi.kakao.com/v2/local/search/keyword.json";
        const params = new URLSearchParams({
            query: query,
            page: "1",
            size: "15",
            sort: "accuracy",
        });

        // 중심 좌표가 제공되면 추가
        if (x && y) {
            params.append("x", x);
            params.append("y", y);
            if (radius) {
                params.append("radius", radius);
            }
        }

        const url = `${baseUrl}?${params.toString()}`;

        logger.info("Calling Kakao REST API:", url);
        logger.info("Authorization header:", `KakaoAK ${kakaoApiKey.substring(0, 10)}...`);

        fetch(url, {
            method: "GET",
            headers: {
                "Authorization": `KakaoAK ${kakaoApiKey}`,
                "Accept": "application/json",
            },
        })
            .then((res) => {
                logger.info("Kakao REST API Response Status:", res.status);
                if (!res.ok) {
                    throw new Error(`Kakao API error: ${res.status} ${res.statusText}`);
                }
                return res.json();
            })
            .then((data) => {
                logger.info("Kakao REST API Response:", JSON.stringify(data, null, 2));

                if (data.documents && data.documents.length > 0) {
                    const results = data.documents.map((item: any) => ({
                        title: item.place_name,
                        category: item.category_name || "장소",
                        telephone: item.phone || "",
                        address: item.address_name || "",
                        roadAddress: item.road_address_name || item.address_name || "",
                        mapx: item.x || "",
                        mapy: item.y || "",
                    }));
                    logger.info("Kakao 검색 결과 개수:", results.length);
                    response.json(results);
                } else {
                    logger.info("Kakao 검색 결과 없음");
                    response.json([]);
                }
            })
            .catch((error) => {
                logger.error("Error fetching from Kakao REST API:", error);
                response.status(500).json({error: "Failed to fetch data", details: error.message});
            });
    });
