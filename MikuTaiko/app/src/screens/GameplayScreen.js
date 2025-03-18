import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions, 
  Animated, 
  Image,
  SafeAreaView, 
  StatusBar
} from 'react-native';
import { useAppContext } from '../contexts/AppContext';
import { useGameContext } from '../contexts/GameContext';

const { width, height } = Dimensions.get('window');
const HIT_POSITION = width * 0.2;

// Use the song's beatmap from the song selection, or use this default beatmap
const DEFAULT_BEATMAP = [
  { type: 'don', time: 1000 },
  { type: 'ka', time: 2000 },
  { type: 'don', time: 3000 },
  { type: 'don', time: 3500 },
  { type: 'ka', time: 4000 },
  { type: 'don', time: 4500 },
  { type: 'ka', time: 5000 },
  { type: 'don', time: 5500 },
  { type: 'don', time: 6000 },
  { type: 'ka', time: 6500 },
  { type: 'don', time: 7000 },
];

const TIMING_WINDOW = 300; // ms
const PERFECT_WINDOW = 100; // ms
const NOTE_SPEED = 350; // pixels per second

export default function GameplayScreen({ navigation, route }) {
  const {
    currentScore,
    setCurrentScore,
    combo,
    setCombo,
    maxCombo,
    setMaxCombo,
    accuracy,
    setAccuracy,
    selectedSong,
    saveHighScore
  } = useAppContext();

  const { gameSettings } = useGameContext();
  
  const [activeNotes, setActiveNotes] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [gameFinished, setGameFinished] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [countdownValue, setCountdownValue] = useState(3);
  const [hitFeedback, setHitFeedback] = useState(null);
  const [songTitle, setSongTitle] = useState('');
  
  const scrollX = useRef(new Animated.Value(0)).current;
  const songData = selectedSong || route.params?.selectedSong;

  // Initialize game countdown
  useEffect(() => {
    if (songData) {
      setSongTitle(songData.title);
    }
    
    // Show countdown before starting the game
    const countdownInterval = setInterval(() => {
      setCountdownValue(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setGameStarted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(countdownInterval);
  }, []);

  // Initialize game after countdown
  useEffect(() => {
    if (!gameStarted) return;
    
    // Reset score and combo
    setCurrentScore(0);
    setCombo(0);
    setMaxCombo(0);
    setAccuracy(100);
    setGameFinished(false);
    
    // Start the game timer
    setStartTime(Date.now());
    
    // Get beatmap from the selected song, or use default
    const beatmap = songData?.beatmap || DEFAULT_BEATMAP;
    
    // Adjust beatmap based on difficulty settings
    let adjustedBeatmap = [...beatmap];
    if (gameSettings.difficulty === 'hard') {
      // Make the game harder by adding more notes between existing ones
      let extraNotes = [];
      for (let i = 0; i < beatmap.length - 1; i++) {
        const midTime = (beatmap[i].time + beatmap[i+1].time) / 2;
        extraNotes.push({
          type: Math.random() > 0.5 ? 'don' : 'ka',
          time: midTime
        });
      }
      adjustedBeatmap = [...adjustedBeatmap, ...extraNotes].sort((a, b) => a.time - b.time);
    }
    
    setActiveNotes(adjustedBeatmap);

    // Game loop for note movement and missed notes
    const gameLoop = setInterval(() => {
      const currentTime = Date.now() - startTime;
      
      // Check for missed notes (past the hit window)
      setActiveNotes(prev => {
        const missedNotes = prev.filter(note => currentTime > note.time + TIMING_WINDOW);
        
        // Reset combo for each missed note
        if (missedNotes.length > 0) {
          setCombo(0);
          
          // Show miss feedback
          setHitFeedback({ type: 'miss', timestamp: Date.now() });
        }
        
        const remainingNotes = prev.filter(note => currentTime <= note.time + TIMING_WINDOW);
        
        // Check if all notes are gone to end the game
        if (remainingNotes.length === 0 && prev.length > 0) {
          clearInterval(gameLoop);
          
          // Add a delay before ending
          setTimeout(() => {
            setGameFinished(true);
            
            // Save high score before navigating
            if (songData?.id) {
              saveHighScore(songData.id, currentScore);
            }
            
            // Navigate to results after a delay
            setTimeout(() => {
              navigation.navigate('Results');
            }, 2000);
          }, 1000);
        }
        
        return remainingNotes;
      });
    }, 16);

    return () => clearInterval(gameLoop);
  }, [gameStarted]);

  // Clear hit feedback after animation
  useEffect(() => {
    if (hitFeedback) {
      const feedbackTimer = setTimeout(() => {
        setHitFeedback(null);
      }, 500);
      return () => clearTimeout(feedbackTimer);
    }
  }, [hitFeedback]);

  // Handle drum hit
  const handleHit = (type) => {
    if (!gameStarted || gameFinished) return;
    
    const currentTime = Date.now() - startTime;
    
    // Find a note of the correct type within the timing window
    const nearestNoteIndex = activeNotes.findIndex(note => {
      const timeDiff = Math.abs(note.time - currentTime);
      return note.type === type && timeDiff <= TIMING_WINDOW;
    });

    if (nearestNoteIndex !== -1) {
      const hitNote = activeNotes[nearestNoteIndex];
      const timeDiff = Math.abs(hitNote.time - currentTime);
      
      // Determine hit quality based on timing
      const isPerfect = timeDiff <= PERFECT_WINDOW;
      const isGood = timeDiff <= TIMING_WINDOW * 0.7;
      
      // Calculate points based on accuracy
      let points;
      let hitType;
      
      if (isPerfect) {
        points = 100;
        hitType = 'perfect';
      } else if (isGood) {
        points = 75;
        hitType = 'good';
      } else {
        points = 50;
        hitType = 'ok';
      }
      
      // Apply combo bonus
      const comboBonus = Math.min(combo * 0.1, 2.0);
      const totalPoints = Math.floor(points * (1 + comboBonus));
      
      // Update score and combo
      setCurrentScore(prev => prev + totalPoints);
      setCombo(prev => prev + 1);
      setMaxCombo(prev => Math.max(prev, combo + 1));
      
      // Show hit feedback
      setHitFeedback({ 
        type: hitType, 
        timestamp: Date.now(),
        points: totalPoints
      });
      
      // Remove hit note
      setActiveNotes(prev => 
        prev.filter((_, index) => index !== nearestNoteIndex)
      );
    } else {
      // Miss (wrong hit or no note to hit)
      setCombo(0);
      setHitFeedback({ type: 'miss', timestamp: Date.now() });
    }
  };

  // Calculate note position based on time
  const getNotePosition = (noteTime) => {
    if (!startTime) return width;
    
    const currentTime = Date.now() - startTime;
    const timeToImpact = noteTime - currentTime;
    
    return HIT_POSITION + (timeToImpact / 1000) * NOTE_SPEED;
  };

  // Get feedback text and color
  const getFeedbackTextAndColor = () => {
    if (!hitFeedback) return { text: '', color: 'transparent' };
    
    switch (hitFeedback.type) {
      case 'perfect':
        return { text: 'PERFECT!', color: '#4CAF50', points: hitFeedback.points };
      case 'good':
        return { text: 'GOOD!', color: '#2196F3', points: hitFeedback.points };
      case 'ok':
        return { text: 'OK', color: '#FF9800', points: hitFeedback.points };
      case 'miss':
        return { text: 'MISS', color: '#F44336' };
      default:
        return { text: '', color: 'transparent' };
    }
  };

  const feedback = getFeedbackTextAndColor();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.container}>
        {/* Song title and score info */}
        <View style={styles.headerContainer}>
          <Text style={styles.songTitle}>{songTitle}</Text>
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreText}>Score: {currentScore}</Text>
            <Text style={styles.comboText}>Combo: {combo}x</Text>
          </View>
        </View>
        
        {/* Game area */}
        <View style={styles.gameArea}>
          {!gameStarted && !gameFinished && (
            <View style={styles.countdownContainer}>
              <Text style={styles.countdownText}>{countdownValue}</Text>
            </View>
          )}
          
          {gameStarted && !gameFinished && (
            <>
              {/* Hit feedback */}
              <Animated.View style={[
                styles.feedbackContainer,
                {
                  opacity: hitFeedback ? 
                    new Animated.Value(1).interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0, 1, 0]
                    }) : 0
                }
              ]}>
                <Text style={[styles.feedbackText, { color: feedback.color }]}>
                  {feedback.text}
                </Text>
                {feedback.points && (
                  <Text style={[styles.pointsText, { color: feedback.color }]}>
                    +{feedback.points}
                  </Text>
                )}
              </Animated.View>
              
              {/* Playing field with notes */}
              <View style={styles.playfield}>
                {/* Hit line */}
                <View style={styles.hitLine} />
                
                {/* Moving notes */}
                {activeNotes.map((note, index) => {
                  const position = getNotePosition(note.time);
                  
                  // Only render notes that are on screen
                  if (position < -50 || position > width + 50) return null;
                  
                  return (
                    <View
                      key={index}
                      style={[
                        styles.note,
                        { 
                          left: position,
                          backgroundColor: note.type === 'don' ? '#ff4444' : '#4444ff'
                        }
                      ]}
                    >
                      <Text style={styles.noteText}>
                        {note.type === 'don' ? 'DON' : 'KA'}
                      </Text>
                    </View>
                  );
                })}
                
                {/* Taiko drum target zone */}
                <View style={styles.taikoTarget} />
              </View>
            </>
          )}
          
          {/* Game finished overlay */}
          {gameFinished && (
            <View style={styles.gameFinishedOverlay}>
              <Text style={styles.gameFinishedText}>Song Complete!</Text>
              <Text style={styles.finalScoreText}>Score: {currentScore}</Text>
            </View>
          )}
        </View>
        
        {/* Drum controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.drumPad, styles.donPad]}
            activeOpacity={0.7}
            onPress={() => handleHit('don')}
          >
            <Text style={styles.padText}>DON</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.drumPad, styles.kaPad]}
            activeOpacity={0.7}
            onPress={() => handleHit('ka')}
          >
            <Text style={styles.padText}>KA</Text>
          </TouchableOpacity>
        </View>
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
  },
  headerContainer: {
    padding: 15,
  },
  songTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  scoreText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  comboText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  gameArea: {
    flex: 1,
    position: 'relative',
  },
  countdownContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 10,
  },
  countdownText: {
    color: '#ffffff',
    fontSize: 80,
    fontWeight: 'bold',
  },
  feedbackContainer: {
    position: 'absolute',
    top: '10%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 5,
  },
  feedbackText: {
    fontSize: 32,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },
  pointsText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 5,
  },
  playfield: {
    height: 200,
    backgroundColor: '#16213e',
    position: 'relative',
  },
  hitLine: {
    position: 'absolute',
    left: HIT_POSITION,
    width: 4,
    height: '100%',
    backgroundColor: '#ffffff',
    zIndex: 3,
  },
  taikoTarget: {
    position: 'absolute',
    left: HIT_POSITION - 30,
    top: '50%',
    width: 60,
    height: 60,
    borderRadius: 30,
    marginTop: -30,
    borderWidth: 2,
    borderColor: '#ffffff',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 2,
  },
  note: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    top: '50%',
    marginTop: -25,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  noteText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    padding: 20,
    backgroundColor: '#16213e',
  },
  drumPad: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  donPad: {
    backgroundColor: '#ff4444',
  },
  kaPad: {
    backgroundColor: '#4444ff',
  },
  padText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  gameFinishedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  gameFinishedText: {
    color: '#ffffff',
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  finalScoreText: {
    color: '#ffffff',
    fontSize: 24,
  },
});
