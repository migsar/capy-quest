# Agent & AI Integration Documentation

## 🤖 AI Implementation Details
This project utilizes the **Google Gemini API** (`@google/genai`) to generate dynamic gameplay content.

### Trivia Generation System
*   **API Service**: `services/geminiService.ts`
*   **Quiz Service**: `services/quizService.ts`
*   **Model**: `gemini-2.5-flash`
*   **Prompt Engineering**:
    *   Target Audience: 6-year-old children.
    *   Format: JSON Array (strict schema enforcement via `responseSchema`).
    *   Content: Topic-based trivia with 4 options and 1 correct answer index.
*   **Performance Optimization** (handled by `quizService`):
    *   **Batching**: Requests 20 questions at a time to reduce API round-trips.
    *   **Pre-fetching**: The service initiates a background fetch when the cache runs low (< 5 items) to ensure zero-latency when a player hits a gate.
    *   **Fallback**: Includes an offline fallback question ("Moo" -> "Cow") if the API fails or quota is exceeded.

## 🏗️ Architecture for Agents
If you are an AI assistant modifying this code, adhere to the following architectural patterns:

### 1. The React-Pixi Bridge
*   **State Separation**: 
    *   **React** handles UI overlays (HUD, Trivia, Menus, Settings) and game progression (Score, Level).
    *   **PixiJS (`GameEngine.ts`)** handles the game loop, physics, rendering, and input.
*   **Communication**:
    *   **React -> Engine**: Via `ref.current` methods (e.g., `engine.loadLevel()`, `engine.resume()`).
    *   **Engine -> React**: Via a callback function passed in constructor (e.g., `eventCallback('GATE_HIT', data)`).
*   **Lifecycle**: The Engine is instantiated *once* in `useEffect` and cleaned up on unmount.

### 2. Asset Management
*   Asset URLs are defined in `constants.ts`, assets are in `/src/assets/`.
*   Textures are pre-loaded in `GameEngine.init()` using `Assets.load()`.
*   Procedural textures (Dirt, Walls) are generated via `Graphics` to save bandwidth and allow for easy palette swaps.
*   All text must be created in English(US), Spanish(MX), and Portuguese(PT), text strings are always saved in `constants.ts` and referenced from there.

### 3. State Persistence
*   `localStorage` is used for Settings (Language, Quiz Toggle, Favorites).
*   Hooks in `MainMenu.tsx` handle JSON import/export of prompts.

## 📝 Coding Conventions
*   **Styling**: TailwindCSS for UI.
*   **Fonts**: 'VT323' for retro aesthetic.
*   **Types**: Strict TypeScript interfaces in `types.ts`.
*   **Imports**: Named imports preferred. Avoid circular dependencies between Engine and React components.
