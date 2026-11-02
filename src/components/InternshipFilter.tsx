import React from 'react';
import { 
  Search, 
  Send,
  GraduationCap,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { WorkMode, RoleCategory } from '../types.ts';

interface InternshipFilterProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  workModeFilter: WorkMode | 'all';
  setWorkModeFilter: (m: WorkMode | 'all') => void;
  matchTierFilter: 'all' | 'high' | 'good' | 'gap';
  setMatchTierFilter: (t: 'all' | 'high' | 'good' | 'gap') => void;
  categoryFilter: RoleCategory | 'all';
  setCategoryFilter: (c: RoleCategory | 'all') => void;
  platformFilter?: string;
  setPlatformFilter?: (p: string) => void;
  onlyEligibleOnly?: boolean;
  setOnlyEligibleOnly?: (val: boolean) => void;
  candidateYear?: number;
  selectedCount: number;
  totalFilteredCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onSelectHighMatches: () => void;
  onSelectRemoteOnly: () => void;
  onTriggerBatchSend: () => void;
}

export const InternshipFilter: React.FC<InternshipFilterProps> = ({
  searchQuery,
  setSearchQuery,
  workModeFilter,
  setWorkModeFilter,
  matchTierFilter,
  setMatchTierFilter,
  categoryFilter,
  setCategoryFilter,
  platformFilter = 'all',
  setPlatformFilter,
  onlyEligibleOnly = true,
  setOnlyEligibleOnly,
  candidateYear = 3,
  selectedCount,
  totalFilteredCount,
  onSelectAll,
  onDeselectAll,
  onSelectHighMatches,
  onSelectRemoteOnly,
  onTriggerBatchSend,
}) => {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white shadow-sm p-5 sm:p-6 space-y-4 text-slate-900">
      
      {/* Search Input & Quick Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by company, role, skills (e.g. React, Python), city (Bengaluru, NYC)..."
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-2xl border border-slate-200 focus:ring-2 focus:ring-slate-900 focus:border-slate-900 bg-slate-50 text-slate-900 placeholder:text-slate-400 font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-700"
            >
              Clear
            </button>
          )}
        </div>

        {/* Work Mode Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'All Modes' },
            { id: 'remote', label: '🌐 Remote' },
            { id: 'hybrid', label: '🔄 Hybrid' },
            { id: 'onsite', label: '🏢 On-site' },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setWorkModeFilter(mode.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                workModeFilter === mode.id
                  ? 'bg-[#1c1c1e] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {/* Match Tier Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'All Matches' },
            { id: 'high', label: '⭐ High (≥70%)' },
            { id: 'good', label: 'Good (≥50%)' },
            { id: 'gap', label: 'Skill Gaps' },
          ].map((tier) => (
            <button
              key={tier.id}
              onClick={() => setMatchTierFilter(tier.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                matchTierFilter === tier.id
                  ? 'bg-[#1c1c1e] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              {tier.label}
            </button>
          ))}
        </div>

        {/* Student Eligibility Toggle (User Year Scoped) */}
        {setOnlyEligibleOnly && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <button
              type="button"
              onClick={() => setOnlyEligibleOnly(!onlyEligibleOnly)}
              title={onlyEligibleOnly ? 'Click to show all roles including ineligible 4th year only roles' : 'Click to hide ineligible roles'}
              className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5 ${
                onlyEligibleOnly
                  ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/30'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 text-[#d9f99d]" />
              <span>{onlyEligibleOnly ? `Only Eligible (${candidateYear}th Year)` : 'Showing All Batches'}</span>
            </button>
          </div>
        )}

      </div>

      {/* Role Category Selector Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto text-xs pt-1 border-t border-slate-200">
        <span className="font-extrabold text-slate-500 mr-1 shrink-0">Category:</span>
        {[
          { id: 'all', label: 'All Roles' },
          { id: 'fullstack', label: 'Full-Stack' },
          { id: 'ai-ml', label: 'AI & Machine Learning' },
          { id: 'cloud-devops', label: 'Cloud & DevOps' },
          { id: 'frontend', label: 'Frontend' },
          { id: 'backend', label: 'Backend' },
          { id: 'data', label: 'Data Science' },
          { id: 'security', label: 'Security' },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategoryFilter(cat.id as any)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              categoryFilter === cat.id
                ? 'bg-slate-900 text-white font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Sourced Platform Filter Pills */}
      {setPlatformFilter && (
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs pt-2 border-t border-slate-200">
          <span className="font-extrabold text-slate-500 mr-1 shrink-0">Source Platform:</span>
          {[
            { id: 'all', label: '🌐 All Platforms' },
            { id: 'LinkedIn', label: '💼 LinkedIn' },
            { id: 'Unstop', label: '🎯 Unstop' },
            { id: 'Naukri', label: '📄 Naukri.com' },
            { id: 'Glassdoor', label: '⭐ Glassdoor' },
            { id: 'Indeed', label: '🔍 Indeed' },
          ].map((plat) => (
            <button
              key={plat.id}
              type="button"
              onClick={() => setPlatformFilter(plat.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                platformFilter === plat.id
                  ? 'bg-slate-900 text-[#d9f99d] font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {plat.label}
            </button>
          ))}
        </div>
      )}

      {/* 1-Click Action & Multi-Select Bar */}
      <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
        
        {/* Selection presets */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="font-extrabold text-slate-900">
            {selectedCount} of {totalFilteredCount} selected
          </span>
          <span className="text-slate-300">|</span>
          <button
            type="button"
            onClick={onSelectAll}
            className="text-slate-700 hover:text-slate-950 font-bold hover:underline"
          >
            Select All ({totalFilteredCount})
          </button>
          <span className="text-slate-300">•</span>
          <button
            type="button"
            onClick={onSelectHighMatches}
            className="text-slate-700 hover:text-slate-950 font-bold hover:underline"
          >
            Top Matches (≥40%)
          </button>
          <span className="text-slate-300">•</span>
          <button
            type="button"
            onClick={onSelectRemoteOnly}
            className="text-slate-700 hover:text-slate-950 font-bold hover:underline"
          >
            Remote Only
          </button>
          <span className="text-slate-300">•</span>
          <button
            type="button"
            onClick={onDeselectAll}
            className="text-slate-400 hover:text-slate-600 font-medium"
          >
            Clear
          </button>
        </div>

        {/* Dispatch Action Button */}
        <button
          type="button"
          onClick={onTriggerBatchSend}
          disabled={selectedCount === 0}
          className={`px-5 py-2.5 rounded-xl text-xs font-extrabold shadow-md flex items-center justify-center gap-2 transition-all ${
            selectedCount > 0
              ? 'bg-[#1c1c1e] text-white hover:bg-black hover:scale-[1.02]'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          <Send className="w-3.5 h-3.5 text-[#d9f99d]" />
          <span>Batch Send Pitches ({selectedCount})</span>
        </button>

      </div>

    </div>
  );
};
