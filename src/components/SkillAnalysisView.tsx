import React, { useState } from 'react';
import { 
  Sparkles, 
  Check, 
  X, 
  Plus, 
  Award, 
  UserCheck, 
  RefreshCw
} from 'lucide-react';
import { CandidateProfile } from '../types.ts';

interface SkillAnalysisViewProps {
  profile: CandidateProfile;
  onAddSkill: (skill: string) => void;
  onRemoveSkill: (skill: string) => void;
  onReset: () => void;
  matchedCount: number;
  avgMatchScore: number;
}

export const SkillAnalysisView: React.FC<SkillAnalysisViewProps> = ({
  profile,
  onAddSkill,
  onRemoveSkill,
  onReset,
  matchedCount,
  avgMatchScore,
}) => {
  const [newSkillInput, setNewSkillInput] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const val = newSkillInput.trim();
    if (val) {
      onAddSkill(val);
      setNewSkillInput('');
      setIsAdding(false);
    }
  };

  return (
    <div className="relative rounded-3xl p-6 sm:p-8 border border-slate-200/80 bg-white shadow-sm space-y-6 text-slate-900">
      
      {/* Candidate Profile Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#1c1c1e] text-[#d9f99d] font-black text-xl flex items-center justify-center shadow-sm shrink-0">
            {profile.name
              ? profile.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
              : 'ID'}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black text-slate-950">
                {profile.name || 'Candidate Profile'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#d9f99d]/60 text-slate-950 border border-slate-300">
                {profile.experienceLevel || 'Fresher / Student'}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
              {profile.email} • {profile.phone || 'Phone attached'}
            </p>
          </div>
        </div>

        {/* Quick Stats Score Card */}
        <div className="flex items-center gap-2 sm:gap-3 self-stretch md:self-auto justify-between md:justify-end">
          <div className="p-3 px-4 rounded-2xl bg-slate-100 border border-slate-200 text-center">
            <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
              Detected Skills
            </span>
            <span className="text-lg font-black text-slate-900">
              {profile.detectedSkills.length}
            </span>
          </div>

          <div className="p-3 px-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
            <span className="block text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
              Eligible Openings
            </span>
            <span className="text-lg font-black text-emerald-800">
              {matchedCount} Active
            </span>
          </div>

          <div className="p-3 px-4 rounded-2xl bg-slate-100 border border-slate-200 text-center">
            <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
              Average Match
            </span>
            <span className="text-lg font-black text-slate-900">
              {avgMatchScore}%
            </span>
          </div>

          <button
            onClick={onReset}
            title="Clear and upload a different resume"
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 font-extrabold text-xs transition-colors shrink-0 shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Clear / Change Resume</span>
          </button>
        </div>
      </div>

      {/* Candidate Executive Summary & Strengths */}
      {profile.summary && (
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
          <div className="font-extrabold text-slate-900 mb-1 flex items-center gap-1.5 text-xs uppercase tracking-wider">
            <UserCheck className="w-3.5 h-3.5 text-slate-900" />
            Resume Intelligence Analysis
          </div>
          {profile.summary}
        </div>
      )}

      {/* Skills Extracted Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-slate-900" />
              <span>Extracted Skills from Your Resume ({profile.detectedSkills.length})</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              These technical keywords are directly matched against current employer requirements.
            </p>
          </div>

          {!isAdding ? (
            <button
              onClick={() => setIsAdding(true)}
              className="inline-flex items-center gap-1 text-xs font-extrabold text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3 py-1.5 rounded-xl transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Missing Skill</span>
            </button>
          ) : (
            <form onSubmit={handleAdd} className="flex items-center gap-1.5">
              <input
                type="text"
                autoFocus
                placeholder="e.g. AWS, Docker"
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
                className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none w-32 sm:w-40 bg-slate-50 text-slate-900 placeholder:text-slate-400 font-medium"
              />
              <button
                type="submit"
                className="p-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-black"
              >
                <Check className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="p-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs hover:bg-slate-300"
              >
                <X className="w-3 h-3" />
              </button>
            </form>
          )}
        </div>

        {/* Skill Pills */}
        <div className="flex flex-wrap gap-2 pt-1">
          {profile.detectedSkills.map((skill) => (
            <span
              key={skill}
              className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-slate-100 text-slate-900 border border-slate-200 hover:bg-slate-200 transition-all shadow-xs"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-slate-900"></span>
              <span>{skill}</span>
              <button
                type="button"
                onClick={() => onRemoveSkill(skill)}
                title={`Remove ${skill}`}
                className="text-slate-400 hover:text-rose-600 transition-colors ml-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Candidate Strengths */}
      {profile.strengths && profile.strengths.length > 0 && (
        <div className="pt-3 border-t border-slate-200">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-amber-600" />
            Key Candidate Strengths
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {profile.strengths.map((str, i) => (
              <div
                key={i}
                className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium"
              >
                <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                <span>{str}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
