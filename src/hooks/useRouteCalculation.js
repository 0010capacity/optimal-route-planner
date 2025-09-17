import { useEffect } from 'react';
import { getDirections } from '../api/naverApi';

export const useRouteCalculation = (geocodedLocations, isOptimizing, setOptimizedRoute) => {
  // Automatic route calculation (only individual segment calculation)
  useEffect(() => {
    const fetchRoute = async () => {
      if (isOptimizing) return; // Skip auto calculation during optimization

      if (geocodedLocations.length >= 2) {
        // Calculate individual segments only
        const actualSegmentTimes = [];
        const actualSegmentDistances = [];
        let fullPath = [];

        for (let i = 0; i < geocodedLocations.length - 1; i++) {
          const segmentStart = geocodedLocations[i];
          const segmentEnd = geocodedLocations[i + 1];

          const segmentCoordsArray = [segmentStart.coords, segmentEnd.coords];
          const segmentNamesArray = [segmentStart.name, segmentEnd.name];

          const segmentResult = await getDirections(segmentCoordsArray, segmentNamesArray);
          if (segmentResult) {
            actualSegmentTimes.push(segmentResult.totalTime);
            actualSegmentDistances.push(segmentResult.totalDistance);
            // Merge paths (exclude first point for segments after the first)
            if (i === 0) {
              fullPath = [...segmentResult.path];
            } else {
              fullPath = [...fullPath, ...segmentResult.path.slice(1)];
            }
          } else {
            return; // Stop calculation on failure
          }
        }

        // Calculate total time and distance
        const totalActualTime = actualSegmentTimes.reduce((sum, time) => sum + time, 0);
        const totalActualDistance = actualSegmentDistances.reduce((sum, dist) => sum + dist, 0);

        setOptimizedRoute({
          path: fullPath,
          segmentTimes: actualSegmentTimes,
          segmentDistances: actualSegmentDistances,
          totalTime: totalActualTime,
          totalDistance: totalActualDistance,
          order: geocodedLocations.map((_, index) => index) // Sequential order
        });
      } else {
        setOptimizedRoute(null);
      }
    };

    fetchRoute();
  }, [geocodedLocations, isOptimizing, setOptimizedRoute]);
};
