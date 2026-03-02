import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, Loader2, MessageCircle, Send, Youtube } from 'lucide-react';
import { getAIResponse } from '@/lib/ai-chat';

const THERAPY_VIDEOS = [
  {
    id: 'nature',
    title: 'Nature Therapy',
    emoji: '🌿',
    url: 'https://youtu.be/29XymHesxa0?si=9AKs4S8IryeOXBHM',
    color: 'bg-green-50 border-green-200 text-green-700'
  },
  {
    id: 'rain',
    title: 'Rain Therapy',
    emoji: '🌧️',
    url: 'https://youtu.be/GQEeK-sExHg?si=SKU9B4m_HvucOZAU',
    color: 'bg-blue-50 border-blue-200 text-blue-700'
  },
  {
    id: 'birds',
    title: 'Birds Chirping',
    emoji: '🐦',
    url: 'https://youtu.be/Qm846KdZN_c?si=wWQu9ZjK0C-T8vcI',
    color: 'bg-amber-50 border-amber-200 text-amber-700'
  }
];

export default function VoiceChat({ stressLevel = 'medium', onMessage, onComplete, isCompleted }) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [textInput, setTextInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [micPermission, setMicPermission] = useState('prompt'); // 'prompt' | 'granted' | 'denied'
  const [inputMode, setInputMode] = useState('text'); // 'text' | 'voice'

  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);
  const synthRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Init speech synthesis + recognition
  useEffect(() => {
    synthRef.current = window.speechSynthesis;

    const SpeechRecognition = window.SpeechRecognition || /** @type {any} */ (window).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      initRecognition(SpeechRecognition);
    }

    // Check existing mic permission without prompting
    if (navigator.permissions?.query) {
      navigator.permissions.query({ name: 'microphone' }).then(status => {
        setMicPermission(status.state); // 'granted' | 'denied' | 'prompt'
        status.onchange = () => setMicPermission(status.state);
      }).catch(() => {});
    }

    return () => {
      recognitionRef.current?.abort();
      synthRef.current?.cancel();
    };
  }, []);

  const initRecognition = (SR) => {
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.onresult = (event) => {
      let interimText = '';
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += t;
        else interimText += t;
      }
      if (interimText) setTranscript(interimText);
      if (finalText) {
        setTranscript('');
        sendMessage(finalText.trim());
      }
    };
    recognition.onerror = (e) => {
      setIsListening(false);
      if (e.error === 'not-allowed') {
        setMicPermission('denied');
        setError('Microphone access denied. Please allow it in your browser settings.');
      } else if (e.error === 'no-speech') {
        setError('No speech heard. Try again.');
        setTimeout(() => setError(null), 2500);
      }
    };
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
  };

  // Request mic permission explicitly via getUserMedia
  const requestMicPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the stream immediately — we just needed the permission grant
      stream.getTracks().forEach(t => t.stop());
      setMicPermission('granted');
      setError(null);
      return true;
    } catch (err) {
      setMicPermission('denied');
      setError('Microphone access denied. Check your browser settings.');
      return false;
    }
  };

  // Robust speech synthesis
  const speakText = useCallback((text) => {
    const synth = synthRef.current || window.speechSynthesis;
    if (!synth) return;
    synth.cancel();

    const trySpeak = () => {
      const utt = new SpeechSynthesisUtterance(text);
      utt.rate = 0.88;
      utt.pitch = 1.05;
      utt.volume = 1;

      const voices = synth.getVoices();
      // Prefer a clear English female voice
      const pick = voices.find(v => v.name === 'Samantha')
        || voices.find(v => v.name === 'Karen')
        || voices.find(v => v.name === 'Google UK English Female')
        || voices.find(v => v.name === 'Google US English')
        || voices.find(v => v.lang === 'en-US' || v.lang === 'en-GB')
        || voices.find(v => v.lang.startsWith('en'));

      if (pick) utt.voice = pick;

      utt.onstart = () => setIsSpeaking(true);
      utt.onend = () => setIsSpeaking(false);
      utt.onerror = () => setIsSpeaking(false);

      synth.speak(utt);

      // Chrome bug: sometimes synthesis pauses itself
      const resume = setInterval(() => {
        if (synth.paused) synth.resume();
        if (!synth.speaking) clearInterval(resume);
      }, 500);
    };

    const voices = synth.getVoices();
    if (voices.length > 0) {
      trySpeak();
    } else {
      synth.onvoiceschanged = () => {
        synth.onvoiceschanged = null;
        trySpeak();
      };
      setTimeout(trySpeak, 800); // fallback if event never fires
    }
  }, []);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim()) return;

    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setIsProcessing(true);
    setError(null);

    try {
      const aiText = await getAIResponse(text, stressLevel, messages);

      const aiMsg = { role: 'assistant', content: aiText };
      setMessages(prev => [...prev, aiMsg]);
      onMessage?.(userMsg, aiMsg);
      speakText(aiText);
      if (!isCompleted) onComplete?.();
    } catch {
      const fallback = "I hear you. Take a slow breath — in for 4, hold for 4, out for 6. You've got this.";
      const aiMsg = { role: 'assistant', content: fallback };
      setMessages(prev => [...prev, aiMsg]);
      speakText(fallback);
      if (!isCompleted) onComplete?.();
    } finally {
      setIsProcessing(false);
    }
  }, [stressLevel, speakText, onMessage, onComplete, isCompleted]);

  const toggleListening = async () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      return;
    }

    // Ensure mic permission is granted before starting recognition
    if (micPermission !== 'granted') {
      const ok = await requestMicPermission();
      if (!ok) return;
    }

    setTranscript('');
    setError(null);
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch {
      // Reinitialize if recognition was already stopped
      const SR = /** @type {any} */ (window).SpeechRecognition || /** @type {any} */ (window).webkitSpeechRecognition;
      if (!SR) return;
      initRecognition(SR);
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleTextSend = (e) => {
    e.preventDefault();
    if (!textInput.trim() || isProcessing) return;
    sendMessage(textInput.trim());
    setTextInput('');
  };

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Therapy video recommendations */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {THERAPY_VIDEOS.map(v => (
          <a
            key={v.id}
            href={v.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex-shrink-0 flex items-center gap-2 border rounded-xl px-3 py-2 text-xs font-medium hover:opacity-80 transition-opacity ${v.color}`}
          >
            <span>{v.emoji}</span>
            <span>{v.title}</span>
            <Youtube className="w-3 h-3" />
          </a>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 min-h-[120px] max-h-[240px] sm:max-h-[300px] pr-1">
        {messages.length === 0 && (
          <div className="text-center py-6">
            <MessageCircle className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-slate-500 dark:text-slate-400 text-sm">Type or speak — I'll respond with text & voice</p>
          </div>
        )}
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#2D6A9F] text-white'
                  : 'bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200'
              }`}>
                {msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {transcript && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-end">
            <div className="max-w-[82%] rounded-2xl px-4 py-2.5 bg-[#2D6A9F]/15 text-[#2D6A9F] italic text-sm">
              {transcript}…
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Status */}
      <div className="h-5 flex items-center justify-center gap-2 text-xs text-slate-500">
        {isListening && <><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /><span>Listening…</span></>}
        {isProcessing && <><Loader2 className="w-3 h-3 animate-spin" /><span>Thinking…</span></>}
        {isSpeaking && <><Volume2 className="w-3 h-3 text-[#2D6A9F] animate-pulse" /><span>Speaking…</span></>}
      </div>

      {error && <p className="text-xs text-center text-[#E76F51] bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-1.5">{error}</p>}

      {/* Input row — text + optional mic */}
      <div className="flex gap-2 items-end">
        <form onSubmit={handleTextSend} className="flex-1 flex gap-2">
          <input
            type="text"
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
            placeholder="Type your message…"
            disabled={isProcessing}
            className="flex-1 rounded-xl border border-slate-200 dark:border-slate-600 px-4 py-2.5 text-sm outline-none focus:border-[#2D6A9F] bg-white dark:bg-slate-800 dark:text-slate-100 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!textInput.trim() || isProcessing}
            className="w-10 h-10 rounded-xl bg-[#2D6A9F] text-white flex items-center justify-center disabled:opacity-40 hover:bg-[#2D6A9F]/90 transition-colors flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        {/* Mic button — show if speech API available */}
        {speechSupported && (
          <motion.button
            onClick={toggleListening}
            disabled={isProcessing}
            whileTap={{ scale: 0.92 }}
            animate={isListening ? { scale: [1, 1.1, 1] } : {}}
            transition={isListening ? { repeat: Infinity, duration: 0.8 } : {}}
            className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md flex-shrink-0 transition-colors ${
              isListening
                ? 'bg-red-500 text-white'
                : micPermission === 'denied'
                  ? 'bg-slate-400 text-white'
                  : 'bg-[#88C0D0] text-white'
            } disabled:opacity-40`}
            title={
              micPermission === 'denied'
                ? 'Microphone blocked — click to retry'
                : isListening
                  ? 'Stop listening'
                  : micPermission === 'granted'
                    ? 'Speak'
                    : 'Enable microphone'
            }
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </motion.button>
        )}
      </div>
    </div>
  );
}