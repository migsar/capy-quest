import React, { useEffect, useRef, useState } from 'react';
import { GameState, GameSettings, Position, TriviaQuestion, TriviaContext, TriviaContextType, Language } from '../types';
import { TRANSLATIONS, ASSET_URLS } from '../constants';
import { fetchTriviaBatch } from '../services/geminiService';
import { GameEngine } from '../classes/GameEngine';

interface Props {
  settings: GameSettings;
  onGameOver: (score: number) => void;
  onExit: () => void;
}

interface CachedQuestion extends TriviaQuestion {
  localId: string;
  usageCount: number;
}

const HomeIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const Game: React.FC<Props> = ({ settings, onGameOver, onExit }) => {
  const t = TRANSLATIONS[settings.language];
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Game UI State
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3); // Start with 3 lives
  const [gameState, setGameState] = useState<GameState>(GameState.PLAYING);
  
  // Trivia State
  const [currentTrivia, setCurrentTrivia] = useState<TriviaQuestion | null>(null);
  const [triviaContext, setTriviaContext] = useState<TriviaContext | null>(null);
  const [loadingTrivia, setLoadingTrivia] = useState(false);
  const [triviaFeedback, setTriviaFeedback] = useState<'correct' | 'wrong' | null>(null);

  // Trivia Cache State
  const [questionCache, setQuestionCache] = useState<CachedQuestion[]>([]);
  const [cacheParams, setCacheParams] = useState({ topic: '', lang: '' });

  const MAX_LIVES = 5;

  useEffect(() => {
    if (!canvasContainerRef.current) return;

    const handleEngineEvent = (event: string, data: any) => {
      switch(event) {
        case 'GATE_HIT':
          handleTriviaTrigger('GATE', { pos: data });
          break;
        case 'HIT_TREAT':
          handleTriviaTrigger('TREAT', { pos: data });
          break;
        case 'HIT_PREDATOR':
          handleTriviaTrigger('PREDATOR', { predatorId: data.id });
          break;
        case 'WIN_LEVEL':
          setScore(s => s + 1000);
          setLevel(l => l + 1);
          break;
      }
    };

    const engine = new GameEngine(canvasContainerRef.current, handleEngineEvent);
    engine.init().then(() => {
      engine.loadLevel(level);
    });
    engineRef.current = engine;

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (engineRef.current && level > 1) {
      engineRef.current.loadLevel(level);
      engineRef.current.resume();
    }
  }, [level]);

  useEffect(() => {
    if (lives <= 0) {
      onGameOver(score);
    }
  }, [lives, onGameOver, score]);

  // Helper to fetch and wrap questions
  const loadNewBatch = async (topic: string, lang: Language): Promise<CachedQuestion[]> => {
    const questions = await fetchTriviaBatch(topic, lang);
    return questions.map((q, i) => ({
      ...q,
      usageCount: 0,
      localId: `${Date.now()}-${i}`
    }));
  };

  // Logic to get the next question from cache or fetch new ones
  const getNextQuestion = async (): Promise<TriviaQuestion> => {
    let activeCache = [...questionCache];
    let activeTopic = cacheParams.topic;
    let activeLang = cacheParams.lang;

    // 1. Check if context (Topic/Lang) changed
    const contextChanged = activeTopic !== settings.selectedPrompt || activeLang !== settings.language;
    
    // 2. Check if we have available questions (usage < 2)
    const hasAvailable = activeCache.some(q => q.usageCount < 2);

    if (contextChanged || !hasAvailable) {
      const newBatch = await loadNewBatch(settings.selectedPrompt, settings.language);
      
      if (newBatch.length > 0) {
        activeCache = newBatch;
        activeTopic = settings.selectedPrompt;
        activeLang = settings.language;
        // Update state context immediately so subsequent calls know
        setCacheParams({ topic: activeTopic, lang: activeLang as string }); 
      } else {
        // Fallback if API fails
         return {
          question: "Which animal says 'Moo'? (Offline)",
          options: ["Cat", "Cow", "Dog", "Fish"],
          correctIndex: 1
        };
      }
    }

    // 3. Select random question from available ones
    const candidates = activeCache.filter(q => q.usageCount < 2);
    if (candidates.length === 0) {
      // Emergency fallback (should cover API failure case)
       return {
          question: "Which animal says 'Meow'? (Offline)",
          options: ["Cat", "Cow", "Dog", "Fish"],
          correctIndex: 0
        };
    }

    const selected = candidates[Math.floor(Math.random() * candidates.length)];

    // 4. Update usage count in state
    const updatedCache = activeCache.map(q => 
      q.localId === selected.localId 
        ? { ...q, usageCount: q.usageCount + 1 } 
        : q
    );
    
    setQuestionCache(updatedCache);
    return selected;
  };

  const handleTriviaTrigger = async (type: TriviaContextType, data: any) => {
    // If quizzes are disabled, handle standard behavior immediately
    if (!settings.enableQuizzes) {
      if (type === 'GATE') engineRef.current?.unlockGate(data.pos);
      if (type === 'TREAT') {
        engineRef.current?.resolveTreat(data.pos);
        setScore(s => s + 100);
        setLives(prev => Math.min(prev + 1, MAX_LIVES));
      }
      if (type === 'PREDATOR') {
        // Standard predator behavior: Lose life, reset
        setLives(prev => prev - 1);
        engineRef.current?.resolvePredator(data.predatorId, false);
      }
      return;
    }

    setGameState(GameState.TRIVIA);
    setTriviaContext({ type, ...data });
    setLoadingTrivia(true);
    
    // Use caching logic
    const question = await getNextQuestion();
    setCurrentTrivia(question);
    setLoadingTrivia(false);
  };

  const handleTriviaAnswer = (index: number) => {
    if (!currentTrivia || !triviaContext || !engineRef.current) return;

    const isCorrect = index === currentTrivia.correctIndex;

    if (isCorrect) {
      setTriviaFeedback('correct');
      // Success Logic
      setTimeout(() => {
        if (triviaContext.type === 'GATE' && triviaContext.pos) {
          engineRef.current?.unlockGate(triviaContext.pos);
          setScore(prev => prev + 500);
        }
        else if (triviaContext.type === 'TREAT' && triviaContext.pos) {
          engineRef.current?.resolveTreat(triviaContext.pos);
          setScore(prev => prev + 100);
          setLives(prev => Math.min(prev + 1, MAX_LIVES));
        }
        else if (triviaContext.type === 'PREDATOR' && triviaContext.predatorId !== undefined) {
          engineRef.current?.resolvePredator(triviaContext.predatorId, true);
          // Jumped over, no life lost
        }

        resetTriviaState();
      }, 1000);
    } else {
      setTriviaFeedback('wrong');
      // Failure Logic
      setTimeout(() => {
        if (triviaContext.type === 'GATE') {
           setLives(prev => prev - 1);
           engineRef.current?.resume(); // Bounce/Stay logic handled by engine implicitly by not unlocking
        }
        else if (triviaContext.type === 'TREAT' && triviaContext.pos) {
           // Wrong answer on treat: Treat disappears, NO heart gained
           engineRef.current?.resolveTreat(triviaContext.pos);
        }
        else if (triviaContext.type === 'PREDATOR' && triviaContext.predatorId !== undefined) {
           // Wrong answer on predator: Move to safe square (reset), Lose life
           setLives(prev => prev - 1);
           engineRef.current?.resolvePredator(triviaContext.predatorId, false);
        }

        resetTriviaState();
      }, 1000);
    }
  };

  const resetTriviaState = () => {
    setTriviaFeedback(null);
    setCurrentTrivia(null);
    setTriviaContext(null);
    setGameState(GameState.PLAYING);
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-stone-950 text-white font-[VT323] overflow-hidden">
      {/* Retro HUD Bar */}
      <div className="w-full bg-black border-b-4 border-stone-700 p-2 px-4 flex justify-between items-center text-xl md:text-3xl shadow-lg sticky top-0 z-10 h-16">
         <div className="flex items-center space-x-4">
           <button 
             onClick={onExit}
             className="mr-2 p-1 text-stone-400 hover:text-yellow-400 transition-colors"
             title="Return to Menu"
           >
             <HomeIcon />
           </button>
           <span className="text-white">{t.score}</span>
           <span className="text-white tracking-widest">{score.toString().padStart(6, '0')}</span>
         </div>
         
         <div className="hidden md:block text-stone-500">
           {t.level} {level}
         </div>

         <div className="flex items-center space-x-4">
           <span className="text-white">{t.lives}</span>
           <div className="flex space-x-1">
             {Array.from({ length: MAX_LIVES }).map((_, i) => (
               <span 
                 key={i} 
                 className={`text-2xl drop-shadow-sm ${i < lives ? 'text-red-600' : 'text-stone-800'}`}
               >
                 ❤
               </span>
             ))}
           </div>
         </div>
      </div>

      {/* PixiJS Canvas Container */}
      <div className="flex-1 flex items-center justify-center w-full bg-stone-900 p-4">
        <div 
          id="game-canvas-container" 
          ref={canvasContainerRef}
          className="shadow-[0_0_40px_rgba(0,0,0,0.6)] border-4 border-stone-800 rounded-lg overflow-hidden bg-black"
        >
          {/* Canvas is injected here */}
        </div>
      </div>

      {/* Trivia Modal */}
      {gameState === GameState.TRIVIA && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-stone-900 border-4 border-yellow-600 rounded-lg max-w-2xl w-full p-8 shadow-[0_0_50px_rgba(234,179,8,0.3)] animate-in fade-in zoom-in duration-200 font-[VT323]">
             {loadingTrivia ? (
               <div className="text-center py-10 flex flex-col items-center">
                 <img 
                   src={ASSET_URLS.LOADING} 
                   alt="Loading..." 
                   className="w-48 h-48 object-contain mb-6 animate-bounce" 
                 />
                 <p className="text-2xl text-yellow-500 tracking-widest animate-pulse">
                   {t.loadingQuestion}
                 </p>
               </div>
             ) : (
               <>
                 <h2 className="text-3xl md:text-4xl mb-6 text-center text-yellow-500 leading-tight">
                   {currentTrivia?.question}
                 </h2>
                 <div className="grid grid-cols-1 gap-4">
                   {currentTrivia?.options.map((option, idx) => {
                     let btnClass = "py-4 px-6 text-2xl border-2 border-stone-600 bg-stone-800 hover:bg-stone-700 hover:border-yellow-500 transition-all text-left";
                     
                     if (triviaFeedback === 'correct' && idx === currentTrivia.correctIndex) {
                       btnClass = "py-4 px-6 text-2xl border-2 border-green-500 bg-green-900 text-green-100 animate-pulse";
                     } else if (triviaFeedback === 'wrong' && idx !== currentTrivia.correctIndex) {
                       btnClass = "py-4 px-6 text-2xl border-2 border-red-500 bg-red-900 text-red-100";
                     }

                     return (
                       <button
                         key={idx}
                         onClick={() => !triviaFeedback && handleTriviaAnswer(idx)}
                         disabled={!!triviaFeedback}
                         className={btnClass}
                       >
                         <span className="inline-block w-8 text-yellow-600 font-bold">{idx + 1}.</span> {option}
                       </button>
                     );
                   })}
                 </div>
                 {triviaFeedback && (
                    <div className={`mt-6 text-center text-3xl font-bold ${triviaFeedback === 'correct' ? 'text-green-500' : 'text-red-500'}`}>
                        {triviaFeedback === 'correct' ? t.correct : t.wrong}
                    </div>
                 )}
               </>
             )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Game;