import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import CompassHeading from 'react-native-compass-heading';

export const SimpleCompassTest: React.FC = () => {
  const [heading, setHeading] = useState<number>(0);
  const [accuracy, setAccuracy] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const subscriptionRef = React.useRef<any>(null);

  const startCompass = () => {
    if (subscriptionRef.current) {
      console.log('SimpleCompassTest - Compass already started');
      return;
    }

    console.log('SimpleCompassTest - Starting compass...');
    try {
      setError(null);
      setIsActive(true);
      
      subscriptionRef.current = CompassHeading.start(1, (headingData: any) => {
        console.log('SimpleCompassTest - Raw data:', headingData);
        
        if (headingData && typeof headingData.heading === 'number') {
          setHeading(headingData.heading);
          if (headingData.accuracy) {
            setAccuracy(headingData.accuracy);
          }
        }
      });
      
      console.log('SimpleCompassTest - Compass started');
    } catch (err: any) {
      console.error('SimpleCompassTest - Error:', err);
      setError(err.message);
      setIsActive(false);
    }
  };

  const stopCompass = () => {
    if (subscriptionRef.current) {
      CompassHeading.stop();
      subscriptionRef.current = null;
    }
    setIsActive(false);
  };

  useEffect(() => {
    startCompass();
    return () => stopCompass();
  }, []);

  if (!isVisible) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.closeButton}
        onPress={() => setIsVisible(false)}
      >
        <Text style={styles.closeButtonText}>×</Text>
      </TouchableOpacity>
      
      <Text style={styles.title}>Simple Compass Test</Text>
      
      <View style={styles.dataRow}>
        <Text style={styles.label}>Heading:</Text>
        <Text style={styles.value}>{Math.round(heading)}°</Text>
      </View>
      
      <View style={styles.dataRow}>
        <Text style={styles.label}>Accuracy:</Text>
        <Text style={styles.value}>{accuracy.toFixed(1)}°</Text>
      </View>
      
      <View style={styles.dataRow}>
        <Text style={styles.label}>Active:</Text>
        <Text style={[styles.value, { color: isActive ? '#27AE60' : '#E74C3C' }]}>
          {isActive ? 'Yes' : 'No'}
        </Text>
      </View>
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      )}
      
      <TouchableOpacity 
        style={styles.button}
        onPress={isActive ? stopCompass : startCompass}
      >
        <Text style={styles.buttonText}>
          {isActive ? 'Stop Compass' : 'Start Compass'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 350,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    padding: 15,
    borderRadius: 10,
    minWidth: 200,
    zIndex: 10000,
  },
  closeButton: {
    position: 'absolute',
    top: 5,
    right: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  label: {
    color: '#ccc',
    fontSize: 12,
  },
  value: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  errorContainer: {
    marginTop: 10,
    padding: 5,
    backgroundColor: 'rgba(231, 76, 60, 0.3)',
    borderRadius: 5,
  },
  errorText: {
    color: '#E74C3C',
    fontSize: 11,
  },
  button: {
    marginTop: 10,
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
