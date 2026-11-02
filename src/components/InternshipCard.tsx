import React from 'react';
import { 
  DollarSign, 
  Clock, 
  MapPin, 
  Linkedin, 
  Mail, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Send, 
  ExternalLink, 
  Check, 
  Sparkles,
  Info
} from 'lucide-react';
import { MatchedInternship, WorkMode } from '../types.ts';
import { getCompanyLinkedinUrl, getHrLinkedinUrl } from '../utils/linkedin.ts';

interface InternshipCardProps {
  internship: MatchedInternship;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onPreviewPitch: (internship: MatchedInternship) => void;
  onViewCompany: (internship: MatchedInternship) => void;
  onDirectApply: (internship: MatchedInternship) => void;
  hasApplied: boolean;
}

export const InternshipCard: React.FC<InternshipCardProps> = ({
  internship,
  isSelected,
  onToggleSelect,
  onPreviewPitch,
  onViewCompany,
  onDirectApply,
  hasApplied,
}) => {
  const getWorkModeBadge = (mode: WorkMode) => {
    switch (mode) {
      case 'remote':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            🌐 Remote
          </span>
        );
      case 'hybrid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30">
            🔄 Hybrid
          </span>
        );
      case 'onsite':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            🏢 Onsite
          </span>
        );
    }
  };

  const getMatchScoreBadge = (score: number) => {
    if (score >= 70) {
      return {
        bg: 'bg-emerald-400',
        text: 'text-emerald-300',
        badgeBg: 'bg-emerald-500/15 border-emerald-500/30',
        label: 'High Match',
      };
    }
    if (score >= 50) {
      return {
        bg: 'bg-violet-400',
        text: 'text-violet-300',
        badgeBg: 'bg-violet-500/15 border-violet-500/30',
        label: 'Good Match',
      };
    }
    return {
      bg: 'bg-amber-400',
      text: 'text-amber-300',
      badgeBg: 'bg-amber-500/15 border-amber-500/30',
      label: 'Growth Opportunity',
    };
  };

  const matchStyle = getMatchScoreBadge(internship.matchPercentage);

  return (
    <div className={`group relative rounded-3xl transition-all duration-300 ${
      isSelected 
        ? 'bg-white border-2 border-slate-950 ring-4 ring-slate-900/10 shadow-lg' 
        : 'bg-white border border-slate-200/90 hover:border-slate-400 hover:shadow-md shadow-sm'
    }`}>
      
      <div className="p-5 sm:p-6 space-y-4 text-slate-900">
        
        {/* Top Header: Selection Checkbox, Company Branding, Authenticity Tag */}
        <div className="flex items-start justify-between gap-3">
          
          <div className="flex items-start gap-3">
            {/* Checkbox for 1-Click Batch Send */}
            <div className="pt-1">
              <input
                type="checkbox"
                id={`check-${internship.id}`}
                checked={isSelected}
                onChange={() => onToggleSelect(internship.id)}
                title="Select for 1-Click Batch Pitch"
                className="w-5 h-5 rounded-lg border-slate-300 bg-slate-100 text-slate-900 focus:ring-slate-900 cursor-pointer accent-slate-900"
              />
            </div>

            {/* Company Avatar & Role Details */}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span 
                  className="font-extrabold text-sm sm:text-base text-slate-900 hover:text-violet-600 cursor-pointer transition-colors" 
                  onClick={() => onViewCompany(internship)}
                >
                  {internship.company}
                </span>

                {/* Source Platform Badge */}
                {internship.sourcePlatform && (
                  <a
                    href={internship.sourceUrl || getCompanyLinkedinUrl(internship.company, internship.companyLinkedin)}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`Opportunity verified from ${internship.sourcePlatform}`}
                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border transition-all hover:scale-105 ${
                      internship.sourcePlatform === 'Unstop'
                        ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                        : internship.sourcePlatform === 'LinkedIn'
                        ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                        : internship.sourcePlatform === 'Naukri'
                        ? 'bg-sky-50 text-sky-800 border-sky-200 hover:bg-sky-100'
                        : internship.sourcePlatform === 'Glassdoor'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100'
                    }`}
                  >
                    <span>
                      {internship.sourcePlatform === 'Unstop' ? '🎯' : 
                       internship.sourcePlatform === 'LinkedIn' ? '💼' : 
                       internship.sourcePlatform === 'Naukri' ? '📄' : 
                       internship.sourcePlatform === 'Glassdoor' ? '⭐' : '🔍'}
                    </span>
                    <span>{internship.sourcePlatform}</span>
                    <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                  </a>
                )}

                {/* Company LinkedIn Profile */}
                <a
                  href={getCompanyLinkedinUrl(internship.company, internship.companyLinkedin)}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Verify Company on LinkedIn"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 transition-colors"
                >
                  <Linkedin className="w-3 h-3 text-blue-600" />
                  <span>Verify Company</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                </a>

                {/* Authenticity badge */}
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>{internship.trustScore}% Verified</span>
                </span>

                {/* Direct Official Apply Link */}
                <a
                  href={internship.directApplyUrl || internship.officialNotificationUrl || internship.companyWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Directly redirect to official job application submission page"
                  className="inline-flex items-center gap-1.5 text-[11px] font-black text-slate-950 bg-[#d9f99d] hover:bg-[#bef264] px-2.5 py-0.5 rounded-md border border-slate-900/20 shadow-xs hover:scale-105 transition-all"
                >
                  <ExternalLink className="w-3 h-3 text-slate-950" />
                  <span>Direct Apply ↗</span>
                </a>
              </div>

              <h3 className="text-base sm:text-lg font-black text-slate-950 mt-1">
                {internship.role}
              </h3>
            </div>
          </div>

          {/* Match Score Badge */}
          <div className="text-right shrink-0">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-[#d9f99d] text-slate-950 shadow-xs">
              <Sparkles className="w-3 h-3 text-slate-950" />
              <span>{internship.matchPercentage}% Match</span>
            </div>
            <div className="text-[10px] font-bold text-slate-400 mt-0.5">
              {matchStyle.label}
            </div>
          </div>

        </div>

        {/* Metadata Pill Grid: Work Mode, Salary, Location & Student Eligibility */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          {getWorkModeBadge(internship.workMode)}

          {/* Student Eligibility Badge */}
          {internship.isEligible ? (
            <span 
              title={internship.eligibilityCriteria}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-100/80 text-emerald-900 border border-emerald-300 shadow-2xs"
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-700" />
              <span>Eligible: {internship.eligibilityCriteria || 'Open for your year'}</span>
            </span>
          ) : (
            <span 
              title={internship.eligibilityReason}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-100/90 text-rose-900 border border-rose-300 shadow-2xs"
            >
              <AlertTriangle className="w-3 h-3 text-rose-700" />
              <span>{internship.eligibilityReason || 'Ineligible for your current year'}</span>
            </span>
          )}

          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            <span>{internship.salary}</span>
          </span>

          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <MapPin className="w-3.5 h-3.5 text-slate-500" />
            <span>HQ: {internship.companyLocation}</span>
          </span>

          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{internship.duration}</span>
          </span>
        </div>

        {/* Job Location & Office Address */}
        <div className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 flex items-start gap-2">
          <MapPin className="w-3.5 h-3.5 text-slate-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-extrabold text-slate-900">Office Location: </span>
            <span className="text-slate-600 font-medium">{internship.jobLocation}</span>
          </div>
        </div>

        {/* Match Percentage Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-bold text-slate-700">Resume Skills Compatibility</span>
            <span className="font-extrabold text-slate-900">{internship.matchPercentage}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-slate-900 transition-all duration-500"
              style={{ width: `${Math.max(5, internship.matchPercentage)}%` }}
            />
          </div>
        </div>

        {/* SKILLS BREAKDOWN: Matched vs Lacking */}
        <div className="space-y-2.5 pt-1">
          
          {/* Matched Skills */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-800 mb-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Matched Skills in Your Resume ({internship.matchedSkills.length})</span>
            </div>
            {internship.matchedSkills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {internship.matchedSkills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200"
                  >
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>{skill}</span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic font-medium">
                No direct required skills detected in your resume yet.
              </p>
            )}
          </div>

          {/* Lacking Skills */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-800 mb-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Skills You Are Lacking for this Role ({internship.lackingSkills.length})</span>
            </div>
            {internship.lackingSkills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {internship.lackingSkills.map((skill) => (
                  <span
                    key={skill}
                    title="Company requires this skill. AI will articulate your learning curiosity in your pitch!"
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    <span>{skill}</span>
                  </span>
                ))}
              </div>
            ) : (
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <span>🌟 100% Skills Complete! You fulfill all listed requirements.</span>
              </div>
            )}
          </div>

        </div>

        {/* HR Recruiter Contact Box */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1c1c1e] text-[#d9f99d] font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
              {internship.hr.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <div className="font-extrabold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
                <span>{internship.hr.name}</span>
                <span className="text-[10px] font-semibold text-slate-500">• {internship.hr.title}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-600 mt-0.5 flex-wrap">
                <a
                  href={`mailto:${internship.hr.email}`}
                  className="inline-flex items-center gap-1 text-slate-900 hover:text-black font-extrabold"
                >
                  <Mail className="w-3 h-3 text-slate-500" />
                  <span>{internship.hr.email}</span>
                </a>

                {/* Direct HR LinkedIn Profile link */}
                <a
                  href={getHrLinkedinUrl(internship.hr.name, internship.company, internship.hr.linkedin)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-extrabold"
                >
                  <Linkedin className="w-3 h-3 text-blue-600" />
                  <span>HR LinkedIn</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                </a>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onPreviewPitch(internship)}
            className="text-xs font-extrabold text-slate-900 hover:bg-slate-200 bg-slate-200/80 px-3 py-1.5 rounded-xl transition-colors self-start sm:self-auto shrink-0 flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3 text-slate-900" />
            <span>AI Pitch Draft</span>
          </button>

        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-slate-200">
          
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => onViewCompany(internship)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 py-1 px-2 rounded-lg hover:bg-slate-100 transition-colors flex items-center justify-center sm:justify-start gap-1"
            >
              <Info className="w-3.5 h-3.5 text-slate-400" />
              <span>Perks & Details</span>
            </button>

            {/* Platform Direct Listing Link Button */}
            {internship.sourcePlatform && internship.sourceUrl && (
              <a
                href={internship.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                title={`Open official listing on ${internship.sourcePlatform}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 shadow-2xs hover:scale-105 transition-all"
              >
                <ExternalLink className="w-3 h-3 text-slate-600" />
                <span>Apply on {internship.sourcePlatform} ↗</span>
              </a>
            )}

            {/* Direct Official Apply Link Button */}
            <a
              href={internship.directApplyUrl || internship.officialNotificationUrl || `${internship.companyWebsite}/careers`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-[#1c1c1e] hover:bg-black text-[#d9f99d] shadow-sm hover:scale-105 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#d9f99d]" />
              <span>Official Apply Link ↗</span>
            </a>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onDirectApply(internship)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 ${
                hasApplied
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
              }`}
            >
              {hasApplied ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Pitch Sent (Tracking)</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 text-slate-700" />
                  <span>AI Recruiter Pitch</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
