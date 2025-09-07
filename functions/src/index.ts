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
    {
        secrets: [NAVER_CLIENT_ID, NAVER_CLIENT_SECRET],
        region: "asia-northeast3",
    },
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

        let url = `https://maps.apigw.ntruss.com/map-direction/v1/driving?start=${start}&goal=${goal}`;
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

                    // Extract segment times and distances from sections
                    let segmentTimes: number[] = [];
                    let segmentDistances: number[] = [];

                    // Group sections by waypoint segments
                    const numWaypoints = coordsArray.length;
                    if (route.section && route.section.length > 0 && numWaypoints > 1) {
                        const numSegments = numWaypoints - 1;

                        // Initialize arrays for each waypoint segment
                        const waypointSegmentTimes = new Array(numSegments).fill(0);
                        const waypointSegmentDistances = new Array(numSegments).fill(0);

                        // Group sections by waypoint index
                        route.section.forEach((section: any) => {
                            // NAVER API sections have waypoint index (pointIndex)
                            const waypointIndex = section.pointIndex || 0;

                            // Ensure waypoint index is within bounds
                            if (waypointIndex >= 0 && waypointIndex < numSegments) {
                                waypointSegmentTimes[waypointIndex] += section.duration || 0;
                                waypointSegmentDistances[waypointIndex] += section.distance || 0;
                            }
                        });

                        // Handle case where some sections don't have proper waypoint mapping
                        const totalMappedTime = waypointSegmentTimes.reduce((sum, time) => sum + time, 0);

                        // If mapping is incomplete, distribute remaining proportionally
                        if (totalMappedTime < totalTime * 0.9) { // If less than 90% mapped
                            logger.warn("Incomplete waypoint mapping, falling back to proportional distribution");

                            // Calculate total section data for proportional distribution
                            const totalSectionTime = route.section.reduce((sum: number, section: any) =>
                                sum + (section.duration || 0), 0);
                            const totalSectionDistance = route.section.reduce((sum: number, section: any) =>
                                sum + (section.distance || 0), 0);

                            // If we have section data, distribute proportionally
                            if (totalSectionTime > 0 && totalSectionDistance > 0) {
                                for (let i = 0; i < numSegments; i++) {
                                    const proportion = 1 / numSegments; // Equal distribution as fallback
                                    waypointSegmentTimes[i] = totalTime * proportion;
                                    waypointSegmentDistances[i] = totalDistance * proportion;
                                }
                            } else {
                                // Last resort: equal distribution
                                for (let i = 0; i < numSegments; i++) {
                                    waypointSegmentTimes[i] = totalTime / numSegments;
                                    waypointSegmentDistances[i] = totalDistance / numSegments;
                                }
                            }
                        }

                        segmentTimes = waypointSegmentTimes;
                        segmentDistances = waypointSegmentDistances;

                        logger.info(`Grouped ${route.section.length} sections into ${numSegments} waypoint segments`);
                        logger.info(`Segment times: ${segmentTimes}`);
                        logger.info(`Segment distances: ${segmentDistances}`);
                    } else {
                        // Fallback: equal distribution
                        const numSegments = numWaypoints - 1;
                        for (let i = 0; i < numSegments; i++) {
                            segmentTimes.push(totalTime / numSegments);
                            segmentDistances.push(totalDistance / numSegments);
                        }
                        logger.warn("No section data or insufficient waypoints, using equal distribution");
                    }

                    response.json({
                        path: fullPath,
                        totalTime,
                        totalDistance,
                        segmentTimes,
                        segmentDistances,
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
