import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileText, 
  Sparkles, 
  CheckCircle, 
  AlertCircle, 
  User, 
  Mail, 
  Phone, 
  Linkedin, 
  Globe, 
  ArrowRight,
  FileCheck,
  ExternalLink
} from 'lucide-react';
import { CandidateProfile, UserAccount } from '../types.ts';
import { extractTextFromPDF } from '../utils/pdfParser.ts';

interface ResumeUploaderProps {
  onAnalyze: (resumeText: string, profile: Partial<CandidateProfile>, fileName?: string) => Promise<void>;
  isLoading: boolean;
  currentProfile: CandidateProfile | null;
  currentUser?: UserAccount | null;
}

export const ResumeUploader: React.FC<ResumeUploaderProps> = ({
  onAnalyze,
  isLoading,
  currentProfile,
  currentUser,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState(currentProfile?.rawResumeText || '');
  const [useTextMode, setUseTextMode] = useState(false);
  const [parsingError, setParsingError] = useState<string | null>(null);
  const [originalFileUrl, setOriginalFileUrl] = useState<string | null>(null);
  const [resumeBase64, setResumeBase64] = useState<string>(currentProfile?.resumeFileData || '');
  const [downloadUrl, setDownloadUrl] = useState<string>(currentProfile?.downloadUrl || '');

  // Candidate contact details - empty by default unless there is an active currentProfile
  const [name, setName] = useState(currentProfile?.name || '');
  const [email, setEmail] = useState(currentProfile?.email || '');
  const [phone, setPhone] = useState(currentProfile?.phone || '');
  const [linkedin, setLinkedin] = useState(currentProfile?.linkedin || '');
  const [portfolio, setPortfolio] = useState(currentProfile?.portfolio || '');
  const [resumeUrl, setResumeUrl] = useState(
    currentProfile?.resumeUrl && !currentProfile.resumeUrl.includes('localhost') && !currentProfile.resumeUrl.includes('127.0.0.1')
      ? currentProfile.resumeUrl
      : ''
  );

  // Synchronize or reset all candidate form fields when currentProfile changes or is removed
  React.useEffect(() => {
    if (!currentProfile) {
      setName('');
      setEmail('');
      setPhone('');
      setLinkedin('');
      setPortfolio('');
      setResumeUrl('');
      setSelectedFile(null);
      setResumeText('');
      setOriginalFileUrl(null);
      setResumeBase64('');
      setDownloadUrl('');
      setParsingError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } else {
      setName(currentProfile.name || '');
      setEmail(currentProfile.email || '');
      setPhone(currentProfile.phone || '');
      setLinkedin(currentProfile.linkedin || '');
      setPortfolio(currentProfile.portfolio || '');
      setResumeUrl(
        currentProfile.resumeUrl && !currentProfile.resumeUrl.includes('localhost') && !currentProfile.resumeUrl.includes('127.0.0.1')
          ? currentProfile.resumeUrl
          : ''
      );
      setResumeText(currentProfile.rawResumeText || '');
      setResumeBase64(currentProfile.resumeFileData || '');
      setDownloadUrl(currentProfile.downloadUrl || '');
    }
  }, [currentProfile]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setParsingError(null);
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setParsingError('Please select a valid PDF file.');
      return;
    }

    if (file.size > 12 * 1024 * 1024) {
      setParsingError('File exceeds 12MB limit.');
      return;
    }

    setSelectedFile(file);
    try {
      const blobUrl = URL.createObjectURL(file);
      setOriginalFileUrl(blobUrl);

      // Read as persistent Base64 Data URL and upload to server storage
      const reader = new FileReader();
      reader.onload = async () => {
        if (reader.result && typeof reader.result === 'string') {
          const b64 = reader.result;
          setResumeBase64(b64);

          try {
            const upRes = await fetch('/api/upload-resume-file', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                filename: file.name,
                fileData: b64,
                mimeType: file.type || 'application/pdf',
                resumeText: extracted,
                candidateName: name || 'Candidate',
                candidateEmail: email || '',
              }),
            });
            const upData = await upRes.json();
            if (upData.success && upData.downloadUrl) {
              setDownloadUrl(upData.downloadUrl);
            }
          } catch (e) {
            console.warn('Auto upload error:', e);
          }
        }
      };
      reader.readAsDataURL(file);

      const extracted = await extractTextFromPDF(file);
      setResumeText(extracted);
      
      // Auto-extract candidate email if available and not yet set
      const emailMatch = extracted.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch && !email) {
        setEmail(emailMatch[0]);
      }

      // Auto-extract candidate name from first line if blank
      if (!name) {
        const firstLine = extracted.split('\n')[0]?.trim();
        if (firstLine && firstLine.length < 35 && !firstLine.includes('@')) {
          setName(firstLine);
        }
      }
    } catch (err: any) {
      console.warn('PDF parsing issue:', err);
      setParsingError(err.message || 'Could not parse PDF. You can paste the resume text directly.');
      setUseTextMode(true);
    }
  };

  const handleOpenOriginalResume = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (
      resumeUrl &&
      resumeUrl.startsWith('http') &&
      !resumeUrl.includes('localhost') &&
      !resumeUrl.includes('127.0.0.1')
    ) {
      window.open(resumeUrl, '_blank');
      return;
    }
    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
      return;
    }
    if (resumeBase64 && resumeBase64.includes('base64,')) {
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(`
          <!DOCTYPE html>
          <html>
            <head><title>${name || 'Candidate'} - Resume Preview</title><style>body,html{margin:0;padding:0;height:100%;overflow:hidden;background:#525659;}</style></head>
            <body><embed width="100%" height="100%" src="${resumeBase64}" type="application/pdf" /></body>
          </html>
        `);
        win.document.close();
        return;
      }
    }
    if (selectedFile) {
      const u = URL.createObjectURL(selectedFile);
      window.open(u, '_blank');
      return;
    }
    if (resumeText) {
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(`
          <!DOCTYPE html>
          <html>
            <head><title>${name || 'Candidate'} - Resume</title></head>
            <body style="font-family:system-ui,-apple-system,sans-serif; background:#f8fafc; padding:30px; color:#0f172a;">
              <div style="max-width:750px; margin:0 auto; background:white; padding:35px; border-radius:12px; box-shadow:0 4px 15px rgba(0,0,0,0.06);">
                <h1 style="margin:0 0 6px 0; color:#0f172a;">${name || 'Candidate'}</h1>
                <p style="color:#64748b; font-size:14px; margin-bottom:15px;">📧 ${email}</p>
                <pre style="white-space:pre-wrap; font-family:inherit; background:#f1f5f9; padding:20px; border-radius:8px; font-size:13px; line-height:1.6; color:#1e293b;">${resumeText}</pre>
              </div>
            </body>
          </html>
        `);
        win.document.close();
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setParsingError(null);

    if (!resumeText.trim()) {
      setParsingError('Please upload your resume PDF or paste your resume text to begin.');
      return;
    }

    if (!email || !email.includes('@')) {
      setParsingError('Please enter a valid candidate email where HR recruiters can respond.');
      return;
    }

    const cleanUrl = resumeUrl.trim();
    const finalResumeUrl =
      cleanUrl.startsWith('http') &&
      !cleanUrl.includes('localhost') &&
      !cleanUrl.includes('127.0.0.1') &&
      cleanUrl !== 'https://drive.google.com/file/d/view?usp=sharing'
        ? cleanUrl
        : '';

    onAnalyze(
      resumeText,
      {
        name: name.trim() || 'Candidate',
        email: email.trim(),
        phone: phone.trim(),
        linkedin: linkedin.trim(),
        portfolio: portfolio.trim(),
        resumeUrl: finalResumeUrl,
        downloadUrl: downloadUrl,
        resumeFileData: resumeBase64,
      },
      selectedFile?.name || currentProfile?.fileName || 'Resume.pdf'
    );
  };

  return (
    <div className="relative rounded-3xl p-7 sm:p-10 border border-slate-200/80 bg-white shadow-sm space-y-8 text-slate-900">
      
      {/* Hero Title Section */}
      <div className="relative z-10 text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#d9f99d]/50 border border-slate-200 text-slate-900 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-slate-900" />
          <span>AI Resume Analysis & Direct HR Match</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          Find Matching Internships & Connect Directly with HRs
        </h1>

        <p className="text-sm sm:text-base text-slate-500 leading-relaxed max-w-xl mx-auto font-medium">
          Upload your resume to extract all your detected skills, view matched company openings, and send tailored applications in 1-click.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
        
        {/* PDF Dropzone */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Upload Your Resume <span className="text-slate-900">*</span>
            </label>
            <button
              type="button"
              onClick={() => setUseTextMode(!useTextMode)}
              className="text-xs text-slate-900 hover:text-black font-extrabold underline transition-colors"
            >
              {useTextMode ? 'Switch to PDF Upload' : 'Or paste resume text directly'}
            </button>
          </div>

          {!useTextMode ? (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-10 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-slate-900 bg-slate-100 scale-[0.99] shadow-sm'
                  : selectedFile
                  ? 'border-emerald-500 bg-emerald-50/50'
                  : 'border-slate-300 bg-slate-50/80 hover:bg-slate-100/60 hover:border-slate-400'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFile(e.target.files[0]);
                }}
              />

              <div className="flex flex-col items-center justify-center gap-3.5">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${
                  selectedFile 
                    ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300' 
                    : 'bg-[#1c1c1e] text-[#d9f99d]'
                }`}>
                  {selectedFile ? <FileCheck className="w-8 h-8" /> : <UploadCloud className="w-8 h-8" />}
                </div>

                {selectedFile ? (
                  <div>
                    <p className="font-extrabold text-slate-900 text-base sm:text-lg">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-emerald-700 font-bold mt-1">
                      ✓ Ready for AI Skill Extraction ({Math.round(selectedFile.size / 1024)} KB)
                    </p>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      Click to choose a different PDF
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="font-bold text-slate-900 text-sm sm:text-base">
                      Drag & drop your resume PDF here, or <span className="text-slate-950 font-black underline">browse files</span>
                    </p>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      Supports PDF up to 12MB. Text is parsed safely in your browser.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste the text of your resume here (education, skills, projects, experience)..."
                rows={7}
                className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-xs sm:text-sm font-mono focus:ring-2 focus:ring-slate-900 focus:border-slate-900 bg-slate-50 text-slate-900 placeholder:text-slate-400"
              />
              <p className="text-xs text-slate-500 font-medium mt-1">
                {resumeText ? `${resumeText.split(/\s+/).length} words ready for skill extraction` : 'Paste text from Word, Google Docs, or LinkedIn profile.'}
              </p>
            </div>
          )}
        </div>

        {/* Candidate Profile Fields (Dispatched to HR) */}
        <div className="pt-4 border-t border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-900" />
              Candidate Profile (Dispatched to HR along with your resume)
            </h3>
            <span className="text-[11px] text-slate-500 font-medium">Edit as needed</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-extrabold text-slate-800 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Lucas Bennett"
                  className="w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900 focus:bg-white font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-800 mb-1">
                Your Email (HRs will reply here) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. bennet02@gmail.com"
                  className="w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900 focus:bg-white font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-800 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +1 (555) 019-2831"
                  className="w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900 focus:bg-white font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-800 mb-1">
                Candidate LinkedIn URL
              </label>
              <div className="relative">
                <Linkedin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="url"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900 focus:bg-white font-medium"
                />
              </div>
            </div>

            {/* Public Resume Link (Google Drive / Cloud Host) */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-extrabold text-slate-800">
                  Public Resume Link (Google Drive / OneDrive / Dropbox)
                </label>
                <div className="flex items-center gap-2">
                  {resumeUrl &&
                    resumeUrl.startsWith('http') &&
                    !resumeUrl.includes('localhost') &&
                    !resumeUrl.includes('127.0.0.1') && (
                      <a
                        href={resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-blue-700 hover:text-blue-900 font-extrabold bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 flex items-center gap-1 hover:underline shadow-xs"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Test Link ↗</span>
                      </a>
                    )}
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Direct Link Included in Email Pitch
                  </span>
                </div>
              </div>
              <div className="relative">
                <Globe className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="url"
                  value={resumeUrl}
                  onChange={(e) => setResumeUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/YOUR_FILE_ID/view?usp=sharing"
                  className="w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900 focus:bg-white font-medium"
                />
              </div>
              {resumeUrl && (resumeUrl.includes('localhost') || resumeUrl.includes('127.0.0.1')) && (
                <p className="text-[11px] text-red-600 font-bold mt-1">
                  ⚠️ Localhost links cannot be accessed by recruiters. Please paste your public Google Drive, OneDrive, or Dropbox link.
                </p>
              )}
              <p className="text-[11px] text-slate-500 font-medium mt-1">
                Recruiters clicking this link in the email body will immediately open your resume in Google Drive without needing file attachments.
              </p>
            </div>

            {/* 1-Click Access: Open Original Uploaded Resume (Only visible when file/profile exists) */}
            {(selectedFile || currentProfile) && (
              <div className="sm:col-span-2 p-4 bg-emerald-50/70 border border-emerald-200/90 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200">
                    <FileText className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-900">
                      {selectedFile?.name || (currentProfile?.fileName || 'Uploaded Resume File')}
                    </div>
                    <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Original resume verified & attached for applications</span>
                    </div>
                  </div>
                </div>

                {(selectedFile || originalFileUrl || resumeText) && (
                  <button
                    type="button"
                    onClick={handleOpenOriginalResume}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer hover:scale-105 shrink-0"
                    title="Click to open and view the original resume file directly"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Open Original Resume ↗</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Parsing Error notification */}
        {parsingError && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{parsingError}</span>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex flex-col sm:flex-row items-center gap-4 justify-between pt-2">
          <div className="text-xs text-slate-500 flex items-center gap-2 font-medium">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Direct contact with HR corporate domains & LinkedIn profiles</span>
          </div>

          <button
            type="submit"
            disabled={isLoading || !resumeText.trim()}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#1c1c1e] hover:bg-black text-white font-black text-sm shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2.5"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Analyzing Skills with AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-[#d9f99d]" />
                <span>Analyze Resume & Match Openings</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};
