import React from 'react';
import { ShieldCheck, UserCheck, ShieldAlert, Wifi, Code } from 'lucide-react';

export type AppView = 'candidate' | 'invigilator' | 'embed';

interface NavbarProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  examTitle?: string;
  isOnline?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onViewChange,
  examTitle = 'CS-402: Distributed Systems & Machine Learning Governance',
  isOnline = true,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-slate-900 dark:text-white">AI Proctor</span>
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                Standalone SDK
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block truncate max-w-md">
              {examTitle}
            </p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-4">
          {/* Network Status */}
          <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
            <Wifi className={`h-3.5 w-3.5 ${isOnline ? 'text-emerald-500' : 'text-red-500'}`} />
            <span className="hidden md:inline">{isOnline ? 'Real-time Sync Active' : 'Offline'}</span>
          </div>

          {/* Navigation View Switcher */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800">
            <button
              onClick={() => onViewChange('candidate')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-all ${
                currentView === 'candidate'
                  ? 'bg-white text-blue-700 shadow-sm dark:bg-slate-900 dark:text-blue-400 font-bold'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>Candidate Room</span>
            </button>
            <button
              onClick={() => onViewChange('invigilator')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-all ${
                currentView === 'invigilator'
                  ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-900 dark:text-indigo-400 font-bold'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Invigilator Dashboard</span>
            </button>
            <button
              onClick={() => onViewChange('embed')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-all ${
                currentView === 'embed'
                  ? 'bg-white text-emerald-700 shadow-sm dark:bg-slate-900 dark:text-emerald-400 font-bold'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Code className="h-3.5 w-3.5" />
              <span>Embed on Websites</span>
            </button>
          </div>

          {/* Active Profile */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
            <img
              src={
                currentView === 'candidate'
                  ? 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex'
                  : 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus'
              }
              alt="Avatar"
              className="h-8 w-8 rounded-full border border-slate-300 bg-slate-200 dark:border-slate-700"
            />
          </div>
        </div>
      </div>
    </header>
  );
};

