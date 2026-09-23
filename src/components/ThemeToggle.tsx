import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  variant?: 'pill' | 'segmented' | 'floating' | 'compact';
  className?: string;
  showLabels?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  variant = 'pill',
  className = '',
  showLabels = true
}) => {
  const { isDark, toggleTheme, setTheme } = useTheme();

  // Dual segmented switcher showing both Light and Dark options clearly
  if (variant === 'segmented') {
    return (
      <div 
        className={`inline-flex items-center p-1 rounded-xl bg-slate-950 border-2 border-amber-500/60 shadow-lg shadow-amber-500/15 ${className}`}
        role="group"
        aria-label="Color theme selector"
      >
        <button
          type="button"
          onClick={() => setTheme('light')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
            !isDark
              ? 'bg-amber-400 text-slate-950 shadow-md scale-[1.02]'
              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
          }`}
          title="Switch to Light Theme"
        >
          <Sun className={`w-3.5 h-3.5 ${!isDark ? 'fill-slate-950 stroke-slate-950' : ''}`} />
          <span>Light</span>
        </button>
        <button
          type="button"
          onClick={() => setTheme('dark')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
            isDark
              ? 'bg-slate-800 text-amber-300 shadow-md border border-amber-500/40 scale-[1.02]'
              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
          }`}
          title="Switch to Dark Theme"
        >
          <Moon className={`w-3.5 h-3.5 ${isDark ? 'fill-amber-400 stroke-amber-400' : ''}`} />
          <span>Dark</span>
        </button>
      </div>
    );
  }

  // Floating Corner Badge (Pinned to bottom-left corner of the window for 100% visibility)
  if (variant === 'floating') {
    return (
      <button
        onClick={toggleTheme}
        type="button"
        className={`fixed bottom-4 left-4 z-[1200] flex items-center gap-2.5 px-3.5 py-2 rounded-2xl border-2 border-amber-500/70 shadow-2xl backdrop-blur-md transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 ${
          isDark 
            ? 'bg-slate-900/95 text-slate-100 hover:bg-slate-850 shadow-amber-500/20' 
            : 'bg-white/95 text-slate-900 hover:bg-amber-50 shadow-xl'
        } ${className}`}
        title={`Currently ${isDark ? 'Dark Mode' : 'Light Mode'}. Click to toggle.`}
      >
        <div className={`w-6 h-6 rounded-xl flex items-center justify-center transition-colors ${
          isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-500 text-slate-950'
        }`}>
          {isDark ? <Moon className="w-4 h-4 fill-amber-300" /> : <Sun className="w-4 h-4 fill-slate-950" />}
        </div>
        <div className="flex flex-col text-left leading-none">
          <span className="text-[9px] uppercase font-bold text-amber-500 dark:text-amber-400 tracking-wider">
            Theme Mode
          </span>
          <span className="text-xs font-black">
            {isDark ? '🌙 Dark Mode' : '☀️ Light Mode'}
          </span>
        </div>
      </button>
    );
  }

  // Pill Variant with High-Contrast border and bold label
  return (
    <button
      onClick={toggleTheme}
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className={`group relative inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 transition-all duration-200 cursor-pointer select-none font-bold ${
        isDark
          ? 'bg-slate-950/90 border-amber-500/50 text-slate-100 hover:border-amber-400 hover:bg-slate-900 shadow-md shadow-amber-500/10'
          : 'bg-white border-amber-500 text-slate-900 hover:bg-amber-50/80 shadow-md'
      } ${className}`}
      title={`Theme is currently ${isDark ? 'Dark' : 'Light'}. Click to switch to ${isDark ? 'Light' : 'Dark'} mode.`}
    >
      <span
        className={`flex items-center justify-center w-5 h-5 rounded-lg transition-transform duration-300 ${
          isDark 
            ? 'bg-amber-500/20 text-amber-300 rotate-0' 
            : 'bg-amber-500 text-slate-950 rotate-180 shadow-sm'
        }`}
      >
        {isDark ? <Moon className="w-3.5 h-3.5 fill-amber-300" /> : <Sun className="w-3.5 h-3.5 fill-slate-950" />}
      </span>
      {showLabels && (
        <span className="text-xs font-black tracking-tight flex items-center gap-1">
          <span>{isDark ? '🌙 Dark' : '☀️ Light'}</span>
        </span>
      )}
    </button>
  );
};

