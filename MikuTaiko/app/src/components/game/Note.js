import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useAppContext } from '../../contexts/AppContext';

const Note = ({ type, startTime, onComplete }) => {
  const { noteSpeed } = useAppContext();
  const [position] = useState(new Animated.Value(400)); // Start from right edge

  useEffect(() => {
    // Animate note moving from right to left
    Animated.timing(position, {
      toValue: -50, // Move past left edge
      duration: 2000 / noteSpeed, // Adjust speed based on noteSpeed setting
      useNativeDriver: true,
    }).start(() => {
      if (onComplete) {
        onComplete();
      }
    });
  }, []);

  return (
    <Animated.View
      style={[
        styles.note,
        type === 'don' ? styles.donNote : styles.kaNote,
        {
          transform: [{ translateX: position }]
        }
      ]}
    />
  );
};

const styles = StyleSheet.create({
  note: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    top: '50%',
    marginTop: -20,
  },
  donNote: {
    backgroundColor: '#ff4444', // Red for don
  },
  kaNote: {
    backgroundColor: '#4444ff', // Blue for ka
  }
});

export default Note;
