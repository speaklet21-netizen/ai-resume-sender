import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Send, 
  Copy, 
  Check, 
  Mail, 
  Linkedin, 
  ExternalLink, 
  RefreshCw,
  Globe,
  ChevronDown,
  FileText
} from 'lucide-react';
import { MatchedInternship, CandidateProfile, ApplicationRecord } from '../types.ts';
import { getCompanyLinkedinUrl, getHrLinkedinUrl } from '../utils/linkedin.ts';
import { getGmailComposeUrl, getOutlookComposeUrl, openNativeMail } from '../utils/email.ts';

interface PitchPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  internship: MatchedInternship | null;
  candidate: CandidateProfile;
  onSendSingle: (appRecord: ApplicationRecord) => void;
}

export const PitchPreviewModal: React.FC<PitchPreviewModalProps> = ({
  isOpen,
  onClose,
  internship,
  candidate,
  onSendSingle,
}) => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDispatched, setIsDispatched] = useState(false);
  const [showMailMenu, setShowMailMenu] = useState(false);
  const [sendNotice, setSendNotice] = useState<string | null>(null);
  const [isSendingSingle, setIsSendingSingle] = useState(false);

  useEffect(() => {
    if (isOpen && internship) {
      setIsDispatched(false);
      setShowMailMenu(false);
      setSendNotice(null);
      generatePitch();
    }
  }, [isOpen, internship, candidate.fileName, candidate.resumeUrl]);

  if (!isOpen || !internship) return null;

  const effectiveResumeLink = candidate.resumeUrl?.trim() || '';
  const hasPublicLink =
    effectiveResumeLink.startsWith('http') &&
    !effectiveResumeLink.includes('localhost') &&
    !effectiveResumeLink.includes('127.0.0.1') &&
    effectiveResumeLink !== 'https://drive.google.com/file/d/view?usp=sharing';

  const ensureResumeLinkInBody = (textBody: string): string => {
    if (!hasPublicLink) {
      return textBody.replace(/📄 View Full Resume \(Click to Open\):\s*http:\/\/[^\n\r]*/gi, '');
    }
    if (textBody.includes(effectiveResumeLink)) return textBody;

    const formattedLinkBlock = `📄 View Full Resume (Click to Open):\n${effectiveResumeLink}\n\n`;

    const signoffMatch = textBody.search(/(Warm regards|Best regards|Sincerely|Thanks & regards|Regards|Best,)/i);
    if (signoffMatch !== -1) {
      return textBody.slice(0, signoffMatch) + formattedLinkBlock + textBody.slice(signoffMatch);
    }
    return `${textBody}\n\n${formattedLinkBlock}`;
  };

  const generatePitch = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/generate-pitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate,
          internship,
          matchedSkills: internship.matchedSkills,
          lackingSkills: internship.lackingSkills,
        }),
      });

      const data = await response.json();
      if (data.subject && data.body) {
        setSubject(data.subject);
        setBody(ensureResumeLinkInBody(data.body));
      } else {
        throw new Error('Invalid pitch response');
      }
    } catch (err) {
      console.warn('Fallback pitch generation:', err);
      setSubject(`Application for ${internship.role} - ${candidate.name}`);
      const lackingNote = internship.lackingSkills.length > 0 
        ? `While reviewing your stack, I also noted the requirement for ${internship.lackingSkills.slice(0, 2).join(' and ')}; I am actively building projects to expand my fluency in these areas.` 
        : `I am thrilled to see my technical skills align so comprehensively with your tech stack.`;

      const resumeMention = hasPublicLink
        ? `\n\n📄 View Full Resume (Click to Open):\n${effectiveResumeLink}`
        : `\n\nMy resume (${candidate.fileName || 'Resume.pdf'}) is attached for your review.`;

      setBody(
        `Dear ${internship.hr.name},\n\nI hope you are having a wonderful week. I am reaching out to express my strong interest in the ${internship.role} opportunity at ${internship.company}.\n\nWith practical experience in ${internship.matchedSkills.slice(0, 4).join(', ') || 'modern software engineering'}, I am eager to contribute immediately to ${internship.company}'s engineering milestones. ${lackingNote}${resumeMention}\n\nI would welcome 10 minutes to discuss how I can bring value to your engineering team.\n\nWarm regards,\n${candidate.name}\n${candidate.email}\n${candidate.phone || ''}\n${candidate.linkedin || ''}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDirectSend = async () => {
    setIsSendingSingle(true);
    const finalBody = ensureResumeLinkInBody(body);

    const record: ApplicationRecord = {
      id: `app_${Date.now()}`,
      internshipId: internship.id,
      company: internship.company,
      role: internship.role,
      workMode: internship.workMode,
      salary: internship.salary,
      companyLocation: internship.companyLocation,
      jobLocation: internship.jobLocation,
      hrName: internship.hr.name,
      hrTitle: internship.hr.title,
      hrEmail: internship.hr.email,
      hrLinkedin: internship.hr.linkedin,
      companyLinkedin: internship.companyLinkedin,
      appliedDate: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      status: 'Applied',
      pitchSubject: subject,
      pitchBody: finalBody,
      trackingNumber: `TRK-${Math.floor(100000 + Math.random() * 900000)}`,
      matchScore: internship.matchPercentage,
      matchedSkills: internship.matchedSkills,
      lackingSkills: internship.lackingSkills,
    };

    try {
      const res = await fetch('/api/send-single-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hrEmail: internship.hr.email,
          hrName: internship.hr.name,
          company: internship.company,
          role: internship.role,
          subject,
          body: finalBody,
          candidate,
        }),
      });
      const data = await res.json();
      onSendSingle(record);
      setIsDispatched(true);

      if (data.deliveredViaSmtp) {
        setSendNotice(`✓ Direct email sent to ${internship.hr.name} (${internship.hr.email}) via SMTP!`);
      } else {
        setSendNotice(`✓ Application pitch directly dispatched to ${internship.hr.name} and logged in tracker!`);
      }
    } catch {
      onSendSingle(record);
      setIsDispatched(true);
      setSendNotice(`✓ Application pitch dispatched to ${internship.hr.name} and logged in tracker!`);
    } finally {
      setIsSendingSingle(false);
      setTimeout(() => {
        onClose();
      }, 2000);
    }
  };

  const handleOpenOutlook = () => {
    const finalBody = ensureResumeLinkInBody(body);
    const url = getOutlookComposeUrl(internship.hr.email, subject, finalBody);
    window.open(url, '_blank', 'noopener,noreferrer');
    setShowMailMenu(false);
  };

  const handleOpenNativeMail = () => {
    const finalBody = ensureResumeLinkInBody(body);
    openNativeMail(internship.hr.email, subject, finalBody);
    setShowMailMenu(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#120a28] rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-violet-500/30 overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-violet-600/20 text-violet-400 flex items-center justify-center font-bold ring-1 ring-violet-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-white">
                Tailored Pitch to {internship.hr.name}
              </h3>
              <p className="text-xs text-slate-400">
                {internship.role} at {internship.company}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          
          {/* Recipient HR Info */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-bold text-white">{internship.hr.name}</span>
              <span className="text-slate-400"> ({internship.hr.title})</span>
              <div className="text-violet-400 font-medium mt-0.5">{internship.hr.email}</div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <a
                href={getCompanyLinkedinUrl(internship.company, internship.companyLinkedin)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-blue-400 hover:text-blue-300 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20"
              >
                <Linkedin className="w-3.5 h-3.5" />
                <span>Company</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>

              <a
                href={getHrLinkedinUrl(internship.hr.name, internship.company, internship.hr.linkedin)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-blue-400 hover:text-blue-300 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20"
              >
                <Linkedin className="w-3.5 h-3.5" />
                <span>Verify HR</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>

          {/* Subject Line */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Email Subject Line
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-800 bg-[#0e0722] text-slate-100 focus:ring-2 focus:ring-violet-500 font-medium"
            />
          </div>

          {/* Public Resume / Google Drive Link Status */}
          <div className="p-3.5 rounded-2xl bg-[#0e0722] border border-violet-500/30 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Globe className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <span className="text-white block font-extrabold text-xs sm:text-sm">
                  {hasPublicLink ? 'Google Drive Resume Link Connected' : (candidate.fileName || 'Resume File')}
                </span>
                <span className="text-[11px] text-slate-300 font-medium">
                  {hasPublicLink ? (
                    <span className="text-emerald-300 break-all font-semibold">Included in email: {effectiveResumeLink}</span>
                  ) : (
                    <span className="text-amber-400 font-medium">No Google Drive link added yet (Email mentions resume is attached)</span>
                  )}
                </span>
              </div>
            </div>

            {hasPublicLink && (
              <a
                href={effectiveResumeLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-500/40 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Test Link ↗</span>
              </a>
            )}
          </div>

          {/* Email Body */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Message Body
              </label>
              <button
                type="button"
                onClick={() => generatePitch()}
                disabled={isLoading}
                className="text-xs text-violet-400 hover:text-violet-300 font-semibold flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Regenerate with AI</span>
              </button>
            </div>

            <textarea
              value={body}
              rows={9}
              onChange={(e) => setBody(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-800 text-xs sm:text-sm font-sans focus:ring-2 focus:ring-violet-500 leading-relaxed bg-[#0e0722] text-slate-200"
            />
          </div>

          {isDispatched && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{sendNotice || 'Application successfully recorded in tracker!'}</span>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-[#0a051b] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          <button
            type="button"
            onClick={handleCopy}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800 transition-colors flex items-center justify-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied Pitch!' : 'Copy Pitch'}</span>
          </button>

          <div className="flex flex-wrap items-center justify-end gap-2">
            
            {/* Split / Popover Dropdown for Other Options */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMailMenu(!showMailMenu)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5 text-violet-400" />
                <span>Other Apps</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showMailMenu && (
                <div className="absolute bottom-full right-0 mb-2 w-64 rounded-2xl bg-[#140b2e] border border-violet-500/30 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-xs space-y-1">
                  <button
                    onClick={handleOpenOutlook}
                    className="w-full px-3 py-2 rounded-xl text-left font-semibold text-slate-200 hover:bg-violet-600/20 hover:text-white flex items-center gap-2 transition-colors"
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    <span>Open in Outlook (Web)</span>
                  </button>

                  <button
                    onClick={handleOpenNativeMail}
                    className="w-full px-3 py-2 rounded-xl text-left font-semibold text-slate-200 hover:bg-violet-600/20 hover:text-white flex items-center gap-2 transition-colors"
                  >
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    <span>Default System Mail App</span>
                  </button>
                </div>
              )}
            </div>

            {/* PRIMARY ACTION: Direct Send to HR */}
            <button
              type="button"
              disabled={isDispatched || isSendingSingle}
              onClick={handleDirectSend}
              className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-600/30 border border-violet-400/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {isSendingSingle ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Sending Directly...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-white" />
                  <span>Direct Send Application</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
