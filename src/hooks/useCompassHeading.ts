import { useState, useEffect, useRef, useCallback } from 'react';
import CompassHeading from 'react-native-compass-heading';

interface UseCompassHeadingReturn {
  heading: number;
  accuracy: number;
  isActive: boolean;
  error: string | null;
  startCompass: () => void;
  stopCompass: () => void;
}

export const useCompassHeading = (): UseCompassHeadingReturn => {
  const [heading, setHeading] = useState<number>(0);
  const [accuracy, setAccuracy] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const subscriptionRef = useRef<any>(null);
  const lastHeadingRef = useRef<number>(0);
  const updateTimeoutRef = useRef<number | null>(null);

  // Smooth heading update with debouncing
  const updateHeading = useCallback((newHeading: number) => {
    // Clear any pending update
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Debounce updates to prevent excessive re-renders
    updateTimeoutRef.current = setTimeout(() => {
      // Simple smoothing to prevent jitter
      const smoothingFactor = 0.3;
      const diff = newHeading - lastHeadingRef.current;

      // Handle 360° wraparound
      let adjustedDiff = diff;
      if (diff > 180) adjustedDiff = diff - 360;
      if (diff < -180) adjustedDiff = diff + 360;

      const smoothedHeading =
        lastHeadingRef.current + adjustedDiff * smoothingFactor;
      const normalizedHeading = ((smoothedHeading % 360) + 360) % 360;

      setHeading(normalizedHeading);
      lastHeadingRef.current = normalizedHeading;
    }, 50); // 50ms debounce
  }, []);

  const startCompass = () => {
    if (subscriptionRef.current) {
      console.log('useCompassHeading - Compass already started');
      return;
    }

    console.log('useCompassHeading - Starting compass...');
    try {
      setError(null);
      setIsActive(true);

      subscriptionRef.current = CompassHeading.start(1, (headingData: any) => {
        if (headingData && typeof headingData.heading === 'number') {
          // Normalize heading to 0-360 range
          let normalizedHeading = ((headingData.heading % 360) + 360) % 360;

          updateHeading(normalizedHeading);

          if (headingData.accuracy) {
            setAccuracy(headingData.accuracy);
          }
        }
      });

      console.log('useCompassHeading - Compass started successfully');
    } catch (err: any) {
      console.error('useCompassHeading - Error starting compass:', err);
      setError(`Compass error: ${err.message || 'Unknown error'}`);
      setIsActive(false);
    }
  };

  const stopCompass = () => {
    console.log('useCompassHeading - Stopping compass...');
    if (subscriptionRef.current) {
      try {
        CompassHeading.stop();
      } catch (err) {
        console.error('useCompassHeading - Error stopping compass:', err);
      }
      subscriptionRef.current = null;
    }
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    setIsActive(false);
    lastHeadingRef.current = 0;
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
  };
};
