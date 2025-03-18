import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import SongSelectScreen from '../screens/SongSelectScreen';
import GameplayScreen from '../screens/GameplayScreen';
import ResultsScreen from '../screens/ResultsScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#1a1a2e',
          },
          headerTintColor: '#ffffff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{
            title: 'Miku Taiko',
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="SongSelect" 
          component={SongSelectScreen}
          options={{
            title: 'Select Song',
          }}
        />
        <Stack.Screen 
          name="Gameplay" 
          component={GameplayScreen}
          options={{
            title: 'Play',
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="Results" 
          component={ResultsScreen}
          options={{
            title: 'Results',
            headerLeft: () => null, // Prevent going back to gameplay
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
} 