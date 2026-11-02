import React from 'react';
import { 
  Sparkles, 
  Briefcase, 
  CheckCircle2, 
  FileText, 
  Layers, 
  MessageSquare, 
  Home, 
  BarChart3, 
  Users,
  Zap
} from 'lucide-react';

interface SidebarProps {
  activeTab: 'match' | 'tracker' | 'similar-jobs';
  setActiveTab: (tab: 'match' | 'tracker' | 'similar-jobs') => void;
  applicationsCount: number;
  matchedCount: number;
  hasResume: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  applicationsCount,
  matchedCount,
  hasResume,
}) => {
  return (
    <aside className="w-full lg:w-64 xl:w-72 shrink-0 bg-[#1c1c1e] text-slate-200 p-5 sm:p-6 flex flex-col justify-between rounded-t-[28px] lg:rounded-l-[28px] lg:rounded-tr-none border-b lg:border-b-0 lg:border-r border-slate-800/80">
      <div className="space-y-8">
        
        {/* Brand Logo: AI Resume Sender */}
        <div className="flex items-center gap-2.5 px-2 pt-1">
          <div className="w-9 h-9 rounded-xl bg-[#d9f99d] text-black font-black flex items-center justify-center shadow-lg shadow-[#d9f99d]/20">
            <Zap className="w-5 h-5 fill-black stroke-black" />
          </div>
          <span className="font-extrabold text-xl text-white tracking-tight">
            AI <span className="text-[#d9f99d]">Resume</span> Sender
          </span>
        </div>

        {/* Navigation Section */}
        <nav className="space-y-2 text-sm font-semibold">
          
          {/* Dashboard / Match & Apply */}
          <button
            onClick={() => setActiveTab('match')}
            className={`w-full px-4 py-3.5 rounded-2xl flex items-center justify-between transition-all duration-200 ${
              activeTab === 'match'
                ? 'bg-white text-slate-950 font-extrabold shadow-lg shadow-black/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <Sparkles className={`w-4 h-4 ${activeTab === 'match' ? 'text-black' : 'text-slate-400'}`} />
              <span>Dashboard</span>
            </div>
            {matchedCount > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
                activeTab === 'match'
                  ? 'bg-[#d9f99d] text-black'
                  : 'bg-slate-800 text-[#d9f99d]'
              }`}>
                {matchedCount}
              </span>
            )}
          </button>

          {/* Similar Jobs */}
          <button
            onClick={() => setActiveTab('similar-jobs')}
            className={`w-full px-4 py-3.5 rounded-2xl flex items-center justify-between transition-all duration-200 ${
              activeTab === 'similar-jobs'
                ? 'bg-white text-slate-950 font-extrabold shadow-lg shadow-black/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <Briefcase className={`w-4 h-4 ${activeTab === 'similar-jobs' ? 'text-black' : 'text-slate-400'}`} />
              <span>Similar Jobs</span>
            </div>
          </button>

          {/* Application Tracker */}
          <button
            onClick={() => setActiveTab('tracker')}
            className={`w-full px-4 py-3.5 rounded-2xl flex items-center justify-between transition-all duration-200 ${
              activeTab === 'tracker'
                ? 'bg-white text-slate-950 font-extrabold shadow-lg shadow-black/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className={`w-4 h-4 ${activeTab === 'tracker' ? 'text-black' : 'text-slate-400'}`} />
              <span>Tracker</span>
            </div>
            {applicationsCount > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
                activeTab === 'tracker'
                  ? 'bg-[#d9f99d] text-black'
                  : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                {applicationsCount}
              </span>
            )}
          </button>

          {/* Workspace Nav Items */}
          <div className="pt-4 border-t border-slate-800/60 space-y-1 text-xs font-semibold text-slate-400">
            <div className="px-4 py-2 text-[10px] font-black uppercase tracking-wider text-slate-500">
              Workspace
            </div>

            <div className="px-4 py-3 rounded-2xl flex items-center gap-3 text-slate-400 hover:text-white cursor-pointer hover:bg-slate-800/40 transition-colors">
              <BarChart3 className="w-4 h-4 text-slate-400" />
              <span>Analytics & Fit</span>
            </div>

            <div className="px-4 py-3 rounded-2xl flex items-center justify-between text-slate-400 hover:text-white cursor-pointer hover:bg-slate-800/40 transition-colors">
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-slate-400" />
                <span>Recruiters</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-[#d9f99d]"></span>
            </div>

            <div className="px-4 py-3 rounded-2xl flex items-center gap-3 text-slate-400 hover:text-white cursor-pointer hover:bg-slate-800/40 transition-colors">
              <MessageSquare className="w-4 h-4 text-slate-400" />
              <span>HR Messages</span>
            </div>
          </div>

        </nav>
      </div>

      {/* Sidebar Footer: System Status */}
      <div className="pt-6 border-t border-slate-800/60">
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800/80 flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-[#d9f99d] animate-pulse shrink-0" />
          <div className="text-xs">
            <span className="font-bold text-white block">System Online</span>
            <span className="text-[11px] text-slate-400">AI Match Engine v2.4</span>
          </div>
        </div>
      </div>

    </aside>
  );
};
