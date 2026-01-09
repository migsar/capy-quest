import { TRANSLATIONS, ASSET_URLS } from '../constants';

interface Props {
  language: string;
  onButtonClick: () => void;
  finalScore: number;
}

export default function GameOverScreen({ language, onButtonClick, finalScore }: Props) {
  const t = TRANSLATIONS[language];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4 font-['VT323']">
      <div className="text-center space-y-6 animate-in fade-in duration-500">
        <div className="relative mb-6">
          <img 
            src={ASSET_URLS.GAME_OVER} 
            alt="Game Over" 
            className="w-full max-w-sm mx-auto drop-shadow-[0_0_20px_rgba(255,255,255,0.4)] animate-bounce"
          />
        </div>
        <h1 className="text-6xl text-red-600 font-bold mb-4">{t.gameOver}</h1>
        <div className="text-4xl text-green-400 mb-8">
          {t.score}: {finalScore}
        </div>
        <button 
          onClick={onButtonClick}
          className="px-8 py-4 bg-white text-black text-2xl font-bold rounded hover:bg-gray-200 transition-colors uppercase border-b-8 border-gray-400 active:border-b-0 active:translate-y-2"
        >
          {t.restart}
        </button>
      </div>
    </div>
  );	
}
