import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';

/**
 * Utility for importing and parsing beatmap files
 * This is a simplified version that doesn't require jszip
 */
export default class OszImporter {
  /**
   * Open file picker and allow user to select an .osu file directly
   * instead of an .osz archive
   * @returns {Promise<Object>} The selected file info or null if cancelled
   */
  static async pickOsuFile() {
    try {
      console.log('DEBUG: Opening document picker to select .osu file');
      console.log('DEBUG: DocumentPicker available:', !!DocumentPicker);
      console.log('DEBUG: DocumentPicker.getDocumentAsync available:', !!DocumentPicker.getDocumentAsync);
      
      // Check if we're running on a device that supports document picking
      if (Platform.OS === 'web') {
        console.warn('DEBUG: Running on web platform - using web-specific document picker');
      }
      
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/octet-stream', // Generic type for .osu files
        copyToCacheDirectory: true
      });
      
      console.log('DEBUG: Document picker result:', JSON.stringify(result));
      
      if (result.canceled) {
        console.log('DEBUG: File picking was cancelled');
        return null;
      }
      
      // For Expo Go/SDK 47+, the picked file is in the assets array
      const fileUri = result.assets ? result.assets[0].uri : result.uri;
      const fileName = result.assets ? result.assets[0].name : result.name;
      // Store the raw file on web platform
      const file = Platform.OS === 'web' && result.assets ? result.assets[0].file : null;
      
      console.log('DEBUG: Selected file URI:', fileUri);
      console.log('DEBUG: Selected file name:', fileName);
      console.log('DEBUG: Raw File object available:', !!file);
      
      if (!fileName.toLowerCase().endsWith('.osu')) {
        console.warn('DEBUG: Selected file is not an .osu file:', fileName);
        return null;
      }
      
      // Verify the file exists and is readable - only needed on native platforms
      if (Platform.OS !== 'web') {
        try {
          const fileInfo = await FileSystem.getInfoAsync(fileUri);
          console.log('DEBUG: File info:', JSON.stringify(fileInfo));
          
          if (!fileInfo.exists) {
            console.error('DEBUG: File does not exist at URI:', fileUri);
            return null;
          }
        } catch (fileCheckError) {
          console.error('DEBUG: Error checking file info:', fileCheckError);
        }
      }
      
      console.log('DEBUG: Successfully picked .osu file:', fileName);
      return {
        uri: fileUri,
        name: fileName,
        file: file // Include the raw file for web platform
      };
    } catch (error) {
      console.error('DEBUG: Error picking .osu file:', error);
      console.error('DEBUG: Error details:', error.message);
      console.error('DEBUG: Error stack:', error.stack);
      return null;
    }
  }
  
  /**
   * Parse an .osu file into usable components
   * @param {string} fileUri - URI of the .osu file
   * @returns {Promise<Object>} Parsed beatmap data
   */
  static async parseOsuFile(fileUri) {
    try {
      console.log('DEBUG: Reading .osu file from:', fileUri);
      
      // Read the file as string - using different methods based on platform
      console.log('DEBUG: Attempting to read file content...');
      let osuContent;
      
      try {
        if (Platform.OS === 'web') {
          // On web, we need to use the File object and FileReader
          // Check if we have a file object (from pickOsuFile)
          const fileInfo = await this.pickOsuFile();
          
          if (!fileInfo || !fileInfo.file) {
            throw new Error('File object not available for web platform. Use the dataUrl directly.');
          }
          
          // Read the file using FileReader
          osuContent = await this._readWebFile(fileInfo.file);
          console.log('DEBUG: Web file read successful, content length:', osuContent.length);
        } else {
          // On native platforms, use expo-file-system
          osuContent = await FileSystem.readAsStringAsync(fileUri);
          console.log('DEBUG: File content read successfully, length:', osuContent.length);
        }
        
        // Check if fileUri is a data URL (common on web)
        if (!osuContent && fileUri.startsWith('data:')) {
          console.log('DEBUG: URI is a data URL, attempting to parse...');
          osuContent = this._decodeDataUrl(fileUri);
          console.log('DEBUG: Data URL decoded, length:', osuContent.length);
        }
        
        console.log('DEBUG: First 100 chars:', osuContent.substring(0, 100));
      } catch (readError) {
        console.error('DEBUG: Error reading file:', readError);
        console.error('DEBUG: File URI that failed:', fileUri);
        throw new Error(`Could not read file: ${readError.message}`);
      }
      
      if (!osuContent) {
        throw new Error('Failed to get file content');
      }
      
      // Parse the .osu file content
      console.log('DEBUG: Parsing .osu file content...');
      const beatmapData = this._parseOsuFile(osuContent);
      console.log('DEBUG: Parsed beatmap data:', JSON.stringify(beatmapData, null, 2));
      
      // Create and return our final beatmap object
      // Note: Since we're not extracting from a ZIP file, audio will need to be handled separately
      const result = {
        title: beatmapData.title || 'Unknown Song',
        artist: beatmapData.artist || 'Unknown Artist',
        audioFileName: beatmapData.audioFileName, // Just keep the filename reference
        beatmap: beatmapData.hitObjects.map(obj => ({
          type: obj.type === 1 ? 'don' : 'ka', // Convert osu types to our types
          time: obj.time
        })),
        difficulty: beatmapData.difficulty || 'Medium',
        bpm: beatmapData.bpm,
        offset: beatmapData.offset || 0, // Include offset for timing adjustment
        totalNotes: beatmapData.hitObjects.length // Include total note count for reference
      };
      
      console.log('DEBUG: Finished processing beatmap:', result.title, 'by', result.artist);
      console.log('DEBUG: Total notes:', result.beatmap.length);
      
      return result;
    } catch (error) {
      console.error('DEBUG: Error parsing .osu file:', error);
      console.error('DEBUG: Error details:', error.message);
      console.error('DEBUG: Error stack:', error.stack);
      throw error;
    }
  }
  
  /**
   * Read a file using the Web File API
   * @param {File} file - Browser File object
   * @returns {Promise<string>} File contents as string
   */
  static _readWebFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        resolve(reader.result);
      };
      
      reader.onerror = (error) => {
        console.error('DEBUG: FileReader error:', error);
        reject(error);
      };
      
      reader.readAsText(file);
    });
  }
  
  /**
   * Decode a data URL to a string
   * @param {string} dataUrl - Data URL containing file data
   * @returns {string} Decoded file content
   */
  static _decodeDataUrl(dataUrl) {
    // Extract the base64 data from the data URL
    const base64Data = dataUrl.split(',')[1];
    // Decode base64 to string
    return atob(base64Data);
  }
  
  /**
   * Parse an .osu file content into structured data
   * @param {string} osuContent - Content of the .osu file
   * @returns {Object} Structured beatmap data
   */
  static _parseOsuFile(osuContent) {
    console.log('DEBUG: Starting to parse .osu file content');
    
    // Start with empty data structure
    const beatmapData = {
      title: null,
      artist: null,
      audioFileName: null,
      difficulty: null,
      bpm: null,
      offset: 0, // Time offset for better synchronization
      hitObjects: []
    };
    
    // Split content into lines
    const lines = osuContent.split('\n');
    console.log('DEBUG: File has', lines.length, 'lines');
    
    // Current section we're parsing
    let currentSection = null;
    
    // Parse line by line
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip empty lines
      if (!trimmedLine) continue;
      
      // Check for section headers
      if (trimmedLine.startsWith('[') && trimmedLine.endsWith(']')) {
        currentSection = trimmedLine.substring(1, trimmedLine.length - 1);
        console.log('DEBUG: Found section:', currentSection);
        continue;
      }
      
      // Parse metadata
      if (currentSection === 'General' || currentSection === 'Metadata') {
        const colonIndex = trimmedLine.indexOf(':');
        if (colonIndex > 0) {
          const key = trimmedLine.substring(0, colonIndex).trim();
          const value = trimmedLine.substring(colonIndex + 1).trim();
          
          // Assign values to beatmapData
          if (key === 'AudioFilename') {
            beatmapData.audioFileName = value;
            console.log('DEBUG: Found AudioFilename:', value);
          }
          else if (key === 'Title') {
            beatmapData.title = value;
            console.log('DEBUG: Found Title:', value);
          }
          else if (key === 'Artist') {
            beatmapData.artist = value;
            console.log('DEBUG: Found Artist:', value);
          }
          else if (key === 'AudioLeadIn') {
            // Audio lead-in is in milliseconds - can help with offset
            const leadIn = parseInt(value);
            if (!isNaN(leadIn)) {
              beatmapData.offset = leadIn;
              console.log('DEBUG: Found AudioLeadIn (offset):', leadIn);
            }
          }
          else if (key === 'PreviewTime') {
            beatmapData.previewTime = parseInt(value);
            console.log('DEBUG: Found PreviewTime:', value);
          }
        }
      }
      
      // Parse difficulty info
      else if (currentSection === 'Difficulty') {
        const colonIndex = trimmedLine.indexOf(':');
        if (colonIndex > 0) {
          const key = trimmedLine.substring(0, colonIndex).trim();
          const value = trimmedLine.substring(colonIndex + 1).trim();
          
          if (key === 'OverallDifficulty') {
            const diffValue = parseFloat(value);
            // Map difficulty to our system
            if (diffValue < 3) beatmapData.difficulty = 'Easy';
            else if (diffValue < 6) beatmapData.difficulty = 'Medium';
            else beatmapData.difficulty = 'Hard';
            
            console.log('DEBUG: Found difficulty:', beatmapData.difficulty, '(', diffValue, ')');
          }
        }
      }
      
      // Parse timing points for BPM
      else if (currentSection === 'TimingPoints' && !beatmapData.bpm) {
        const parts = trimmedLine.split(',');
        if (parts.length >= 2) {
          const beatLength = parseFloat(parts[1].trim());
          if (beatLength > 0) {
            beatmapData.bpm = Math.round(60000 / beatLength);
            console.log('DEBUG: Calculated BPM:', beatmapData.bpm);
          }
        }
      }
      
      // Parse hit objects
      else if (currentSection === 'HitObjects') {
        const parts = trimmedLine.split(',');
        if (parts.length >= 4) {
          try {
            const x = parseInt(parts[0].trim());
            const time = parseInt(parts[2].trim());
            const typeData = parseInt(parts[3].trim());
            
            // For Taiko mode conversion, we need to determine if it's a Don (center) or Ka (rim)
            // In osu, bit 0 of the type field determines if it's a circle (1) or a slider (2)
            // In Taiko, center hits are generally red (Don) and rim hits are blue (Ka)
            
            // We'll use a mix of position and type to determine:
            // 1. Look at X position - in Taiko maps, this often indicates Don/Ka
            // 2. Check hitsound flags in later parts if available
            
            let hitType = 'don'; // Default to Don
            
            // Simple deterministic logic based on X position
            // For most Taiko converted maps, the X position helps determine the type
            if (x >= 256) {
              hitType = 'ka';
            }
            
            // If there's a hitsound type in the data (5th parameter)
            if (parts.length >= 5) {
              const hitsound = parseInt(parts[4].trim());
              // Use hitsound to help determine hit type:
              // Normal = 0, Whistle = 2, Finish = 4, Clap = 8
              // In Taiko, whistles/claps often correlate to rim hits (Ka)
              if (hitsound & 10) { // Check for Whistle (2) or Clap (8)
                hitType = 'ka';
              }
            }
            
            // Check if it's a proper hit object and not a spinner or slider
            if ((typeData & 1) || (typeData & 2) || (typeData & 8)) {
              // It's a circle, slider, or spinner - convert to our note format
              beatmapData.hitObjects.push({
                time,
                type: hitType === 'don' ? 1 : 2 // Convert to numeric type
              });
            }
          } catch (parseError) {
            console.error('DEBUG: Error parsing hit object line:', trimmedLine);
            console.error('DEBUG: Parse error:', parseError);
          }
        }
      }
    }
    
    // Sort hit objects by time
    beatmapData.hitObjects.sort((a, b) => a.time - b.time);
    
    console.log('DEBUG: Parsed', beatmapData.hitObjects.length, 'hit objects');
    
    return beatmapData;
  }
  
  /**
   * Check if expo-document-picker is available (for informing the user)
   */
  static isDocumentPickerAvailable() {
    const available = !!DocumentPicker && !!DocumentPicker.getDocumentAsync;
    console.log('DEBUG: Document picker available:', available);
    return available;
  }
} 