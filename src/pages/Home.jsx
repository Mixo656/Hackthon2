import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Heart, Brain, Mic, Wind, Sparkles, ArrowRight, RefreshCw, MessageCircle, CheckCircle2, Trophy, Keyboard, X, Youtube
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { StressSessionStore } from '@/lib/storage';
import { getStressSuggestion } from '@/lib/ai-chat';
import RhythmTap from '@/components/RhythmTap';
import MotionSensor from '@/components/MotionSensor';
import VoiceChat from '@/components/VoiceChat';
import SwipeCard from '@/components/SwipeCard';
import BreathingExercise from '@/components/BreathingExercise';
import StressResults from '@/components/StressResults';
import AlphabetGame from '@/components/AlphabetGame';

const INTERVENTIONS = [
  { id: 'breathing', icon: Wind, label: 'Breathe', desc: 'Box breathing exercise' },
  { id: 'swipe', icon: Brain, label: 'Release', desc: 'Swipe away thoughts' },
  { id: 'chat', icon: Mic, label: 'Talk', desc: 'Voice AI chat' },
  { id: 'alphabet', icon: Keyboard, label: 'Focus', desc: 'Click all letters' },
];

const THERAPY_VIDEOS = [
  { id: 'nature', title: 'Nature Therapy', emoji: '🌿', url: 'https://youtu.be/29XymHesxa0?si=9AKs4S8IryeOXBHM' },
  { id: 'rain', title: 'Rain Therapy', emoji: '🌧️', url: 'https://youtu.be/GQEeK-sExHg?si=SKU9B4m_HvucOZAU' },
  { id: 'birds', title: 'Birds Chirping', emoji: '🐦', url: 'https://youtu.be/Qm846KdZN_c?si=wWQu9ZjK0C-T8vcI' },
];

export default function Home() {
  const [stage, setStage] = useState('welcome');
  const [stressData, setStressData] = useState({
    rhythmData: [], rhythmVariance: 0, motionIntensity: 0, stressLevel: 'medium', aiSuggestion: ''
  });
  const [selectedIntervention, setSelectedIntervention] = useState('breathing');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  // Track which activities have been completed (persist across tab switches)
  const [completedTasks, setCompletedTasks] = useState({
    breathing: false,
    swipe: false,
    chat: false,
    alphabet: false,
  });
  const [showVideoNotif, setShowVideoNotif] = useState(false);
  const [showCongrats, setShowCongrats] = useState(false);

  const motionDataRef = useRef({ intensity: 0, samples: [] });
  const handleMotionData = useCallback((intensity, samples) => {
    motionDataRef.current = { intensity, samples };
  }, []);

  const markTaskDone = useCallback((id) => {
    setCompletedTasks(prev => {
      if (prev[id]) return prev; // already done, don't re-trigger
      const next = { ...prev, [id]: true };
      // Check if all done
      const remaining = INTERVENTIONS.filter(i => !next[i.id]);
      if (remaining.length === 0) {
        setTimeout(() => setShowCongrats(true), 600);
      }
      return next;
    });
  }, []);

  const allDone = INTERVENTIONS.every(i => completedTasks[i.id]);
  const remainingTasks = INTERVENTIONS.filter(i => !completedTasks[i.id]);

  const analyzeStress = async (rhythmData) => {
    setIsAnalyzing(true);
    const intervals = [];
    for (let i = 1; i < rhythmData.length; i++) intervals.push(rhythmData[i] - rhythmData[i - 1]);
    const avgInterval = intervals.length > 0 ? intervals.reduce((a, b) => a + b, 0) / intervals.length : 0;
    const variance = intervals.length > 0
      ? Math.sqrt(intervals.reduce((sum, i) => sum + Math.pow(i - avgInterval, 2), 0) / intervals.length)
      : 0;
    const motionIntensity = motionDataRef.current.intensity;
    let stressLevel = 'low';
    if (variance > 200 || motionIntensity > 50) stressLevel = 'high';
    else if (variance > 100 || motionIntensity > 25) stressLevel = 'medium';

    let aiSuggestion = '';
    try {
      aiSuggestion = await getStressSuggestion(variance, motionIntensity, stressLevel);
    } catch {
      aiSuggestion = stressLevel === 'high'
        ? "Take a moment to pause. A few deep breaths can help reset your nervous system."
        : stressLevel === 'medium'
        ? "You're doing okay, but some light tension is showing. Consider taking a short break."
        : "You seem centered and calm. Keep up the good work!";
    }

    try {
      StressSessionStore.create({
        rhythm_data: rhythmData, motion_intensity: motionIntensity,
        stress_level: stressLevel, ai_response: aiSuggestion, session_type: 'rhythm_check'
      });
    } catch {}

    setStressData({ rhythmData, rhythmVariance: variance, motionIntensity, stressLevel, aiSuggestion });
    setIsAnalyzing(false);
    setStage('results');
    // Show video notification after results
    setTimeout(() => setShowVideoNotif(true), 1200);
  };

  const startOver = () => {
    setStage('welcome');
    setStressData({ rhythmData: [], rhythmVariance: 0, motionIntensity: 0, stressLevel: 'medium', aiSuggestion: '' });
    setCompletedTasks({ breathing: false, swipe: false, chat: false, alphabet: false });
    setShowCongrats(false);
    setShowVideoNotif(false);
  };

  return (
    <div className="transition-colors">
      <div className="max-w-lg mx-auto px-3 sm:px-4 py-4 sm:py-6">

        {/* Header — clickable to go home */}
        <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-4 sm:mb-8">
          <Link to={createPageUrl('Home')} onClick={startOver} className="inline-flex items-center gap-2 bg-white/65 dark:bg-slate-800/60 glass-strong rounded-full px-4 py-2 shadow-sm border border-white/30 dark:border-slate-600/40 mb-4 cursor-pointer hover:shadow-md transition-shadow">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2D6A9F] to-[#88C0D0] flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-slate-800 dark:text-slate-100">Smart Calm AI</span>
          </Link>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Your mindful companion for stress awareness</p>
        </motion.header>

        {/* Video notification — top-right corner */}
        <AnimatePresence>
          {showVideoNotif && (
            <motion.div
              initial={{ opacity: 0, x: 80, y: -20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: 80 }}
              className="fixed top-16 right-3 z-50 w-60 bg-white/75 dark:bg-slate-800/70 glass-strong rounded-2xl shadow-2xl border border-white/40 dark:border-slate-600/40 p-3"
            >
              <div className="flex items-start justify-between mb-2">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">🎬 Relaxation Videos</p>
                <button onClick={() => setShowVideoNotif(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-1.5">
                {THERAPY_VIDEOS.map(v => (
                  <a key={v.id} href={v.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-xl bg-slate-50 dark:bg-slate-700 hover:bg-[#2D6A9F]/5 dark:hover:bg-slate-600 px-2 py-1.5 transition-colors">
                    <span className="text-base">{v.emoji}</span>
                    <span className="text-xs text-slate-700 dark:text-slate-200 flex-1">{v.title}</span>
                    <Youtube className="w-3 h-3 text-red-500" />
                  </a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Congratulations overlay */}
        <AnimatePresence>
          {showCongrats && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
            >
              <div className="bg-white/75 dark:bg-slate-800/70 glass-strong rounded-3xl p-6 sm:p-10 text-center shadow-2xl border border-white/40 dark:border-slate-600/40 max-w-sm w-full">
                <motion.div
                  animate={{ rotate: [0, 15, -15, 10, -10, 0], scale: [1, 1.3, 1] }}
                  transition={{ duration: 1.2 }}
                  className="text-6xl mb-4"
                >🏆</motion.div>
                <Trophy className="w-10 h-10 text-yellow-400 mx-auto mb-3" />
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Congratulations!</h2>
                <p className="text-slate-600 dark:text-slate-300 mb-6">
                  You completed all 3 activities — breathing, thought release, and voice chat. Amazing work on your mindfulness session!
                </p>
                <div className="flex gap-3 justify-center flex-wrap">
                  <Button onClick={() => setShowCongrats(false)} variant="outline">Keep Going</Button>
                  <Button onClick={startOver} className="bg-[#2D6A9F]">
                    <RefreshCw className="w-4 h-4 mr-2" /> Start Fresh
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {/* Welcome Stage */}
          {stage === 'welcome' && (
            <motion.div key="welcome" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              <Card className="relative overflow-hidden border-0 shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-[#2D6A9F] to-[#88C0D0]" />
                <div className="relative p-5 sm:p-8 text-center text-white">
                  <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 3 }} className="inline-block mb-3 sm:mb-4">
                    <Heart className="w-12 h-12 sm:w-16 sm:h-16 drop-shadow-lg" />
                  </motion.div>
                  <h1 className="text-xl sm:text-2xl font-bold mb-2">How are you feeling?</h1>
                  <p className="text-white/80 mb-4 sm:mb-6 text-sm sm:text-base">Let's check your stress level using rhythm, motion, and AI</p>
                  <Button onClick={() => setStage('checking')} size="lg" className="bg-white text-[#2D6A9F] hover:bg-white/90 shadow-lg gap-2">
                    Start Check-In <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </Card>

              <div className="grid grid-cols-3 gap-3">
                {[{ icon: Heart, label: 'Rhythm', desc: 'Tap analysis' }, { icon: Sparkles, label: 'Motion', desc: 'Body sensing' }, { icon: Mic, label: 'Voice AI', desc: 'Talk anytime' }].map((f, i) => (
                  <motion.div key={f.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}
                    className="bg-white/65 dark:bg-slate-800/60 glass rounded-xl p-3 sm:p-4 text-center border border-white/30 dark:border-slate-600/40 shadow-sm">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-1.5 sm:mb-2 rounded-full bg-[#2D6A9F]/10 flex items-center justify-center">
                      <f.icon className="w-4 h-4 sm:w-5 sm:h-5 text-[#2D6A9F]" />
                    </div>
                    <p className="font-medium text-slate-800 dark:text-slate-100 text-sm">{f.label}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{f.desc}</p>
                  </motion.div>
                ))}
              </div>

              <Button variant="outline" onClick={() => { setStage('intervention'); setSelectedIntervention('chat'); }}
                className="w-full gap-2 border-[#2D6A9F]/20 text-[#2D6A9F]">
                <MessageCircle className="w-4 h-4" /> Skip to Voice Chat
              </Button>
            </motion.div>
          )}

          {/* Checking Stage */}
          {stage === 'checking' && (
            <motion.div key="checking" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              <MotionSensor onMotionData={handleMotionData} isActive={true} />
              <Card className="p-6 border-0 shadow-lg">
                {isAnalyzing ? (
                  <div className="text-center py-12">
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                      <Brain className="w-12 h-12 mx-auto text-[#2D6A9F]" />
                    </motion.div>
                    <p className="text-slate-600 dark:text-slate-300 mt-4">Analyzing your patterns…</p>
                  </div>
                ) : (
                  <RhythmTap onComplete={analyzeStress} />
                )}
              </Card>
              <Button variant="ghost" onClick={startOver} className="w-full text-slate-500">Cancel</Button>
            </motion.div>
          )}

          {/* Results Stage */}
          {stage === 'results' && (
            <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              <StressResults
                stressLevel={stressData.stressLevel}
                rhythmVariance={stressData.rhythmVariance}
                motionIntensity={stressData.motionIntensity}
                aiSuggestion={stressData.aiSuggestion}
              />

              <div className="space-y-3">
                <h3 className="text-sm font-medium text-slate-600 dark:text-slate-300">Try these activities:</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                  {INTERVENTIONS.map((item) => (
                    <Button
                      key={item.id}
                      variant="outline"
                      onClick={() => { setSelectedIntervention(item.id); setStage('intervention'); }}
                      className={`h-auto p-3 sm:p-4 flex-col items-center text-center border-slate-200 dark:border-slate-600 hover:border-[#2D6A9F] hover:bg-[#2D6A9F]/5 relative ${
                        completedTasks[item.id] ? 'border-[#5DB075] bg-[#5DB075]/5' : ''
                      }`}
                    >
                      {completedTasks[item.id] && (
                        <CheckCircle2 className="w-4 h-4 text-[#5DB075] absolute top-2 right-2" />
                      )}
                      <item.icon className={`w-5 h-5 mb-2 ${completedTasks[item.id] ? 'text-[#5DB075]' : 'text-[#2D6A9F]'}`} />
                      <span className="font-medium text-slate-800 dark:text-slate-100 text-xs">{item.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <Button variant="ghost" onClick={startOver} className="w-full gap-2 text-slate-500">
                <RefreshCw className="w-4 h-4" /> Check Again
              </Button>
            </motion.div>
          )}

          {/* Intervention Stage */}
          {stage === 'intervention' && (
            <motion.div key="intervention" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <Tabs value={selectedIntervention} onValueChange={setSelectedIntervention}>
                <TabsList className="w-full mb-4 sm:mb-6 bg-slate-100 dark:bg-slate-800">
                  {INTERVENTIONS.map(item => (
                    <TabsTrigger key={item.id} value={item.id} className="flex-1 gap-1 relative">
                      {completedTasks[item.id] && (
                        <CheckCircle2 className="w-3 h-3 text-[#5DB075] absolute top-0.5 right-0.5" />
                      )}
                      <item.icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{item.label}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>

                <Card className="p-4 sm:p-6 border-0 shadow-lg min-h-[360px] sm:min-h-[420px]">
                  <TabsContent value="breathing" className="m-0">
                    <BreathingExercise
                      cycles={3}
                      onComplete={() => markTaskDone('breathing')}
                      isCompleted={completedTasks.breathing}
                    />
                  </TabsContent>

                  <TabsContent value="swipe" className="m-0">
                    <SwipeCard
                      key="swipe-card"
                      onComplete={() => markTaskDone('swipe')}
                      isCompleted={completedTasks.swipe}
                    />
                  </TabsContent>

                    <TabsContent value="chat" className="m-0">
                    <VoiceChat
                      stressLevel={stressData.stressLevel}
                      onMessage={() => {}}
                      onComplete={() => markTaskDone('chat')}
                      isCompleted={completedTasks.chat}
                    />
                  </TabsContent>

                  <TabsContent value="alphabet" className="m-0">
                    <AlphabetGame
                      onComplete={() => markTaskDone('alphabet')}
                      isCompleted={completedTasks.alphabet}
                    />
                  </TabsContent>
                </Card>
              </Tabs>

              {/* Suggest remaining tasks */}
              {remainingTasks.length > 0 && remainingTasks.length < 3 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 bg-[#2D6A9F]/5 border border-[#2D6A9F]/20 rounded-xl p-4"
                >
                  <p className="text-sm text-[#2D6A9F] font-medium mb-2">
                    Great progress! Try these next:
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {remainingTasks.map(task => (
                      <button
                        key={task.id}
                        onClick={() => setSelectedIntervention(task.id)}
                        className="flex items-center gap-1.5 bg-white/65 dark:bg-slate-800/60 glass border border-[#2D6A9F]/30 rounded-full px-3 py-1.5 text-xs text-[#2D6A9F] dark:text-[#88C0D0] hover:bg-[#2D6A9F]/10 transition-colors"
                      >
                        <task.icon className="w-3 h-3" />
                        {task.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              <div className="flex gap-3 mt-4">
                <Button variant="ghost" onClick={() => setStage('results')} className="flex-1 text-slate-500">
                  ← Back
                </Button>
                <Button variant="ghost" onClick={startOver} className="flex-1 gap-2 text-slate-500">
                  <RefreshCw className="w-4 h-4" /> Start Over
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}