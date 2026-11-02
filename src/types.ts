export type WorkMode = 'remote' | 'hybrid' | 'onsite';

export type RoleCategory =
  | 'frontend'
  | 'backend'
  | 'fullstack'
  | 'ai-ml'
  | 'cloud-devops'
  | 'data'
  | 'security';

export type PlatformSource = 'LinkedIn' | 'Unstop' | 'Naukri' | 'Glassdoor' | 'Indeed' | 'Wellfound';

export interface HRContact {
  name: string;
  title: string;
  email: string;
  linkedin: string;
  avatarBg?: string;
}

export interface Internship {
  id: string;
  role: string;
  company: string;
  companyDescription: string;
  companyLinkedin: string;
  companyWebsite: string;
  sourcePlatform?: PlatformSource;
  sourceUrl?: string;
  officialNotificationUrl?: string;
  directApplyUrl?: string;
  companyLocation: string;
  jobLocation: string;
  country?: string;
  workMode: WorkMode;
  salary: string;
  duration: string;
  category: RoleCategory;
  verifiedEmployer: boolean;
  trustScore: number;
  verificationBadge: string;
  hr: HRContact;
  requiredSkills: string[];
  preferredSkills: string[];
  responsibilities: string[];
  perks: string[];
  postedDate: string;
  applicantsCount: number;
  eligibleYears?: number[]; // e.g. [3, 4] = 3rd & 4th year eligible; [4] = 4th year only; [3] = 3rd year only
  eligibleBatches?: string[]; // e.g. ['3rd Year', '4th Year (2025/2026 Batch)']
  eligibilityCriteria?: string; // Human-readable e.g. 'Open to 3rd & 4th Year B.Tech / BE students'
}

export interface MatchedInternship extends Internship {
  matchPercentage: number;
  matchedSkills: string[];
  lackingSkills: string[];
  matchTier: 'excellent' | 'good' | 'moderate' | 'gap';
  isEligible?: boolean;
  eligibilityReason?: string;
}

export interface UserAccount {
  email: string;
  name: string;
  authMethod: 'password' | 'otp';
  avatarBg?: string;
  createdAt: string;
}

export interface CandidateProfile {
  name: string;
  email: string;
  phone: string;
  linkedin: string;
  portfolio: string;
  summary: string;
  experienceLevel: string;
  detectedSkills: string[];
  skillsByCategory?: {
    languages?: string[];
    frontend?: string[];
    backend?: string[];
    databases?: string[];
    aiMlData?: string[];
    cloudDevOps?: string[];
    toolsAndOther?: string[];
  };
  strengths: string[];
  collegeYear?: number; // 1 | 2 | 3 | 4
  collegeYearLabel?: string; // e.g. '3rd Year (Pre-final)'
  graduationYear?: number; // e.g. 2026
  detectedDegree?: string; // e.g. 'B.Tech / BE'
  rawResumeText: string;
  fileName?: string;
  resumeUrl?: string; // Direct link to uploaded resume (Google Drive, Cloud storage, etc.)
  downloadUrl?: string; // Direct download endpoint for attaching in Gmail
  resumeFileData?: string; // Persistent Base64 data URL of the uploaded resume PDF
}

export type ApplicationStatus =
  | 'Applied'
  | 'Under Review'
  | 'Interview Scheduled'
  | 'Offer Received'
  | 'Archived';

export interface ApplicationRecord {
  id: string;
  internshipId: string;
  company: string;
  role: string;
  workMode: WorkMode;
  salary: string;
  companyLocation: string;
  jobLocation: string;
  hrName: string;
  hrTitle: string;
  hrEmail: string;
  hrLinkedin: string;
  companyLinkedin: string;
  appliedDate: string;
  status: ApplicationStatus;
  pitchSubject: string;
  pitchBody: string;
  trackingNumber: string;
  matchScore: number;
  matchedSkills: string[];
  lackingSkills: string[];
  notes?: string;
}

export interface SkillGapAnalysisItem {
  skill: string;
  frequencyMissing: number;
  rolesDemanding: string[];
  importance: 'High' | 'Medium' | 'Recommended';
  learningResourceTip: string;
}
