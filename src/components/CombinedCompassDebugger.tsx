import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useCompassHeading } from '../hooks/useCompassHeading';

export const CombinedCompassDebugger: React.FC = () => {
  const compass = useCompassHeading();

  useEffect(() => {
    console.log('CombinedCompassDebugger - Starting compass...');
    compass.startCompass();
  }, [compass.startCompass]);

  useEffect(() => {
    console.log('CombinedCompassDebugger - Compass state:', {
      heading: compass.heading,
      isActive: compass.isActive,
      accuracy: compass.accuracy,
      error: compass.error,
      isCalibrated: compass.isCalibrated
    });
  }, [compass.heading, compass.isActive, compass.accuracy, compass.error, compass.isCalibrated]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Compass Debug</Text>
      
      <View style={styles.section}>
        <Text style={styles.subtitle}>Enhanced Compass</Text>
        <Text style={styles.text}>Heading: {Math.round(compass.heading)}°</Text>
        <Text style={styles.text}>Accuracy: {compass.accuracy.toFixed(1)}°</Text>
        <Text style={styles.text}>Active: {compass.isActive ? 'Yes' : 'No'}</Text>
        <Text style={styles.text}>Calibrated: {compass.isCalibrated ? 'Yes' : 'No'}</Text>
        {compass.error && <Text style={styles.error}>Error: {compass.error}</Text>}
      </View>

      <View style={styles.section}>
        <Text style={styles.subtitle}>Instructions</Text>
        <Text style={styles.instruction}>1. Rotate device in figure-8 pattern</Text>
        <Text style={styles.instruction}>2. Look for heading changes</Text>
        <Text style={styles.instruction}>3. Should see 0-360° range</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 200,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 10,
    borderRadius: 8,
    zIndex: 10000,
    minWidth: 200,
  },
  title: {
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  section: {
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
  },
  subtitle: {
    color: 'yellow',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  text: {
    color: 'white',
    fontSize: 12,
  },
  instruction: {
    color: '#4ECDC4',
    fontSize: 11,
    marginBottom: 2,
  },
  error: {
    color: 'red',
    fontSize: 12,
  },
});