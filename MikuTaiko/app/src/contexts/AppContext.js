import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppContextProvider = ({ children }) => {
  const [currentScore, setCurrentScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [highScores, setHighScores] = useState({});
  const [selectedSong, setSelectedSong] = useState(null);
  const [customSongs, setCustomSongs] = useState([]);

  // Load high scores and custom songs from AsyncStorage on initial load
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedHighScores = await AsyncStorage.getItem('highScores');
        if (storedHighScores !== null) {
          setHighScores(JSON.parse(storedHighScores));
        }
        
        const storedCustomSongs = await AsyncStorage.getItem('customSongs');
        if (storedCustomSongs !== null) {
          setCustomSongs(JSON.parse(storedCustomSongs));
        }
      } catch (error) {
        console.error('Failed to load data from storage:', error);
      }
    };

    loadData();
  }, []);

  // Save a new high score for a song
  const saveHighScore = async (songId, score) => {
    try {
      // Only update if the score is higher than the existing high score
      const newHighScores = { ...highScores };
      
      if (!newHighScores[songId] || score > newHighScores[songId]) {
        newHighScores[songId] = score;
        setHighScores(newHighScores);
        await AsyncStorage.setItem('highScores', JSON.stringify(newHighScores));
        return true; // Indicates a new high score was set
      }
      
      return false; // Not a new high score
    } catch (error) {
      console.error('Failed to save high score:', error);
      return false;
    }
  };

  // Get the high score for a specific song
  const getHighScore = (songId) => {
    return highScores[songId] || 0;
  };
  
  // Add a custom song imported from an .osz file
  const addCustomSong = async (songData) => {
    try {
      // Check if we have required data
      if (!songData.title || !songData.audioFile || !songData.beatmap) {
        throw new Error('Invalid song data: missing required fields');
      }
      
      // Add the song to our custom songs list
      const updatedSongs = [...customSongs, songData];
      setCustomSongs(updatedSongs);
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('customSongs', JSON.stringify(updatedSongs));
      
      return true;
    } catch (error) {
      console.error('Failed to add custom song:', error);
      throw error;
    }
  };
  
  // Remove a custom song
  const removeCustomSong = async (songId) => {
    try {
      const updatedSongs = customSongs.filter(song => song.id !== songId);
      setCustomSongs(updatedSongs);
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('customSongs', JSON.stringify(updatedSongs));
      
      return true;
    } catch (error) {
      console.error('Failed to remove custom song:', error);
      return false;
    }
  };
  
  // Get all songs (built-in + custom)
  const getAllSongs = () => {
    // This should be updated to include both your built-in songs and custom songs
    return [...builtInSongs, ...customSongs];
  };

  return (
    <AppContext.Provider
      value={{
        currentScore,
        setCurrentScore,
        combo,
        setCombo,
        maxCombo,
        setMaxCombo,
        accuracy,
        setAccuracy,
        highScores,
        saveHighScore,
        getHighScore,
        selectedSong,
        setSelectedSong,
        customSongs,
        addCustomSong,
        removeCustomSong,
        getAllSongs
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
