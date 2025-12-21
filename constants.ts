import { Language } from './types';

export const CELL_SIZE = 64; // Doubled size for better visibility for kids
export const BOARD_WIDTH = 20; // 20 * 64 = 1280px
export const BOARD_HEIGHT = 12; // 12 * 64 = 768px

export const ASSET_URLS = {
  CAPYBARA: "https://20230229-us.us-southeast-1.linodeobjects.com/capybara%2Fcapybara.png",
  JAGUAR: "https://20230229-us.us-southeast-1.linodeobjects.com/capybara%2Fjaguar.png",
  ANACONDA: "https://20230229-us.us-southeast-1.linodeobjects.com/capybara%2Fanaconda.png",
  CAIMAN: "https://20230229-us.us-southeast-1.linodeobjects.com/capybara%2Fcaiman.png",
  WOOD: "https://20230229-us.us-southeast-1.linodeobjects.com/capybara%2Fwood.png",
  PUMPKIN: "https://20230229-us.us-southeast-1.linodeobjects.com/capybara%2Fpumpkin.png",
  WATERMELON: "https://20230229-us.us-southeast-1.linodeobjects.com/capybara%2Fwatermelon.png",
  CORN: "https://20230229-us.us-southeast-1.linodeobjects.com/capybara%2Fcorn.png",
  LOADING: "https://20230229-us.us-southeast-1.linodeobjects.com/capybara%2Fcapybara_loading.png",
  LOGO: "https://20230229-us.us-southeast-1.linodeobjects.com/capybara%2Flogo.png",
  POND: "https://20230229-us.us-southeast-1.linodeobjects.com/capybara%2Fpond.png",
  WALL1: "https://20230229-us.us-southeast-1.linodeobjects.com/capybara%2Fwall001.png",
  WALL2: "https://20230229-us.us-southeast-1.linodeobjects.com/capybara%2Fwall002.png",
  WALL3: "https://20230229-us.us-southeast-1.linodeobjects.com/capybara%2Fwall003.png",
  PATH1: "https://20230229-us.us-southeast-1.linodeobjects.com/capybara%2Fpath001.png",
  PATH2: "https://20230229-us.us-southeast-1.linodeobjects.com/capybara%2Fpath002.png",
  LEVEL_COMPLETE: "https://20230229-us.us-southeast-1.linodeobjects.com/capybara%2Flevel_complete.png",
};

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
    enableQuizzes: "Habilitar Preguntas",
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