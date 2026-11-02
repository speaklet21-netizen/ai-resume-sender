import React, { useState } from 'react';
import { 
  Briefcase, 
  Sparkles, 
  Linkedin, 
  ExternalLink, 
  MapPin, 
  DollarSign, 
  ShieldCheck, 
  ArrowRight, 
  Send, 
  CheckCircle2, 
  Compass, 
  Layers,
  ChevronRight
} from 'lucide-react';
import { CandidateProfile, MatchedInternship } from '../types.ts';
import { getCompanyLinkedinUrl, getHrLinkedinUrl } from '../utils/linkedin.ts';

interface SimilarJobsViewProps {
  matchedInternships: MatchedInternship[];
  candidate: CandidateProfile | null;
  onApplyInternship: (internship: MatchedInternship) => void;
  onViewCompany: (internship: MatchedInternship) => void;
}

export const SimilarJobsView: React.FC<SimilarJobsViewProps> = ({
  matchedInternships,
  candidate,
  onApplyInternship,
  onViewCompany,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'direct' | 'adjacent'>('all');

  // Direct matches: Match score >= 40% (improved threshold for more results)
  const directMatches = matchedInternships.filter(i => i.matchPercentage >= 40);
  
  // Adjacent roles: roles with some skill overlap but notable gaps — great growth opportunities
  const adjacentRoles = matchedInternships.filter(i => i.matchPercentage < 40 && i.matchedSkills.length > 0);

  const displayedList = selectedFilter === 'direct' 
    ? directMatches 
    : selectedFilter === 'adjacent' 
    ? adjacentRoles 
    : matchedInternships;

  if (!candidate) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-12 text-center max-w-lg mx-auto space-y-4 my-8">
        <div className="w-14 h-14 rounded-2xl bg-[#d9f99d] text-slate-950 flex items-center justify-center mx-auto shadow-sm">
          <Briefcase className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-black text-slate-900">
          Upload Your Resume to Discover Similar Roles
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
          Please upload your resume in the Match & Apply tab first. We will analyze your detected skills and map out both direct openings and career growth opportunities tailored specifically to your profile.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300 text-slate-900">
      
      {/* Hero Header */}
      <div className="relative rounded-3xl overflow-hidden p-8 sm:p-10 border border-slate-200/80 bg-white shadow-sm">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black bg-[#d9f99d] text-slate-950 mb-4 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-slate-950" />
            <span>AI Career Resonance Engine</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            Similar Jobs & Roles to Consider
          </h1>

          <p className="text-sm sm:text-base font-medium text-slate-500 mt-2.5 leading-relaxed">
            Based on your resume skills{candidate ? ` (${candidate.detectedSkills.slice(0, 4).join(', ')})` : ''}, we've mapped direct opening matches alongside adjacent roles you might consider to expand your career reach.
          </p>

          {/* Filter Pills */}
          <div className="flex items-center gap-2.5 mt-6 flex-wrap">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                selectedFilter === 'all'
                  ? 'bg-[#1c1c1e] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              All Openings ({matchedInternships.length})
            </button>

            <button
              onClick={() => setSelectedFilter('direct')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                selectedFilter === 'direct'
                  ? 'bg-[#1c1c1e] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              🎯 Direct Skill Matches ({directMatches.length})
            </button>

            <button
              onClick={() => setSelectedFilter('adjacent')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                selectedFilter === 'adjacent'
                  ? 'bg-[#1c1c1e] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              🚀 Adjacent Roles to Consider ({adjacentRoles.length})
            </button>
          </div>
        </div>
      </div>

      {/* Similar Jobs Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {displayedList.map((job) => {
          const isHighMatch = job.matchPercentage >= 50;

          return (
            <div
              key={job.id}
              className="group relative rounded-3xl p-6 bg-white border border-slate-200/90 hover:border-slate-400 hover:shadow-md transition-all duration-300 shadow-sm flex flex-col justify-between"
            >
              <div className="relative z-10 space-y-4">
                
                {/* Header: Company & Match Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-sm text-slate-900">
                        {job.company}
                      </span>

                      {/* Company LinkedIn Profile */}
                      <a
                        href={getCompanyLinkedinUrl(job.company, job.companyLinkedin)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 hover:bg-blue-100 transition-colors"
                      >
                        <Linkedin className="w-3 h-3 text-blue-600" />
                        <span>Verify</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                      </a>

                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        <span>{job.trustScore}% Verified</span>
                      </span>

                      {/* Official Direct Apply Link */}
                      <a
                        href={job.directApplyUrl || job.officialNotificationUrl || `${job.companyWebsite}/careers`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] font-black text-slate-950 bg-[#d9f99d] hover:bg-[#bef264] px-2.5 py-0.5 rounded-md border border-slate-900/20 transition-all hover:scale-105"
                      >
                        <ExternalLink className="w-2.5 h-2.5 text-slate-950" />
                        <span>Direct Apply ↗</span>
                      </a>
                    </div>

                    <h3 className="text-lg font-black text-slate-950 mt-1">
                      {job.role}
                    </h3>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-[#d9f99d] text-slate-950 shadow-xs">
                      <Sparkles className="w-3 h-3 text-slate-950" />
                      <span>{job.matchPercentage}% Match</span>
                    </span>
                    <span className="block text-[10px] font-bold text-slate-400 mt-0.5">
                      {isHighMatch ? 'Direct Skill Fit' : 'Growth Role'}
                    </span>
                  </div>
                </div>

                {/* Meta details: Stipend, Work Mode, Location */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-extrabold capitalize">
                    {job.workMode === 'remote' ? '🌐 Remote' : job.workMode === 'hybrid' ? '🔄 Hybrid' : '🏢 Onsite'}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-black">
                    {job.salary}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-semibold flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    <span>{job.companyLocation}</span>
                  </span>
                </div>

                {/* "Why This is Similar to Your Resume" Insight */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5 font-medium">
                  <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-slate-700" />
                    <span>Similarity Analysis Based on Your Resume:</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    {job.matchedSkills.length > 0 ? (
                      <>
                        Strong overlap in <strong className="text-slate-900 font-extrabold">{job.matchedSkills.slice(0, 3).join(', ')}</strong>.
                        {job.lackingSkills.length > 0 && (
                          <span className="text-slate-500"> Excellent role to consider if you want to expand into <span className="text-amber-800 font-bold">{job.lackingSkills.slice(0, 2).join(', ')}</span>.</span>
                        )}
                      </>
                    ) : (
                      <>
                        Adjacent high-trajectory role in <strong className="text-slate-900 font-extrabold">{job.category}</strong> engineering with competitive stipend.
                      </>
                    )}
                  </p>
                </div>

                {/* HR Recruiter Info */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#1c1c1e] text-[#d9f99d] font-black flex items-center justify-center text-xs">
                      {job.hr.name.slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900">{job.hr.name}</div>
                      <div className="text-[11px] font-semibold text-slate-500">{job.hr.title}</div>
                    </div>
                  </div>

                  <a
                    href={getHrLinkedinUrl(job.hr.name, job.company, job.hr.linkedin)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200"
                  >
                    <Linkedin className="w-3 h-3 text-blue-600" />
                    <span>HR Profile</span>
                  </a>
                </div>

              </div>

              {/* Bottom Actions */}
              <div className="relative z-10 pt-4 mt-4 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onViewCompany(job)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    Details & Perks
                  </button>

                  <a
                    href={job.directApplyUrl || job.officialNotificationUrl || `${job.companyWebsite}/careers`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-extrabold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3 text-blue-600" />
                    <span>Official Apply ↗</span>
                  </a>
                </div>

                <button
                  type="button"
                  onClick={() => onApplyInternship(job)}
                  className="px-4 py-2 rounded-xl text-xs font-extrabold bg-[#1c1c1e] hover:bg-black text-white shadow-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5 text-[#d9f99d]" />
                  <span>Contact HR Now</span>
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
