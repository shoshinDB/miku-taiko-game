import React, { createContext, useContext, useState } from 'react';

const MultiplayerContext = createContext();

export const useMultiplayerContext = () => useContext(MultiplayerContext);

export const MultiplayerContextProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [players, setPlayers] = useState([]);

  return (
    <MultiplayerContext.Provider
      value={{
        isConnected,
        setIsConnected,
        roomCode,
        setRoomCode,
        players,
        setPlayers,
      }}
    >
      {children}
    </MultiplayerContext.Provider>
  );
};


