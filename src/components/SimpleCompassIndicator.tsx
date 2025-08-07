import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useCompassHeading } from '../hooks/useCompassHeading';
import { headingToCardinal } from '../utils/compassUtils';

export const SimpleCompassIndicator: React.FC = () => {
  const { heading, accuracy, isActive } = useCompassHeading();

  return (
    <View style={styles.container}>
      <View style={styles.indicatorRow}>
        <Text style={styles.label}>🧭</Text>
        <Text style={styles.heading}>{Math.round(heading)}°</Text>
        <Text style={styles.direction}>{headingToCardinal(heading)}</Text>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: isActive ? '#27AE60' : '#E74C3C' },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    zIndex: 1000,
  },
  indicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 16,
    color: 'white',
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    minWidth: 50,
    textAlign: 'center',
  },
  direction: {
    fontSize: 14,
    color: '#4ECDC4',
    fontWeight: 'bold',
    minWidth: 30,
    textAlign: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
