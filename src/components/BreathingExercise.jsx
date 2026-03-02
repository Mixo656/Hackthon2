import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const BREATH_PHASES = [
  { name: 'Breathe In', duration: 4, instruction: 'Inhale slowly through your nose' },
  { name: 'Hold', duration: 4, instruction: 'Hold gently' },
  { name: 'Breathe Out', duration: 6, instruction: 'Exhale slowly through your mouth' },
  { name: 'Rest', duration: 2, instruction: 'Pause before the next breath' }
];

export default function BreathingExercise({ cycles = 3, onComplete, isCompleted }) {
  const [isActive, setIsActive] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [countdown, setCountdown] = useState(BREATH_PHASES[0].duration);
  const [completedCycles, setCompletedCycles] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let interval;
    if (isActive) {
      interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            const nextPhase = (currentPhase + 1) % BREATH_PHASES.length;
            if (nextPhase === 0) {
              const newCycles = completedCycles + 1;
              setCompletedCycles(newCycles);
              if (newCycles >= cycles) {
                setIsActive(false);
                setDone(true);
                if (!isCompleted) onComplete?.(newCycles);
                return BREATH_PHASES[0].duration;
              }
            }
            setCurrentPhase(nextPhase);
            return BREATH_PHASES[nextPhase].duration;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, currentPhase, completedCycles, cycles, onComplete, isCompleted]);

  const phase = BREATH_PHASES[currentPhase];
  const progress = ((cycles * 4 - (cycles - completedCycles) * 4 + currentPhase) / (cycles * 4)) * 100;

  const getCircleScale = () => {
    if (!isActive) return 1;
    switch (currentPhase) {
      case 0: return 1.4;
      case 1: return 1.4;
      case 2: return 1;
      case 3: return 1;
      default: return 1;
    }
  };

  const reset = () => {
    setIsActive(false);
    setCurrentPhase(0);
    setCountdown(BREATH_PHASES[0].duration);
    setCompletedCycles(0);
    setDone(false);
  };

  return (
    <div className="flex flex-col items-center py-3 sm:py-6">
      <div className="text-center mb-3 sm:mb-6">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-1">
          {isActive ? phase.name : done ? 'Well Done!' : 'Box Breathing'}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          {isActive ? phase.instruction : done ? `Completed ${cycles} cycles` : `${cycles} cycles • Reduces stress & anxiety`}
        </p>
      </div>

      {/* Breathing circle */}
      <div className="relative w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center">
        {/* Background rings */}
        <div className="absolute inset-0 rounded-full border-2 border-slate-100 dark:border-slate-700" />
        <div className="absolute inset-4 rounded-full border-2 border-slate-100 dark:border-slate-700" />

        {/* Animated breathing circle */}
        <motion.div
          animate={{
            scale: getCircleScale(),
            backgroundColor: currentPhase === 0 || currentPhase === 1 ? '#88C0D0' : '#2D6A9F'
          }}
          transition={{ duration: phase.duration, ease: 'easeInOut' }}
          className="w-24 h-24 sm:w-32 sm:h-32 rounded-full flex items-center justify-center shadow-lg"
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={countdown}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="text-3xl sm:text-4xl font-light text-white"
            >
              {done ? '🌟' : isActive ? countdown : '🧘'}
            </motion.span>
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Phase indicators — placed BELOW the circle container */}
      {isActive && (
        <div className="flex gap-2 mt-4 mb-2">
          {BREATH_PHASES.map((p, i) => (
            <div
              key={p.name}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === currentPhase ? 'bg-[#2D6A9F]' : 'bg-slate-200 dark:bg-slate-600'
              }`}
            />
          ))}
        </div>
      )}

      {/* Progress */}
      {isActive && (
        <div className="w-full max-w-xs mb-4 mt-2">
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>Progress</span>
            <span>{completedCycles} / {cycles} cycles</span>
          </div>
          <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#2D6A9F] to-[#5DB075]"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-3 mt-4">
        {!done && (
          <Button
            onClick={() => setIsActive(!isActive)}
            className={`gap-2 ${isActive ? 'bg-slate-600 hover:bg-slate-700' : 'bg-[#2D6A9F] hover:bg-[#2D6A9F]/90'}`}
          >
            {isActive ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4" /> {completedCycles > 0 ? 'Resume' : 'Start'}</>}
          </Button>
        )}
        {(isActive || completedCycles > 0) && (
          <Button variant="outline" onClick={reset} className="gap-2">
            <RotateCcw className="w-4 h-4" /> Reset
          </Button>
        )}
      </div>

      {done && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 text-center">
          <p className="text-[#5DB075] font-medium">Great job! You completed {cycles} breathing cycles.</p>
        </motion.div>
      )}
    </div>
  );
}