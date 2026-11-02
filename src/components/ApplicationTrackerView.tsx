import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Linkedin, 
  ExternalLink, 
  Mail, 
  ArrowRight
} from 'lucide-react';
import { ApplicationRecord, ApplicationStatus } from '../types.ts';
import { getCompanyLinkedinUrl, getHrLinkedinUrl } from '../utils/linkedin.ts';

interface ApplicationTrackerViewProps {
  applications: ApplicationRecord[];
  onUpdateStatus: (id: string, status: ApplicationStatus) => void;
  onAddNote: (id: string, note: string) => void;
  onNavigateToMatch: () => void;
}

export const ApplicationTrackerView: React.FC<ApplicationTrackerViewProps> = ({
  applications,
  onUpdateStatus,
  onAddNote,
  onNavigateToMatch,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewingPitchAppId, setViewingPitchAppId] = useState<string | null>(null);
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});

  const filteredApps = applications.filter((app) => {
    if (statusFilter === 'all') return true;
    return app.status.toLowerCase() === statusFilter.toLowerCase();
  });

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case 'Applied':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Under Review':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Interview Scheduled':
        return 'bg-amber-100 text-amber-900 border-amber-200';
      case 'Offer Received':
        return 'bg-emerald-100 text-emerald-900 border-emerald-200';
      case 'Archived':
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const counts = {
    all: applications.length,
    applied: applications.filter(a => a.status === 'Applied').length,
    underReview: applications.filter(a => a.status === 'Under Review').length,
    interview: applications.filter(a => a.status === 'Interview Scheduled').length,
    offer: applications.filter(a => a.status === 'Offer Received').length,
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header & Stats Banner */}
      <div className="rounded-3xl border border-slate-200/80 bg-white shadow-sm p-6 sm:p-8 text-slate-900">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200 mb-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Real-Time Internship Application Status</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Application Pipeline & HR Communications
            </h1>
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
              Track your sent applications, review interview requests, log recruiter notes, and view dispatches.
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="px-4 py-2.5 rounded-2xl bg-slate-100 border border-slate-200 text-center">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                Total Sent
              </span>
              <span className="text-lg font-black text-slate-900">{counts.all}</span>
            </div>

            <div className="px-4 py-2.5 rounded-2xl bg-blue-50 border border-blue-200 text-center">
              <span className="text-[10px] font-extrabold text-blue-700 uppercase tracking-wider block">
                Applied
              </span>
              <span className="text-lg font-black text-blue-700">{counts.applied}</span>
            </div>

            <div className="px-4 py-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-center">
              <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider block">
                Interviews
              </span>
              <span className="text-lg font-black text-amber-800">{counts.interview}</span>
            </div>

            <div className="px-4 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
              <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider block">
                Offers
              </span>
              <span className="text-lg font-black text-emerald-800">{counts.offer}</span>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pt-6 border-t border-slate-200 mt-6 text-xs">
          {[
            { id: 'all', label: `All (${counts.all})` },
            { id: 'applied', label: `Applied (${counts.applied})` },
            { id: 'under review', label: `Under Review (${counts.underReview})` },
            { id: 'interview scheduled', label: `Interview (${counts.interview})` },
            { id: 'offer received', label: `Offers (${counts.offer})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-2 rounded-xl font-extrabold whitespace-nowrap transition-all ${
                statusFilter === tab.id
                  ? 'bg-[#1c1c1e] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Applications List */}
      {filteredApps.length > 0 ? (
        <div className="space-y-4">
          {filteredApps.map((app) => (
            <div
              key={app.id}
              className="rounded-3xl border border-slate-200/80 bg-white shadow-sm p-5 sm:p-6 space-y-4 text-slate-900"
            >
              {/* Top Row: Company, Role, Status Selector, Date */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-base text-slate-900">
                      {app.company}
                    </span>

                    {/* Company LinkedIn Profile */}
                    <a
                      href={getCompanyLinkedinUrl(app.company, app.companyLinkedin)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 hover:bg-blue-100"
                    >
                      <Linkedin className="w-3 h-3 text-blue-600" />
                      <span>Company LinkedIn</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>

                    <span className="text-xs text-slate-400 font-semibold">
                      • {app.trackingNumber}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-black text-slate-950 mt-0.5">
                    {app.role}
                  </h3>
                </div>

                {/* Status Dropdown Picker */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">Status:</span>
                  <select
                    value={app.status}
                    onChange={(e) => onUpdateStatus(app.id, e.target.value as ApplicationStatus)}
                    className={`text-xs font-black px-3 py-1.5 rounded-xl border cursor-pointer outline-none ${getStatusBadge(app.status)}`}
                  >
                    <option value="Applied" className="bg-white text-slate-900">Applied (Sent to HR)</option>
                    <option value="Under Review" className="bg-white text-slate-900">Under Review</option>
                    <option value="Interview Scheduled" className="bg-white text-slate-900">Interview Scheduled</option>
                    <option value="Offer Received" className="bg-white text-slate-900">Offer Received 🎉</option>
                    <option value="Archived" className="bg-white text-slate-900">Archived</option>
                  </select>
                </div>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs text-slate-700">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Work Mode</span>
                  <span className="font-extrabold text-slate-900 capitalize mt-0.5 block">{app.workMode}</span>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] text-emerald-700 font-bold uppercase block">Stipend</span>
                  <span className="font-black text-emerald-800 mt-0.5 block">{app.salary}</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Location</span>
                  <span className="font-extrabold text-slate-900 mt-0.5 block truncate" title={app.jobLocation}>{app.companyLocation}</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Sent On</span>
                  <span className="font-extrabold text-slate-900 mt-0.5 block">{app.appliedDate}</span>
                </div>
              </div>

              {/* HR Recruiter Contact Info */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#1c1c1e] text-[#d9f99d] font-black flex items-center justify-center shrink-0">
                    {app.hrName.slice(0, 2)}
                  </div>
                  <div>
                    <div className="font-extrabold text-slate-900">
                      {app.hrName} <span className="font-medium text-slate-500">({app.hrTitle})</span>
                    </div>
                    <a href={`mailto:${app.hrEmail}`} className="text-slate-900 hover:underline font-extrabold">
                      {app.hrEmail}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={getHrLinkedinUrl(app.hrName, app.company, app.hrLinkedin)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-100"
                  >
                    <Linkedin className="w-3 h-3 text-blue-600" />
                    <span>HR Profile</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>

                  <button
                    onClick={() => setViewingPitchAppId(viewingPitchAppId === app.id ? null : app.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-extrabold text-slate-800 bg-slate-200 hover:bg-slate-300 transition-colors"
                  >
                    {viewingPitchAppId === app.id ? 'Hide Sent Pitch' : 'View Sent Pitch'}
                  </button>
                </div>
              </div>

              {/* Sent Pitch Accordion */}
              {viewingPitchAppId === app.id && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 space-y-2 animate-in fade-in duration-150">
                  <div className="font-black text-slate-900 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-700" />
                    <span>Subject: {app.pitchSubject}</span>
                  </div>
                  <pre className="font-sans whitespace-pre-wrap leading-relaxed text-slate-700 bg-white p-3 rounded-xl border border-slate-200 font-medium">
                    {app.pitchBody}
                  </pre>
                </div>
              )}

              {/* Notes & Interview Follow-Up Input */}
              <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  placeholder={app.notes ? `Note: ${app.notes}` : "Add interview date, recruiter feedback, or follow-up note..."}
                  value={noteInputs[app.id] ?? ''}
                  onChange={(e) => setNoteInputs({ ...noteInputs, [app.id]: e.target.value })}
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-slate-900 font-medium"
                />
                <button
                  onClick={() => {
                    if (noteInputs[app.id]) {
                      onAddNote(app.id, noteInputs[app.id]);
                      setNoteInputs({ ...noteInputs, [app.id]: '' });
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-black text-slate-950 bg-[#d9f99d] hover:bg-[#bef264] border border-slate-300 transition-colors shrink-0"
                >
                  Save Note
                </button>
              </div>

            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center max-w-lg mx-auto space-y-4 shadow-sm text-slate-900">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-900 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">
              No Applications in this View Yet
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Select openings in the Match & Apply tab, and send your details to HRs in 1-click!
            </p>
          </div>
          <button
            onClick={onNavigateToMatch}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#1c1c1e] hover:bg-black text-white font-extrabold text-xs sm:text-sm shadow-sm transition-all"
          >
            <span>Explore Internship Openings</span>
            <ArrowRight className="w-4 h-4 text-[#d9f99d]" />
          </button>
        </div>
      )}

    </div>
  );
};
