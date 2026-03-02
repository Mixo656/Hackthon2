import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { X, Check, Wind } from 'lucide-react';

const ALL_THOUGHTS = [
  "I should have done better",
  "What if I fail?",
  "I'm not good enough",
  "Everyone is judging me",
  "I can't handle this",
  "Something bad will happen",
  "I'm always messing up",
  "Nobody understands me",
  "I'm too stressed to cope",
  "Things will never get better",
  "I always ruin everything",
  "I'm falling behind everyone",
  "What's the point of trying?",
  "I'm too sensitive",
  "I should be further ahead by now",
  "Nobody really cares",
  "I'll never be good enough",
  "I made the wrong choice",
  "I don't deserve good things",
  "My anxiety is out of control",
  "I can't trust myself",
  "Everyone has it figured out except me",
  "I'm a burden to others",
  "I'm stuck and can't move forward",
];

function getRandomThoughts(count = 5) {
  const shuffled = [...ALL_THOUGHTS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export default function SwipeCard({ onComplete, isCompleted }) {
  const [cards, setCards] = useState(() => getRandomThoughts(5));
  const [dismissed, setDismissed] = useState(0);
  const totalRef = React.useRef(cards.length);

  const handleDismiss = (direction) => {
    const newDismissed = dismissed + 1;
    setDismissed(newDismissed);
    setCards(prev => prev.slice(1));
    
    if (cards.length <= 1) {
      setTimeout(() => {
        if (!isCompleted) onComplete?.(newDismissed);
      }, 500);
    }
  };

  return (
    <div className="relative h-[340px] sm:h-[400px] flex flex-col items-center justify-center">
      <div className="text-center mb-4 sm:mb-8">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">
          Release Intrusive Thoughts
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Swipe away thoughts that don't serve you
        </p>
      </div>

      <div className="relative w-64 sm:w-72 h-40 sm:h-48">
        <AnimatePresence>
          {cards.map((thought, index) => (
            <SwipeableCard
              key={thought}
              thought={thought}
              index={index}
              onDismiss={handleDismiss}
              isTop={index === 0}
            />
          ))}
        </AnimatePresence>

        {cards.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-[#5DB075]/10 rounded-2xl"
          >
            <Wind className="w-12 h-12 text-[#5DB075] mb-3" />
            <p className="text-[#5DB075] font-medium">Mind cleared!</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{dismissed} thoughts released</p>
          </motion.div>
        )}
      </div>

      {/* Instructions */}
      <div className="flex items-center justify-center gap-8 mt-4 sm:mt-8">
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <X className="w-5 h-5 text-[#E76F51]" />
          <span>Swipe left</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <Check className="w-5 h-5 text-[#5DB075]" />
          <span>Swipe right</span>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-2 mt-4 sm:mt-6">
        {Array(totalRef.current).fill(0).map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-colors ${
              i < dismissed ? 'bg-[#5DB075]' : 'bg-slate-200 dark:bg-slate-600'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function SwipeableCard({ thought, index, onDismiss, isTop }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  const leftIndicatorOpacity = useTransform(x, [-100, 0], [1, 0]);
  const rightIndicatorOpacity = useTransform(x, [0, 100], [0, 1]);

  const handleDragEnd = (_, info) => {
    if (Math.abs(info.offset.x) > 100) {
      onDismiss(info.offset.x > 0 ? 'right' : 'left');
    }
  };

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ 
        scale: 1 - index * 0.05, 
        y: index * 8,
        opacity: 1 
      }}
      exit={{ 
        x: x.get() > 0 ? 300 : -300, 
        opacity: 0,
        transition: { duration: 0.2 }
      }}
      style={{ x, rotate, opacity, zIndex: 10 - index }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
    >
      <div className="relative w-full h-full bg-white/70 dark:bg-slate-800/65 glass-strong rounded-2xl shadow-xl border border-white/30 dark:border-slate-600/40 p-6 flex items-center justify-center">
        {/* Dismiss indicators */}
        <motion.div
          style={{ opacity: leftIndicatorOpacity }}
          className="absolute left-4 top-4"
        >
          <div className="w-10 h-10 rounded-full bg-[#E76F51]/10 flex items-center justify-center">
            <X className="w-5 h-5 text-[#E76F51]" />
          </div>
        </motion.div>
        
        <motion.div
          style={{ opacity: rightIndicatorOpacity }}
          className="absolute right-4 top-4"
        >
          <div className="w-10 h-10 rounded-full bg-[#5DB075]/10 flex items-center justify-center">
            <Check className="w-5 h-5 text-[#5DB075]" />
          </div>
        </motion.div>

        {/* Thought content */}
        <p className="text-lg text-slate-700 dark:text-slate-200 text-center font-medium leading-relaxed">
          "{thought}"
        </p>
      </div>
    </motion.div>
  );
}