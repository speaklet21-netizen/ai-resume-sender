import React from 'react';
import { 
  X, 
  Building2, 
  Linkedin, 
  ExternalLink, 
  MapPin, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Gift, 
  Send
} from 'lucide-react';
import { MatchedInternship } from '../types.ts';
import { getCompanyLinkedinUrl, getHrLinkedinUrl } from '../utils/linkedin.ts';

interface CompanyDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  internship: MatchedInternship | null;
  onApply: (internship: MatchedInternship) => void;
  hasApplied: boolean;
}

export const CompanyDetailModal: React.FC<CompanyDetailModalProps> = ({
  isOpen,
  onClose,
  internship,
  onApply,
  hasApplied,
}) => {
  if (!isOpen || !internship) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#120a28] rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-violet-500/30 overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-black text-xl flex items-center justify-center shrink-0 shadow-lg shadow-violet-600/30 ring-1 ring-violet-400/30">
              {internship.company.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-extrabold text-white">
                  {internship.company}
                </h2>

                {/* Company LinkedIn Profile link for authenticity */}
                <a
                  href={getCompanyLinkedinUrl(internship.company, internship.companyLinkedin)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-400 hover:text-blue-300 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20 transition-colors"
                >
                  <Linkedin className="w-3.5 h-3.5 text-blue-400" />
                  <span>Check on LinkedIn</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                {/* Direct Official Apply Link */}
                <a
                  href={internship.directApplyUrl || internship.officialNotificationUrl || internship.companyWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-black text-black bg-[#d9f99d] hover:bg-[#bef264] px-3 py-1 rounded-lg border border-slate-900/20 shadow-sm transition-all hover:scale-105"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-black" />
                  <span>Direct Apply to Official Posting ↗</span>
                </a>

                {/* Authenticity Trust Score */}
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{internship.trustScore}% Verified Employer</span>
                </span>
              </div>

              <p className="text-sm font-bold text-violet-400 mt-1">
                {internship.role}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {internship.companyDescription}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs sm:text-sm">
          
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Work Mode
              </span>
              <span className="text-sm font-bold text-white mt-0.5 block capitalize">
                {internship.workMode === 'remote' ? '🌐 100% Remote' : internship.workMode === 'hybrid' ? '🔄 Hybrid' : '🏢 Onsite'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Stipend / Salary
              </span>
              <span className="text-sm font-bold text-emerald-400 mt-0.5 block">
                {internship.salary}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Company HQ
              </span>
              <span className="text-sm font-bold text-white mt-0.5 block truncate" title={internship.companyLocation}>
                {internship.companyLocation}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-violet-950/40 border border-violet-800/40">
              <span className="text-[11px] font-bold text-violet-300 uppercase tracking-wider block">
                Resume Match
              </span>
              <span className="text-sm font-extrabold text-white mt-0.5 block">
                {internship.matchPercentage}% Compatibility
              </span>
            </div>
          </div>

          {/* Detailed Locations */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="font-bold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-violet-400" />
              <span>Location & Workplace Verification</span>
            </div>
            <div className="text-xs text-slate-300 grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <div>
                <span className="font-semibold text-slate-200">Company Registered HQ: </span>
                <span className="text-slate-400">{internship.companyLocation}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-200">Job Location / Physical Office: </span>
                <span className="text-slate-400">{internship.jobLocation}</span>
              </div>
            </div>
          </div>

          {/* Authenticity & Verification Section */}
          <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-2">
            <div className="font-bold text-emerald-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Employer Authenticity & Credential Verification</span>
            </div>
            <p className="text-xs text-emerald-200/90">
              {internship.verificationBadge}. The HR recruiter contact ({internship.hr.email}) operates on the company's authenticated domain.
            </p>
            <div className="flex items-center gap-3 pt-1 flex-wrap">
              <a
                href={getCompanyLinkedinUrl(internship.company, internship.companyLinkedin)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 bg-blue-500/10 px-3 py-1.5 rounded-xl border border-blue-500/20"
              >
                <Linkedin className="w-3.5 h-3.5" />
                <span>Visit Company LinkedIn Profile</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <a
                href={internship.companyWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700"
              >
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Official Website</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Direct HR Recruiter Contact Box */}
          <div className="p-4 rounded-2xl bg-[#120a28]/80 border border-violet-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-violet-600 text-white font-bold text-base flex items-center justify-center shrink-0">
                {internship.hr.name.slice(0, 2)}
              </div>
              <div>
                <div className="font-bold text-white text-sm">{internship.hr.name}</div>
                <div className="text-xs text-slate-400">{internship.hr.title}</div>
                <div className="flex items-center gap-2 mt-1">
                  <a href={`mailto:${internship.hr.email}`} className="text-xs font-bold text-violet-400 hover:underline">
                    {internship.hr.email}
                  </a>
                </div>
              </div>
            </div>

            <a
              href={getHrLinkedinUrl(internship.hr.name, internship.company, internship.hr.linkedin)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 px-3.5 py-2 rounded-xl border border-blue-500/20 self-start sm:self-auto"
            >
              <Linkedin className="w-3.5 h-3.5" />
              <span>Verify Recruiter Profile</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Skill Alignment & Missing Qualifications */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-white text-sm">
              Skills Alignment & Qualifications
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Matched */}
              <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30">
                <div className="font-bold text-emerald-300 text-xs flex items-center gap-1.5 mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Matched from your resume ({internship.matchedSkills.length})</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {internship.matchedSkills.map((s) => (
                    <span key={s} className="px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      ✓ {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Lacking */}
              <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/30">
                <div className="font-bold text-amber-300 text-xs flex items-center gap-1.5 mb-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Skills this role requires ({internship.lackingSkills.length})</span>
                </div>
                {internship.lackingSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {internship.lackingSkills.map((s) => (
                      <span key={s} className="px-2 py-0.5 rounded-md text-xs font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        • {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-emerald-400 font-semibold">
                    You fulfill all required skills!
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Perks & Benefits */}
          <div>
            <h4 className="font-extrabold text-white text-sm mb-2 flex items-center gap-1.5">
              <Gift className="w-4 h-4 text-purple-400" />
              <span>Internship Perks & Mentorship</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {internship.perks.map((perk, i) => (
                <div key={i} className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>{perk}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-[#0a051b] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Close
            </button>

            <a
              href={internship.directApplyUrl || internship.officialNotificationUrl || `${internship.companyWebsite}/careers`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl text-xs font-extrabold bg-[#d9f99d] text-slate-950 hover:bg-[#bef264] transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Official Apply Link ↗</span>
            </a>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              onApply(internship);
            }}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>{hasApplied ? 'View in Application Tracker' : 'AI Pitch / Email HR'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
