import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useAppContext } from '../../contexts/AppContext';

const TaikoDrum = () => {
  const { setCombo, setCurrentScore } = useAppContext();

  const handleDon = () => {
    // Handle don (red) hit
    setCurrentScore(prev => prev + 100);
    setCombo(prev => prev + 1);
  };

  const handleKa = () => {
    // Handle ka (blue) hit
    setCurrentScore(prev => prev + 100); 
    setCombo(prev => prev + 1);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.drumPad, styles.donPad]}
        onPress={handleDon}
      />
      <TouchableOpacity
        style={[styles.drumPad, styles.kaPad]}
        onPress={handleKa}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 20,
  },
  drumPad: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  donPad: {
    backgroundColor: '#ff4444',
  },
  kaPad: {
    backgroundColor: '#4444ff',
  },
});

export default TaikoDrum;
