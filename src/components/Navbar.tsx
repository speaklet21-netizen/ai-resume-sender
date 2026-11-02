import React from 'react';
import { 
  Sparkles, 
  Briefcase, 
  CheckCircle2, 
  Zap,
  Globe,
  Mail,
  User,
  LogOut,
  LogIn,
  KeyRound
} from 'lucide-react';
import { UserAccount } from '../types.ts';

interface NavbarProps {
  activeTab: 'match' | 'tracker' | 'similar-jobs';
  setActiveTab: (tab: 'match' | 'tracker' | 'similar-jobs') => void;
  applicationsCount: number;
  matchedCount: number;
  hasResume: boolean;
  currentUser: UserAccount | null;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  applicationsCount,
  matchedCount,
  hasResume,
  currentUser,
  onOpenAuth,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#1c1c1e] text-white border-b border-slate-800 shadow-xl">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          
          {/* AI Resume Sender Brand Logo */}
          <div 
            onClick={() => setActiveTab('match')} 
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#d9f99d] text-black font-black flex items-center justify-center shadow-md shadow-[#d9f99d]/20 group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5 fill-black stroke-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl text-white tracking-tight">
                  AI <span className="text-[#d9f99d]">Resume</span> Sender
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider bg-slate-800 text-[#d9f99d] px-2 py-0.5 rounded-full border border-slate-700">
                  Direct HR Dispatch
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden md:block">
                Intelligent Skill Extraction & 1-Click Direct HR Dispatch
              </p>
            </div>
          </div>

          {/* Original Feature Order Nav Tabs in Flux Pill Style */}
          <nav className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Tab 1: Match & Apply */}
            <button
              onClick={() => setActiveTab('match')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all duration-200 ${
                activeTab === 'match'
                  ? 'bg-white text-slate-950 shadow-md scale-105'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Sparkles className={`w-4 h-4 ${activeTab === 'match' ? 'text-black' : 'text-slate-400'}`} />
              <span>Match & Apply</span>
              {hasResume && matchedCount > 0 && (
                <span className={`px-2 py-0.5 text-[10px] font-black rounded-full ${
                  activeTab === 'match' ? 'bg-[#d9f99d] text-black' : 'bg-slate-800 text-[#d9f99d]'
                }`}>
                  {matchedCount}
                </span>
              )}
            </button>

            {/* Tab 2: Similar Jobs */}
            <button
              onClick={() => setActiveTab('similar-jobs')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all duration-200 ${
                activeTab === 'similar-jobs'
                  ? 'bg-white text-slate-950 shadow-md scale-105'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Briefcase className={`w-4 h-4 ${activeTab === 'similar-jobs' ? 'text-black' : 'text-slate-400'}`} />
              <span>Similar Jobs</span>
            </button>

            {/* Tab 3: Tracker */}
            <button
              onClick={() => setActiveTab('tracker')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all duration-200 ${
                activeTab === 'tracker'
                  ? 'bg-white text-slate-950 shadow-md scale-105'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <CheckCircle2 className={`w-4 h-4 ${activeTab === 'tracker' ? 'text-black' : 'text-slate-400'}`} />
              <span>Tracker</span>
              {applicationsCount > 0 && (
                <span className={`px-2 py-0.5 text-[10px] font-black rounded-full ${
                  activeTab === 'tracker' ? 'bg-[#d9f99d] text-black' : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {applicationsCount}
                </span>
              )}
            </button>

          </nav>

          {/* Right side: User Profile / Auth State */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {currentUser ? (
              <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 rounded-2xl p-1.5 pl-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-[#d9f99d] text-slate-950 font-black text-xs flex items-center justify-center shadow-xs">
                    {(currentUser.name || currentUser.email).slice(0, 2).toUpperCase()}
                  </div>
                  <div className="hidden sm:block text-left pr-1">
                    <span className="block text-xs font-black text-white leading-tight">
                      {currentUser.name || 'Candidate'}
                    </span>
                    <span className="block text-[10px] text-slate-400 font-medium leading-tight">
                      {currentUser.email}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onLogout}
                  title="Log out and switch account"
                  className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenAuth}
                className="px-4 py-2 rounded-xl text-xs font-extrabold bg-[#d9f99d] hover:bg-[#bef264] text-slate-950 shadow-md transition-all flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In / OTP</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
