import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import NavigationMapScreen from './src/screens/NavigationMapScreen';

function App(): any {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      <NavigationMapScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
