import { useState, useEffect, useRef } from 'react';
import CompassHeading from 'react-native-compass-heading';

interface UseSimpleCompassReturn {
  heading: number;
  isActive: boolean;
  error: string | null;
  startCompass: () => void;
  stopCompass: () => void;
}

export const useSimpleCompass = (): UseSimpleCompassReturn => {
  const [heading, setHeading] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const subscriptionRef = useRef<any>(null);

  const startCompass = () => {
    if (subscriptionRef.current) {
      console.log('useSimpleCompass - Compass already started');
      return;
    }

    console.log('useSimpleCompass - Starting compass...');
    try {
      setError(null);
      setIsActive(true);
      
      subscriptionRef.current = CompassHeading.start(1, (headingData: any) => {
        try {
          console.log('useSimpleCompass - Received heading data:', headingData);
          
          const { heading: rawHeading, accuracy } = headingData;
          
          if (typeof rawHeading === 'number' && !isNaN(rawHeading)) {
            console.log('useSimpleCompass - Setting heading:', rawHeading);
            setHeading(rawHeading);
          } else {
            console.warn('useSimpleCompass - Invalid heading data:', rawHeading);
          }
        } catch (err) {
          console.error('useSimpleCompass - Error processing compass data:', err);
          setError('Failed to process compass data');
        }
      });
      
      console.log('useSimpleCompass - Compass started successfully');
    } catch (err: any) {
      console.error('useSimpleCompass - Error starting compass:', err);
      setError(`Compass error: ${err.message || 'Unknown error'}`);
      setIsActive(false);
    }
  };

  const stopCompass = () => {
    console.log('useSimpleCompass - Stopping compass...');
    if (subscriptionRef.current) {
      CompassHeading.stop();
      subscriptionRef.current = null;
    }
    setIsActive(false);
  };

  useEffect(() => {
    return () => {
      stopCompass();
    };
  }, []);

  return {
    heading,
    isActive,
    error,
    startCompass,
    stopCompass,
  };
};