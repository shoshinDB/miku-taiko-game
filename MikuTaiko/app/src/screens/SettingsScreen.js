import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Switch } from 'react-native';
import { useGameContext } from '../contexts/GameContext';

export default function SettingsScreen({ navigation }) {
  const { gameSettings, setGameSettings } = useGameContext();
  
  const toggleVolume = () => {
    setGameSettings({
      ...gameSettings,
      volume: gameSettings.volume > 0 ? 0 : 0.8,
    });
  };
  
  const toggleDifficulty = () => {
    setGameSettings({
      ...gameSettings,
      difficulty: gameSettings.difficulty === 'normal' ? 'hard' : 'normal',
    });
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Settings</Text>
        
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Sound</Text>
          <Switch 
            value={gameSettings.volume > 0}
            onValueChange={toggleVolume}
            trackColor={{ false: '#767577', true: '#4a78f3' }}
          />
        </View>
        
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Hard Mode</Text>
          <Switch 
            value={gameSettings.difficulty === 'hard'}
            onValueChange={toggleDifficulty}
            trackColor={{ false: '#767577', true: '#4a78f3' }}
          />
        </View>
        
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Back</Text>
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
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 30,
    textAlign: 'center',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333366',
  },
  settingLabel: {
    fontSize: 18,
    color: '#ffffff',
  },
  backButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ffffff',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 40,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});


