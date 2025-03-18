import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppContextProvider } from './app/src/contexts/AppContext';
import { GameContextProvider } from './app/src/contexts/GameContext';
import AppNavigator from './app/src/navigation/AppNavigator';

export default function App() {
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