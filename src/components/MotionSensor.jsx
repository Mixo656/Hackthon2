import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Activity } from 'lucide-react';

export default function MotionSensor({ onMotionData, isActive = true }) {
  const [intensity, setIntensity] = useState(0);
  const [isSupported, setIsSupported] = useState(true);
  const dataRef = useRef([]);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!isActive) return;

    const handleMotion = (event) => {
      const acc = event.accelerationIncludingGravity;
      if (acc && acc.x !== null) {
        const magnitude = Math.sqrt(
          Math.pow(acc.x || 0, 2) +
          Math.pow(acc.y || 0, 2) +
          Math.pow(acc.z || 0, 2)
        );
        // Normalize (gravity is ~9.8, so subtract baseline)
        const normalized = Math.max(0, Math.min(100, (magnitude - 9.8) * 10));
        setIntensity(normalized);
        dataRef.current.push(normalized);
      }
    };

    if (window.DeviceMotionEvent) {
      // Check if permission is needed (iOS 13+)
      if (typeof DeviceMotionEvent.requestPermission === 'function') {
        DeviceMotionEvent.requestPermission()
          .then(response => {
            if (response === 'granted') {
              window.addEventListener('devicemotion', handleMotion);
            } else {
              setIsSupported(false);
              startFallbackMode();
            }
          })
          .catch(() => {
            setIsSupported(false);
            startFallbackMode();
          });
      } else {
        window.addEventListener('devicemotion', handleMotion);
      }
    } else {
      setIsSupported(false);
      startFallbackMode();
    }

    // Fallback for desktop - simulate gentle motion
    function startFallbackMode() {
      intervalRef.current = setInterval(() => {
        const simulated = Math.random() * 30 + 10;
        setIntensity(simulated);
        dataRef.current.push(simulated);
      }, 500);
    }

    // Send data periodically
    const reportInterval = setInterval(() => {
      if (dataRef.current.length > 0) {
        const avg = dataRef.current.reduce((a, b) => a + b, 0) / dataRef.current.length;
        onMotionData?.(avg, dataRef.current);
      }
    }, 2000);

    return () => {
      window.removeEventListener('devicemotion', handleMotion);
      clearInterval(intervalRef.current);
      clearInterval(reportInterval);
    };
  }, [isActive, onMotionData]);

  const getIntensityColor = () => {
    if (intensity < 20) return 'text-[#5DB075]';
    if (intensity < 50) return 'text-[#88C0D0]';
    return 'text-[#E76F51]';
  };

  const getIntensityLabel = () => {
    if (intensity < 20) return 'Calm';
    if (intensity < 50) return 'Active';
    return 'Restless';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/65 dark:bg-slate-800/60 glass rounded-2xl p-4 border border-white/30 dark:border-slate-600/40 shadow-sm"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isSupported ? (
            <Smartphone className="w-4 h-4 text-slate-400" />
          ) : (
            <Activity className="w-4 h-4 text-slate-400" />
          )}
          <span className="text-sm text-slate-500">
            {isSupported ? 'Motion Sensing' : 'Simulated Motion'}
          </span>
        </div>
        <span className={`text-sm font-medium ${getIntensityColor()}`}>
          {getIntensityLabel()}
        </span>
      </div>

      {/* Motion visualization */}
      <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#5DB075] via-[#88C0D0] to-[#E76F51]"
          animate={{ width: `${Math.min(intensity, 100)}%` }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      </div>

      <div className="flex justify-between mt-2 text-xs text-slate-400">
        <span>Still</span>
        <span>Moving</span>
      </div>
    </motion.div>
  );
}