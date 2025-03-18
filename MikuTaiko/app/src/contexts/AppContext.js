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

  // Load high scores from AsyncStorage on initial load
  useEffect(() => {
    const loadHighScores = async () => {
      try {
        const storedHighScores = await AsyncStorage.getItem('highScores');
        if (storedHighScores !== null) {
          setHighScores(JSON.parse(storedHighScores));
        }
      } catch (error) {
        console.error('Failed to load high scores:', error);
      }
    };

    loadHighScores();
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
        setSelectedSong
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
