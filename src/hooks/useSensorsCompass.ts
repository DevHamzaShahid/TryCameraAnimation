import { useState, useEffect, useRef } from 'react';
import { magnetometer, SensorData, setUpdateIntervalForType, SensorTypes } from 'react-native-sensors';

interface UseSensorsCompassReturn {
  heading: number;
  isActive: boolean;
  error: string | null;
  startCompass: () => void;
  stopCompass: () => void;
}

export const useSensorsCompass = (): UseSensorsCompassReturn => {
  const [heading, setHeading] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const subscriptionRef = useRef<any>(null);

  const calculateHeading = (x: number, y: number): number => {
    // Calculate heading from magnetometer data
    let heading = Math.atan2(y, x) * (180 / Math.PI);
    
    // Normalize to 0-360 degrees
    if (heading < 0) {
      heading += 360;
    }
    
    return heading;
  };

  const startCompass = () => {
    if (subscriptionRef.current) {
      console.log('useSensorsCompass - Compass already started');
      return;
    }

    console.log('useSensorsCompass - Starting compass...');
    try {
      setError(null);
      setIsActive(true);
      
      // Set update interval to 100ms
      setUpdateIntervalForType(SensorTypes.magnetometer, 100);
      
      subscriptionRef.current = magnetometer.subscribe(
        (data: SensorData) => {
          try {
            console.log('useSensorsCompass - Received magnetometer data:', data);
            
            const { x, y } = data;
            const calculatedHeading = calculateHeading(x, y);
            
            console.log('useSensorsCompass - Calculated heading:', calculatedHeading);
            setHeading(calculatedHeading);
          } catch (err) {
            console.error('useSensorsCompass - Error processing sensor data:', err);
            setError('Failed to process sensor data');
          }
        },
        (error) => {
          console.error('useSensorsCompass - Sensor error:', error);
          setError(`Sensor error: ${error.message || 'Unknown error'}`);
          setIsActive(false);
        }
      );
      
      console.log('useSensorsCompass - Magnetometer started successfully');
    } catch (err: any) {
      console.error('useSensorsCompass - Error starting magnetometer:', err);
      setError(`Magnetometer error: ${err.message || 'Unknown error'}`);
      setIsActive(false);
    }
  };

  const stopCompass = () => {
    console.log('useSensorsCompass - Stopping compass...');
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
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