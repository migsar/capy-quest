
export enum Language {
  EN_US = 'en-US',
  ES_MX = 'es-MX',
  PT_PT = 'pt-PT',
}

export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  TRIVIA = 'TRIVIA',
  GAME_OVER = 'GAME_OVER',
  WIN_LEVEL = 'WIN_LEVEL',
}

export enum EntityType {
  EMPTY = 0,
  WALL = 1,
  PLAYER = 2,
  PREDATOR = 3,
  TREAT = 4,
  GATE = 5,
  POND = 6,
}

export enum PredatorType {
  JAGUAR = 'JAGUAR',
  ANACONDA = 'ANACONDA',
  CAIMAN = 'CAIMAN',
}

export enum TreatType {
  WATERMELON = 'WATERMELON',
  CORN = 'CORN',
  PUMPKIN = 'PUMPKIN',
}

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export interface Position {
  x: number;
  y: number;
}

export interface TriviaQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

export interface Predator {
  id: number;
  position: Position;
  direction: Direction;
  type: PredatorType;
}

export interface Treat {
  position: Position;
  type: TreatType;
}

export interface LevelConfig {
  width: number;
  height: number;
  difficulty: number;
}

export interface GameSettings {
  language: Language;
  enableQuizzes: boolean;
  selectedPrompt: string;
  favoritePrompts: string[];
}

export type TriviaContextType = 'GATE' | 'TREAT' | 'PREDATOR';

export interface TriviaContext {
  type: TriviaContextType;
  pos?: Position; // For Gates and Treats
  predatorId?: number; // For Predators
}
