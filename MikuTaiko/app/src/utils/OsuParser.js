import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';

/**
 * Utility for parsing .osu beatmap files for MikuTaiko
 */
export default class OsuParser {
  /**
   * Load and parse a .osu file from the assets directory
   * @param {string} osuFilePath - Path to the .osu file in assets
   * @returns {Promise<Object>} Structured beatmap data
   */
  static async parseOsuFile(osuFilePath) {
    try {
      console.log(`Loading .osu file from: ${osuFilePath}`);
      
      // Read the .osu file content
      const fileContent = await this._readAssetFile(osuFilePath);
      
      if (!fileContent) {
        throw new Error(`Could not read .osu file at: ${osuFilePath}`);
      }
      
      // Parse the content
      return this._parseOsuContent(fileContent);
    } catch (error) {
      console.error(`Error parsing .osu file: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Read a file from the assets directory
   * @param {string} filePath - Path to the file in assets
   * @returns {Promise<string>} File content
   */
  static async _readAssetFile(filePath) {
    try {
      // Load the asset
      const asset = Asset.fromModule(filePath);
      await asset.downloadAsync();
      
      // Read the file content
      const content = await FileSystem.readAsStringAsync(asset.localUri);
      return content;
    } catch (error) {
      console.error(`Error reading asset file: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Parse .osu file content into structured data
   * @param {string} osuContent - Content of the .osu file
   * @returns {Object} Structured beatmap data with timing and notes
   */
  static _parseOsuContent(osuContent) {
    // Initialize beatmap data
    const beatmapData = {
      title: null,
      artist: null,
      audioFilename: null,
      difficulty: null,
      bpm: null,
      taikoNotes: [] // This will contain the converted don/ka notes
    };
    
    // Split the content into lines
    const lines = osuContent.split('\n');
    
    // Track current section
    let currentSection = null;
    
    // Process the file line by line
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip empty lines
      if (!trimmedLine) continue;
      
      // Check for section headers
      if (trimmedLine.startsWith('[') && trimmedLine.endsWith(']')) {
        currentSection = trimmedLine.substring(1, trimmedLine.length - 1);
        continue;
      }
      
      // Parse general info and metadata
      if (currentSection === 'General' || currentSection === 'Metadata') {
        const colonIndex = trimmedLine.indexOf(':');
        if (colonIndex > 0) {
          const key = trimmedLine.substring(0, colonIndex).trim();
          const value = trimmedLine.substring(colonIndex + 1).trim();
          
          if (key === 'Title') beatmapData.title = value;
          else if (key === 'Artist') beatmapData.artist = value;
          else if (key === 'AudioFilename') beatmapData.audioFilename = value;
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
          }
        }
      }
      
      // Parse timing points (for BPM)
      else if (currentSection === 'TimingPoints' && !beatmapData.bpm) {
        const parts = trimmedLine.split(',');
        if (parts.length >= 2) {
          const beatLength = parseFloat(parts[1].trim());
          if (beatLength > 0) {
            beatmapData.bpm = Math.round(60000 / beatLength);
          }
        }
      }
      
      // Parse hit objects (notes)
      else if (currentSection === 'HitObjects') {
        this._parseHitObject(trimmedLine, beatmapData.taikoNotes);
      }
    }
    
    // Sort notes by time
    beatmapData.taikoNotes.sort((a, b) => a.time - b.time);
    
    // Convert to our game's format
    const convertedBeatmap = beatmapData.taikoNotes.map(note => ({
      type: note.type, // 'don' or 'ka'
      time: note.time  // timestamp in ms
    }));
    
    return {
      title: beatmapData.title || 'Unknown Song',
      artist: beatmapData.artist || 'Unknown Artist',
      difficulty: beatmapData.difficulty || 'Medium',
      bpm: beatmapData.bpm,
      audioFilename: beatmapData.audioFilename,
      beatmap: convertedBeatmap
    };
  }
  
  /**
   * Parse a hit object line from the .osu file
   * Converts osu! hit objects to taiko don/ka notes
   * 
   * @param {string} hitObjectLine - Line from [HitObjects] section
   * @param {Array} taikoNotes - Array to add the parsed note to
   */
  static _parseHitObject(hitObjectLine, taikoNotes) {
    const parts = hitObjectLine.split(',');
    if (parts.length < 4) return; // Invalid format
    
    // Extract basic data
    const x = parseInt(parts[0].trim());
    const time = parseInt(parts[2].trim());
    const type = parseInt(parts[3].trim());
    
    // For Taiko mode conversion:
    // Determine if it's a Don (center) or Ka (rim) hit
    
    // The conversion logic varies by osu! version and mode
    // This is a simplified conversion for demonstration
    
    // Check if it's a slider or spinner (bits 1 or 3)
    const isSlider = (type & 2) > 0;
    const isSpinner = (type & 8) > 0;
    
    if (isSpinner) {
      // For spinners in taiko, we often add multiple hits
      const endTime = parseInt(parts[5].trim());
      const duration = endTime - time;
      
      // Add multiple don hits during the spinner
      const interval = 200; // ms between hits
      for (let t = time; t <= endTime; t += interval) {
        taikoNotes.push({
          time: t,
          type: 'don' // Spinners are usually mapped to don
        });
      }
    } 
    else if (isSlider) {
      // For sliders, add a hit at the start
      taikoNotes.push({
        time: time,
        type: 'don' // Default to don for sliders
      });
      
      // Could also add slider ticks as ka hits
      if (parts.length > 6) {
        const repeats = parseInt(parts[6].trim());
        const duration = parseInt(parts[7].trim());
        
        // Add ka hits for slider ticks
        if (repeats > 0 && duration > 0) {
          const tickInterval = duration / (repeats + 1);
          for (let i = 1; i <= repeats; i++) {
            taikoNotes.push({
              time: time + (tickInterval * i),
              type: 'ka'
            });
          }
        }
      }
    }
    else {
      // Regular hit
      // Use x position to determine type (this is a simple heuristic)
      // In real taiko conversion, we'd look at hitsound or other properties
      const noteType = x < 256 ? 'don' : 'ka';
      
      // Check if it's a large note (finisher) - in real taiko these are harder hits
      const isFinisher = (type & 4) > 0;
      
      taikoNotes.push({
        time: time,
        type: noteType,
        isFinisher: isFinisher
      });
      
      // Check for hitsounds to better determine don/ka if needed
      if (parts.length > 4) {
        const hitsound = parseInt(parts[4].trim());
        // Could refine note type based on hitsound
        // whistle (2) and clap (8) are often ka, normal (0) and finish (4) are don
      }
    }
  }
  
  /**
   * Load all .osu files from the osu directory
   * @returns {Promise<Array>} Array of parsed beatmaps
   */
  static async loadAllBeatmaps() {
    try {
      // Here we would normally dynamically load all files
      // But for React Native/Expo, we need to require them statically
      // This is just a placeholder - in practice you'd need to list files manually
      
      const beatmapFiles = [
        require('../../../assets/songs/osu/example1.osu'),
        // Add more .osu files here as needed
      ];
      
      const beatmaps = [];
      
      for (const file of beatmapFiles) {
        try {
          const beatmap = await this.parseOsuFile(file);
          beatmaps.push(beatmap);
        } catch (error) {
          console.error(`Error parsing beatmap: ${error.message}`);
        }
      }
      
      return beatmaps;
    } catch (error) {
      console.error(`Error loading beatmaps: ${error.message}`);
      return [];
    }
  }
} 