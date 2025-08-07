import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useCompassHeading } from '../hooks/useCompassHeading';
import { headingToCardinal } from '../utils/compassUtils';

export const CompassTestComponent: React.FC = () => {
  const compass = useCompassHeading();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    compass.startCompass();
  }, [compass.startCompass]);

  if (!isVisible) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.closeButton}
        onPress={() => setIsVisible(false)}
      >
        <Text style={styles.closeButtonText}>×</Text>
      </TouchableOpacity>
      
      <Text style={styles.title}>Compass Test</Text>
      
      <View style={styles.dataRow}>
        <Text style={styles.label}>Heading:</Text>
        <Text style={styles.value}>{Math.round(compass.heading)}°</Text>
      </View>
      
      <View style={styles.dataRow}>
        <Text style={styles.label}>Direction:</Text>
        <Text style={styles.value}>{headingToCardinal(compass.heading)}</Text>
      </View>
      
      <View style={styles.dataRow}>
        <Text style={styles.label}>Accuracy:</Text>
        <Text style={styles.value}>{compass.accuracy.toFixed(1)}°</Text>
      </View>
      
      <View style={styles.dataRow}>
        <Text style={styles.label}>Active:</Text>
        <Text style={[styles.value, { color: compass.isActive ? '#27AE60' : '#E74C3C' }]}>
          {compass.isActive ? 'Yes' : 'No'}
        </Text>
      </View>
      
      {compass.error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {compass.error}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
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
}); 