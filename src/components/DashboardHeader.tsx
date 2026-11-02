import React from 'react';
import { 
  Search, 
  Bell, 
  ChevronDown, 
  User, 
  Calendar,
  Sparkles
} from 'lucide-react';
import { CandidateProfile } from '../types.ts';

interface DashboardHeaderProps {
  candidate: CandidateProfile | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeTabTitle: string;
  activeTabSubtitle: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  candidate,
  searchQuery,
  setSearchQuery,
  activeTabTitle,
  activeTabSubtitle,
}) => {
  const userName = candidate?.name || 'Lucas Bennett';
  const userEmail = candidate?.email || 'bennet02@gmail.com';

  return (
    <div className="space-y-6 pb-6 border-b border-slate-200/80">
      
      {/* Top Controls Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Left: User Profile Pill matching screenshot */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-violet-500 to-indigo-500 text-white font-bold flex items-center justify-center text-sm shadow-md ring-2 ring-white shrink-0 overflow-hidden">
            {candidate ? (
              <span className="font-extrabold text-base">{userName.slice(0, 2).toUpperCase()}</span>
            ) : (
              <img 
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80" 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5 cursor-pointer group">
              <span className="font-extrabold text-slate-900 text-sm group-hover:text-violet-600 transition-colors">
                {userName}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700" />
            </div>
            <span className="text-xs text-slate-500 block font-medium">
              {userEmail}
            </span>
          </div>
        </div>

        {/* Right Controls: Search, Notifications, Date Selector */}
        <div className="flex items-center gap-3 flex-wrap">
          
          {/* Rounded White Search Bar */}
          <div className="relative flex-1 sm:w-64 lg:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search jobs, skills, recruiters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-full bg-white border border-slate-200/90 text-slate-900 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium"
            />
          </div>

          {/* Notification Bell Badge Pill */}
          <div className="relative w-10 h-10 rounded-full bg-white border border-slate-200/90 shadow-sm flex items-center justify-center text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors">
            <Bell className="w-4 h-4" />
            <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-[#d9f99d] text-black font-black text-[9px] flex items-center justify-center shadow-xs border border-white">
              2
            </span>
          </div>

          {/* Date Selector Pill */}
          <div className="hidden md:flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200/90 shadow-sm text-xs font-semibold text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>24 Sept, 2026</span>
            <div className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-full text-[11px] font-bold text-slate-800 ml-1">
              <span>Today</span>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </div>
          </div>

        </div>

      </div>

      {/* Main Section Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
          {activeTabTitle}
        </h1>
        <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
          {activeTabSubtitle}
        </p>
      </div>

    </div>
  );
};
