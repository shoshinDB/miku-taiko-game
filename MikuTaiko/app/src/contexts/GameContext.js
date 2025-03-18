import React, { createContext, useContext, useState } from 'react';

const GameContext = createContext();

export const useGameContext = () => useContext(GameContext);

export const GameContextProvider = ({ children }) => {
  const [gameState, setGameState] = useState('idle');
  const [gameSettings, setGameSettings] = useState({
    difficulty: 'normal',
    notesSpeed: 1.0,
    volume: 0.8,
  });

  return (
    <GameContext.Provider
      value={{
        gameState,
        setGameState,
        gameSettings,
        setGameSettings,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};


