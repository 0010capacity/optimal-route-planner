import { useEffect } from 'react';
import { getDirections } from '../api/naverApi';

export const useRouteCalculation = (geocodedLocations, isOptimizing, setOptimizedRoute) => {
  // Automatic route calculation with batch processing
  useEffect(() => {
    const fetchRoute = async () => {
      if (isOptimizing) return; // Skip auto calculation during optimization

      if (geocodedLocations.length >= 2) {
        // Prepare batch API calls for all segments
        const segmentCalls = [];
        for (let i = 0; i < geocodedLocations.length - 1; i++) {
          const segmentStart = geocodedLocations[i];
          const segmentEnd = geocodedLocations[i + 1];
          
          segmentCalls.push({
            index: i,
            coordsArray: [segmentStart.coords, segmentEnd.coords],
            namesArray: [segmentStart.name, segmentEnd.name]
          });
        }

        // Process segments in batches of 16
        const batchSize = 16;
        const segmentResults = new Array(segmentCalls.length);
        
        for (let batchStart = 0; batchStart < segmentCalls.length; batchStart += batchSize) {
          const batchEnd = Math.min(batchStart + batchSize, segmentCalls.length);
          const batch = segmentCalls.slice(batchStart, batchEnd);

          // Execute batch in parallel
          const promises = batch.map(async ({ index, coordsArray, namesArray }) => {
            try {
              const result = await getDirections(coordsArray, namesArray);
              return { index, result };
            } catch (error) {
              console.warn(`Segment API call failed for ${index}:`, error);
              return { index, result: null };
            }
          });

          const batchResults = await Promise.all(promises);
          
          // Store results by index
          batchResults.forEach(({ index, result }) => {
            segmentResults[index] = result;
          });

          // Small delay between batches to prevent API overload
          if (batchEnd < segmentCalls.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }

        // Process results and build route
        const actualSegmentTimes = [];
        const actualSegmentDistances = [];
        let fullPath = [];

        for (let i = 0; i < segmentResults.length; i++) {
          const segmentResult = segmentResults[i];
          
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
            // Handle failed segment
            console.error(`Failed to get route for segment ${i}`);
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
