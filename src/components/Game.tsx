
import React, { useEffect, useRef, useState } from 'react';
import { TRANSLATIONS, ASSET_URLS } from '../constants';
import { quizService } from '../services/quizService';
import { GameEngine } from '../classes/GameEngine';

import {
  GameState,
  GameSettings,
  QuizQuestion,
  QuizContext,
  QuizContextType,
} from '../types';

interface Props {
  settings: GameSettings;
  onGameOver: (score: number) => void;
  onExit: () => void;
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
  const [lives, setLives] = useState(3);
  const [gameState, setGameState] = useState<GameState>(GameState.PLAYING);
  
  // Quiz State
  const [currentQuiz, setCurrentQuiz] = useState<QuizQuestion | null>(null);
  const [quizContext, setQuizContext] = useState<QuizContext | null>(null);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [quizFeedback, setQuizFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);

  // Level Complete State
  const [countdown, setCountdown] = useState(5);

  // We use a ref to store the latest handler so the GameEngine (initialized once)
  // can always call the latest version of the logic with fresh state.
  const handleEngineEventRef = useRef<(event: string, data: any) => void>(() => {});

  const MAX_LIVES = 5;

  useEffect(() => {
    quizService.initialize(settings.selectedPrompt, settings.language);
  }, [settings.selectedPrompt, settings.language]);

  const handleQuizTrigger = async (type: QuizContextType, data: any) => {
    if (!settings.enableQuizzes) {
      if (type === 'GATE') engineRef.current?.unlockGate(data.pos);
      if (type === 'TREAT') {
        engineRef.current?.resolveTreat(data.pos);
        setScore(s => s + 100);
        setLives(prev => Math.min(prev + 1, MAX_LIVES));
      }
      if (type === 'PREDATOR') {
        setLives(prev => prev - 1);
        engineRef.current?.resolvePredator(data.predatorId, false);
      }
      return;
    }

    setGameState(GameState.quiz);
    setQuizContext({ type, ...data });
    setLoadingQuiz(true);
    
    const question = await quizService.getNextQuestion();
    setCurrentQuiz(question);
    setLoadingQuiz(false);
  };

  const handleQuizAnswer = (index: number) => {
    if (!currentQuiz || !quizContext || !engineRef.current) return;

    setSelectedAnswerIndex(index);
    const isCorrect = index === currentQuiz.correctIndex;
    
    const FEEDBACK_DURATION = 3000;

    if (isCorrect) {
      setQuizFeedback('correct');
      setTimeout(() => {
        if (quizContext.type === 'GATE' && quizContext.pos) {
          engineRef.current?.unlockGate(quizContext.pos);
          setScore(prev => prev + 500);
        }
        else if (quizContext.type === 'TREAT' && quizContext.pos) {
          engineRef.current?.resolveTreat(quizContext.pos);
          setScore(prev => prev + 100);
          setLives(prev => Math.min(prev + 1, MAX_LIVES));
        }
        else if (quizContext.type === 'PREDATOR' && quizContext.predatorId !== undefined) {
          engineRef.current?.resolvePredator(quizContext.predatorId, true);
        }
        resetQuizState();
      }, FEEDBACK_DURATION);
    } else {
      setQuizFeedback('wrong');
      setTimeout(() => {
        if (quizContext.type === 'GATE') {
           setLives(prev => prev - 1);
           engineRef.current?.resume(); 
        }
        else if (quizContext.type === 'TREAT' && quizContext.pos) {
           engineRef.current?.resolveTreat(quizContext.pos);
        }
        else if (quizContext.type === 'PREDATOR' && quizContext.predatorId !== undefined) {
           setLives(prev => prev - 1);
           engineRef.current?.resolvePredator(quizContext.predatorId, false);
        }
        resetQuizState();
      }, FEEDBACK_DURATION);
    }
  };

  const resetQuizState = () => {
    setQuizFeedback(null);
    setCurrentQuiz(null);
    setQuizContext(null);
    setSelectedAnswerIndex(null);
    setGameState(GameState.PLAYING);
  };

  useEffect(() => {
    handleEngineEventRef.current = (event: string, data: any) => {
      switch(event) {
        case 'GATE_HIT':
          handleQuizTrigger('GATE', { pos: data });
          break;
        case 'HIT_TREAT':
          handleQuizTrigger('TREAT', { pos: data });
          break;
        case 'HIT_PREDATOR':
          handleQuizTrigger('PREDATOR', { predatorId: data.id });
          break;
        case 'WIN_LEVEL':
          setScore(s => s + 1000);
          setGameState(GameState.WIN_LEVEL);
          break;
      }
    };
  }); 

  useEffect(() => {
    if (gameState === GameState.WIN_LEVEL) {
      setCountdown(5);
      const interval = setInterval(() => {
        setCountdown(prev => Math.max(0, prev - 1));
      }, 1000);

      const timeout = setTimeout(() => {
        setLevel(prev => prev + 1);
        setGameState(GameState.PLAYING);
      }, 5000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [gameState]);

  useEffect(() => {
    let isMounted = true;
    let engine: GameEngine | null = null;

    const initEngine = async () => {
      if (!canvasContainerRef.current || !isMounted) return;

      const proxyCallback = (event: string, data: any) => {
        handleEngineEventRef.current(event, data);
      };

      engine = new GameEngine(canvasContainerRef.current, proxyCallback);
      engineRef.current = engine;

      try {
        await engine.init();
        if (isMounted && engineRef.current) {
          engineRef.current.loadLevel(level);
        }
      } catch (error) {
        console.error('Failed to initialize game engine:', error);

        if (engine && isMounted) {
          engine.destroy();
          engineRef.current = null;
        }
      }
    };

    initEngine();

    return () => {
      isMounted = false;
    
      // Clean up the engine
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    
      // Also clean up the local variable if initialization was in progress
      if (engine && engine !== engineRef.current) {
        engine.destroy();
      }
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

      {/* Level Complete Modal */}
      {gameState === GameState.WIN_LEVEL && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in zoom-in duration-500">
           <div className="text-center max-w-lg w-full">
              <div className="relative mb-6">
                <img 
                  src={ASSET_URLS.LEVEL_COMPLETE} 
                  alt="Level Complete" 
                  className="w-full max-w-sm mx-auto drop-shadow-[0_0_20px_rgba(255,255,255,0.4)] animate-bounce"
                />
              </div>
              <h1 className="text-6xl md:text-8xl text-yellow-400 font-bold mb-8 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)] uppercase">
                {t.levelComplete}
              </h1>
              <div className="text-4xl text-white mb-4 bg-stone-800/50 py-4 border-y-4 border-stone-700">
                 {t.score}: <span className="text-green-400 font-bold">{score}</span>
              </div>
              <p className="text-2xl text-stone-400 tracking-widest">
                {t.nextLevelIn} {countdown}...
              </p>
           </div>
        </div>
      )}

      {/* Quiz Modal */}
      {gameState === GameState.quiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-stone-900 border-4 border-yellow-600 rounded-lg max-w-4xl w-full min-h-[400px] p-8 shadow-[0_0_50px_rgba(234,179,8,0.3)] animate-in fade-in zoom-in duration-200 font-[VT323] relative overflow-hidden flex flex-col">
             {loadingQuiz && (
               <div className="flex-1 flex flex-col items-center justify-center">
                 <img 
                   src={ASSET_URLS.LOADING} 
                   alt="Loading..." 
                   className="w-48 h-48 object-contain mb-6 animate-bounce" 
                 />
                 <p className="text-2xl text-yellow-500 tracking-widest animate-pulse">
                   {t.loadingQuestion}
                 </p>
               </div>
             )}

             {!loadingQuiz && currentQuiz && !quizFeedback && (
               <>
                 <h2 className="text-3xl md:text-5xl mb-8 text-center text-yellow-500 leading-tight">
                   {currentQuiz.question}
                 </h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                   {currentQuiz.options.map((option, idx) => (
                       <button
                         key={idx}
                         onClick={() => handleQuizAnswer(idx)}
                         className="py-4 px-6 text-2xl md:text-3xl border-2 border-stone-600 bg-stone-800 hover:bg-stone-700 hover:border-yellow-500 transition-all text-left rounded shadow-lg active:translate-y-1"
                       >
                         <span className="inline-block w-8 text-yellow-600 font-bold">{idx + 1}.</span> {option}
                       </button>
                   ))}
                 </div>
               </>
             )}

             {!loadingQuiz && currentQuiz && quizFeedback === 'correct' && (
                <div className="flex-1 flex flex-col items-center justify-center animate-in zoom-in duration-300">
                    <h2 className="text-3xl text-yellow-600 mb-6 opacity-60 text-center">{currentQuiz.question}</h2>
                    <div className="bg-green-600 border-8 border-green-400 rounded-2xl p-12 shadow-[0_0_60px_rgba(74,222,128,0.6)] transform scale-110 mb-8">
                        <span className="text-6xl md:text-8xl font-bold text-white text-center block drop-shadow-md">
                            {currentQuiz.options[currentQuiz.correctIndex]}
                        </span>
                    </div>
                    <div className="text-5xl text-green-400 font-bold animate-bounce uppercase tracking-widest">
                        {t.correct}
                    </div>
                </div>
             )}

             {!loadingQuiz && currentQuiz && quizFeedback === 'wrong' && selectedAnswerIndex !== null && (
                <div className="flex-1 flex flex-col justify-center animate-in slide-in-from-right duration-300 relative">
                   <div className="absolute top-0 left-0 transform -rotate-3 z-0 opacity-50 pointer-events-none">
                      <div className="text-2xl text-red-500 font-bold mb-1 ml-2">{t.wrong}</div>
                      <div className="bg-stone-800 border-2 border-red-800 p-4 rounded-lg">
                         <span className="text-3xl text-red-700 line-through decoration-4 decoration-red-600 blur-[1px]">
                           {currentQuiz.options[selectedAnswerIndex]}
                         </span>
                      </div>
                   </div>

                   <div className="flex flex-col items-center justify-center z-10 mt-12">
                      <div className="bg-green-700 border-8 border-green-500 rounded-2xl p-10 shadow-[0_0_50px_rgba(34,197,94,0.4)] w-full text-center">
                          <p className="text-5xl md:text-7xl font-bold text-white">
                             {currentQuiz.options[currentQuiz.correctIndex]}
                          </p>
                      </div>
                   </div>
                </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Game;
