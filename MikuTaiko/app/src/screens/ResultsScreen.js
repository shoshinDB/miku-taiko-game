import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppContext } from '../contexts/AppContext';

export default function ResultsScreen() {
  const navigation = useNavigation();
  const {
    currentScore,
    maxCombo,
    accuracy,
    selectedSong,
  } = useAppContext();

  const handlePlayAgain = () => {
    navigation.navigate('SongSelect');
  };

  const handleMainMenu = () => {
    navigation.navigate('Home');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Results</Text>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Score</Text>
            <Text style={styles.statValue}>{currentScore}</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Max Combo</Text>
            <Text style={styles.statValue}>{maxCombo}x</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Accuracy</Text>
            <Text style={styles.statValue}>{accuracy.toFixed(1)}%</Text>
          </View>
        </View>

        {selectedSong && (
          <View style={styles.songInfo}>
            <Text style={styles.songTitle}>{selectedSong.title}</Text>
            <Text style={styles.songArtist}>{selectedSong.artist}</Text>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.playAgainButton]}
            onPress={handlePlayAgain}
          >
            <Text style={styles.buttonText}>Play Again</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.menuButton]}
            onPress={handleMainMenu}
          >
            <Text style={styles.buttonText}>Main Menu</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 40,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },
  statsContainer: {
    width: '100%',
    maxWidth: 300,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  statLabel: {
    fontSize: 18,
    color: '#ffffff',
    opacity: 0.8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  songInfo: {
    alignItems: 'center',
    marginBottom: 40,
  },
  songTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  songArtist: {
    fontSize: 18,
    color: '#ffffff',
    opacity: 0.8,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
    gap: 15,
  },
  button: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  playAgainButton: {
    backgroundColor: '#4CAF50',
  },
  menuButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
