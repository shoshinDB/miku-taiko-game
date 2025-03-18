import React, { useState } from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  Dimensions,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { useAppContext } from '../contexts/AppContext';

const { width } = Dimensions.get('window');

const songs = [
  {
    id: 1,
    title: "Redial",
    artist: "Miku Hatsune",
    difficulty: "Easy",
    coverImage: require('../../../assets/images/redial.png'),
    beatmap: [
      { type: 'don', time: 1000 },
      { type: 'ka', time: 2000 },
      { type: 'don', time: 3000 },
    ]
  },
  {
    id: 2, 
    title: "World is Mine",
    artist: "Miku Hatsune",
    difficulty: "Medium",
    coverImage: require('../../../assets/images/world-is-mine.jpg'),
    beatmap: [
      { type: 'don', time: 800 },
      { type: 'ka', time: 1600 },
      { type: 'don', time: 2400 },
    ]
  },
  {
    id: 3,
    title: "Freely Tomorrow",
    artist: "Miku Hatsune",
    difficulty: "Hard",
    coverImage: require('../../../assets/images/freely-tomorrow.png'), 
    beatmap: [
      { type: 'don', time: 500 },
      { type: 'ka', time: 1000 },
      { type: 'don', time: 1500 },
    ]
  }
];

export default function SongSelectScreen({ navigation }) {
  const { setSelectedSong, getHighScore } = useAppContext();
  const [selectedIndex, setSelectedIndex] = useState(null);
  
  const handleSongSelect = (song, index) => {
    setSelectedIndex(index);
    setSelectedSong(song);
    
    // Add a small delay for visual feedback before navigating
    setTimeout(() => {
      navigation.navigate('Gameplay', { selectedSong: song });
    }, 300);
  };

  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'Easy': return '#4CAF50';
      case 'Medium': return '#FFC107';
      case 'Hard': return '#F44336';
      default: return '#4CAF50';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        <Text style={styles.title}>Select a Song</Text>
        <Text style={styles.subtitle}>Choose your rhythm challenge</Text>
        
        <ScrollView 
          style={styles.songList}
          showsVerticalScrollIndicator={false}
        >
          {songs.map((song, index) => (
            <TouchableOpacity
              key={song.id}
              style={[
                styles.songCard,
                selectedIndex === index && styles.selectedCard
              ]}
              activeOpacity={0.7}
              onPress={() => handleSongSelect(song, index)}
            >
              <View style={styles.cardContent}>
                <Image 
                  source={song.coverImage}
                  style={styles.coverImage}
                  defaultSource={require('../../../assets/images/redial.png')}
                />
                <View style={styles.songInfo}>
                  <Text style={styles.songTitle}>{song.title}</Text>
                  <Text style={styles.artistName}>{song.artist}</Text>
                  <View style={styles.difficultyContainer}>
                    <View 
                      style={[
                        styles.difficultyBadge,
                        { backgroundColor: getDifficultyColor(song.difficulty) }
                      ]}
                    >
                      <Text style={styles.difficultyText}>{song.difficulty}</Text>
                    </View>
                  </View>
                  <Text style={styles.highScore}>
                    High Score: {getHighScore(song.id).toLocaleString()}
                  </Text>
                </View>
              </View>
              
              <View style={styles.playButtonContainer}>
                <TouchableOpacity 
                  style={styles.playButton}
                  onPress={() => handleSongSelect(song, index)}
                >
                  <Text style={styles.playButtonText}>PLAY</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#bbbbbb',
    textAlign: 'center',
    marginBottom: 24,
  },
  songList: {
    flex: 1,
  },
  songCard: {
    backgroundColor: '#16213e',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2a2a5a',
  },
  selectedCard: {
    borderColor: '#4a78f3',
    shadowColor: '#4a78f3',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  cardContent: {
    flexDirection: 'row',
    padding: 15,
    alignItems: 'center',
  },
  coverImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  songInfo: {
    marginLeft: 15,
    flex: 1,
  },
  songTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  artistName: {
    fontSize: 14,
    color: '#bbbbbb',
    marginBottom: 10,
  },
  difficultyContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  highScore: {
    fontSize: 14,
    color: '#e0e0e0',
  },
  playButtonContainer: {
    borderTopWidth: 1,
    borderTopColor: '#2a2a5a',
    padding: 10,
    alignItems: 'center',
  },
  playButton: {
    backgroundColor: '#4a78f3',
    paddingVertical: 8,
    paddingHorizontal: 30,
    borderRadius: 20,
  },
  playButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  backButton: {
    marginTop: 20,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ffffff',
    padding: 12,
    borderRadius: 25,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
});
