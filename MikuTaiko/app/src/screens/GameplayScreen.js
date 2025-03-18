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
  StatusBar,
  Platform
} from 'react-native';
import { Audio } from 'expo-av';
import { useAppContext } from '../contexts/AppContext';
import { useGameContext } from '../contexts/GameContext';
import { useFocusEffect } from '@react-navigation/native';
import OsuParser from '../utils/OsuParser';

const { width, height } = Dimensions.get('window');
const HIT_POSITION = width * 0.2;

// This will be used as a fallback if no beatmap is found
const DEFAULT_BEATMAP = [
  { type: 'don', time: 1000 },
  { type: 'don', time: 2000 },
  { type: 'ka', time: 3000 },
  { type: 'don', time: 3500 },
  { type: 'ka', time: 4000 },
  { type: 'don', time: 4500 },
  { type: 'ka', time: 5000 },
  { type: 'don', time: 5500 },
  { type: 'don', time: 6000 },
  { type: 'ka', time: 6500 },
  { type: 'don', time: 7000 },
];

// Add minimum start time to prevent notes from immediately being missed
const MIN_START_TIME = 3000; // Minimum 3 seconds after game starts before any note

// Load the osu beatmap at startup
const loadOsuBeatmap = async () => {
  try {
    // Load our example .osu file
    const osuBeatmap = await OsuParser.parseOsuFile(
      require('../../../assets/songs/osu/example1.osu')
    );
    
    console.log('Loaded osu beatmap:', osuBeatmap.title);
    console.log('Total notes:', osuBeatmap.beatmap.length);
    
    return osuBeatmap.beatmap;
  } catch (error) {
    console.error('Error loading osu beatmap:', error);
    return DEFAULT_BEATMAP; // Fallback to default if there's an error
  }
};

// Will be populated with the parsed .osu beatmap
let OSU_BEATMAP = null;

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
  const [sound, setSound] = useState(null);
  const [audioStatus, setAudioStatus] = useState('Loading...');
  const [timeOffset, setTimeOffset] = useState(0); // Note timing offset
  const [debugStatus, setDebugStatus] = useState('Initializing...'); // Extra debugging info
  
  const scrollX = useRef(new Animated.Value(0)).current;
  const songData = selectedSong || route.params?.selectedSong;

  // Initialize game countdown
  useEffect(() => {
    console.log('GAME INITIALIZATION STARTING - THIS SHOULD BE VISIBLE IN LOGS 🎯');
    
    // Play a quick test sound to verify audio system
    const testAudioSystem = async () => {
      try {
        console.log('RUNNING AUDIO SYSTEM TEST');
        setAudioStatus('Testing audio system...');
        
        // Request audio permissions
        const { granted } = await Audio.requestPermissionsAsync();
        if (!granted) {
          console.log('⚠️ TEST FAILED: Audio permissions not granted');
          setAudioStatus('Error: No audio permissions');
          return;
        }
        
        // Set up audio mode
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        });
        
        console.log('DIRECT SONG TEST: Attempting to directly play song file');
        
        // Try to play the song directly here to test
        if (songData?.audioFile) {
          try {
            console.log('TEST: Creating sound from song file directly:', songData.audioFile);
            const { sound: testSound } = await Audio.Sound.createAsync(
              songData.audioFile,
              { volume: 1.0 }
            );
            
            console.log('TEST: Playing song directly');
            await testSound.playAsync();
          } catch (error) {
            console.error('TEST FAILED: Direct song playback error:', error);
            setAudioStatus(`Song test error: ${error.message}`);
          }
        } else {
          console.log('TEST: No song file available for direct test');
          setAudioStatus('No song file for testing');
        }
      } catch (error) {
        console.error('TEST FAILED: Audio system test error:', error);
        setAudioStatus(`Audio test error: ${error.message}`);
      }
    };
    
    // Run the audio test
    testAudioSystem();
    
    if (songData) {
      console.log('SONG DATA FOUND:', {
        title: songData.title,
        artist: songData.artist,
        audioFile: songData.audioFile ? 'AVAILABLE' : 'MISSING',
        totalNotes: songData.beatmap?.length || 'UNKNOWN',
        offset: songData.offset || 0
      });
      setSongTitle(songData.title);
      
      // Set timing offset if specified in the song data (for imported osu maps)
      if (songData.offset) {
        console.log('TIMING: Setting offset to', songData.offset, 'ms');
        setTimeOffset(songData.offset);
      }
    } else {
      console.log('⚠️ NO SONG DATA AVAILABLE - THIS IS A CRITICAL ERROR');
    }
    
    // Show countdown before starting the game
    const countdownInterval = setInterval(() => {
      setCountdownValue(prev => {
        console.log(`COUNTDOWN VALUE: ${prev}`);
        if (prev <= 1) {
          console.log('COUNTDOWN COMPLETE - GAME STARTING');
          clearInterval(countdownInterval);
          setGameStarted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(countdownInterval);
  }, []);

  // Load and play song
  useEffect(() => {
    // Function to load and play the song
    async function loadAndPlaySong() {
      try {
        console.log('AUDIO DEBUG: Starting to load song');
        
        // First unload any previous sound
        if (sound) {
          console.log('AUDIO DEBUG: Unloading previous sound');
          await sound.unloadAsync();
        }
    
        // Check if we have an audio file for this song
        if (songData?.audioFile) {
          console.log('AUDIO DEBUG: Audio file found for:', songData.title);
          console.log('AUDIO DEBUG: Audio file:', JSON.stringify(songData.audioFile));
          
          // Request audio permissions first
          console.log('AUDIO DEBUG: Requesting audio permissions');
          const { granted } = await Audio.requestPermissionsAsync();
          if (!granted) {
            console.warn('AUDIO DEBUG: Audio permissions not granted');
            return;
          }
          console.log('AUDIO DEBUG: Audio permissions granted');
          
          // Set audio mode for music playback
          console.log('AUDIO DEBUG: Setting audio mode');
          await Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            staysActiveInBackground: true,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false, // Add this to ensure it plays through speakers
          });
          
          // Create a new sound object with improved settings
          console.log('AUDIO DEBUG: Creating sound object');
          const { sound: newSound } = await Audio.Sound.createAsync(
            songData.audioFile,
            { 
              shouldPlay: false,
              volume: gameSettings?.volume || 0.8,
              progressUpdateIntervalMillis: 50,
              isLooping: true, // Enable looping by default
            },
            (status) => {
              console.log('AUDIO DEBUG: Sound status update:', JSON.stringify(status));
              
              // If sound finished playing and game is still going, loop it
              if (status.didJustFinish && !gameFinished) {
                console.log('AUDIO DEBUG: Sound finished, playing again');
                newSound.replayAsync().catch(e => console.error('Replay error:', e));
              }
            }
          );
          
          // Save sound object to state
          setSound(newSound);
          console.log('AUDIO DEBUG: Sound loaded successfully');
          setAudioStatus('Sound loaded successfully - ready to play');
        } else {
          console.log('AUDIO DEBUG: No audio file available for this song');
          setAudioStatus('ERROR: No audio file available');
        }
      } catch (error) {
        console.error('AUDIO DEBUG: Error loading song:', error);
        setAudioStatus(`Error loading: ${error.message}`);
      }
    }

    // Load the song when component mounts
    loadAndPlaySong();

    // Cleanup function to unload the sound
    return () => {
      if (sound) {
        console.log('AUDIO DEBUG: Cleanup - unloading sound');
        sound.unloadAsync();
      }
    };
  }, [songData]);

  // Play sound when game starts
  useEffect(() => {
    if (gameStarted && sound) {
      // Play the sound when the game starts
      const playSong = async () => {
        try {
          console.log('AUDIO DEBUG: Attempting to play song now that game has started');
          setAudioStatus('Attempting to play...');
          
          // Check sound status before playing
          const status = await sound.getStatusAsync();
          console.log('AUDIO DEBUG: Sound status before playing:', JSON.stringify(status));
          
          // Reset position if needed
          if (status.positionMillis > 0) {
            await sound.setPositionAsync(0);
            console.log('AUDIO DEBUG: Reset position to start');
          }
          
          // Play the sound with higher volume to ensure audibility
          await sound.setVolumeAsync(Math.min(1.0, (gameSettings?.volume || 0.8) * 1.25));
          await sound.playAsync();
          console.log('AUDIO DEBUG: Sound playback started');
          setAudioStatus('Playing...');
          
          // Check status again after playing
          const afterStatus = await sound.getStatusAsync();
          console.log('AUDIO DEBUG: Sound status after playing:', JSON.stringify(afterStatus));
          
          // Set up more frequent status checks
          const checkInterval = setInterval(async () => {
            try {
              if (!sound) {
                console.log('AUDIO CHECK: Sound object no longer exists');
                clearInterval(checkInterval);
                return;
              }
              
              const currentStatus = await sound.getStatusAsync();
              console.log('AUDIO STATUS CHECK:', JSON.stringify(currentStatus));
              setAudioStatus(`Playing: ${currentStatus.isPlaying ? 'Yes' : 'No'}, Position: ${Math.floor(currentStatus.positionMillis || 0)/1000}s`);
              
              // If not playing but should be, try to restart
              if (!currentStatus.isPlaying && !gameFinished) {
                console.log('AUDIO RECOVERY: Sound not playing but game active, attempting to restart');
                await sound.playAsync();
              }
            } catch (err) {
              console.error('AUDIO STATUS CHECK ERROR:', err);
              setAudioStatus('Status check error');
            }
          }, 1000); // Check every second
          
          return () => clearInterval(checkInterval);
        } catch (error) {
          console.error('AUDIO DEBUG: Error playing song:', error);
          setAudioStatus(`Error: ${error.message}`);
        }
      };
      
      playSong();
    } else if (gameStarted) {
      console.log('AUDIO DEBUG: Game started but sound object is not available');
      setAudioStatus('No sound object available');
    }
  }, [gameStarted, sound]);
  
  // Handle screen focus and blur events to manage audio
  useFocusEffect(
    React.useCallback(() => {
      console.log('NAVIGATION: Screen is now focused');
      
      // When screen loses focus (user navigates away)
      return () => {
        console.log('NAVIGATION: Screen is being unfocused, stopping audio');
        if (sound) {
          console.log('AUDIO CLEANUP: Stopping and unloading sound due to navigation');
          setAudioStatus('Stopping - Navigation');
          sound.stopAsync().then(() => {
            sound.unloadAsync();
          }).catch(err => {
            console.error('Error stopping sound on navigation:', err);
          });
        }
      };
    }, [sound])
  );
  
  // Stop sound when game finishes - enhanced version
  useEffect(() => {
    return () => {
      console.log('COMPONENT UNMOUNT: Cleaning up resources');
      
      // Ensure audio is stopped and unloaded - with more careful error handling
      if (sound) {
        console.log('COMPONENT UNMOUNT: Stopping and unloading sound');
        
        // Use a more careful approach with separate try/catch blocks
        try {
          // First stop
          sound.stopAsync()
            .then(() => {
              console.log('Sound stopped successfully');
              // Then unload in a separate step
              try {
                sound.unloadAsync()
                  .then(() => console.log('Sound unloaded successfully'))
                  .catch(err => console.error('Error unloading sound:', err));
              } catch (unloadErr) {
                console.error('Error in unload attempt:', unloadErr);
              }
            })
            .catch(err => console.error('Error stopping sound:', err));
        } catch (err) {
          console.error('General cleanup error:', err);
        }
      }
    };
  }, [sound]);

  // Initialize game after countdown
  useEffect(() => {
    if (!gameStarted) return;
    
    console.log('GAME DEBUG: Game started');
    
    // Reset score and combo
    setCurrentScore(0);
    setCombo(0);
    setMaxCombo(0);
    setAccuracy(100);
    setGameFinished(false);
    
    // Start the game timer
    setStartTime(Date.now());
    console.log('GAME DEBUG: Game timer started');
    
    // Get beatmap from different sources in priority order:
    // 1. OSU_BEATMAP if loaded
    // 2. Selected song's beatmap
    // 3. Default beatmap as fallback
    const loadBeatmapAndStart = async () => {
      // Try to load the OSU_BEATMAP if it's not loaded yet
      if (!OSU_BEATMAP) {
        OSU_BEATMAP = await loadOsuBeatmap();
      }
      
      let beatmap;
      if (songData?.beatmap && songData.beatmap.length > 0) {
        console.log('GAME DEBUG: Using selected song beatmap with', songData.beatmap.length, 'notes');
        beatmap = songData.beatmap;
        
        // Log distribution of note types
        const donCount = beatmap.filter(note => note.type === 'don' || note.type === 1).length;
        const kaCount = beatmap.filter(note => note.type === 'ka' || note.type === 2).length;
        console.log(`GAME DEBUG: Note distribution - Don: ${donCount}, Ka: ${kaCount}, Total: ${donCount + kaCount}`);
        
        // Log timing range
        if (beatmap.length > 0) {
          const firstNoteTime = Math.min(...beatmap.map(note => note.time));
          const lastNoteTime = Math.max(...beatmap.map(note => note.time));
          console.log(`GAME DEBUG: Note timing range - First: ${firstNoteTime}ms, Last: ${lastNoteTime}ms, Duration: ${(lastNoteTime - firstNoteTime) / 1000}s`);
        }
        
        // Check for and normalize note types (should be strings 'don' or 'ka')
        beatmap = beatmap.map(note => ({
          time: note.time,
          type: note.type === 1 || note.type === 'don' ? 'don' : 'ka'
        }));
        
        // Apply timing offset from song data
        if (timeOffset) {
          console.log(`GAME DEBUG: Applying timing offset of ${timeOffset}ms to all notes`);
          beatmap = beatmap.map(note => ({
            ...note,
            time: note.time + timeOffset
          }));
        }
        
        // Add a minimum start time to ensure notes aren't immediately missed
        // Only apply this if the first note is too early
        const earliestNoteTime = Math.min(...beatmap.map(note => note.time));
        if (earliestNoteTime < MIN_START_TIME) {
          console.log(`GAME DEBUG: First note is too early (${earliestNoteTime}ms). Adding buffer time.`);
          const timeBuffer = MIN_START_TIME - earliestNoteTime;
          beatmap = beatmap.map(note => ({
            ...note,
            time: note.time + timeBuffer
          }));
          console.log(`GAME DEBUG: Applied buffer of ${timeBuffer}ms to all notes`);
        }
        
        setDebugStatus(`Using imported beatmap: ${beatmap.length} notes with offset ${timeOffset}ms`);
      } else if (OSU_BEATMAP && OSU_BEATMAP.length > 0) {
        console.log('GAME DEBUG: Using parsed .osu beatmap with', OSU_BEATMAP.length, 'notes');
        beatmap = OSU_BEATMAP;
        setDebugStatus(`Using built-in beatmap: ${OSU_BEATMAP.length} notes`);
      } else {
        console.log('GAME DEBUG: Using default beatmap');
        beatmap = DEFAULT_BEATMAP;
        setDebugStatus(`Using fallback beatmap: ${DEFAULT_BEATMAP.length} notes`);
      }
      
      console.log('GAME DEBUG: Using beatmap with', beatmap.length, 'notes');
      
      // Sort beatmap by time to ensure proper ordering
      beatmap = [...beatmap].sort((a, b) => a.time - b.time);
      
      // Adjust beatmap based on difficulty settings
      let adjustedBeatmap = [...beatmap];
      if (gameSettings?.difficulty === 'hard') {
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
        console.log('GAME DEBUG: Added extra notes for hard difficulty. Total notes:', adjustedBeatmap.length);
      }
      
      // Double check that we have notes and they're not all in the past
      if (adjustedBeatmap.length > 0) {
        console.log('GAME DEBUG: First note time:', adjustedBeatmap[0].time, 'ms');
        console.log('GAME DEBUG: Last note time:', adjustedBeatmap[adjustedBeatmap.length - 1].time, 'ms');
      }
      
      setActiveNotes(adjustedBeatmap);
      console.log('GAME DEBUG: Set active notes:', adjustedBeatmap.length);
    };
    
    // Load beatmap and start the game
    loadBeatmapAndStart();

    // Game loop for note movement and missed notes
    const gameLoop = setInterval(() => {
      const currentTime = Date.now() - startTime;
      
      // Check for missed notes (past the hit window)
      setActiveNotes(prev => {
        // Only consider notes missed if we're past the initial grace period (3 seconds)
        if (currentTime < 1000) {
          return prev; // Don't mark any notes as missed during the first second
        }
        
        const missedNotes = prev.filter(note => currentTime > note.time + TIMING_WINDOW);
        
        // Reset combo for each missed note
        if (missedNotes.length > 0) {
          console.log('GAME DEBUG: Missed', missedNotes.length, 'notes at time', currentTime);
          setCombo(0);
          
          // Show miss feedback
          setHitFeedback({ type: 'miss', timestamp: Date.now() });
        }
        
        const remainingNotes = prev.filter(note => currentTime <= note.time + TIMING_WINDOW);
        
        // Check if all notes are gone to end the game - with improved logic
        // Only end if we've been playing for at least 5 seconds AND there are no more notes
        if (remainingNotes.length === 0 && prev.length > 0 && currentTime > 5000) {
          console.log('GAME DEBUG: No more notes left. Ending game.');
          clearInterval(gameLoop);
          
          // Add a delay before ending
          setTimeout(() => {
            console.log('GAME DEBUG: Game finished');
            setGameFinished(true);
            setAudioStatus('Game finished - stopping audio');
            
            // Save high score before navigating
            if (songData?.id) {
              console.log('GAME DEBUG: Saving high score');
              saveHighScore(songData.id, currentScore);
            }
            
            // Stop the song before navigating away (using the enhanced useEffect)
            // Navigation will happen after sound is stopped (in the useEffect)
            setTimeout(() => {
              console.log('GAME DEBUG: Navigating to Results');
              navigation.navigate('Results');
            }, 2000);
          }, 1000);
        }
        
        return remainingNotes;
      });
    }, 16);

    return () => {
      clearInterval(gameLoop);
      console.log('GAME DEBUG: Game loop cleared');
    };
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

  // Get hit feedback text and color based on hit type
  const getFeedbackTextAndColor = () => {
    if (!hitFeedback) return { text: '', color: { color: '#ffffff' } };
    
    switch (hitFeedback.type) {
      case 'perfect':
        return { 
          text: 'PERFECT!', 
          color: { color: '#ffcc00' } 
        };
      case 'good':
        return { 
          text: 'GOOD!', 
          color: { color: '#33cc33' } 
        };
      case 'ok':
        return { 
          text: 'OK', 
          color: { color: '#3399ff' } 
        };
      case 'miss':
        return { 
          text: 'MISS', 
          color: { color: '#ff3333' } 
        };
      default:
        return { 
          text: '', 
          color: { color: '#ffffff' } 
        };
    }
  };

  const feedback = getFeedbackTextAndColor();

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      console.log('COMPONENT UNMOUNT: Cleaning up resources');
      
      // Ensure audio is stopped and unloaded
      if (sound) {
        console.log('COMPONENT UNMOUNT: Stopping and unloading sound');
        sound.stopAsync().then(() => sound.unloadAsync())
          .catch(err => console.error('Cleanup error:', err));
      }
    };
  }, [sound]);

  // Render notes with improved visibility logic
  const renderNotes = () => {
    if (!gameStarted || !startTime) return null;
    
    const currentTime = Date.now() - startTime;
    const visibleNotes = activeNotes.filter(note => {
      const timeToNote = note.time - currentTime;
      // Show notes within a 4 second window
      return timeToNote >= -TIMING_WINDOW && timeToNote <= 4000;
    });
    
    return (
      <View style={styles.notesContainer}>
        {visibleNotes.map((note, index) => {
          // Calculate note position based on time
          const timeToNote = note.time - currentTime;
          
          // Calculate position (pixels from hit position)
          const position = HIT_POSITION + (timeToNote / 1000) * NOTE_SPEED;
          
          return (
            <Animated.View
              key={`note-${index}-${note.time}`}
              style={[
                styles.note,
                {
                  left: position,
                  backgroundColor: note.type === 'don' ? '#ff4444' : '#4444ff',
                },
              ]}
            />
          );
        })}
        
        {/* Hit position marker */}
        <View style={styles.hitPosition} />
        
        {/* Debug count of visible notes */}
        <Text style={styles.noteCountText}>
          Notes: {visibleNotes.length}/{activeNotes.length}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar hidden />
      
      {!gameStarted ? (
        <View style={styles.countdownContainer}>
          <Text style={styles.countdownText}>{countdownValue}</Text>
          <Text style={styles.songTitle}>{songTitle}</Text>
          <Text style={styles.audioStatus}>{audioStatus}</Text>
          
          {/* Debug status info */}
          <View style={styles.debugInfo}>
            <Text style={styles.debugText}>{debugStatus}</Text>
            {songData?.beatmap && (
              <Text style={styles.debugText}>
                Beatmap: {songData.beatmap.length} notes
                {songData.offset ? `, Offset: ${songData.offset}ms` : ''}
              </Text>
            )}
          </View>
        </View>
      ) : gameFinished ? (
        <View style={styles.gameFinishedContainer}>
          <Text style={styles.gameFinishedText}>Game Finished!</Text>
          <Text style={styles.scoreText}>Score: {currentScore}</Text>
          <Text style={styles.comboText}>Max Combo: {maxCombo}</Text>
        </View>
      ) : (
        <View style={styles.gameplayContainer}>
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreText}>Score: {currentScore}</Text>
            <Text style={styles.comboText}>Combo: {combo}</Text>
          </View>
          
          {/* Feedback text (perfect, good, miss, etc.) */}
          {hitFeedback && (
            <View style={styles.feedbackContainer}>
              <Text style={[
                styles.feedbackText,
                getFeedbackTextAndColor().color
              ]}>
                {getFeedbackTextAndColor().text}
              </Text>
            </View>
          )}
          
          {/* Notes and gameplay area */}
          {renderNotes()}
          
          {/* Drum controls */}
          <View style={styles.drumControls}>
            <TouchableOpacity
              style={[styles.drumButton, styles.donButton]}
              onPress={() => handleHit('don')}
            >
              <Text style={styles.drumButtonText}>DON</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.drumButton, styles.kaButton]}
              onPress={() => handleHit('ka')}
            >
              <Text style={styles.drumButtonText}>KA</Text>
            </TouchableOpacity>
          </View>
          
          {/* Debug info in-game */}
          <View style={styles.inGameDebug}>
            <Text style={styles.debugText}>
              Notes: {activeNotes.length} | Timing offset: {timeOffset}ms
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  countdownContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownText: {
    fontSize: 72,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  songTitle: {
    fontSize: 24,
    color: '#ffffff',
    marginTop: 20,
    textAlign: 'center',
  },
  audioStatus: {
    fontSize: 16,
    color: '#aaaaaa',
    marginTop: 10,
  },
  gameplayContainer: {
    flex: 1,
    position: 'relative',
  },
  scoreContainer: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scoreText: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  comboText: {
    fontSize: 24,
    color: '#ffffff',
  },
  notesContainer: {
    height: 120,
    width: '100%',
    position: 'relative',
    marginTop: 20,
  },
  note: {
    width: 40,
    height: 40,
    borderRadius: 20,
    position: 'absolute',
    top: 40,
  },
  hitPosition: {
    width: 50,
    height: 120,
    position: 'absolute',
    left: HIT_POSITION - 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  drumControls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  drumButton: {
    width: 150,
    height: 150,
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
  },
  donButton: {
    backgroundColor: 'rgba(255, 68, 68, 0.8)',
    borderColor: '#ff0000',
  },
  kaButton: {
    backgroundColor: 'rgba(68, 68, 255, 0.8)',
    borderColor: '#0000ff',
  },
  drumButtonText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  feedbackContainer: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  feedbackText: {
    fontSize: 42,
    fontWeight: 'bold',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
  },
  gameFinishedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameFinishedText: {
    fontSize: 36,
    color: '#ffffff',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  debugInfo: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  debugText: {
    color: '#00ff00',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    textAlign: 'center',
  },
  inGameDebug: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    padding: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  noteCountText: {
    position: 'absolute',
    top: 10,
    right: 10,
    color: '#ffffff',
    fontSize: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 5,
    borderRadius: 3,
  },
});
