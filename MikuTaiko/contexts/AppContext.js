import React, { createContext, useState, useContext } from 'react';

const AppContext = createContext();

export function useAppContext() {
  return useContext(AppContext);
}

export function AppContextProvider({ children }) {
  // Game settings state
  const [volume, setVolume] = useState(0.8);
  const [noteSpeed, setNoteSpeed] = useState(1.0);
  const [inputOffset, setInputOffset] = useState(0);

  // Scoring state  
  const [currentScore, setCurrentScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [accuracy, setAccuracy] = useState(100);

  const value = {
    // Settings
    volume,
    setVolume,
    noteSpeed,
    setNoteSpeed, 
    inputOffset,
    setInputOffset,

    // Scoring
    currentScore,
    setCurrentScore,
    combo,
    setCombo,
    maxCombo,
    setMaxCombo,
    accuracy,
    setAccuracy,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}
