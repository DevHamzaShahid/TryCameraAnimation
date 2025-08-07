import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface ManualRotationTestProps {
  onHeadingChange: (heading: number) => void;
}

export const ManualRotationTest: React.FC<ManualRotationTestProps> = ({ onHeadingChange }) => {
  const [currentHeading, setCurrentHeading] = useState(0);

  const rotateBy = (degrees: number) => {
    const newHeading = (currentHeading + degrees) % 360;
    setCurrentHeading(newHeading);
    onHeadingChange(newHeading);
    console.log('ManualRotationTest - Setting heading to:', newHeading);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manual Rotation Test</Text>
      <Text style={styles.text}>Current: {Math.round(currentHeading)}°</Text>
      
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.button} onPress={() => rotateBy(-90)}>
          <Text style={styles.buttonText}>-90°</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => rotateBy(-45)}>
          <Text style={styles.buttonText}>-45°</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => rotateBy(45)}>
          <Text style={styles.buttonText}>+45°</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => rotateBy(90)}>
          <Text style={styles.buttonText}>+90°</Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity style={[styles.button, styles.resetButton]} onPress={() => rotateBy(-currentHeading)}>
        <Text style={styles.buttonText}>Reset</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 200,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 10,
    borderRadius: 8,
    zIndex: 10000,
  },
  title: {
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  text: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 4,
    marginHorizontal: 2,
  },
  resetButton: {
    backgroundColor: '#FF6B6B',
    alignSelf: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});