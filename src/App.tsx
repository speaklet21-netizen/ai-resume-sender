/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Sparkles, 
  Send, 
  CheckCircle2, 
  Building2, 
  Briefcase, 
  FileText,
  Filter,
  Globe,
  Mail,
  Phone,
  KeyRound,
  UserCheck
} from 'lucide-react';
import { Navbar } from './components/Navbar.tsx';
import { ResumeUploader } from './components/ResumeUploader.tsx';
import { SkillAnalysisView } from './components/SkillAnalysisView.tsx';
import { InternshipFilter } from './components/InternshipFilter.tsx';
import { InternshipCard } from './components/InternshipCard.tsx';
import { BatchSendModal } from './components/BatchSendModal.tsx';
import { PitchPreviewModal } from './components/PitchPreviewModal.tsx';
import { CompanyDetailModal } from './components/CompanyDetailModal.tsx';
import { ApplicationTrackerView } from './components/ApplicationTrackerView.tsx';
import { SimilarJobsView } from './components/SimilarJobsView.tsx';
import { INITIAL_INTERNSHIPS } from './data/internships.ts';
import { AuthModal } from './components/AuthModal.tsx';
import { 
  CandidateProfile, 
  MatchedInternship, 
  ApplicationRecord, 
  ApplicationStatus, 
  WorkMode, 
  RoleCategory,
  UserAccount 
} from './types.ts';
import { extractSkillsLocally, matchInternship, extractEligibilityFromResume } from './utils/skillMatcher.ts';

const STORAGE_KEY_AUTH_USER = 'internmatch_auth_user_v3';

// Account-isolated storage key helpers
const getAppStorageKey = (email?: string) => 
  `internmatch_applications_v3_${(email || 'default').toLowerCase().trim()}`;

const getCandidateStorageKey = (email?: string) => 
  `internmatch_candidate_v3_${(email || 'default').toLowerCase().trim()}`;

// Migrate legacy application records to iamsumit.rawat07@gmail.com once so they don't pollute sumitrawat.corp@gmail.com
try {
  const legacyApps = localStorage.getItem('internmatch_applications_v2');
  if (legacyApps) {
    const parsed: ApplicationRecord[] = JSON.parse(legacyApps);
    if (parsed.length > 0) {
      const targetKey = getAppStorageKey('iamsumit.rawat07@gmail.com');
      if (!localStorage.getItem(targetKey)) {
        localStorage.setItem(targetKey, JSON.stringify(parsed));
      }
    }
    localStorage.removeItem('internmatch_applications_v2');
  }
} catch {}

// Helper to sanitize candidate data loaded from localStorage or props
const sanitizeCandidate = (cand: CandidateProfile | null): CandidateProfile | null => {
  if (!cand) return null;
  if (
    cand.resumeUrl &&
    (cand.resumeUrl.includes('localhost') ||
      cand.resumeUrl.includes('127.0.0.1') ||
      cand.resumeUrl.includes('/file/d/view?usp=sharing'))
  ) {
    return { ...cand, resumeUrl: '' };
  }
  return cand;
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'match' | 'tracker' | 'similar-jobs'>('match');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [uploaderKey, setUploaderKey] = useState(0);
  const [isConnectingGmail, setIsConnectingGmail] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string>('');

  // Active User Account session (defaults to sumitrawat.corp@gmail.com or saved user)
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_AUTH_USER);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      email: 'sumitrawat.corp@gmail.com',
      name: 'Sumit Rawat',
      authMethod: 'otp',
      avatarBg: 'bg-emerald-600',
      createdAt: new Date().toISOString(),
    };
  });

  const loadedEmailRef = useRef<string | null>(currentUser?.email || null);
  const isInitialLoadDoneRef = useRef<boolean>(false);
  const lastSavedPayloadRef = useRef<string>('');
  const isSyncingResumeFileRef = useRef<boolean>(false);
  
  // Stored Applications - strictly isolated per logged-in user email
  const [applications, setApplications] = useState<ApplicationRecord[]>(() => {
    try {
      const initialKey = getAppStorageKey(currentUser?.email);
      const saved = localStorage.getItem(initialKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Candidate Profile - strictly isolated per logged-in user email
  const [candidate, setCandidate] = useState<CandidateProfile | null>(() => {
    try {
      const initialKey = getCandidateStorageKey(currentUser?.email);
      const saved = localStorage.getItem(initialKey);
      if (saved) return sanitizeCandidate(JSON.parse(saved));
    } catch {}
    return null;
  });

  // Ensure active candidate profile has functioning server-side download endpoint for internal preview
  useEffect(() => {
    if (candidate && !candidate.downloadUrl && (candidate.resumeFileData || candidate.rawResumeText) && !isSyncingResumeFileRef.current) {
      isSyncingResumeFileRef.current = true;
      fetch('/api/upload-resume-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: candidate.fileName || 'Resume.pdf',
          fileData: candidate.resumeFileData || '',
          mimeType: 'application/pdf',
          resumeText: candidate.rawResumeText || '',
          candidateName: candidate.name || 'Candidate',
          candidateEmail: candidate.email || '',
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.downloadUrl) {
            setCandidate((prev) =>
              prev
                ? {
                    ...prev,
                    downloadUrl: data.downloadUrl,
                  }
                : null
            );
          }
        })
        .catch((err) => console.warn('Resume sync warning:', err))
        .finally(() => {
          isSyncingResumeFileRef.current = false;
        });
    }
  }, [candidate?.fileName, candidate?.rawResumeText]);

  // Synchronize active account data from server persistence on startup or account switch
  useEffect(() => {
    if (currentUser?.email) {
      isInitialLoadDoneRef.current = false;
      loadedEmailRef.current = currentUser.email;
      const userAppKey = getAppStorageKey(currentUser.email);
      const userCandKey = getCandidateStorageKey(currentUser.email);

      fetch(`/api/user-data/${encodeURIComponent(currentUser.email)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            if (!candidate && data.candidate) {
              const cleanCand = sanitizeCandidate(data.candidate);
              setCandidate(cleanCand);
              localStorage.setItem(userCandKey, JSON.stringify(cleanCand));
            }
            if (applications.length === 0 && Array.isArray(data.applications) && data.applications.length > 0) {
              setApplications(data.applications);
              localStorage.setItem(userAppKey, JSON.stringify(data.applications));
            }
          }
        })
        .catch(() => {})
        .finally(() => {
          // Allow client changes to save only after server state is loaded
          setTimeout(() => {
            isInitialLoadDoneRef.current = true;
          }, 400);
        });
    }
  }, [currentUser?.email]);

  // Debounced auto-save of candidate profile and applications (avoids saving on initial load or if data didn't change)
  useEffect(() => {
    if (!isInitialLoadDoneRef.current) return;
    if (!currentUser?.email || loadedEmailRef.current !== currentUser.email) return;

    const sanitizedCand = sanitizeCandidate(candidate);
    const userAppKey = getAppStorageKey(currentUser.email);
    const userCandKey = getCandidateStorageKey(currentUser.email);

    // Persist to isolated local storage immediately
    try {
      localStorage.setItem(userAppKey, JSON.stringify(applications));
      if (sanitizedCand) {
        localStorage.setItem(userCandKey, JSON.stringify(sanitizedCand));
      } else {
        localStorage.removeItem(userCandKey);
      }
    } catch {}

    const payload = JSON.stringify({
      candidate: sanitizedCand,
      applications,
    });

    // Skip network POST if nothing actually changed
    if (payload === lastSavedPayloadRef.current) {
      return;
    }

    const timer = setTimeout(() => {
      lastSavedPayloadRef.current = payload;
      fetch(`/api/user-data/${encodeURIComponent(currentUser.email)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      }).catch(() => {});
    }, 600);

    return () => clearTimeout(timer);
  }, [applications, candidate, currentUser?.email]);

  const handleResetResume = () => {
    if (currentUser?.email) {
      try {
        localStorage.removeItem(getCandidateStorageKey(currentUser.email));
        fetch(`/api/user-data/${encodeURIComponent(currentUser.email)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ candidate: null, applications }),
        }).catch(() => {});
      } catch {}
    }
    setCandidate(null);
    setSelectedIds(new Set());
    setUploaderKey((prev) => prev + 1);
  };

  // Check active server-side session and Gmail OAuth status on load
  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.email) {
          if (data.csrfToken) setCsrfToken(data.csrfToken);
          setCurrentUser((prev) => {
            const updated: UserAccount = {
              email: data.email,
              name: prev?.name || 'User',
              authMethod: 'otp' as const,
              avatarBg: prev?.avatarBg || 'bg-emerald-600',
              createdAt: prev?.createdAt || new Date().toISOString(),
              gmailStatus: data.gmailStatus || { connected: false },
            };
            try {
              localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(updated));
            } catch {}
            return updated;
          });
        }
      })
      .catch(() => {});
  }, []);

  // Handle Google OAuth callback URL parameters (/?gmail_connected=true or /?gmail_error=...)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const gmailConnected = urlParams.get('gmail_connected');
    const gmailError = urlParams.get('gmail_error');

    if (gmailConnected === 'true') {
      fetch('/api/auth/google/status')
        .then((res) => res.json())
        .then((statusData) => {
          if (statusData && statusData.connected) {
            setCurrentUser((prev) => {
              if (!prev) return prev;
              const updated: UserAccount = {
                ...prev,
                gmailStatus: {
                  connected: true,
                  email: statusData.email,
                  connectedAt: statusData.connectedAt,
                  scopeValid: statusData.scopeValid,
                },
              };
              try {
                localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(updated));
              } catch {}
              return updated;
            });
          }
        })
        .catch(() => {});

      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (gmailError) {
      alert(`Gmail Connection Error: ${decodeURIComponent(gmailError)}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleConnectGmail = async () => {
    try {
      setIsConnectingGmail(true);
      const res = await fetch('/api/auth/google/url');
      if (res.status === 401) {
        setIsConnectingGmail(false);
        setIsAuthModalOpen(true);
        alert('Please sign in with your email OTP first to securely connect your Gmail account.');
        return;
      }
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to start Gmail connection');
        setIsConnectingGmail(false);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to connect Gmail');
      setIsConnectingGmail(false);
    }
  };

  const handleDisconnectGmail = async () => {
    if (!window.confirm('Are you sure you want to disconnect your Gmail account? You will switch back to SMTP sending.')) {
      return;
    }
    try {
      const res = await fetch('/api/auth/google/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        },
      });
      const data = await res.json();
      if (data.success) {
        setCurrentUser((prev) => {
          if (!prev) return prev;
          const updated: UserAccount = {
            ...prev,
            gmailStatus: { connected: false },
          };
          try {
            localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(updated));
          } catch {}
          return updated;
        });
      } else {
        alert(data.error || 'Failed to disconnect Gmail');
      }
    } catch (err: any) {
      alert(err.message || 'Error disconnecting Gmail');
    }
  };

  const handleLoginSuccess = (user: UserAccount) => {
    isInitialLoadDoneRef.current = false;
    setCurrentUser(user);
    loadedEmailRef.current = user.email;
    try {
      localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(user));
      const userAppKey = getAppStorageKey(user.email);
      const userCandKey = getCandidateStorageKey(user.email);

      const savedApps = localStorage.getItem(userAppKey);
      const parsedApps = savedApps ? JSON.parse(savedApps) : [];
      setApplications(parsedApps);

      const savedCand = localStorage.getItem(userCandKey);
      const parsedCand = savedCand ? sanitizeCandidate(JSON.parse(savedCand)) : null;
      setCandidate(parsedCand);
      setUploaderKey((prev) => prev + 1);

      // Check server disk persistence as well
      fetch(`/api/user-data/${encodeURIComponent(user.email)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            if (!parsedCand && data.candidate) {
              const cleanCand = sanitizeCandidate(data.candidate);
              setCandidate(cleanCand);
              localStorage.setItem(userCandKey, JSON.stringify(cleanCand));
            }
            if (parsedApps.length === 0 && Array.isArray(data.applications) && data.applications.length > 0) {
              setApplications(data.applications);
              localStorage.setItem(userAppKey, JSON.stringify(data.applications));
            }
          }
        })
        .catch(() => {});

      // Sync backend session and Gmail status
      fetch('/api/auth/session')
        .then((res) => res.json())
        .then((data) => {
          if (data.authenticated) {
            if (data.csrfToken) setCsrfToken(data.csrfToken);
            if (data.gmailStatus) {
              setCurrentUser((prev) => {
                if (!prev) return prev;
                const updated: UserAccount = { ...prev, gmailStatus: data.gmailStatus };
                try {
                  localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(updated));
                } catch {}
                return updated;
              });
            }
          }
        })
        .catch(() => {});
    } catch {}
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        },
      });
    } catch {}

    try {
      localStorage.removeItem(STORAGE_KEY_AUTH_USER);
    } catch {}
    loadedEmailRef.current = null;
    setCurrentUser(null);
    setCandidate(null);
    setApplications([]);
    setUploaderKey((prev) => prev + 1);
    setIsAuthModalOpen(true);
  };

  // Loading state for AI analysis
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [workModeFilter, setWorkModeFilter] = useState<WorkMode | 'all'>('all');
  const [matchTierFilter, setMatchTierFilter] = useState<'all' | 'high' | 'good' | 'gap'>('all');
  const [categoryFilter, setCategoryFilter] = useState<RoleCategory | 'all'>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [onlyEligibleOnly, setOnlyEligibleOnly] = useState<boolean>(true);

  // Selected Internships for 1-Click Batch Send
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modals state
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [pitchModalInternship, setPitchModalInternship] = useState<MatchedInternship | null>(null);
  const [companyDetailInternship, setCompanyDetailInternship] = useState<MatchedInternship | null>(null);

  // Match calculations - Only compute if a resume is uploaded (candidate has skills)
  const matchedInternships: MatchedInternship[] = useMemo(() => {
    if (!candidate || !candidate.detectedSkills || candidate.detectedSkills.length === 0) {
      return [];
    }
    const skills = candidate.detectedSkills;
    const year = candidate.collegeYear || 3;
    return INITIAL_INTERNSHIPS.map((internship) => matchInternship(skills, internship, year))
      .sort((a, b) => b.matchPercentage - a.matchPercentage);
  }, [candidate?.detectedSkills, candidate?.collegeYear]);

  // Pre-select high matches when candidate changes (lower threshold → more pre-selections)
  useEffect(() => {
    if (matchedInternships.length > 0 && candidate) {
      const topMatches = matchedInternships
        .filter((item) => item.matchPercentage >= 40)
        .map((item) => item.id);
      setSelectedIds(new Set(topMatches.slice(0, 6)));
    }
  }, [candidate?.detectedSkills]);

  // Filtered internships
  const filteredInternships = useMemo(() => {
    return matchedInternships.filter((item) => {
      const q = searchQuery.toLowerCase().trim();

      // 1. Search Query Matching (Company name, role, skills, location, HR, perks)
      if (q) {
        const inCompany = item.company.toLowerCase().includes(q);
        const inRole = item.role.toLowerCase().includes(q);
        const inDesc = item.companyDescription.toLowerCase().includes(q);
        const inLocation = item.companyLocation.toLowerCase().includes(q) || item.jobLocation.toLowerCase().includes(q);
        const inCountry = (item.country || '').toLowerCase().includes(q);
        const inSkills = item.requiredSkills.some(s => s.toLowerCase().includes(q)) || 
                         item.preferredSkills.some(s => s.toLowerCase().includes(q));
        const inHR = item.hr.name.toLowerCase().includes(q) || item.hr.title.toLowerCase().includes(q);
        const inPerks = item.perks.some(p => p.toLowerCase().includes(q));

        const matchesSearch = inCompany || inRole || inDesc || inLocation || inCountry || inSkills || inHR || inPerks;
        if (!matchesSearch) {
          return false;
        }
      }

      // 2. Work mode filter
      if (workModeFilter !== 'all' && item.workMode !== workModeFilter) {
        return false;
      }

      // 3. Category filter
      if (categoryFilter !== 'all' && item.category !== categoryFilter) {
        return false;
      }

      // Source Platform Filter (LinkedIn, Unstop, Naukri, Glassdoor, Indeed)
      if (platformFilter !== 'all' && item.sourcePlatform !== platformFilter) {
        return false;
      }

      // 4. Match tier filter
      if (matchTierFilter === 'high' && item.matchPercentage < 70) return false;
      if (matchTierFilter === 'good' && item.matchPercentage < 50) return false;
      if (matchTierFilter === 'gap' && item.matchPercentage >= 50) return false;

      // 5. Student Year Eligibility Filter:
      // If student is in 3rd year and opening is strictly hiring 4th year students, exclude it!
      if (onlyEligibleOnly && item.isEligible === false) {
        return false;
      }

      // Resume-Driven Relevance Filter:
      // If user hasn't typed an explicit text search query, only display internships that genuinely align with their uploaded resume skills
      // This guarantees that uploading different resumes displays completely different, non-repeated matching internships!
      if (!q && matchTierFilter === 'all') {
        const hasRelevantSkills = item.matchedSkills.length > 0;
        if (!hasRelevantSkills && item.matchPercentage < 35) {
          return false;
        }
      }

      return true;
    });
  }, [matchedInternships, workModeFilter, categoryFilter, matchTierFilter, platformFilter, searchQuery, onlyEligibleOnly]);

  // Average match score computed across candidate's relevant matching internships
  const avgMatchScore = useMemo(() => {
    const relevant = matchedInternships.filter(i => i.matchedSkills.length > 0);
    if (relevant.length === 0) return 0;
    const sum = relevant.reduce((acc, curr) => acc + curr.matchPercentage, 0);
    return Math.round(sum / relevant.length);
  }, [matchedInternships]);

  // Handlers
  const handleUpdateCollegeYear = (year: number) => {
    if (!candidate) return;
    const yearLabels: Record<number, string> = {
      1: '1st Year (Freshman / Batch 2028)',
      2: '2nd Year (Sophomore / Batch 2027)',
      3: '3rd Year (Pre-Final Year / Batch 2026)',
      4: '4th Year (Final Year / Batch 2025)',
    };
    setCandidate({
      ...candidate,
      collegeYear: year,
      collegeYearLabel: yearLabels[year] || `${year}th Year`,
    });
  };

  const handleAnalyzeResume = async (
    text: string,
    profileData: Partial<CandidateProfile>,
    fileName?: string
  ) => {
    setIsLoadingAnalysis(true);
    const eligibility = extractEligibilityFromResume(text);
    const localSkills = extractSkillsLocally(text);

    let cleanResumeUrl = profileData.resumeUrl?.trim() || '';
    let cleanDownloadUrl = profileData.downloadUrl?.trim() || '';

    // Only accept genuine public URLs (e.g. Google Drive, Dropbox, OneDrive); reject localhost and placeholders
    if (
      !cleanResumeUrl.startsWith('http') ||
      cleanResumeUrl.includes('localhost') ||
      cleanResumeUrl.includes('127.0.0.1') ||
      cleanResumeUrl.includes('/file/d/view?usp=sharing')
    ) {
      cleanResumeUrl = '';
    }

    // Ensure local file download endpoint is generated if resume file exists
    if (!cleanDownloadUrl && (text || profileData.resumeFileData)) {
      try {
        const upRes = await fetch('/api/upload-resume-file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: fileName || `${(profileData.name || 'Candidate').replace(/\s+/g, '_')}_Resume.pdf`,
            fileData: profileData.resumeFileData || candidate?.resumeFileData || '',
            mimeType: 'application/pdf',
            resumeText: text,
            candidateName: profileData.name || 'Candidate',
            candidateEmail: profileData.email || '',
          }),
        });
        const upData = await upRes.json();
        if (upData.success && upData.downloadUrl) {
          cleanDownloadUrl = upData.downloadUrl;
        }
      } catch (err) {
        console.warn('Could not auto-generate download link:', err);
      }
    }

    try {
      const res = await fetch('/api/analyze-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText: text,
          candidateInfo: profileData,
        }),
      });

      const responseJson = await res.json();

      if (responseJson.success && responseJson.data) {
        const aiData = responseJson.data;
        const finalSkills = Array.from(
          new Set([
            ...(aiData.detectedSkills || []),
            ...localSkills,
          ])
        );

        setCandidate({
          name: profileData.name || aiData.candidateName || (currentUser?.name || 'Applicant'),
          email: profileData.email || aiData.candidateEmail || (currentUser?.email || 'applicant@gmail.com'),
          phone: profileData.phone || aiData.candidatePhone || '',
          linkedin: profileData.linkedin || 'https://linkedin.com',
          portfolio: profileData.portfolio || '',
          summary: aiData.summary || `Candidate in ${eligibility.collegeYearLabel} with active development expertise.`,
          experienceLevel: eligibility.collegeYearLabel,
          collegeYear: eligibility.collegeYear,
          collegeYearLabel: eligibility.collegeYearLabel,
          graduationYear: eligibility.graduationYear,
          detectedDegree: eligibility.detectedDegree,
          detectedSkills: finalSkills.length > 0 ? finalSkills : localSkills,
          skillsByCategory: aiData.skillsByCategory,
          strengths: aiData.strengths || ['Proactive problem solver', 'Solid technical foundations'],
          rawResumeText: text,
          fileName: fileName || 'Resume.pdf',
          resumeUrl: cleanResumeUrl,
          downloadUrl: cleanDownloadUrl,
          resumeFileData: profileData.resumeFileData || candidate?.resumeFileData || '',
        });
      } else {
        setCandidate({
          name: profileData.name || (currentUser?.name || 'Applicant'),
          email: profileData.email || (currentUser?.email || 'applicant@gmail.com'),
          phone: profileData.phone || '',
          linkedin: profileData.linkedin || 'https://linkedin.com',
          portfolio: profileData.portfolio || '',
          summary: `Candidate in ${eligibility.collegeYearLabel} with practical software engineering skills.`,
          experienceLevel: eligibility.collegeYearLabel,
          collegeYear: eligibility.collegeYear,
          collegeYearLabel: eligibility.collegeYearLabel,
          graduationYear: eligibility.graduationYear,
          detectedDegree: eligibility.detectedDegree,
          detectedSkills: localSkills,
          strengths: [
            'Proficient in core software development standards and tools',
            'Strong self-learning capability across modern frameworks',
          ],
          rawResumeText: text,
          fileName: fileName || 'Resume.pdf',
          resumeUrl: cleanResumeUrl,
          downloadUrl: cleanDownloadUrl,
          resumeFileData: profileData.resumeFileData || candidate?.resumeFileData || '',
        });
      }
    } catch (err) {
      console.warn('Analysis error:', err);
      setCandidate({
        name: profileData.name || (currentUser?.name || 'Applicant'),
        email: profileData.email || (currentUser?.email || 'applicant@gmail.com'),
        phone: profileData.phone || '',
        linkedin: profileData.linkedin || 'https://linkedin.com',
        portfolio: profileData.portfolio || '',
        summary: `Candidate in ${eligibility.collegeYearLabel} parsed from uploaded resume.`,
        experienceLevel: eligibility.collegeYearLabel,
        collegeYear: eligibility.collegeYear,
        collegeYearLabel: eligibility.collegeYearLabel,
        graduationYear: eligibility.graduationYear,
        detectedDegree: eligibility.detectedDegree,
        detectedSkills: localSkills,
        strengths: ['Adaptive developer', 'Strong project portfolio foundations'],
        rawResumeText: text,
        fileName: fileName || 'Resume.pdf',
        resumeUrl: cleanResumeUrl,
        downloadUrl: cleanDownloadUrl,
        resumeFileData: profileData.resumeFileData || candidate?.resumeFileData || '',
      });
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  const handleAddSkill = (skill: string) => {
    if (!candidate) return;
    const lower = skill.toLowerCase().trim();
    if (!candidate.detectedSkills.includes(lower)) {
      setCandidate({
        ...candidate,
        detectedSkills: [...candidate.detectedSkills, lower],
      });
    }
  };

  const handleRemoveSkill = (skill: string) => {
    if (!candidate) return;
    setCandidate({
      ...candidate,
      detectedSkills: candidate.detectedSkills.filter((s) => s !== skill),
    });
  };

  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleSelectAll = () => {
    setSelectedIds(new Set(filteredInternships.map((i) => i.id)));
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleSelectHighMatches = () => {
    const ids = filteredInternships
      .filter((i) => i.matchPercentage >= 40)
      .map((i) => i.id);
    setSelectedIds(new Set(ids));
  };

  const handleSelectRemoteOnly = () => {
    const ids = filteredInternships
      .filter((i) => i.workMode === 'remote')
      .map((i) => i.id);
    setSelectedIds(new Set(ids));
  };

  const handleBatchSendConfirm = (newApps: ApplicationRecord[]) => {
    const existingIds = new Set(applications.map((a) => a.internshipId));
    const toAdd = newApps.filter((a) => !existingIds.has(a.internshipId));
    setApplications([...toAdd, ...applications]);
    setActiveTab('tracker');
  };

  const handleSingleSend = (newApp: ApplicationRecord) => {
    const filtered = applications.filter((a) => a.internshipId !== newApp.internshipId);
    setApplications([newApp, ...filtered]);
  };

  const handleUpdateAppStatus = (appId: string, status: ApplicationStatus) => {
    setApplications(
      applications.map((a) => (a.id === appId ? { ...a, status } : a))
    );
  };

  const handleAddAppNote = (appId: string, note: string) => {
    setApplications(
      applications.map((a) => (a.id === appId ? { ...a, notes: note } : a))
    );
  };

  const appliedInternshipIds = new Set(applications.map((a) => a.internshipId));

  return (
    <div className="min-h-screen bg-[#dceb92] text-slate-900 font-sans p-2 sm:p-4 lg:p-6 selection:bg-black selection:text-white">
      
      {/* Top Outer Meta Bar */}
      <div className="max-w-[1600px] mx-auto px-4 py-2 flex items-center justify-between text-xs font-bold text-slate-800">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5 cursor-pointer hover:underline">
            <Globe className="w-3.5 h-3.5" />
            <span>airesumesender.com</span>
          </div>
          <div className="flex items-center gap-1.5 cursor-pointer hover:underline">
            <Mail className="w-3.5 h-3.5" />
            <span>support@airesumesender.com</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5" />
            <span>+1 (800) 555-0199</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="bg-[#1c1c1e] text-[#d9f99d] px-2.5 py-1 rounded-full text-[10px] uppercase font-black tracking-wider">
            AI Resume Sender v2.4
          </span>
        </div>
      </div>

      {/* Main Dashboard Outer Shell Container */}
      <div className="bg-[#f4f5f5] text-slate-900 rounded-[32px] sm:rounded-[40px] shadow-2xl overflow-hidden max-w-[1600px] mx-auto border border-black/10 min-h-[92vh] flex flex-col">
        
        {/* Navigation Bar */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          applicationsCount={applications.length}
          matchedCount={filteredInternships.length}
          hasResume={!!candidate}
          currentUser={currentUser}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onLogout={handleLogout}
          onConnectGmail={handleConnectGmail}
          onDisconnectGmail={handleDisconnectGmail}
          isConnectingGmail={isConnectingGmail}
        />

        {/* Main Light Canvas Content Area (Original Feature Order) */}
        <main className="flex-1 p-5 sm:p-8 lg:p-10 max-w-7xl w-full mx-auto space-y-8">
          
          {!currentUser ? (
            <div className="rounded-3xl border border-slate-200/90 bg-white p-10 sm:p-14 text-center max-w-xl mx-auto space-y-5 shadow-sm my-8">
              <div className="w-14 h-14 rounded-2xl bg-[#1c1c1e] text-[#d9f99d] flex items-center justify-center mx-auto shadow-md">
                <KeyRound className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-900">
                  Account Sign-In Required
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed max-w-md mx-auto">
                  To keep each candidate's applications, resumes, and eligibility matches strictly confidential, sign in with your Gmail address (via instant OTP or password). No name required during login.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="px-6 py-3.5 rounded-2xl bg-[#1c1c1e] hover:bg-black text-white font-black text-xs sm:text-sm shadow-md hover:scale-105 transition-all inline-flex items-center gap-2"
              >
                <Mail className="w-4 h-4 text-[#d9f99d]" />
                <span>Sign In with Gmail (OTP or Password)</span>
              </button>
            </div>
          ) : (
            <>
              {/* TAB 1: Match & Apply */}
          {activeTab === 'match' && (
            <div className="space-y-6">
              
              {/* Step 1: Resume Upload Box */}
              <ResumeUploader
                key={`uploader-${uploaderKey}-${candidate ? candidate.fileName || 'active' : 'empty'}`}
                onAnalyze={handleAnalyzeResume}
                isLoading={isLoadingAnalysis}
                currentProfile={candidate}
                currentUser={currentUser}
              />

              {/* Step 2: User-Wise Tracker & Candidate Skill Breakdown on Top */}
              {candidate && (
                <div className="space-y-5">
                  {/* User-Wise Application Tracker Bar */}
                  <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#1c1c1e] text-[#d9f99d] font-black flex items-center justify-center text-sm shadow-xs">
                          {candidate.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-slate-900 text-sm sm:text-base">
                              {candidate.name}
                            </span>
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                              Active Candidate
                            </span>
                            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                              Logged in as: {currentUser?.email || candidate.email}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500 font-medium">
                            {candidate.email} • {candidate.fileName || 'Resume.pdf'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => setIsAuthModalOpen(true)}
                          className="px-3.5 py-2 rounded-xl text-xs font-extrabold bg-[#1c1c1e] text-[#d9f99d] hover:bg-black transition-colors flex items-center gap-1.5 shadow-xs"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Switch Account / OTP</span>
                        </button>
                        <button
                          onClick={() => setActiveTab('tracker')}
                          className="px-3.5 py-2 rounded-xl text-xs font-extrabold bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200 transition-colors flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>View Full Tracker ({applications.length})</span>
                        </button>
                        <button
                          onClick={handleResetResume}
                          className="px-3.5 py-2 rounded-xl text-xs font-extrabold bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-colors"
                        >
                          Remove Resume
                        </button>
                      </div>
                    </div>

                    {/* Tracker Stat Metrics */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                        <span className="block text-[10px] font-black uppercase text-slate-400">Applications Sent</span>
                        <span className="text-xl font-black text-slate-900 mt-0.5 block">{applications.length}</span>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                        <span className="block text-[10px] font-black uppercase text-slate-400">Under Review</span>
                        <span className="text-xl font-black text-amber-600 mt-0.5 block">
                          {applications.filter(a => a.status === 'Applied' || a.status === 'Under Review').length}
                        </span>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                        <span className="block text-[10px] font-black uppercase text-slate-400">Avg Skill Match</span>
                        <span className="text-xl font-black text-emerald-600 mt-0.5 block">{avgMatchScore}%</span>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                        <span className="block text-[10px] font-black uppercase text-slate-400">Eligible Openings</span>
                        <span className="text-xl font-black text-slate-900 mt-0.5 block">{filteredInternships.length}</span>
                      </div>
                    </div>

                    {/* Student Eligibility & Graduation Batch Selection Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-slate-700">
                          🎓 College Eligibility:
                        </span>
                        {[1, 2, 3, 4].map((yr) => (
                          <button
                            key={yr}
                            type="button"
                            onClick={() => handleUpdateCollegeYear(yr)}
                            className={`px-3 py-1 rounded-xl font-black text-xs transition-all ${
                              (candidate.collegeYear || 3) === yr
                                ? 'bg-slate-950 text-[#d9f99d] shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                            }`}
                          >
                            {yr === 4 ? '4th Year (Final Year)' : yr === 3 ? '3rd Year (Pre-Final)' : yr === 2 ? '2nd Year' : '1st Year'}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 text-[11px]">
                          ✅ {candidate.collegeYearLabel || '3rd Year (Pre-Final / Batch 2026)'} • {candidate.detectedDegree || 'B.Tech'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Skills Breakdown Card */}
                  <SkillAnalysisView
                    profile={candidate}
                    onAddSkill={handleAddSkill}
                    onRemoveSkill={handleRemoveSkill}
                    onReset={handleResetResume}
                    matchedCount={filteredInternships.length}
                    avgMatchScore={avgMatchScore}
                  />
                </div>
              )}

              {/* Step 3 & 4: Only show Filters, Match & Apply, and Similar Jobs once user uploads their resume */}
              {candidate ? (
                <>
                  {/* SECTION 1: Match & Apply Header */}
                  <div className="pt-2">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-xl bg-[#d9f99d] text-slate-950 flex items-center justify-center shadow-xs">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                          Match & Apply Openings
                        </h2>
                        <p className="text-xs text-slate-500 font-medium">
                          Verified company internships matching your detected technical skills.
                        </p>
                      </div>
                    </div>

                    {/* Filtering & Bulk Actions */}
                    <InternshipFilter
                      searchQuery={searchQuery}
                      setSearchQuery={setSearchQuery}
                      workModeFilter={workModeFilter}
                      setWorkModeFilter={setWorkModeFilter}
                      matchTierFilter={matchTierFilter}
                      setMatchTierFilter={setMatchTierFilter}
                      categoryFilter={categoryFilter}
                      setCategoryFilter={setCategoryFilter}
                      platformFilter={platformFilter}
                      setPlatformFilter={setPlatformFilter}
                      onlyEligibleOnly={onlyEligibleOnly}
                      setOnlyEligibleOnly={setOnlyEligibleOnly}
                      candidateYear={candidate?.collegeYear || 3}
                      selectedCount={selectedIds.size}
                      totalFilteredCount={filteredInternships.length}
                      onSelectAll={handleSelectAll}
                      onDeselectAll={handleDeselectAll}
                      onSelectHighMatches={handleSelectHighMatches}
                      onSelectRemoteOnly={handleSelectRemoteOnly}
                      onTriggerBatchSend={() => setIsBatchModalOpen(true)}
                    />
                  </div>

                  {/* Internships Grid List */}
                  {filteredInternships.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      {filteredInternships.map((internship) => (
                        <InternshipCard
                          key={internship.id}
                          internship={internship}
                          isSelected={selectedIds.has(internship.id)}
                          onToggleSelect={handleToggleSelect}
                          onPreviewPitch={(item) => setPitchModalInternship(item)}
                          onViewCompany={(item) => setCompanyDetailInternship(item)}
                          onDirectApply={(item) => {
                            if (appliedInternshipIds.has(item.id)) {
                              setActiveTab('tracker');
                            } else {
                              setPitchModalInternship(item);
                            }
                          }}
                          hasApplied={appliedInternshipIds.has(internship.id)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center max-w-md mx-auto space-y-3 shadow-sm">
                      <Filter className="w-10 h-10 text-slate-400 mx-auto" />
                      <h3 className="font-extrabold text-base text-slate-900">
                        No Internships Found
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        Try clearing your search query or selecting "All Modes".
                      </p>
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setWorkModeFilter('all');
                          setMatchTierFilter('all');
                          setCategoryFilter('all');
                          setPlatformFilter('all');
                        }}
                        className="px-4 py-2 rounded-xl bg-slate-100 text-slate-900 border border-slate-200 text-xs font-bold hover:bg-slate-200"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  )}

                  {/* SECTION 2: Similar Jobs Section Comes Below After Putting Resume */}
                  <div className="pt-8 border-t-2 border-slate-200/80">
                    <SimilarJobsView
                      matchedInternships={matchedInternships}
                      candidate={candidate}
                      onApplyInternship={(internship) => {
                        if (appliedInternshipIds.has(internship.id)) {
                          setActiveTab('tracker');
                        } else {
                          setPitchModalInternship(internship);
                        }
                      }}
                      onViewCompany={(internship) => {
                        setCompanyDetailInternship(internship);
                      }}
                    />
                  </div>
                </>
              ) : (
                /* Prompt to upload resume */
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-12 text-center max-w-lg mx-auto space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#d9f99d] text-slate-950 flex items-center justify-center mx-auto shadow-sm">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900">
                    Upload Your Resume to View Matched Roles & Similar Jobs
                  </h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Once you upload or paste your resume above, our AI engine will extract your skills and instantly reveal tailored internships, Match & Apply openings, and similar roles below.
                  </p>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: Similar Jobs */}
          {activeTab === 'similar-jobs' && (
            <SimilarJobsView
              matchedInternships={matchedInternships}
              candidate={candidate}
              onApplyInternship={(internship) => {
                if (appliedInternshipIds.has(internship.id)) {
                  setActiveTab('tracker');
                } else {
                  setPitchModalInternship(internship);
                }
              }}
              onViewCompany={(internship) => {
                setCompanyDetailInternship(internship);
              }}
            />
          )}

          {/* TAB 3: Application Tracker */}
          {activeTab === 'tracker' && (
            <ApplicationTrackerView
              applications={applications}
              onUpdateStatus={handleUpdateAppStatus}
              onAddNote={handleAddAppNote}
              onNavigateToMatch={() => setActiveTab('match')}
            />
          )}

          {/* Footer */}
          <footer className="border-t border-slate-200 pt-6 mt-10 text-center text-xs font-semibold text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="font-bold text-slate-700">
              AI Resume Sender • Intelligent Resume Analyzer & Direct HR Dispatch Engine
            </p>
            <p className="text-[11px] text-slate-400">
              All recruiter credentials & corporate domains verified. © 2026 airesumesender.com
            </p>
          </footer>

            </>
          )}

        </main>

      </div>

      {/* 1-Click Batch Send Modal */}
      {candidate && (
        <BatchSendModal
          isOpen={isBatchModalOpen}
          onClose={() => setIsBatchModalOpen(false)}
          selectedInternships={matchedInternships.filter((item) => selectedIds.has(item.id))}
          candidate={candidate}
          onConfirmSend={handleBatchSendConfirm}
        />
      )}

      {/* Pitch Preview & Edit Modal */}
      {candidate && (
        <PitchPreviewModal
          isOpen={!!pitchModalInternship}
          onClose={() => setPitchModalInternship(null)}
          internship={pitchModalInternship}
          candidate={candidate}
          onSendSingle={handleSingleSend}
        />
      )}

      {/* Company Authenticity & Office Detail Modal */}
      <CompanyDetailModal
        isOpen={!!companyDetailInternship}
        onClose={() => setCompanyDetailInternship(null)}
        internship={companyDetailInternship}
        onApply={(item) => {
          setPitchModalInternship(item);
        }}
        hasApplied={
          companyDetailInternship
            ? appliedInternshipIds.has(companyDetailInternship.id)
            : false
        }
      />

      {/* Account Login & Gmail OTP Verification Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        initialEmail={currentUser?.email || candidate?.email || ''}
      />

    </div>
  );
}
