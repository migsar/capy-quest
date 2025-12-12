import React, { useState, useEffect } from 'react';
import MainMenu from './components/MainMenu';
import Game from './components/Game';
import { GameSettings, GameState } from './types';
import { TRANSLATIONS } from './constants';
import { loadSettings, saveSettings } from './services/storageService';

const App: React.FC = () => {
  const [appState, setAppState] = useState<GameState>(GameState.MENU);
  
  // Initialize from LocalStorage
  const [settings, setSettings] = useState<GameSettings>(loadSettings);
  const [finalScore, setFinalScore] = useState(0);

  // Persistence effect
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const startGame = () => {
    setAppState(GameState.PLAYING);
  };

  const handleGameOver = (score: number) => {
    setFinalScore(score);
    setAppState(GameState.GAME_OVER);
  };

  const returnToMenu = () => {
    setAppState(GameState.MENU);
  };

  if (appState === GameState.MENU) {
    return (
      <MainMenu 
        onStart={startGame} 
        settings={settings} 
        setSettings={setSettings} 
      />
    );
  }

  if (appState === GameState.GAME_OVER) {
    const t = TRANSLATIONS[settings.language];
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
        <div className="text-center space-y-6 animate-in fade-in duration-500">
          <h1 className="text-6xl text-red-600 font-bold mb-4 pixel-font">{t.gameOver}</h1>
          <div className="text-4xl text-green-400 mb-8">
            {t.score}: {finalScore}
          </div>
          <button 
            onClick={returnToMenu}
            className="px-8 py-4 bg-white text-black text-2xl font-bold rounded hover:bg-gray-200 transition-colors uppercase"
          >
            {t.restart}
          </button>
        </div>
      </div>
    );
  }

  return (
    <Game 
      settings={settings} 
      onGameOver={handleGameOver}
      onExit={returnToMenu}
    />
  );
};

export default App;