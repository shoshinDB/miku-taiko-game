import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Platform
} from 'react-native';
import { useAppContext } from '../contexts/AppContext';
import OszImporter from '../utils/OszImporter';

export default function ImportScreen({ navigation }) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [debugLogs, setDebugLogs] = useState([]);
  const { addCustomSong } = useAppContext();
  
  // Add debug log function
  const addDebugLog = (message) => {
    console.log(`IMPORT_DEBUG: ${message}`);
    setDebugLogs(prev => [...prev, `${new Date().toISOString().split('T')[1].slice(0, 8)}: ${message}`]);
  };
  
  // Check if dependencies are available on mount
  useEffect(() => {
    const checkDependencies = async () => {
      addDebugLog(`Platform: ${Platform.OS} ${Platform.Version}`);
      
      // Check if document picker is available
      const isPickerAvailable = OszImporter.isDocumentPickerAvailable();
      addDebugLog(`Document picker available: ${isPickerAvailable}`);
      
      // Check FileSystem availability
      try {
        addDebugLog(`FileSystem module exists: ${!!require('expo-file-system')}`);
      } catch (e) {
        addDebugLog(`FileSystem import error: ${e.message}`);
      }
      
      // Web-specific log
      if (Platform.OS === 'web') {
        addDebugLog(`Running on web platform - some features have limited functionality`);
        addDebugLog(`Data URL handling is enabled for web`);
      }
    };
    
    checkDependencies();
  }, []);
  
  // Function to handle direct data URL content (for web platform)
  const handleDataUrl = (fileUri, fileName) => {
    try {
      addDebugLog(`Processing data URL directly (web platform)`);
      
      // Extract the base64 data from the data URL
      const base64Data = fileUri.split(',')[1];
      // Decode base64 to string
      const osuContent = atob(base64Data);
      
      addDebugLog(`Data URL decoded, length: ${osuContent.length}`);
      return osuContent;
    } catch (error) {
      addDebugLog(`Error decoding data URL: ${error.message}`);
      return null;
    }
  };
  
  const handleImportOsuFile = async () => {
    try {
      setIsLoading(true);
      setLoadingText('Selecting file...');
      addDebugLog('Import process started');
      
      // Allow user to pick an .osu file directly
      addDebugLog('Calling OszImporter.pickOsuFile()');
      const fileInfo = await OszImporter.pickOsuFile();
      
      if (!fileInfo) {
        addDebugLog('No file selected or selection cancelled');
        setIsLoading(false);
        return; // User cancelled
      }
      
      addDebugLog(`File selected: ${fileInfo.name}`);
      addDebugLog(`File URI: ${fileInfo.uri}`);
      setLoadingText(`Parsing ${fileInfo.name}...`);
      
      let beatmapData;
      
      // Special handling for web platform
      if (Platform.OS === 'web') {
        addDebugLog('Web platform detected, using alternative parsing approach');
        
        try {
          // Check if we have a data URL (common on web platform)
          if (fileInfo.uri.startsWith('data:')) {
            addDebugLog('Data URL detected, parsing directly');
            // On web, try to parse the data URL directly
            const osuContent = handleDataUrl(fileInfo.uri, fileInfo.name);
            
            if (osuContent) {
              // Manually parse the content using OszImporter's internal method
              addDebugLog('Parsing osu content directly from data URL');
              const parsedData = OszImporter._parseOsuFile(osuContent);
              
              beatmapData = {
                title: parsedData.title || 'Unknown Song',
                artist: parsedData.artist || 'Unknown Artist',
                audioFileName: parsedData.audioFileName,
                beatmap: parsedData.hitObjects.map(obj => ({
                  type: obj.type === 1 ? 'don' : 'ka',
                  time: obj.time
                })),
                difficulty: parsedData.difficulty || 'Medium',
                bpm: parsedData.bpm,
                offset: parsedData.offset || 0,
                totalNotes: parsedData.hitObjects.length
              };
              
              addDebugLog(`Parsed data directly: ${beatmapData.title} by ${beatmapData.artist}`);
              addDebugLog(`Note types distribution: ${countNoteTypes(beatmapData.beatmap)}`);
            }
          } else if (fileInfo.file) {
            // If we have a File object (from newer Expo DocumentPicker)
            addDebugLog('File object available, using FileReader');
            const reader = new FileReader();
            
            // Create a promise to handle the async FileReader
            beatmapData = await new Promise((resolve, reject) => {
              reader.onload = (event) => {
                try {
                  const osuContent = event.target.result;
                  addDebugLog(`FileReader read ${osuContent.length} bytes`);
                  
                  // Parse the file content
                  const parsedData = OszImporter._parseOsuFile(osuContent);
                  
                  const result = {
                    title: parsedData.title || 'Unknown Song',
                    artist: parsedData.artist || 'Unknown Artist',
                    audioFileName: parsedData.audioFileName,
                    beatmap: parsedData.hitObjects.map(obj => ({
                      type: obj.type === 1 ? 'don' : 'ka',
                      time: obj.time
                    })),
                    difficulty: parsedData.difficulty || 'Medium',
                    bpm: parsedData.bpm,
                    offset: parsedData.offset || 0,
                    totalNotes: parsedData.hitObjects.length
                  };
                  
                  addDebugLog(`Note types distribution: ${countNoteTypes(result.beatmap)}`);
                  resolve(result);
                } catch (error) {
                  addDebugLog(`Error parsing file content: ${error.message}`);
                  reject(error);
                }
              };
              
              reader.onerror = (error) => {
                addDebugLog(`FileReader error: ${error}`);
                reject(error);
              };
              
              reader.readAsText(fileInfo.file);
            });
          }
        } catch (webError) {
          addDebugLog(`Web parsing error: ${webError.message}`);
          addDebugLog(`Stack: ${webError.stack}`);
        }
      } else {
        // On native platforms, use the regular parser
        addDebugLog('Starting to parse file using OszImporter.parseOsuFile()');
        beatmapData = await OszImporter.parseOsuFile(fileInfo.uri);
        if (beatmapData?.beatmap) {
          addDebugLog(`Note types distribution: ${countNoteTypes(beatmapData.beatmap)}`);
        }
      }
      
      if (!beatmapData) {
        throw new Error('Failed to parse beatmap data');
      }
      
      if (!beatmapData.beatmap || beatmapData.beatmap.length === 0) {
        throw new Error('No notes found in the beatmap');
      }
      
      addDebugLog(`Parse successful - Title: ${beatmapData.title}, Artist: ${beatmapData.artist}`);
      addDebugLog(`Notes count: ${beatmapData.beatmap?.length || 0}`);
      addDebugLog(`First note at: ${beatmapData.beatmap[0]?.time}ms, Last note at: ${beatmapData.beatmap[beatmapData.beatmap.length-1]?.time}ms`);
      
      // Add a custom ID for the imported song
      const customSong = {
        ...beatmapData,
        id: `custom_${Date.now()}`,
        isCustom: true,
        // Since we don't extract audio from a zip, use a default audio
        audioFile: require('../../../assets/songs/redial.mp3'),
        coverImage: require('../../../assets/images/default-cover.png')
      };
      
      addDebugLog('Created custom song object with default audio and image');
      addDebugLog(`Beatmap has ${customSong.beatmap.length} notes and offset ${customSong.offset}ms`);
      
      // Add the parsed song to the app context/database
      addDebugLog('Calling addCustomSong()');
      await addCustomSong(customSong);
      addDebugLog('Song added to collection successfully');
      
      setIsLoading(false);
      
      // Show success message
      Alert.alert(
        'Import Successful',
        `Successfully imported "${customSong.title}" by ${customSong.artist} (${customSong.beatmap.length} notes)`,
        [
          { 
            text: 'Play Now', 
            onPress: () => {
              addDebugLog('User selected Play Now');
              navigation.navigate('Gameplay', { selectedSong: customSong });
            }
          },
          { 
            text: 'Go to Song List', 
            onPress: () => {
              addDebugLog('User selected Go to Song List');
              navigation.navigate('SongSelect');
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error importing .osu file:', error);
      addDebugLog(`ERROR: ${error.message}`);
      addDebugLog(`Error stack: ${error.stack}`);
      setIsLoading(false);
      
      // Show error message
      Alert.alert(
        'Import Failed',
        `Failed to import beatmap: ${error.message}`,
        [{ text: 'OK' }]
      );
    }
  };
  
  // Helper function to count the distribution of note types
  const countNoteTypes = (beatmap) => {
    if (!beatmap || !Array.isArray(beatmap)) return 'No valid beatmap';
    
    let don = 0;
    let ka = 0;
    
    beatmap.forEach(note => {
      if (note.type === 'don' || note.type === 1) don++;
      else if (note.type === 'ka' || note.type === 2) ka++;
    });
    
    return `Don: ${don}, Ka: ${ka}, Total: ${don + ka}`;
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Import Beatmaps</Text>
        
        {Platform.OS === 'web' && (
          <View style={[styles.infoBox, styles.webNoticeBox]}>
            <Text style={styles.infoTitle}>Web Browser Notice:</Text>
            <Text style={styles.infoText}>
              You're running MikuTaiko in a web browser, which has some limitations:
            </Text>
            <Text style={styles.infoText}>
              • File handling is different than on mobile devices
            </Text>
            <Text style={styles.infoText}>
              • Audio playback may not work for imported songs
            </Text>
            <Text style={styles.infoText}>
              For the best experience, we recommend using the app on iOS or Android.
            </Text>
          </View>
        )}
        
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Import beatmaps from .osu files to add more songs to your collection.
          </Text>
          <Text style={styles.infoText}>
            .osu files contain the note timing data for rhythm games.
          </Text>
        </View>
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ff4444" />
            <Text style={styles.loadingText}>{loadingText}</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.importButton}
            onPress={handleImportOsuFile}
          >
            <Text style={styles.importButtonText}>Import .osu File</Text>
          </TouchableOpacity>
        )}
        
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>How to use .osu files:</Text>
          <Text style={styles.infoText}>
            1. Download .osu files from osu! beatmap packs
          </Text>
          <Text style={styles.infoText}>
            2. Transfer them to your device
          </Text>
          <Text style={styles.infoText}>
            3. Click "Import .osu File" and select the file
          </Text>
          <Text style={styles.infoText}>
            4. The song will be added to your collection
          </Text>
          <Text style={styles.infoText}>
            Note: This simplified importer uses the default game audio
          </Text>
        </View>
        
        {/* Debug logs section */}
        {debugLogs.length > 0 && (
          <View style={styles.debugContainer}>
            <Text style={styles.debugTitle}>Debug Logs:</Text>
            <ScrollView style={styles.debugLogs}>
              {debugLogs.map((log, index) => (
                <Text key={index} style={styles.debugText}>{log}</Text>
              ))}
            </ScrollView>
          </View>
        )}
        
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20,
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
    marginVertical: 20,
    width: '100%',
  },
  webNoticeBox: {
    backgroundColor: 'rgba(255, 165, 0, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 165, 0, 0.5)',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 16,
    color: '#dddddd',
    marginBottom: 8,
    lineHeight: 22,
  },
  importButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
    marginVertical: 20,
  },
  importButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 10,
  },
  backButton: {
    marginTop: 20,
    padding: 10,
  },
  backButtonText: {
    color: '#aaaaaa',
    fontSize: 16,
  },
  debugContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 10,
    padding: 15,
    marginVertical: 20,
    width: '100%',
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff9900',
    marginBottom: 8,
  },
  debugLogs: {
    maxHeight: 200,
  },
  debugText: {
    fontSize: 12,
    color: '#00ff00',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 4,
  }
}); 