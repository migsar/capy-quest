import { Language } from './types';

// It sucks but apparently it is the only way with vite
import splash from "./assets/splash.png";
import capybara from "./assets/capybara.png";
import jaguar from "./assets/jaguar.png";
import anaconda from "./assets/anaconda.png";
import caiman from "./assets/caiman.png";
import wood from "./assets/wood.png";
import pumpkin from "./assets/pumpkin.png";
import watermelon from "./assets/watermelon.png";
import corn from "./assets/corn.png";
import capybara_loading from "./assets/capybara_loading.png";
import logo from "./assets/logo.png";
import pond from "./assets/pond.png";
import wall001 from "./assets/wall001.png";
import wall002 from "./assets/wall002.png";
import wall003 from "./assets/wall003.png";
import path001 from "./assets/path001.png";
import path002 from "./assets/path002.png";
import level_complete from "./assets/level_complete.png";

export const CELL_SIZE = 64; // Doubled size for better visibility for kids
export const BOARD_WIDTH = 20; // 20 * 64 = 1280px
export const BOARD_HEIGHT = 12; // 12 * 64 = 768px

export const ASSET_URL = "./assets/";

export const ASSET_URLS = {
  SPLASH_IMAGE: splash,
  CAPYBARA: capybara,
  JAGUAR: jaguar,
  ANACONDA: anaconda,
  CAIMAN: caiman,
  WOOD: wood,
  PUMPKIN: pumpkin,
  WATERMELON: watermelon,
  CORN: corn,
  LOADING: capybara_loading,
  LOGO: logo,
  POND: pond,
  WALL1: wall001,
  WALL2: wall002,
  WALL3: wall003,
  PATH1: path001,
  PATH2: path002,
  LEVEL_COMPLETE: level_complete,
};

// Doesn't work with vite's build
// export const ASSET_URLS = Object.fromEntries(
//   Object.entries(ASSETS).map(
//     ([k, v]) => ([k, new URL(`${ASSET_URL}${v}`, import.meta.url).href])
//   )
// );

// Visual Palette derived from the reference image
export const PALETTE = {
  BUSH_MAIN: '#2d5a27',
  BUSH_LIGHT: '#4a8b3c',
  BUSH_DARK: '#1a3318',
  DIRT_BG: '#dcb159', // Sand/Dirt base
  DIRT_NOISE: '#c29a48',
  WATER_MAIN: '#4fa4b8',
  WATER_LIGHT: '#a8d9e3',
  CAPYBARA: '#8c6239',
  
  // Predators
  JAGUAR: '#eab308',
  ANACONDA: '#3f6212', // Dark green/olive
  CAIMAN: '#15803d',   // Green
  
  // Treats
  WATERMELON_RIND: '#14532d',
  WATERMELON_FLESH: '#ef4444',
  CORN: '#facc15',
  PUMPKIN: '#f97316',

  // Jungle Gate
  VINE_MAIN: '#1e3a18',
  VINE_LIGHT: '#4d7c0f',
  VINE_FLOWER: '#dc2626',

  GATE: '#5d4037', // Fallback
  UI_BG: '#000000',
  UI_TEXT: '#ffffff'
};

export const TRANSLATIONS = {
  [Language.EN_US]: {
    preloading: "PREPARING ADVENTURE",
    loader_alt: "Loading",
    start: "START GAME",
    config: "SETTINGS",
    topic: "Trivia Topic",
    topicPlaceholder: "e.g., Animals, Cartoons",
    lives: "LIVES:",
    score: "SCORE:",
    level: "LEVEL:",
    gameOver: "GAME OVER",
    restart: "TRY AGAIN",
    gateLocked: "GATE LOCKED!",
    correct: "CORRECT!",
    wrong: "OOPS!",
    language: "Language",
    controls: "USE ARROW KEYS",
    loading: "MAKING MAZE...",
    loadingQuestion: "THINKING...",
    levelComplete: "LEVEL COMPLETE!",
    nextLevelIn: "Next level in",
    // Settings Screen
    tabGeneral: "General",
    tabPrompts: "Quiz Prompts",
    enableQuizzes: "Enable Quizzes",
    currentPrompt: "Current Learning Prompt",
    saveToFav: "Save to Favorites",
    loadJson: "Load JSON",
    saveJson: "Save JSON",
    favoritesList: "Favorite Prompts",
    back: "BACK",
    on: "ON",
    off: "OFF",
  },
  [Language.ES_MX]: {
    preloading: "PREPARANDO LA AVENTURA",
    loader_alt: "Cargando",
    start: "JUGAR",
    config: "AJUSTES",
    topic: "Tema",
    topicPlaceholder: "ej., Animales, Caricaturas",
    lives: "VIDAS:",
    score: "PUNTOS:",
    level: "NIVEL:",
    gameOver: "FIN DEL JUEGO",
    restart: "REINTENTAR",
    gateLocked: "¡CERRADO!",
    correct: "¡MUY BIEN!",
    wrong: "¡UPS!",
    language: "Idioma",
    controls: "USA LAS FLECHAS",
    loading: "CREANDO LABERINTO...",
    loadingQuestion: "PENSANDO...",
    levelComplete: "¡NIVEL COMPLETADO!",
    nextLevelIn: "Siguiente nivel en",
    // Settings Screen
    tabGeneral: "General",
    tabPrompts: "Temas Quiz",
    enableQuizzes: "Activar Preguntas",
    currentPrompt: "Tema Actual",
    saveToFav: "Guardar en Favoritos",
    loadJson: "Cargar JSON",
    saveJson: "Guardar JSON",
    favoritesList: "Temas Favoritos",
    back: "VOLVER",
    on: "ACTIVO",
    off: "INACTIVO",
  },
  [Language.PT_PT]: {
    preloading: "A PREPARAR A AVENTURA",
    loader_alt: "A carregar",
    start: "JOGAR",
    config: "OPÇÕES",
    topic: "Tópico",
    topicPlaceholder: "ex., Animais, Desenhos",
    lives: "VIDAS:",
    score: "PONTOS:",
    level: "NÍVEL:",
    gameOver: "FIM DE JOGO",
    restart: "REINICIAR",
    gateLocked: "TRANCADO!",
    correct: "BOA!",
    wrong: "OOPS!",
    language: "Idioma",
    controls: "USA AS SETAS",
    loading: "A CRIAR...",
    loadingQuestion: "A PENSAR...",
    levelComplete: "NÍVEL CONCLUÍDO!",
    nextLevelIn: "Próximo nível em",
    // Settings Screen
    tabGeneral: "Geral",
    tabPrompts: "Temas Quiz",
    enableQuizzes: "Ativar Preguntas",
    currentPrompt: "Tema Actual",
    saveToFav: "Guardar nos Favoritos",
    loadJson: "Carregar JSON",
    saveJson: "Guardar JSON",
    favoritesList: "Temas Favoritos",
    back: "VOLTAR",
    on: "ATIVO",
    off: "INATIVO",
  }
};
