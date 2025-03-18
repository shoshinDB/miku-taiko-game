import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  Dimensions,
  SafeAreaView,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { useAppContext } from '../contexts/AppContext';
import BeatmapManager from '../utils/BeatmapManager';

const { width } = Dimensions.get('window');

// Built-in songs
const builtInSongs = [
  {
    id: 1,
    title: "Redial",
    artist: "Miku Hatsune",
    difficulty: "Easy",
    coverImage: require('../../../assets/images/redial.png'),
    audioFile: require('../../../assets/songs/redial.mp3'),
    beatmap: [
      { type: 'don', time: 1000 },
      { type: 'ka', time: 2000 },
      { type: 'don', time: 3000 },
      { type: 'don', time: 4000 },
      { type: 'ka', time: 5000 },
      { type: 'don', time: 6000 },
      { type: 'ka', time: 7000 },
      { type: 'don', time: 8000 },
      { type: 'don', time: 9000 },
      { type: 'ka', time: 10000 },
      { type: 'don', time: 11000 },
      { type: 'ka', time: 12000 },
      { type: 'don', time: 13000 },
      { type: 'don', time: 14000 },
      { type: 'ka', time: 15000 },
      { type: 'don', time: 16000 },
      { type: 'ka', time: 17000 },
      { type: 'don', time: 18000 },
      { type: 'don', time: 19000 },
      { type: 'ka', time: 20000 },
      { type: 'don', time: 21000 },
      { type: 'ka', time: 22000 },
      { type: 'don', time: 23000 },
      { type: 'don', time: 24000 },
      { type: 'ka', time: 25000 },
      { type: 'don', time: 26000 },
      { type: 'ka', time: 27000 },
      { type: 'don', time: 28000 },
      { type: 'don', time: 29000 },
      { type: 'ka', time: 30000 },
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
  const { setSelectedSong, getHighScore, customSongs } = useAppContext();
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [osuSongs, setOsuSongs] = useState([]);
  
  // Load osu beatmaps on component mount
  useEffect(() => {
    const loadOsuBeatmaps = async () => {
      setIsLoading(true);
      
      try {
        // Initialize the BeatmapManager
        await BeatmapManager.initialize();
        
        // Get converted songs from the BeatmapManager
        const songs = BeatmapManager.getSongsFromBeatmaps();
        setOsuSongs(songs);
        
        console.log(`Loaded ${songs.length} songs from .osu beatmaps`);
      } catch (error) {
        console.error('Error loading .osu beatmaps:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadOsuBeatmaps();
  }, []);
  
  // Combine all song sources: built-in, custom imported, and osu beatmaps
  const allSongs = [...builtInSongs, ...customSongs, ...osuSongs];
  
  const handleSongSelect = (song, index) => {
    setSelectedIndex(index);
    setSelectedSong(song);
    
    // Add a small delay for visual feedback before navigating
    setTimeout(() => {
      navigation.navigate('Gameplay', { selectedSong: song });
    }, 300);
  };

  // Handle navigation to the import screen
  const handleImportPress = () => {
    navigation.navigate('Import');
  };

  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'Easy': return '#4CAF50';
      case 'Medium': return '#FFC107';
      case 'Hard': return '#F44336';
      default: return '#4CAF50';
    }
  };

  // Get a badge indicator for the song source
  const getSongSourceBadge = (song) => {
    if (song.source === 'osu') {
      return <Text style={[styles.sourceBadge, { backgroundColor: '#ff66aa' }]}>osu!</Text>;
    } else if (song.isCustom) {
      return <Text style={[styles.sourceBadge, { backgroundColor: '#ff9500' }]}>Custom</Text>;
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        <Text style={styles.title}>Select a Song</Text>
        <Text style={styles.subtitle}>Choose your rhythm challenge</Text>
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4a78f3" />
            <Text style={styles.loadingText}>Loading beatmaps...</Text>
          </View>
        ) : (
          <ScrollView 
            style={styles.songList}
            contentContainerStyle={styles.songListContent}
            showsVerticalScrollIndicator={false}
          >
            {allSongs.map((song, index) => (
              <TouchableOpacity
                key={song.id}
                style={[
                  styles.songCard,
                  selectedIndex === index && styles.selectedCard,
                  song.source === 'osu' && styles.osuSongCard,
                  song.isCustom && styles.customSongCard
                ]}
                onPress={() => handleSongSelect(song, index)}
              >
                <Image
                  source={song.coverImage || require('../../../assets/images/default-cover.png')}
                  style={styles.coverImage}
                  resizeMode="cover"
                />
                
                <View style={styles.songInfo}>
                  <Text style={styles.songTitle}>{song.title}</Text>
                  <Text style={styles.artistName}>{song.artist}</Text>
                  
                  <View style={styles.songMetrics}>
                    <Text style={[
                      styles.difficulty, 
                      { color: getDifficultyColor(song.difficulty) }
                    ]}>
                      {song.difficulty}
                    </Text>
                    
                    {song.bpm && (
                      <Text style={styles.bpm}>BPM: {song.bpm}</Text>
                    )}
                    
                    <Text style={styles.highScore}>
                      High Score: {getHighScore(song.id)}
                    </Text>
                    
                    {getSongSourceBadge(song)}
                  </View>
                  
                  <View style={styles.noteCount}>
                    <Text style={styles.noteCountText}>
                      {song.beatmap?.length || 0} notes
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
            
            {/* Import button at the bottom */}
            <TouchableOpacity 
              style={styles.importButton}
              onPress={handleImportPress}
            >
              <Text style={styles.importButtonText}>Import .osz Beatmap</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
        
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
  songListContent: {
    padding: 20,
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
  customSongCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#ff9500',
  },
  osuSongCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#ff66aa',
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
  songMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  difficulty: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 10,
  },
  bpm: {
    fontSize: 14,
    color: '#bbbbbb',
    marginRight: 10,
  },
  highScore: {
    fontSize: 14,
    color: '#e0e0e0',
  },
  sourceBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
    overflow: 'hidden',
  },
  noteCount: {
    marginTop: 5,
  },
  noteCountText: {
    fontSize: 12,
    color: '#aaaaaa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    marginTop: 16,
    fontSize: 16,
  },
  importButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderStyle: 'dashed',
  },
  importButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
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
