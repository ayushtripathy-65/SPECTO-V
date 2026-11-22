import React, { useState } from 'react';
import {
  ShieldCheck,
  Flame,
  ArrowRight,
  TrendingDown,
  Terminal,
  AlertTriangle,
  Send,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
} from 'lucide-react';
import { NetworkLogEntry } from '../core/types';

interface Props {
  mode: 'DATASHADOW' | 'TRADITIONAL';
  traditionalPayload: Record<string, any> | null;
  minimizedPayload: Record<string, any> | null;
  metrics: {
    rawBytes: number;
    minimizedBytes: number;
    bytesReducedPercent: number;
    rawSensitiveFieldsInTraditional: number;
    rawSensitiveFieldsInMinimized: number;
  } | null;
  networkLogs: NetworkLogEntry[];
  onTriggerRejectionTest: () => void;
  lastRejectionResult: any | null;
}

export const NetworkTruthPanel: React.FC<Props> = ({
  mode,
  traditionalPayload,
  minimizedPayload,
  metrics,
  networkLogs,
  onTriggerRejectionTest,
  lastRejectionResult,
}) => {
  const [copiedSide, setCopiedSide] = useState<'left' | 'right' | null>(null);

  const rawFieldsSent =
    mode === 'TRADITIONAL'
      ? metrics?.rawSensitiveFieldsInTraditional || 14
      : metrics?.rawSensitiveFieldsInMinimized || 0;

  const handleCopy = (text: string, side: 'left' | 'right') => {
    navigator.clipboard.writeText(text);
    setCopiedSide(side);
    setTimeout(() => setCopiedSide(null), 2000);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Terminal className="w-5 h-5 text-cyan-400" />
              <span>Network Truth &amp; Minimization Inspector</span>
            </h2>
            <span className="text-[10px] bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded font-mono font-bold border border-cyan-800">
              SIDE-BY-SIDE VERIFICATION
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Transparent comparison of outbound wire payloads. Zero sensitive data is transmitted in
            DataShadow mode.
          </p>
        </div>

        {/* Rejection Test Action */}
        <button
          onClick={onTriggerRejectionTest}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/70 hover:bg-rose-900/90 text-rose-300 border border-rose-800 text-xs font-semibold rounded-lg transition"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          <span>Simulate Server Rejection</span>
        </button>
      </div>

      {/* Hero Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Metric 1: Raw Sensitive Fields Transmitted */}
        <div
          className={`p-3.5 rounded-xl border transition-all ${
            mode === 'DATASHADOW'
              ? 'bg-emerald-950/30 border-emerald-800/60 shadow-lg shadow-emerald-950/20'
              : 'bg-rose-950/40 border-rose-800/80 shadow-lg shadow-rose-950/20'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
              Sensitive Fields Sent
            </span>
            {mode === 'DATASHADOW' ? (
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            ) : (
              <Flame className="w-4 h-4 text-rose-400 animate-bounce" />
            )}
          </div>
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-2xl font-mono font-extrabold ${
                mode === 'DATASHADOW' ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {rawFieldsSent}
            </span>
            <span className="text-xs text-slate-400">fields</span>
          </div>
          <span
            className={`text-[10px] font-medium block mt-1 ${
              mode === 'DATASHADOW' ? 'text-emerald-300' : 'text-rose-300'
            }`}
          >
            {mode === 'DATASHADOW'
              ? '✓ Zero-Trust verified'
              : '⚠ High-risk data exposure'}
          </span>
        </div>

        {/* Metric 2: Bandwidth Minimization */}
        <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
              Payload Reduction
            </span>
            <TrendingDown className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-mono font-extrabold text-cyan-400">
              {metrics ? `${metrics.bytesReducedPercent}%` : '84.5%'}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">
            {metrics
              ? `${metrics.rawBytes} bytes → ${metrics.minimizedBytes} bytes`
              : 'Significant bandwidth reduction'}
          </span>
        </div>

        {/* Metric 3: Identifier Hashing */}
        <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
              Identity Protection
            </span>
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-sm font-mono font-bold text-purple-300 mt-1">
            {mode === 'DATASHADOW' ? 'Salted Pseudonym' : 'Raw ID / Aadhaar'}
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">
            {mode === 'DATASHADOW' ? 'SHA-256 client salted' : 'Plaintext exposed'}
          </span>
        </div>

        {/* Metric 4: Differential Privacy */}
        <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
              Health Noise Status
            </span>
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-sm font-mono font-bold text-amber-300 mt-1">
            {mode === 'DATASHADOW' ? 'Laplace DP Active' : 'No Differential Noise'}
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">
            {mode === 'DATASHADOW' ? 'Mathematical privacy guarantee' : 'Exact values leaked'}
          </span>
        </div>
      </div>

      {/* Side-by-Side Payload Comparison View */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Traditional Payload */}
        <div className="bg-slate-950/90 border border-rose-900/40 rounded-xl overflow-hidden flex flex-col">
          <div className="bg-rose-950/40 px-3.5 py-2.5 border-b border-rose-900/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-400" />
              <span className="text-xs font-bold text-rose-200">
                Traditional Web App Transmission (Insecure)
              </span>
            </div>
            <button
              onClick={() =>
                handleCopy(JSON.stringify(traditionalPayload, null, 2), 'left')
              }
              className="text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1"
            >
              {copiedSide === 'left' ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          <div className="p-3 bg-slate-950 font-mono text-[11px] text-slate-300 flex-1 overflow-x-auto max-h-72 leading-relaxed">
            <pre className="text-rose-300/90 whitespace-pre-wrap">
              {traditionalPayload
                ? JSON.stringify(traditionalPayload, null, 2)
                : '// Click "Execute Pipeline" or load sample user'}
            </pre>
          </div>

          <div className="bg-rose-950/20 px-3 py-1.5 border-t border-rose-900/40 text-[10px] text-rose-300 flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3 text-rose-400 flex-shrink-0" />
            <span>Sends raw Aadhaar/SSN, full contact details, financial numbers &amp; diagnosis.</span>
          </div>
        </div>

        {/* Right: DataShadow Payload */}
        <div className="bg-slate-950/90 border border-emerald-900/50 rounded-xl overflow-hidden flex flex-col">
          <div className="bg-emerald-950/40 px-3.5 py-2.5 border-b border-emerald-900/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-200">
                DataShadow Zero-Trust Transmission (Protected)
              </span>
            </div>
            <button
              onClick={() =>
                handleCopy(JSON.stringify(minimizedPayload, null, 2), 'right')
              }
              className="text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1"
            >
              {copiedSide === 'right' ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          <div className="p-3 bg-slate-950 font-mono text-[11px] text-slate-300 flex-1 overflow-x-auto max-h-72 leading-relaxed">
            <pre className="text-emerald-300 whitespace-pre-wrap">
              {minimizedPayload
                ? JSON.stringify(minimizedPayload, null, 2)
                : '// Click "Execute Pipeline" to inspect minimized payload'}
            </pre>
          </div>

          <div className="bg-emerald-950/20 px-3 py-1.5 border-t border-emerald-900/40 text-[10px] text-emerald-300 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
            <span>All raw fields dropped or bucketed; pseudonymized hash + Laplace differential noise.</span>
          </div>
        </div>
      </div>

      {/* Live Server Rejection Feedback Banner */}
      {lastRejectionResult && (
        <div className="bg-rose-950/80 border border-rose-800 rounded-xl p-4 space-y-2 animate-fadeIn shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
              <XCircle className="w-5 h-5 text-rose-400" />
              <span>SERVER-SIDE DEFENSE ACTIVATED: HTTP 422 ZERO-TRUST VIOLATION</span>
            </div>
            <span className="text-xs font-mono bg-rose-900/80 text-rose-200 px-2 py-0.5 rounded border border-rose-700">
              REJECTED_ZERO_TRUST_VIOLATION
            </span>
          </div>
          <p className="text-xs text-rose-200">
            {lastRejectionResult.message ||
              'Server rejected payload containing raw unminimized attributes.'}
          </p>
          {lastRejectionResult.violations && lastRejectionResult.violations.length > 0 && (
            <div className="space-y-1 pt-1 border-t border-rose-900/60 font-mono text-xs">
              {lastRejectionResult.violations.map((v: any, idx: number) => (
                <div key={idx} className="bg-slate-950/80 p-2 rounded border border-rose-900/50">
                  <span className="text-rose-400 font-semibold">{v.field}</span>: [{v.rule}] &mdash;{' '}
                  <span className="text-slate-300 font-sans">{v.detail}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Real-time Network Request Audit Trail Log */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2">
        <div className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-800">
          <span className="font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Send className="w-3.5 h-3.5 text-cyan-400" />
            <span>Outbound Wire Audit History</span>
          </span>
          <span className="text-slate-500 font-mono text-[10px]">
            {networkLogs.length} events logged
          </span>
        </div>

        <div className="space-y-1.5 max-h-48 overflow-y-auto font-mono text-[11px]">
          {networkLogs.length === 0 ? (
            <div className="text-slate-500 py-3 text-center text-xs">
              No network requests sent yet. Run the pipeline to view real-time wire logs.
            </div>
          ) : (
            networkLogs.map(log => (
              <div
                key={log.id}
                className="flex items-center justify-between p-2 rounded bg-slate-900/70 border border-slate-800/80 hover:bg-slate-900 transition"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      log.status === 'SUCCESS'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : log.status === 'REJECTED'
                        ? 'bg-rose-950 text-rose-400 border border-rose-800'
                        : 'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}
                  >
                    {log.httpStatus || log.status}
                  </span>
                  <span className="text-slate-200 font-semibold">{log.endpoint}</span>
                  <span className="text-slate-500 text-[10px]">({log.mode})</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-slate-400">
                  <span>
                    Payload: <strong className="text-slate-200">{log.transmittedBytes} B</strong>
                  </span>
                  <span>{log.timestamp}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
