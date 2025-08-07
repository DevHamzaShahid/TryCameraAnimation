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

  const startCompass = useCallback(() => {
    if (subscriptionRef.current) {
      console.log('useCompassHeading - Compass already started');
      return;
    }

    console.log('useCompassHeading - Starting compass...');
    try {
      setError(null);
      setIsActive(true);

      subscriptionRef.current = CompassHeading.start(1, (headingData: any) => {
        console.log('useCompassHeading - Raw data:', headingData);

        if (headingData && typeof headingData.heading === 'number') {
          // Normalize heading to 0-360 range
          let normalizedHeading = ((headingData.heading % 360) + 360) % 360;

          console.log(
            'useCompassHeading - Setting heading:',
            normalizedHeading,
          );
          setHeading(normalizedHeading);

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
  }, []);

  const stopCompass = useCallback(() => {
    console.log('useCompassHeading - Stopping compass...');
    if (subscriptionRef.current) {
      try {
        CompassHeading.stop();
      } catch (err) {
        console.error('useCompassHeading - Error stopping compass:', err);
      }
      subscriptionRef.current = null;
    }
    setIsActive(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCompass();
    };
  }, [stopCompass]);

  return {
    heading,
    accuracy,
    isActive,
    error,
    startCompass,
    stopCompass,
  };
};
