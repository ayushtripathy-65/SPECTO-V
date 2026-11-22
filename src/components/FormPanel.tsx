import React from 'react';
import {
  ShieldAlert,
  Shield,
  User,
  Globe,
  AlertCircle,
  EyeOff,
  Sparkles,
  Info,
} from 'lucide-react';
import { FieldClassification, SensitivityLevel, UserFormData } from '../core/types';

interface Props {
  formData: UserFormData;
  onChange: (updated: Partial<UserFormData>) => void;
  classifications: Record<string, FieldClassification>;
  notesScan: {
    pii: any[];
    redactedText: string;
    hasHighlySensitive: boolean;
    hasSensitive: boolean;
  } | null;
  onSubmit: () => void;
  isProcessing: boolean;
}

export const FormPanel: React.FC<Props> = ({
  formData,
  onChange,
  classifications,
  notesScan,
  onSubmit,
  isProcessing,
}) => {
  // Render badge helper
  const renderBadge = (fieldName: string) => {
    const classification = classifications[fieldName];
    if (!classification) return null;

    const level = classification.level;
    let badgeStyle = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    let Icon = Globe;
    let label = 'PUBLIC';

    if (level === 'HIGHLY_SENSITIVE') {
      badgeStyle = 'bg-rose-500/15 text-rose-400 border-rose-500/30 animate-pulse';
      Icon = ShieldAlert;
      label = 'HIGHLY SENSITIVE';
    } else if (level === 'SENSITIVE') {
      badgeStyle = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      Icon = Shield;
      label = 'SENSITIVE';
    } else if (level === 'PERSONAL') {
      badgeStyle = 'bg-sky-500/15 text-sky-400 border-sky-500/30';
      Icon = User;
      label = 'PERSONAL';
    }

    return (
      <div className="group relative inline-flex items-center">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${badgeStyle} cursor-help transition-all`}
        >
          <Icon className="w-3 h-3" />
          {label}
        </span>
        {/* Tooltip */}
        <div className="absolute left-0 bottom-full mb-1 hidden group-hover:block w-56 p-2 bg-slate-900 border border-slate-700 rounded-lg text-[11px] text-slate-300 shadow-2xl z-50 pointer-events-none">
          <p className="font-semibold text-slate-100 mb-0.5">{classification.reason}</p>
          <div className="text-[10px] text-slate-400">
            Confidence: {(classification.confidence * 100).toFixed(0)}%
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <span>Loan &amp; Health Underwriting Form</span>
            <span className="text-xs font-normal text-slate-400">
              (Live Zero-Trust Classification)
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Every field is classified on-the-fly in a Web Worker thread before any network access.
          </p>
        </div>
      </div>

      <form
        onSubmit={e => {
          e.preventDefault();
          onSubmit();
        }}
        className="space-y-5"
      >
        {/* SECTION 1: Personal Identifiers */}
        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-cyan-400" />
            <span>1. Personal &amp; Identity Credentials</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Full Name */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-300">Full Name</label>
                {renderBadge('fullName')}
              </div>
              <input
                type="text"
                value={formData.fullName}
                onChange={e => onChange({ fullName: e.target.value })}
                placeholder="e.g. Priya Sharma"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg text-xs text-slate-100 outline-none transition"
              />
            </div>

            {/* National ID / Aadhaar */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-300">
                  National ID / Aadhaar / SSN
                </label>
                {renderBadge('nationalId')}
              </div>
              <input
                type="text"
                value={formData.nationalId}
                onChange={e => onChange({ nationalId: e.target.value })}
                placeholder="e.g. 5421 8902 3341"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg text-xs text-slate-100 outline-none transition"
              />
            </div>

            {/* Email */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-300">Email Address</label>
                {renderBadge('email')}
              </div>
              <input
                type="email"
                value={formData.email}
                onChange={e => onChange({ email: e.target.value })}
                placeholder="user@example.com"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg text-xs text-slate-100 outline-none transition"
              />
            </div>

            {/* Phone */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-300">Phone Number</label>
                {renderBadge('phone')}
              </div>
              <input
                type="tel"
                value={formData.phone}
                onChange={e => onChange({ phone: e.target.value })}
                placeholder="+1 555-019-2834"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg text-xs text-slate-100 outline-none transition"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: Financial Liability & Underwriting */}
        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>2. Financial &amp; Demographic Metrics</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
            {/* DOB */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-300">Birth Date</label>
                {renderBadge('dob')}
              </div>
              <input
                type="date"
                value={formData.dob}
                onChange={e => onChange({ dob: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg text-xs text-slate-100 outline-none transition"
              />
            </div>

            {/* Monthly Income */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-300">Monthly Income ($)</label>
                {renderBadge('monthlyIncome')}
              </div>
              <input
                type="number"
                min="0"
                step="100"
                value={formData.monthlyIncome}
                onChange={e => onChange({ monthlyIncome: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg text-xs text-slate-100 outline-none transition"
              />
            </div>

            {/* Existing Debt */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-300">Existing Debt / EMI ($)</label>
                {renderBadge('existingDebt')}
              </div>
              <input
                type="number"
                min="0"
                step="50"
                value={formData.existingDebt}
                onChange={e => onChange({ existingDebt: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg text-xs text-slate-100 outline-none transition"
              />
            </div>

            {/* Credit History Years */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-300">Credit History (Yrs)</label>
                {renderBadge('creditHistoryYears')}
              </div>
              <input
                type="number"
                min="0"
                max="50"
                value={formData.creditHistoryYears}
                onChange={e => onChange({ creditHistoryYears: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg text-xs text-slate-100 outline-none transition"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: Biometric & Health */}
        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>3. Biometrics &amp; Health Conditions</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5 items-center">
            {/* Height */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-300">Height (cm)</label>
                {renderBadge('heightCm')}
              </div>
              <input
                type="number"
                min="100"
                max="250"
                value={formData.heightCm}
                onChange={e => onChange({ heightCm: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg text-xs text-slate-100 outline-none transition"
              />
            </div>

            {/* Weight */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-300">Weight (kg)</label>
                {renderBadge('weightKg')}
              </div>
              <input
                type="number"
                min="30"
                max="250"
                value={formData.weightKg}
                onChange={e => onChange({ weightKg: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg text-xs text-slate-100 outline-none transition"
              />
            </div>

            {/* Diabetes Check */}
            <div className="flex flex-col justify-center">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-slate-300">Diabetes</span>
                {renderBadge('hasDiabetes')}
              </div>
              <label className="flex items-center gap-2 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={formData.hasDiabetes}
                  onChange={e => onChange({ hasDiabetes: e.target.checked })}
                  className="rounded text-cyan-500 focus:ring-0"
                />
                <span className="text-xs text-slate-300">Diagnosed</span>
              </label>
            </div>

            {/* Hypertension Check */}
            <div className="flex flex-col justify-center">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-slate-300">Hypertension</span>
                {renderBadge('hasHypertension')}
              </div>
              <label className="flex items-center gap-2 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={formData.hasHypertension}
                  onChange={e => onChange({ hasHypertension: e.target.checked })}
                  className="rounded text-cyan-500 focus:ring-0"
                />
                <span className="text-xs text-slate-300">High BP</span>
              </label>
            </div>

            {/* Smoker Check */}
            <div className="flex flex-col justify-center">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-slate-300">Smoker</span>
                {renderBadge('isSmoker')}
              </div>
              <label className="flex items-center gap-2 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={formData.isSmoker}
                  onChange={e => onChange({ isSmoker: e.target.checked })}
                  className="rounded text-cyan-500 focus:ring-0"
                />
                <span className="text-xs text-slate-300">Tobacco</span>
              </label>
            </div>
          </div>
        </div>

        {/* SECTION 4: Free-Text Notes with Deep PII Scanner */}
        <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-200">
                Additional Notes / Special Instructions
              </label>
              <span className="text-[10px] text-slate-400">
                (Simulate typing phone numbers, emails, or SSNs)
              </span>
            </div>
            {renderBadge('additionalNotes')}
          </div>

          <textarea
            rows={2}
            value={formData.additionalNotes}
            onChange={e => onChange({ additionalNotes: e.target.value })}
            placeholder="Type anything here... e.g. 'Call my cell at 555-019-2834 or email john@secret.com'"
            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-lg text-xs text-slate-100 outline-none transition font-sans"
          />

          {/* Live PII Detection & Redaction Preview */}
          {notesScan && notesScan.pii.length > 0 && (
            <div className="bg-rose-950/40 border border-rose-800/60 rounded-lg p-2.5 text-xs space-y-1.5 animate-fadeIn">
              <div className="flex items-center justify-between text-rose-300 font-semibold text-[11px]">
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Hidden PII Detected in Unstructured Text!</span>
                </div>
                <span className="text-[10px] bg-rose-900/60 px-2 py-0.5 rounded text-rose-200">
                  {notesScan.pii.length} pattern(s) flagged
                </span>
              </div>

              {/* Badges of detected types */}
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {notesScan.pii.map((p, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-rose-900/80 text-rose-200 rounded text-[10px] font-mono border border-rose-700/50"
                  >
                    {p.type}: &quot;{p.value}&quot;
                  </span>
                ))}
              </div>

              {/* Redaction preview */}
              <div className="pt-1 border-t border-rose-900/40">
                <span className="text-[10px] text-rose-300 block mb-0.5 font-medium flex items-center gap-1">
                  <EyeOff className="w-3 h-3 text-rose-400" />
                  <span>Zero-Trust Auto-Redacted Form (Client-Side Safe):</span>
                </span>
                <p className="font-mono text-[11px] text-emerald-300/90 bg-slate-950/80 p-2 rounded border border-emerald-900/30 break-all">
                  {notesScan.redactedText}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={isProcessing}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-500/20 transition disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isProcessing ? 'Processing in Worker...' : 'Execute Zero-Trust Pipeline'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
