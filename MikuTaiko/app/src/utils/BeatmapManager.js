import OsuParser from './OsuParser';
import { Asset } from 'expo-asset';

/**
 * Manages the loading and caching of beatmaps from .osu files
 */
export default class BeatmapManager {
  // Store loaded beatmaps
  static _loadedBeatmaps = {};
  
  // Initialize flag
  static _initialized = false;
  
  /**
   * Initialize the BeatmapManager by preloading all available beatmaps
   */
  static async initialize() {
    if (this._initialized) return;
    
    console.log('BeatmapManager: Initializing...');
    
    try {
      // List of .osu files to load (would be more dynamic in a real app)
      const beatmapFiles = [
        {
          id: 'example1',
          file: require('../../../assets/songs/osu/example1.osu'),
          audioFile: require('../../../assets/songs/redial.mp3'),
          coverImage: require('../../../assets/images/redial.png')
        },
        // Add more beatmaps here
      ];
      
      // Load each beatmap
      for (const beatmap of beatmapFiles) {
        try {
          // Parse the .osu file
          const parsedBeatmap = await OsuParser.parseOsuFile(beatmap.file);
          
          // Add additional metadata
          const finalBeatmap = {
            ...parsedBeatmap,
            id: beatmap.id,
            audioFile: beatmap.audioFile,
            coverImage: beatmap.coverImage,
            source: 'osu'
          };
          
          // Store in our collection
          this._loadedBeatmaps[beatmap.id] = finalBeatmap;
          
          console.log(`BeatmapManager: Loaded "${finalBeatmap.title}" (${finalBeatmap.beatmap.length} notes)`);
        } catch (error) {
          console.error(`BeatmapManager: Error loading beatmap ${beatmap.id}:`, error);
        }
      }
      
      this._initialized = true;
      console.log(`BeatmapManager: Initialized with ${Object.keys(this._loadedBeatmaps).length} beatmaps`);
    } catch (error) {
      console.error('BeatmapManager: Initialization error:', error);
    }
  }
  
  /**
   * Get all available beatmaps
   * @returns {Array} Array of beatmap objects
   */
  static getAllBeatmaps() {
    return Object.values(this._loadedBeatmaps);
  }
  
  /**
   * Get a specific beatmap by ID
   * @param {string} id - Beatmap ID
   * @returns {Object|null} Beatmap object or null if not found
   */
  static getBeatmap(id) {
    return this._loadedBeatmaps[id] || null;
  }
  
  /**
   * Convert all loaded beatmaps to song format for the song select screen
   * @returns {Array} Array of song objects compatible with SongSelectScreen
   */
  static getSongsFromBeatmaps() {
    return Object.values(this._loadedBeatmaps).map(beatmap => ({
      id: beatmap.id,
      title: beatmap.title,
      artist: beatmap.artist,
      difficulty: beatmap.difficulty,
      coverImage: beatmap.coverImage,
      audioFile: beatmap.audioFile,
      beatmap: beatmap.beatmap,
      bpm: beatmap.bpm,
      source: 'osu'
    }));
  }
  
  /**
   * Add a new beatmap from a .osu file
   * @param {Object} beatmapInfo - Information about the beatmap
   * @returns {Promise<Object>} The added beatmap
   */
  static async addBeatmap(beatmapInfo) {
    try {
      if (!beatmapInfo.file) {
        throw new Error('Beatmap file is required');
      }
      
      // Generate an ID if not provided
      const id = beatmapInfo.id || `beatmap_${Date.now()}`;
      
      // Parse the .osu file
      const parsedBeatmap = await OsuParser.parseOsuFile(beatmapInfo.file);
      
      // Create the full beatmap object
      const finalBeatmap = {
        ...parsedBeatmap,
        id,
        audioFile: beatmapInfo.audioFile,
        coverImage: beatmapInfo.coverImage || require('../../../assets/images/default-cover.png'),
        source: 'osu'
      };
      
      // Store in our collection
      this._loadedBeatmaps[id] = finalBeatmap;
      
      console.log(`BeatmapManager: Added new beatmap "${finalBeatmap.title}"`);
      
      return finalBeatmap;
    } catch (error) {
      console.error('BeatmapManager: Error adding beatmap:', error);
      throw error;
    }
  }
} 