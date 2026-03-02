import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, RotateCcw, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

// Soft click sound via Web Audio API
function playClick() {
  try {
    const ctx = new (window.AudioContext || /** @type {any} */ (window).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.12);
    setTimeout(() => ctx.close(), 200);
  } catch {}
}

export default function AlphabetGame({ onComplete, isCompleted }) {
  const [clicked, setClicked] = useState(new Set());
  const [particles, setParticles] = useState([]);
  const [done, setDone] = useState(false);
  const nextExpected = ALPHABET.find(l => !clicked.has(l));

  const handleClick = (letter) => {
    if (clicked.has(letter) || done) return;
    playClick();

    setClicked(prev => {
      const next = new Set(prev);
      next.add(letter);
      if (next.size === 26) {
        setDone(true);
        if (!isCompleted) onComplete?.();
      }
      return next;
    });

    // Spawn celebration particles
    const id = Date.now() + Math.random();
    setParticles(prev => [...prev, { id, letter }]);
    setTimeout(() => setParticles(prev => prev.filter(p => p.id !== id)), 900);
  };

  const reset = () => {
    setClicked(new Set());
    setDone(false);
  };

  const progress = (clicked.size / 26) * 100;

  return (
    <div className="flex flex-col items-center py-4 gap-5 relative">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-1">
          {done ? 'All Done! 🎉' : 'Tap Every Letter'}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          {done ? 'You crushed it — great focus exercise!' : `Click A → Z in order • ${clicked.size} / 26`}
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xs">
        <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#2D6A9F] to-[#5DB075]"
            animate={{ width: `${progress}%` }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        </div>
        {nextExpected && !done && (
          <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-1">Next: <span className="font-bold text-[#2D6A9F] dark:text-[#88C0D0]">{nextExpected}</span></p>
        )}
      </div>

      {/* Letter grid */}
      <div className="relative w-full">
        {/* Floating particles */}
        <AnimatePresence>
          {particles.map(p => (
            <motion.div
              key={p.id}
              initial={{ y: 0, opacity: 1, scale: 1 }}
              animate={{ y: -60, opacity: 0, scale: 1.8 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="absolute top-0 left-1/2 -translate-x-1/2 text-2xl font-bold text-[#5DB075] pointer-events-none z-10"
            >
              {p.letter}
            </motion.div>
          ))}
        </AnimatePresence>

        <div className="grid grid-cols-7 gap-1.5">
          {ALPHABET.map((letter) => {
            const isDone = clicked.has(letter);
            const isNext = letter === nextExpected && !done;
            return (
              <motion.button
                key={letter}
                onClick={() => handleClick(letter)}
                disabled={isDone || done}
                whileTap={!isDone ? { scale: 0.85 } : {}}
                animate={isDone ? { scale: [1, 1.3, 1] } : isNext ? { scale: [1, 1.05, 1] } : {}}
                transition={isDone ? { duration: 0.25 } : isNext ? { repeat: Infinity, duration: 1.2 } : {}}
                className={`
                  aspect-square rounded-xl text-sm font-bold flex items-center justify-center
                  transition-all duration-200 select-none
                  ${isDone
                    ? 'bg-[#5DB075] text-white shadow-sm shadow-[#5DB075]/30'
                    : isNext
                    ? 'bg-[#2D6A9F] text-white shadow-lg shadow-[#2D6A9F]/40 ring-2 ring-[#2D6A9F]/50'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }
                  disabled:cursor-default
                `}
              >
                {isDone ? (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-base"
                  >
                    ✓
                  </motion.span>
                ) : letter}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3 items-center">
        {done && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2 text-[#5DB075] font-medium">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <span>Perfect run!</span>
          </motion.div>
        )}
        {(clicked.size > 0) && (
          // @ts-ignore
          <Button variant="outline" size="sm" onClick={reset} className="gap-2 dark:border-slate-600 dark:text-slate-300">
            <RotateCcw className="w-3 h-3" /> Reset
          </Button>
        )}
      </div>
    </div>
  );
}