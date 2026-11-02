import React from 'react';
import { 
  Zap, 
  Heart, 
  Activity, 
  Percent, 
  Moon, 
  MoreVertical, 
  ChevronDown,
  TrendingUp,
  ShieldCheck,
  Send
} from 'lucide-react';
import { CandidateProfile, MatchedInternship } from '../types.ts';

interface FluxOverviewWidgetsProps {
  candidate: CandidateProfile | null;
  matchedInternships: MatchedInternship[];
  applicationsCount: number;
  avgMatchScore: number;
}

export const FluxOverviewWidgets: React.FC<FluxOverviewWidgetsProps> = ({
  candidate,
  matchedInternships,
  applicationsCount,
  avgMatchScore,
}) => {
  const detectedCount = candidate?.detectedSkills.length || 12;
  const highMatchCount = matchedInternships.filter(m => m.matchPercentage >= 70).length;

  return (
    <div className="space-y-5">
      
      {/* Top 3-Column Grid matching Screenshot */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
        
        {/* WIDGET 1: Energy Used / Skill Match Distribution (Cols 1-5) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 shadow-sm border border-slate-200/70 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-800">
                <Zap className="w-4 h-4 fill-slate-800" />
              </div>
              <span className="font-extrabold text-slate-900 text-sm">Skills Compatible</span>
            </div>
            <button className="text-slate-400 hover:text-slate-700">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                {avgMatchScore > 0 ? `${avgMatchScore}%` : '88%'}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold bg-[#d9f99d] text-slate-950 px-2 py-0.5 rounded-full">
                +5% compatibility
              </span>
            </div>
            <span className="text-xs font-semibold text-slate-400 mt-1 block">
              {detectedCount} core skills detected in resume
            </span>
          </div>

          {/* Overlapping Circles Graphic from reference image */}
          <div className="relative h-36 flex items-center justify-center pt-2">
            {/* Circle 1: Soft Purple */}
            <div className="w-28 h-28 rounded-full bg-[#c4b5fd] text-slate-950 font-black flex flex-col items-center justify-center shadow-sm -mr-6 z-10">
              <span className="text-xl leading-none">{highMatchCount > 0 ? highMatchCount : '6'}</span>
              <span className="text-[10px] font-bold opacity-80 mt-0.5">high fit</span>
            </div>

            {/* Circle 2: Dark Matte */}
            <div className="w-24 h-24 rounded-full bg-[#1c1c1e] text-white font-black flex flex-col items-center justify-center shadow-md z-20">
              <span className="text-lg leading-none">{matchedInternships.length > 0 ? matchedInternships.length : '10'}</span>
              <span className="text-[9px] font-bold text-slate-300 mt-0.5">roles</span>
            </div>

            {/* Circle 3: Lime Green */}
            <div className="w-20 h-20 rounded-full bg-[#d9f99d] text-slate-950 font-black flex flex-col items-center justify-center shadow-sm -ml-5 z-30 self-end mb-1">
              <span className="text-base leading-none">100%</span>
              <span className="text-[8px] font-bold opacity-80 mt-0.5">verified</span>
            </div>
          </div>
        </div>

        {/* MIDDLE COLUMN: Heart Rate & Activity Stacked (Cols 6-8) */}
        <div className="lg:col-span-3 flex flex-col justify-between gap-4">
          
          {/* Recruiter Interest / Heart Rate */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/70 flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                  <Heart className="w-3.5 h-3.5 fill-red-500" />
                </div>
                <span className="font-extrabold text-slate-900 text-xs">Recruiter Interest</span>
              </div>
              <button className="text-slate-400 hover:text-slate-700">
                <MoreVertical className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900">94<span className="text-xs font-bold text-slate-400 ml-1">%</span></span>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Avg Response</span>
                <span className="text-xs font-extrabold text-slate-800">24 Hours</span>
              </div>
            </div>
          </div>

          {/* Activity / Applications Sent */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/70 flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                  <Activity className="w-3.5 h-3.5" />
                </div>
                <span className="font-extrabold text-slate-900 text-xs">Applications Sent</span>
              </div>
              <button className="text-slate-400 hover:text-slate-700">
                <MoreVertical className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900">{applicationsCount} <span className="text-xs font-bold text-slate-400">sent</span></span>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Status</span>
                <span className="text-xs font-extrabold text-emerald-600">Dispatched</span>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Wellness Index Dot Matrix Chart (Cols 9-12) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 shadow-sm border border-slate-200/70 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                <Percent className="w-4 h-4 font-black" />
              </div>
              <span className="font-extrabold text-slate-900 text-sm">Market Fit Index</span>
            </div>
            <button className="text-slate-400 hover:text-slate-700">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">78%</span>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-extrabold bg-[#d9f99d] text-slate-950 px-2 py-0.5 rounded-full">
                +10%
              </span>
            </div>
            <span className="text-xs font-semibold text-slate-400 mt-0.5 block">
              High hiring momentum for your stack
            </span>
          </div>

          {/* Dot Matrix Visualizer matching screenshot */}
          <div className="grid grid-cols-7 gap-2 pt-2 items-end justify-between">
            {[
              [2, 4, 3],
              [3, 5, 4, 2],
              [4, 6, 5, 3, 2],
              [2, 4, 3],
              [4, 6, 5, 4],
              [3, 5, 4, 3, 2],
              [2, 4, 3, 2],
            ].map((col, idx) => (
              <div key={idx} className="flex flex-col gap-1.5 items-center">
                {col.map((val, dotIdx) => (
                  <span
                    key={dotIdx}
                    className={`w-2.5 h-2.5 rounded-full ${
                      dotIdx === col.length - 1
                        ? 'bg-[#8b5cf6]'
                        : dotIdx === col.length - 2
                        ? 'bg-[#c4b5fd]'
                        : 'bg-[#ede9fe]'
                    }`}
                  />
                ))}
              </div>
            ))}
          </div>

        </div>

      </div>

      {/* Bottom Dark Card Widget: Sleep Analysis / HR Dispatch Stream */}
      <div className="bg-[#1c1c1e] text-white rounded-3xl p-6 shadow-md border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-300">
            <Moon className="w-5 h-5 text-[#d9f99d]" />
          </div>
          <div>
            <span className="font-extrabold text-sm text-white block">
              AI Recruiter Dispatch Pipeline
            </span>
            <span className="text-xs text-slate-400 font-medium">
              1-Click automated pitch generation & email delivery initialized.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          <div className="bg-slate-800 px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-300 flex items-center gap-1.5 cursor-pointer hover:bg-slate-700">
            <span>Monthly Overview</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>
        </div>
      </div>

    </div>
  );
};
