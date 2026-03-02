import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Card } from '@/components/ui/card';
import { StressSessionStore } from '@/lib/storage';
import { 
  Brain, 
  Heart, 
  Wind, 
  MessageCircle, 
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Trash2
} from 'lucide-react';

export default function History() {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Small delay for smooth loading feel
    const timer = setTimeout(() => {
      setSessions(StressSessionStore.list(50));
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const getStressConfig = (level) => ({
    low: { color: 'text-[#5DB075]', bg: 'bg-[#5DB075]/10', icon: TrendingDown, label: 'Low' },
    medium: { color: 'text-[#88C0D0]', bg: 'bg-[#88C0D0]/10', icon: Minus, label: 'Moderate' },
    high: { color: 'text-[#E76F51]', bg: 'bg-[#E76F51]/10', icon: TrendingUp, label: 'High' }
  }[level] || { color: 'text-slate-400', bg: 'bg-slate-100', icon: Minus, label: 'Unknown' });

  const getSessionIcon = (type) => ({
    rhythm_check: Heart,
    voice_chat: MessageCircle,
    breathing: Wind
  }[type] || Brain);

  return (
    <div className="">
      <div className="max-w-lg mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Your Journey</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Track your stress patterns over time</p>
        </motion.header>

        {/* Stats summary */}
        {sessions && sessions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-3 gap-3 mb-8"
          >
            {['low', 'medium', 'high'].map((level) => {
              const count = sessions.filter(s => s.stress_level === level).length;
              const config = getStressConfig(level);
              const Icon = config.icon;
              return (
                <Card key={level} className="p-4 text-center border-0 shadow-sm">
                  <div className={`w-10 h-10 mx-auto mb-2 rounded-full ${config.bg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{count}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{config.label}</p>
                </Card>
              );
            })}
          </motion.div>
        )}

        {/* Session list */}
        <div className="space-y-3">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <Card key={i} className="p-4 border-0 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                    <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                    <div className="h-3 w-3/4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                  </div>
                </div>
              </Card>
            ))
          ) : sessions && sessions.length > 0 ? (
            sessions.map((session, i) => {
              const config = getStressConfig(session.stress_level);
              const SessionIcon = getSessionIcon(session.session_type);
              const StressIcon = config.icon;
              
              return (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="p-4 border-0 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-full ${config.bg} flex items-center justify-center flex-shrink-0`}>
                        <SessionIcon className={`w-5 h-5 ${config.color}`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <StressIcon className={`w-4 h-4 ${config.color}`} />
                            <span className={`font-medium ${config.color}`}>
                              {config.label} Stress
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 text-xs text-slate-400">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(session.created_date), 'MMM d, h:mm a')}
                            </div>
                            <button
                              onClick={() => {
                                StressSessionStore.delete(session.id);
                                setSessions(StressSessionStore.list(50));
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                              title="Delete session"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-400" />
                            </button>
                          </div>
                        </div>
                        
                        {session.ai_response && (
                          <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                            {session.ai_response}
                          </p>
                        )}
                        
                        <div className="flex gap-4 mt-2 text-xs text-slate-400">
                          {session.motion_intensity !== undefined && (
                            <span>Motion: {session.motion_intensity.toFixed(0)}%</span>
                          )}
                          {session.rhythm_data && (
                            <span>Taps: {session.rhythm_data.length}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/65 dark:bg-slate-800/60 glass border border-white/30 dark:border-slate-600/40 flex items-center justify-center">
                <Brain className="w-8 h-8 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-1">No sessions yet</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Complete a stress check to start tracking your journey
              </p>
            </motion.div>
          )}
        </div>

        {/* Clear all button */}
        {sessions && sessions.length > 0 && !isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 text-center">
            <button
              onClick={() => {
                if (window.confirm('Clear all session history?')) {
                  StressSessionStore.clearAll();
                  setSessions([]);
                }
              }}
              className="text-xs text-slate-400 hover:text-red-400 transition-colors underline underline-offset-2"
            >
              Clear all history
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}