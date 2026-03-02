import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RhythmTap({ onComplete, duration = 10000 }) {
  const [taps, setTaps] = useState([]);
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(duration / 1000);
  const [ripples, setRipples] = useState([]);
  const [countdown, setCountdown] = useState(null); // 3,2,1 ready timer

  // Ready countdown before session starts
  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      setCountdown(null);
      setIsActive(true);
      setTaps([]);
      setTimeLeft(duration / 1000);
      return;
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, duration]);

  // Session timer
  const tapsRef = React.useRef(taps);
  tapsRef.current = taps;

  useEffect(() => {
    let interval;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            setIsActive(false);
            onComplete(tapsRef.current);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, onComplete]);

  const handleTap = useCallback(() => {
    if (!isActive) {
      // Start the ready countdown
      setCountdown(3);
      return;
    }

    const now = Date.now();
    setTaps(prev => [...prev, now]);

    const id = now;
    setRipples(prev => [...prev, id]);
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r !== id));
    }, 600);
  }, [isActive]);

  const progress = isActive ? ((duration / 1000 - timeLeft) / (duration / 1000)) * 100 : 0;

  return (
    <div className="flex flex-col items-center justify-center py-4 sm:py-8">
      <div className="text-center mb-4 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-2">
          {countdown !== null
            ? 'Get Ready…'
            : isActive
            ? 'Keep tapping at your natural rhythm'
            : 'Tap to begin'}
        </h2>
        <p className="text-slate-500 dark:text-slate-400">
          {countdown !== null
            ? 'Session starts in a moment'
            : isActive
            ? `${timeLeft}s remaining • ${taps.length} taps`
            : "We'll analyze your rhythm to understand your stress level"}
        </p>
      </div>

      <div className="relative w-36 h-36 sm:w-48 sm:h-48">
        {/* Progress ring */}
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="90" fill="none" stroke="#E2E8F0" strokeWidth="8" />
          <circle
            cx="100" cy="100" r="90" fill="none"
            stroke="#2D6A9F" strokeWidth="8" strokeLinecap="round"
            strokeDasharray={565}
            strokeDashoffset={565 - (565 * progress) / 100}
            className="transition-all duration-300"
          />
        </svg>

        {/* Countdown overlay */}
        <AnimatePresence>
          {countdown !== null && (
            <motion.div
              key={countdown}
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 flex items-center justify-center z-20 bg-white/80 dark:bg-slate-900/80 rounded-full"
            >
              <span className="text-6xl font-bold text-[#2D6A9F] dark:text-[#88C0D0]">
                {countdown === 0 ? 'GO!' : countdown}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tap button */}
        <motion.button
          onClick={handleTap}
          disabled={countdown !== null}
          whileTap={countdown === null ? { scale: 0.95 } : {}}
          className="relative w-36 h-36 sm:w-48 sm:h-48 rounded-full bg-gradient-to-br from-[#2D6A9F] to-[#88C0D0] shadow-xl flex items-center justify-center overflow-hidden disabled:opacity-80"
        >
          <AnimatePresence>
            {ripples.map(id => (
              <motion.div
                key={id}
                initial={{ scale: 0, opacity: 0.6 }}
                animate={{ scale: 2, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="absolute inset-0 rounded-full bg-white/30"
              />
            ))}
          </AnimatePresence>

          <motion.div
            animate={isActive ? { scale: [1, 1.1, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1 }}
            className="text-white text-center z-10"
          >
            <div className="text-4xl sm:text-5xl mb-1">👆</div>
            <span className="text-sm font-medium opacity-90">
              {isActive ? 'TAP' : 'START'}
            </span>
          </motion.div>
        </motion.button>
      </div>

      <div className="mt-4 sm:mt-8 flex items-center gap-2 text-sm text-slate-400 dark:text-slate-500">
        <div className="w-2 h-2 rounded-full bg-[#5DB075] animate-pulse" />
        <span>Tap naturally, like drumming your fingers</span>
      </div>
    </div>
  );
}