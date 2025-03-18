import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useMultiplayerContext } from '../contexts/MultiplayerContext';

export default function MultiplayerLobbyScreen({ navigation }) {
  const { roomCode } = useMultiplayerContext();
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Multiplayer Lobby</Text>
        <Text style={styles.subtitle}>Coming Soon!</Text>
        
        {roomCode ? (
          <View style={styles.roomCodeContainer}>
            <Text style={styles.roomCodeLabel}>Room Code:</Text>
            <Text style={styles.roomCode}>{roomCode}</Text>
          </View>
        ) : (
          <Text style={styles.comingSoon}>This feature is still under development</Text>
        )}
        
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.backButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#bbbbbb',
    marginBottom: 40,
  },
  roomCodeContainer: {
    backgroundColor: '#2a2a4a',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 40,
    width: '100%',
    maxWidth: 300,
  },
  roomCodeLabel: {
    fontSize: 16,
    color: '#bbbbbb',
    marginBottom: 5,
  },
  roomCode: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 5,
  },
  comingSoon: {
    fontSize: 16,
    color: '#bbbbbb',
    marginBottom: 40,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ffffff',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});


