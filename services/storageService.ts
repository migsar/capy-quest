import { GameSettings, Language } from '../types';

const STORAGE_KEY = 'capymaze_settings_v1';

const DEFAULT_SETTINGS: GameSettings = {
  language: Language.EN_US,
  enableQuizzes: true,
  selectedPrompt: "Capybaras",
  favoritePrompts: [
    "Capybaras", 
    "Disney Movies", 
    "Basic Math for 6 year olds", 
    "Solar System",
    "Dinosaurs"
  ]
};

export const loadSettings = (): GameSettings => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to ensure all fields exist (handling updates)
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.error("Failed to load settings", e);
  }
  return DEFAULT_SETTINGS;
};

export const saveSettings = (settings: GameSettings) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error("Failed to save settings", e);
  }
};