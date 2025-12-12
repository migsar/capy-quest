import React, { useState, useRef } from 'react';
import { GameSettings, Language } from '../types';
import { TRANSLATIONS, ASSET_URLS } from '../constants';

interface Props {
  onStart: () => void;
  settings: GameSettings;
  setSettings: React.Dispatch<React.SetStateAction<GameSettings>>;
}

const SPLASH_IMAGE_URL = "https://20230229-us.us-southeast-1.linodeobjects.com/capybara%2Fsplash.png";

const GearIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const LANG_OPTS = {
  [Language.EN_US]: { label: 'English', flag: '🇺🇸' },
  [Language.ES_MX]: { label: 'Español', flag: '🇲🇽' },
  [Language.PT_PT]: { label: 'Português', flag: '🇵🇹' }
};

const MainMenu: React.FC<Props> = ({ onStart, settings, setSettings }) => {
  const [view, setView] = useState<'MAIN' | 'CONFIG'>('MAIN');
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'PROMPTS'>('GENERAL');
  const t = TRANSLATIONS[settings.language];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveFavorite = () => {
    if (settings.selectedPrompt && !settings.favoritePrompts.includes(settings.selectedPrompt)) {
      setSettings(prev => ({
        ...prev,
        favoritePrompts: [settings.selectedPrompt, ...prev.favoritePrompts]
      }));
    }
  };

  const handleDeleteFavorite = (prompt: string) => {
    setSettings(prev => ({
      ...prev,
      favoritePrompts: prev.favoritePrompts.filter(p => p !== prompt)
    }));
  };

  const handleExportJson = () => {
    const dataStr = JSON.stringify(settings.favoritePrompts, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'capymaze_prompts.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = JSON.parse(event.target?.result as string);
        if (Array.isArray(result) && result.every(i => typeof i === 'string')) {
          // Merge unique
          setSettings(prev => ({
            ...prev,
            favoritePrompts: Array.from(new Set([...prev.favoritePrompts, ...result]))
          }));
          alert('Prompts loaded successfully!');
        } else {
          alert('Invalid JSON format. Expected an array of strings.');
        }
      } catch (err) {
        console.error(err);
        alert('Failed to parse JSON.');
      }
    };
    reader.readAsText(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-stone-900 font-['VT323']">
      {/* Background Image */}
      <img 
        src={SPLASH_IMAGE_URL} 
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
      ) : (
        /* Configuration Screen */
        <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="bg-stone-900 border-4 border-stone-600 rounded-lg w-full max-w-5xl h-[80vh] flex shadow-2xl overflow-hidden">
              
              {/* Sidebar */}
              <div className="w-1/4 bg-stone-800 border-r-4 border-stone-600 flex flex-col">
                 <div className="p-6 border-b-4 border-stone-700 bg-stone-900">
                    <h2 className="text-3xl text-green-400">{t.config}</h2>
                 </div>
                 
                 <button 
                    onClick={() => setActiveTab('GENERAL')}
                    className={`p-4 text-left text-2xl transition-colors ${activeTab === 'GENERAL' ? 'bg-stone-700 text-white border-l-8 border-green-500' : 'text-stone-400 hover:text-white hover:bg-stone-700/50'}`}
                 >
                    {t.tabGeneral}
                 </button>
                 
                 <button 
                    onClick={() => setActiveTab('PROMPTS')}
                    className={`p-4 text-left text-2xl transition-colors ${activeTab === 'PROMPTS' ? 'bg-stone-700 text-white border-l-8 border-green-500' : 'text-stone-400 hover:text-white hover:bg-stone-700/50'}`}
                 >
                    {t.tabPrompts}
                 </button>

                 <div className="mt-auto p-4 border-t-4 border-stone-700">
                    <button 
                       onClick={() => setView('MAIN')}
                       className="w-full py-3 bg-stone-600 hover:bg-stone-500 text-white font-bold border-b-4 border-stone-800 active:border-b-0 active:translate-y-1 transition-all text-xl"
                    >
                       {t.back}
                    </button>
                 </div>
              </div>

              {/* Content Area */}
              <div className="w-3/4 bg-stone-900 p-8 overflow-y-auto">
                 {activeTab === 'GENERAL' && (
                    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                       <div>
                          <label className="block text-2xl text-stone-300 mb-4 border-b-2 border-stone-700 pb-2">{t.language}</label>
                          <div className="flex flex-wrap gap-4">
                            {Object.values(Language).map((lang) => (
                              <button
                                key={lang}
                                onClick={() => setSettings(s => ({ ...s, language: lang }))}
                                className={`px-6 py-4 border-2 text-xl rounded flex items-center gap-3 ${
                                  settings.language === lang
                                    ? 'bg-green-700 border-green-400 text-white shadow-[0_0_10px_rgba(74,222,128,0.4)]'
                                    : 'border-stone-600 text-stone-500 hover:border-green-800 bg-stone-800'
                                } transition-all uppercase font-bold`}
                              >
                                <span className="text-3xl">{LANG_OPTS[lang].flag}</span>
                                <span>{LANG_OPTS[lang].label}</span>
                              </button>
                            ))}
                          </div>
                       </div>

                       <div>
                          <label className="block text-2xl text-stone-300 mb-4 border-b-2 border-stone-700 pb-2">{t.enableQuizzes}</label>
                          <label className="flex items-center space-x-4 cursor-pointer group w-fit">
                             <div className={`w-12 h-12 border-4 flex items-center justify-center transition-colors ${settings.enableQuizzes ? 'bg-green-600 border-green-400' : 'bg-stone-800 border-stone-600 group-hover:border-stone-500'}`}>
                                <input 
                                  type="checkbox" 
                                  className="hidden" 
                                  checked={settings.enableQuizzes} 
                                  onChange={(e) => setSettings(s => ({...s, enableQuizzes: e.target.checked}))}
                                />
                                {settings.enableQuizzes && <span className="text-4xl text-white pb-2">✓</span>}
                             </div>
                             <span className="text-xl text-stone-400 group-hover:text-white transition-colors">
                               {settings.enableQuizzes ? t.on : t.off}
                             </span>
                          </label>
                       </div>
                    </div>
                 )}

                 {activeTab === 'PROMPTS' && (
                    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300 h-full flex flex-col">
                       {/* Editor */}
                       <div className="flex-shrink-0">
                          <label className="block text-2xl text-yellow-500 mb-2">{t.currentPrompt}</label>
                          <textarea
                            value={settings.selectedPrompt}
                            onChange={(e) => setSettings(s => ({ ...s, selectedPrompt: e.target.value }))}
                            className="w-full h-32 bg-stone-800 border-2 border-stone-600 p-4 text-white text-xl focus:border-yellow-500 focus:outline-none resize-none rounded"
                            placeholder={t.topicPlaceholder}
                          />
                          <div className="flex justify-end mt-2">
                             <button 
                                onClick={handleSaveFavorite}
                                className="px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded font-bold border-b-4 border-yellow-900 active:border-b-0 active:translate-y-1"
                             >
                                {t.saveToFav}
                             </button>
                          </div>
                       </div>

                       {/* Import/Export */}
                       <div className="flex gap-4 border-t border-b border-stone-700 py-4">
                          <button 
                             onClick={handleExportJson}
                             className="flex-1 py-2 bg-blue-900 hover:bg-blue-800 text-blue-200 border border-blue-700 rounded"
                          >
                             {t.saveJson}
                          </button>
                          <label className="flex-1 py-2 bg-stone-700 hover:bg-stone-600 text-stone-200 border border-stone-500 rounded text-center cursor-pointer">
                             {t.loadJson}
                             <input 
                                type="file" 
                                accept=".json" 
                                className="hidden" 
                                ref={fileInputRef}
                                onChange={handleImportJson}
                             />
                          </label>
                       </div>

                       {/* Favorites List */}
                       <div className="flex-1 overflow-hidden flex flex-col">
                          <h3 className="text-2xl text-stone-300 mb-4">{t.favoritesList}</h3>
                          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                             {settings.favoritePrompts.map((prompt, idx) => (
                                <div key={idx} className="group flex items-center justify-between bg-stone-800 p-3 rounded border border-stone-700 hover:border-yellow-500/50 transition-colors">
                                   <button 
                                      onClick={() => setSettings(s => ({...s, selectedPrompt: prompt}))}
                                      className="flex-1 text-left text-lg text-stone-300 hover:text-yellow-400 truncate mr-4"
                                   >
                                      {prompt}
                                   </button>
                                   <button 
                                      onClick={() => handleDeleteFavorite(prompt)}
                                      className="text-stone-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity px-2"
                                   >
                                      ✕
                                   </button>
                                </div>
                             ))}
                             {settings.favoritePrompts.length === 0 && (
                                <p className="text-stone-600 italic">No favorites saved yet.</p>
                             )}
                          </div>
                       </div>
                    </div>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default MainMenu;