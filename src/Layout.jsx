import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Brain, History, Sun, Moon } from 'lucide-react';
import GridBackground, { useGridMouse } from '@/components/GridBackground';

export default function Layout({ children, currentPageName }) {
  const [dark, setDark] = useState(() => localStorage.getItem('sca-theme') === 'dark');
  const { mouseX, mouseY, handleMouseMove, handleMouseLeave } = useGridMouse();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('sca-theme', dark ? 'dark' : 'light');
  }, [dark]);

  const navItems = [
    { name: 'Home', icon: Brain, label: 'Check-In' },
    { name: 'History', icon: History, label: 'History' },
  ];

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`h-screen-safe flex flex-col overflow-hidden transition-colors duration-300 ${dark ? 'bg-slate-900' : 'bg-[#F7FAFC]'}`}
    >
      <style>{`
        :root {
          --app-primary: #2D6A9F;
          --app-accent: #88C0D0;
          --app-success: #5DB075;
          --app-danger: #E76F51;
        }
        * { -webkit-tap-highlight-color: transparent; }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      {/* Animated grid background */}
      <GridBackground mouseX={mouseX} mouseY={mouseY} />

      {/* Theme toggle button — top right */}
      <button
        onClick={() => setDark(d => !d)}
        className={`fixed top-4 right-4 z-50 w-10 h-10 rounded-full flex items-center justify-center shadow-md border glass-strong transition-colors ${
          dark
            ? 'bg-slate-700/60 border-slate-500/40 text-yellow-300'
            : 'bg-white/70 border-white/40 text-slate-600'
        }`}
        aria-label="Toggle theme"
      >
        {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      <main className="flex-1 overflow-y-auto overflow-x-hidden relative z-10 pb-16 sm:pb-20">
        {children}
      </main>

      {/* Bottom navigation */}
      <nav className={`flex-shrink-0 glass-strong border-t z-50 transition-colors pb-safe ${
        dark ? 'bg-slate-800/65 border-slate-600/40' : 'bg-white/70 border-white/40'
      }`}>
        <div className="max-w-lg mx-auto flex justify-around py-2">
          {navItems.map((item) => {
            const isActive = currentPageName === item.name;
            return (
              <Link
                key={item.name}
                to={createPageUrl(item.name)}
                className={`flex flex-col items-center py-2 px-6 rounded-xl transition-colors ${
                  isActive
                    ? 'text-[#2D6A9F]'
                    : dark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <item.icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5]' : ''}`} />
                <span className="text-xs mt-1 font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}