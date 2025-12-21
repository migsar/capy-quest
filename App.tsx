
import React, { useState, useEffect } from 'react';
import { Assets } from 'pixi.js';
import MainMenu from './components/MainMenu';
import Game from './components/Game';
import { GameSettings, GameState } from './types';
import { TRANSLATIONS, ASSET_URLS } from './constants';
import { loadSettings, saveSettings } from './services/storageService';

const App: React.FC = () => {
  const [appState, setAppState] = useState<GameState>(GameState.MENU);
  const [isBooting, setIsBooting] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  
  // Initialize from LocalStorage
  const [settings, setSettings] = useState<GameSettings>(loadSettings);
  const [finalScore, setFinalScore] = useState(0);

  // Persistence effect
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Global Preloading Logic
  useEffect(() => {
    const preloadAssets = async () => {
      // 1. Prepare assets for PixiJS and for Browser cache
      const assetEntries = Object.entries(ASSET_URLS);
      const splashUrl = "https://20230229-us.us-southeast-1.linodeobjects.com/capybara%2Fsplash.png";
      
      const assets = assetEntries.map(([key, url]) => ({
        alias: key.toLowerCase(),
        src: url
      }));
      assets.push({ alias: 'splash', src: splashUrl });

      try {
        // 2. Load with PixiJS (this fetches the resources via XHR/Fetch)
        await Assets.load(assets, (progress) => {
          setLoadProgress(Math.round(progress * 100));
        });

        // 3. Ensure browser also "sees" them as images to prevent flickering in React components
        // We create an Image object for each to force browser decoding/caching for <img> tags
        const imageLoaders = assets.map(a => {
           return new Promise((resolve) => {
              const img = new Image();
              img.src = a.src;
              img.onload = resolve;
              img.onerror = resolve; // Continue even if one fails
           });
        });

        await Promise.all(imageLoaders);

        // Small delay for smooth transition
        setTimeout(() => setIsBooting(false), 800);
      } catch (err) {
        console.error("Asset loading failed:", err);
        setIsBooting(false); // Proceed anyway to avoid soft-lock
      }
    };

    preloadAssets();
  }, []);

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

  if (isBooting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-stone-950 text-white font-[VT323]">
        <div className="relative">
          {/* We use a raw img here too, but it's the loading capy which is usually fast/hosted */}
          <img 
            src={ASSET_URLS.LOADING} 
            alt="Loading..." 
            className="w-48 h-48 object-contain animate-bounce mb-8"
          />
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-64 h-4 bg-stone-800 border-2 border-stone-600 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 transition-all duration-300" 
              style={{ width: `${loadProgress}%` }}
            />
          </div>
        </div>
        <p className="text-3xl text-green-500 mt-8 tracking-widest animate-pulse">
          PREPARING ADVENTURE... {loadProgress}%
        </p>
      </div>
    );
  }

  // Pre-render hidden images to keep them in browser memory if needed
  // This is a last-resort to ensure <img> tags never flicker
  const PreloadStash = () => (
    <div className="hidden pointer-events-none opacity-0" aria-hidden="true">
       {Object.values(ASSET_URLS).map(url => <img key={url} src={url} alt="" />)}
       <img src="https://20230229-us.us-southeast-1.linodeobjects.com/capybara%2Fsplash.png" alt="" />
    </div>
  );

  if (appState === GameState.MENU) {
    return (
      <>
        <PreloadStash />
        <MainMenu 
          onStart={startGame} 
          settings={settings} 
          setSettings={setSettings} 
        />
      </>
    );
  }

  if (appState === GameState.GAME_OVER) {
    const t = TRANSLATIONS[settings.language];
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4 font-['VT323']">
        <div className="text-center space-y-6 animate-in fade-in duration-500">
          <h1 className="text-6xl text-red-600 font-bold mb-4">{t.gameOver}</h1>
          <div className="text-4xl text-green-400 mb-8">
            {t.score}: {finalScore}
          </div>
          <button 
            onClick={returnToMenu}
            className="px-8 py-4 bg-white text-black text-2xl font-bold rounded hover:bg-gray-200 transition-colors uppercase border-b-8 border-gray-400 active:border-b-0 active:translate-y-2"
          >
            {t.restart}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <PreloadStash />
      <Game 
        settings={settings} 
        onGameOver={handleGameOver}
        onExit={returnToMenu}
      />
    </>
  );
};

export default App;
