import React, { useState, useRef } from 'react';
import { GameSettings, Language } from '../types';
import { TRANSLATIONS, ASSET_URLS } from '../constants';
import ConfigScreen from './ConfigScreen';

interface Props {
  onStart: () => void;
  settings: GameSettings;
  setSettings: React.Dispatch<React.SetStateAction<GameSettings>>;
}

const GearIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const MainMenu: React.FC<Props> = ({ onStart, settings, setSettings }) => {
  const [view, setView] = useState<'MAIN' | 'CONFIG'>('MAIN');
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'PROMPTS'>('GENERAL');
  const t = TRANSLATIONS[settings.language];
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-stone-900 font-['VT323']">
      {/* Background Image */}
      <img 
        src={ASSET_URLS.SPLASH_IMAGE} 
        alt="Capybara Splash" 
        className="absolute inset-0 w-full h-full object-cover select-none"
      />
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/30 pointer-events-none" />
      
      {view === 'MAIN' ? (
        <>
          <div className="absolute inset-0 flex flex-col items-center justify-between p-8 z-10 pointer-events-none">
            {/* Title / Logo */}
            <div className="mt-12 text-center pointer-events-auto hover:scale-105 transition-transform duration-300">
               <img 
                 src={ASSET_URLS.LOGO} 
                 alt="Capy Maze Quest" 
                 className="w-full max-w-sm object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]"
               />
            </div>

            {/* Play Button */}
            <div className="mb-12 pointer-events-auto">
              <button
                onClick={onStart}
                className="group relative px-12 py-6 bg-green-600 hover:bg-green-500 transition-all active:translate-y-1"
              >
                 <div className="absolute inset-0 border-4 border-green-800 pointer-events-none" />
                 <div className="absolute inset-0 border-b-8 border-r-8 border-green-900/50 pointer-events-none group-active:border-b-0 group-active:border-r-0" />
                 <span className="text-4xl md:text-5xl font-bold text-white drop-shadow-md tracking-widest">
                    {t.start}
                 </span>
              </button>
            </div>
          </div>

          <button 
            onClick={() => setView('CONFIG')}
            className="absolute top-6 right-6 p-3 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full text-white/80 hover:text-white transition-all z-20 border-2 border-transparent hover:border-white/20"
          >
            <GearIcon />
          </button>
        </>
      ) : (<ConfigScreen settings={settings} setSettings={setSettings} setView={setView} />)}
    </div>
  );
};

export default MainMenu;
