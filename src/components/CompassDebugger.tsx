import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSimpleCompass } from '../hooks/useSimpleCompass';

export const CompassDebugger: React.FC = () => {
  const { heading, isActive, error, startCompass } = useSimpleCompass();

  useEffect(() => {
    console.log('CompassDebugger - Starting compass...');
    startCompass();
  }, [startCompass]);

  useEffect(() => {
    console.log('CompassDebugger - State update:', {
      heading,
      isActive,
      error
    });
  }, [heading, isActive, error]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Compass Debug</Text>
      <Text style={styles.text}>Heading: {Math.round(heading)}°</Text>
      <Text style={styles.text}>Active: {isActive ? 'Yes' : 'No'}</Text>
      {error && <Text style={styles.error}>Error: {error}</Text>}
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
  },
  title: {
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  text: {
    color: 'white',
    fontSize: 12,
  },
  error: {
    color: 'red',
    fontSize: 12,
  },
});