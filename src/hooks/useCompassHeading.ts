import { useState, useEffect, useRef, useCallback } from 'react';
import CompassHeading from 'react-native-compass-heading';
import { throttle } from '../utils/performanceUtils';
import { 
  normalizeHeading, 
  angleDifference, 
  smoothHeading, 
  isCompassCalibrated,
  calculateCompassAccuracy,
  removeOutliers 
} from '../utils/compassUtils';

interface UseCompassHeadingReturn {
  heading: number;
  accuracy: number;
  isActive: boolean;
  error: string | null;
  startCompass: () => void;
  stopCompass: () => void;
  calibrateCompass: () => void;
  isCalibrated: boolean;
}

export const useCompassHeading = (): UseCompassHeadingReturn => {
  const [heading, setHeading] = useState<number>(0);
  const [accuracy, setAccuracy] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isCalibrated, setIsCalibrated] = useState<boolean>(false);
  const subscriptionRef = useRef<any>(null);
  const headingHistoryRef = useRef<number[]>([]);
  const lastHeadingRef = useRef<number>(0);
  const calibrationRef = useRef<{ min: number; max: number; samples: number[] }>({
    min: 0,
    max: 0,
    samples: []
  });
  
  // Throttled heading update to prevent excessive re-renders
  const throttledSetHeading = useCallback(
    throttle((newHeading: number) => {
      setHeading(newHeading);
    }, 50), // Update at most every 50ms for smoother rotation
    []
  );

  // Enhanced smoothing with outlier detection
  const processHeading = (rawHeading: number): number => {
    // Normalize raw heading
    const normalizedHeading = normalizeHeading(rawHeading);
    
    // Add to history for analysis
    headingHistoryRef.current.push(normalizedHeading);
    if (headingHistoryRef.current.length > 20) {
      headingHistoryRef.current.shift();
    }
    
    // Remove outliers
    const filteredHeadings = removeOutliers(headingHistoryRef.current);
    
    if (filteredHeadings.length === 0) {
      return normalizedHeading; // Fallback to raw value
    }
    
    // Smooth the heading
    const smoothedHeading = smoothHeading(normalizedHeading, lastHeadingRef.current, 0.4);
    
    // Update accuracy based on heading stability
    const accuracyValue = calculateCompassAccuracy(headingHistoryRef.current);
    setAccuracy(accuracyValue);
    
    // Check calibration status
    if (headingHistoryRef.current.length >= 10) {
      const calibrated = isCompassCalibrated(headingHistoryRef.current);
      setIsCalibrated(calibrated);
    }
    
    lastHeadingRef.current = smoothedHeading;
    return smoothedHeading;
  };

  // Calibration function to detect full rotation range
  const calibrateCompass = useCallback(() => {
    console.log('useCompassHeading - Starting compass calibration...');
    calibrationRef.current = { min: 0, max: 0, samples: [] };
    setIsCalibrated(false);
    
    // Collect samples for 10 seconds
    const calibrationInterval = setInterval(() => {
      if (calibrationRef.current.samples.length < 50) {
        calibrationRef.current.samples.push(heading);
        
        // Update min/max
        if (heading < calibrationRef.current.min || calibrationRef.current.min === 0) {
          calibrationRef.current.min = heading;
        }
        if (heading > calibrationRef.current.max) {
          calibrationRef.current.max = heading;
        }
        
        console.log('useCompassHeading - Calibration sample:', {
          heading,
          min: calibrationRef.current.min,
          max: calibrationRef.current.max,
          samples: calibrationRef.current.samples.length
        });
      } else {
        clearInterval(calibrationInterval);
        const range = calibrationRef.current.max - calibrationRef.current.min;
        console.log('useCompassHeading - Calibration complete:', {
          min: calibrationRef.current.min,
          max: calibrationRef.current.max,
          range,
          samples: calibrationRef.current.samples.length
        });
        
        // Check if we have a good range (should be close to 360°)
        if (range > 300) {
          setIsCalibrated(true);
          console.log('useCompassHeading - Compass calibrated successfully');
        } else {
          console.warn('useCompassHeading - Poor calibration range:', range);
        }
      }
    }, 200);
  }, [heading]);

  const startCompass = () => {
    if (subscriptionRef.current) {
      console.log('useCompassHeading - Compass already started');
      return; // Already started
    }

    console.log('useCompassHeading - Starting compass...');
    try {
      setError(null);
      setIsActive(true);
      setIsCalibrated(false);
      
      subscriptionRef.current = CompassHeading.start(1, (headingData: any) => {
        try {
          const { heading: rawHeading, accuracy: rawAccuracy } = headingData;
          
          // Debug logging for raw data
          console.log('useCompassHeading - Raw compass data:', {
            rawHeading,
            accuracy: rawAccuracy,
            timestamp: Date.now()
          });
          
          // Validate raw heading
          if (typeof rawHeading !== 'number' || isNaN(rawHeading)) {
            console.warn('useCompassHeading - Invalid raw heading:', rawHeading);
            return;
          }
          
          // Process and smooth the heading
          const processedHeading = processHeading(rawHeading);
          
          // Only update if there's a significant change to prevent excessive updates
          const headingDiff = Math.abs(angleDifference(lastHeadingRef.current, processedHeading));
          if (headingDiff > 0.5) {
            console.log('useCompassHeading - Updating heading:', {
              raw: rawHeading,
              processed: processedHeading,
              diff: headingDiff
            });
            throttledSetHeading(processedHeading);
          }
          
          // Use processed accuracy or fall back to raw accuracy
          if (rawAccuracy !== undefined) {
            setAccuracy(Math.min(accuracy, rawAccuracy));
          }
        } catch (err) {
          console.error('useCompassHeading - Error processing compass data:', err);
          setError('Failed to process compass data');
        }
      });
    } catch (err: any) {
      console.error('useCompassHeading - Error starting compass:', err);
      setError(`Compass error: ${err.message || 'Unknown error'}`);
      setIsActive(false);
    }
  };

  const stopCompass = () => {
    if (subscriptionRef.current) {
      CompassHeading.stop();
      subscriptionRef.current = null;
    }
    setIsActive(false);
    setIsCalibrated(false);
    headingHistoryRef.current = [];
    calibrationRef.current = { min: 0, max: 0, samples: [] };
  };

  useEffect(() => {
    return () => {
      stopCompass();
    };
  }, []);

  return {
    heading,
    accuracy,
    isActive,
    error,
    startCompass,
    stopCompass,
    calibrateCompass,
    isCalibrated,
  };
};