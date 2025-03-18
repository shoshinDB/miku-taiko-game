import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Import screens
import HomeScreen from './screens/HomeScreen';
import CharacterSelectScreen from './screens/CharacterSelectScreen';
import SongSelectScreen from './screens/SongSelectScreen';
import GameplayScreen from './screens/GameplayScreen';
import ResultsScreen from './screens/ResultsScreen';
import MultiplayerLobbyScreen from './screens/MultiplayerLobbyScreen';
import SettingsScreen from './screens/SettingsScreen';

// Import contexts
import { AppContextProvider } from './contexts/AppContext';
import { GameContextProvider } from './contexts/GameContext';
import { MultiplayerContextProvider } from './contexts/MultiplayerContext';

const Stack = createStackNavigator();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppContextProvider>
          <GameContextProvider>
            <MultiplayerContextProvider>
              <NavigationContainer>
                <Stack.Navigator initialRouteName="Home">
                  <Stack.Screen name="Home" component={HomeScreen} />
                  <Stack.Screen name="CharacterSelect" component={CharacterSelectScreen} />
                  <Stack.Screen name="SongSelect" component={SongSelectScreen} />
                  <Stack.Screen name="Gameplay" component={GameplayScreen} />
                  <Stack.Screen name="Results" component={ResultsScreen} />
                  <Stack.Screen name="MultiplayerLobby" component={MultiplayerLobbyScreen} />
                  <Stack.Screen name="Settings" component={SettingsScreen} />
                </Stack.Navigator>
              </NavigationContainer>
            </MultiplayerContextProvider>
          </GameContextProvider>
        </AppContextProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}