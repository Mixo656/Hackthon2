import React from 'react';
import { motion } from 'framer-motion';
import { TrendingDown, TrendingUp, Minus, AlertCircle, CheckCircle, Info } from 'lucide-react';

export default function StressResults({ stressLevel, rhythmVariance, motionIntensity, aiSuggestion }) {
  const config = {
    low: {
      color: '#5DB075',
      bgColor: 'bg-[#5DB075]/10',
      borderColor: 'border-[#5DB075]/20',
      icon: CheckCircle,
      label: 'Low Stress',
      emoji: '😌',
      description: 'You seem calm and centered'
    },
    medium: {
      color: '#88C0D0',
      bgColor: 'bg-[#88C0D0]/10',
      borderColor: 'border-[#88C0D0]/20',
      icon: Info,
      label: 'Moderate Stress',
      emoji: '😐',
      description: 'Some tension detected'
    },
    high: {
      color: '#E76F51',
      bgColor: 'bg-[#E76F51]/10',
      borderColor: 'border-[#E76F51]/20',
      icon: AlertCircle,
      label: 'High Stress',
      emoji: '😰',
      description: 'Elevated stress indicators'
    }
  };

  const current = config[stressLevel] || config.medium;
  const Icon = current.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Main stress indicator */}
      <div className={`rounded-2xl ${current.bgColor} border ${current.borderColor} p-4 sm:p-6 text-center`}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="text-4xl sm:text-5xl mb-2 sm:mb-3"
        >
          {current.emoji}
        </motion.div>
        
        <div className="flex items-center justify-center gap-2 mb-2">
          <Icon className="w-5 h-5" style={{ color: current.color }} />
          <h3 className="text-xl font-semibold" style={{ color: current.color }}>
            {current.label}
          </h3>
        </div>
        
        <p className="text-slate-600 dark:text-slate-300">{current.description}</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        <MetricCard
          label="Rhythm Variance"
          value={rhythmVariance?.toFixed(1) || '—'}
          unit="ms"
          icon={rhythmVariance > 200 ? TrendingUp : rhythmVariance > 100 ? Minus : TrendingDown}
          description={rhythmVariance > 200 ? 'Irregular' : rhythmVariance > 100 ? 'Normal' : 'Steady'}
        />
        
        <MetricCard
          label="Motion Level"
          value={motionIntensity?.toFixed(0) || '—'}
          unit="%"
          icon={motionIntensity > 50 ? TrendingUp : motionIntensity > 25 ? Minus : TrendingDown}
          description={motionIntensity > 50 ? 'Active' : motionIntensity > 25 ? 'Moderate' : 'Calm'}
        />
      </div>

      {/* AI Suggestion */}
      {aiSuggestion && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white/65 dark:bg-slate-800/60 glass rounded-2xl border border-white/30 dark:border-slate-600/40 p-5 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2D6A9F] to-[#88C0D0] flex items-center justify-center flex-shrink-0">
              <span className="text-white text-lg">✨</span>
            </div>
            <div>
              <h4 className="font-medium text-slate-800 dark:text-slate-100 mb-1">AI Suggestion</h4>
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{aiSuggestion}</p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

function MetricCard({ label, value, unit, icon: Icon, description }) {
  return (
    <div className="bg-white/65 dark:bg-slate-800/60 glass rounded-xl border border-white/30 dark:border-slate-600/40 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
        <Icon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{value}</span>
        <span className="text-sm text-slate-400 dark:text-slate-500">{unit}</span>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{description}</p>
    </div>
  );
}