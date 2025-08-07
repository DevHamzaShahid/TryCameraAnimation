import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSimpleCompass } from '../hooks/useSimpleCompass';
import { useSensorsCompass } from '../hooks/useSensorsCompass';

export const CombinedCompassDebugger: React.FC = () => {
  const simpleCompass = useSimpleCompass();
  const sensorsCompass = useSensorsCompass();

  useEffect(() => {
    console.log('CombinedCompassDebugger - Starting both compasses...');
    simpleCompass.startCompass();
    sensorsCompass.startCompass();
  }, [simpleCompass.startCompass, sensorsCompass.startCompass]);

  useEffect(() => {
    console.log('CombinedCompassDebugger - Simple compass state:', {
      heading: simpleCompass.heading,
      isActive: simpleCompass.isActive,
      error: simpleCompass.error
    });
  }, [simpleCompass.heading, simpleCompass.isActive, simpleCompass.error]);

  useEffect(() => {
    console.log('CombinedCompassDebugger - Sensors compass state:', {
      heading: sensorsCompass.heading,
      isActive: sensorsCompass.isActive,
      error: sensorsCompass.error
    });
  }, [sensorsCompass.heading, sensorsCompass.isActive, sensorsCompass.error]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Compass Debug</Text>
      
      <View style={styles.section}>
        <Text style={styles.subtitle}>Simple Compass</Text>
        <Text style={styles.text}>Heading: {Math.round(simpleCompass.heading)}°</Text>
        <Text style={styles.text}>Active: {simpleCompass.isActive ? 'Yes' : 'No'}</Text>
        {simpleCompass.error && <Text style={styles.error}>Error: {simpleCompass.error}</Text>}
      </View>

      <View style={styles.section}>
        <Text style={styles.subtitle}>Sensors Compass</Text>
        <Text style={styles.text}>Heading: {Math.round(sensorsCompass.heading)}°</Text>
        <Text style={styles.text}>Active: {sensorsCompass.isActive ? 'Yes' : 'No'}</Text>
        {sensorsCompass.error && <Text style={styles.error}>Error: {sensorsCompass.error}</Text>}
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
  error: {
    color: 'red',
    fontSize: 12,
  },
});