import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppContextProvider } from './app/src/contexts/AppContext';
import { GameContextProvider } from './app/src/contexts/GameContext';
import AppNavigator from './app/src/navigation/AppNavigator';
import BeatmapManager from './app/src/utils/BeatmapManager';

export default function App() {
  // Initialize BeatmapManager when the app starts
  useEffect(() => {
    const initializeBeatmaps = async () => {
      try {
        console.log('App: Initializing BeatmapManager...');
        await BeatmapManager.initialize();
        console.log('App: BeatmapManager initialized successfully');
      } catch (error) {
        console.error('App: Error initializing BeatmapManager:', error);
      }
    };
    
    initializeBeatmaps();
  }, []);
  
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppContextProvider>
          <GameContextProvider>
            <AppNavigator />
          </GameContextProvider>
        </AppContextProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}