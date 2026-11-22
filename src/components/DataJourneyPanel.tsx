import React, { useState } from 'react';
import {
  ShieldCheck,
  Cpu,
  Cloud,
  Layers,
  ArrowRight,
  Filter,
  Key,
  Shield,
  EyeOff,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { ExecutionTarget, TaskDecision, TransformationTechnique } from '../core/types';

interface Props {
  decisions: TaskDecision[];
  mode: 'DATASHADOW' | 'TRADITIONAL';
}

export const DataJourneyPanel: React.FC<Props> = ({ decisions, mode }) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string>('all');

  const filteredDecisions =
    selectedTaskId === 'all'
      ? decisions
      : decisions.filter(d => d.taskId === selectedTaskId);

  // Technique badge renderer
  const renderTechniqueBadge = (technique: TransformationTechnique) => {
    switch (technique) {
      case 'STAYED_LOCAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Cpu className="w-3 h-3" />
            STAYED LOCAL
          </span>
        );
      case 'GENERALIZED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Filter className="w-3 h-3" />
            GENERALIZED
          </span>
        );
      case 'HASHED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Key className="w-3 h-3" />
            SALTED HASH
          </span>
        );
      case 'AGGREGATED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Layers className="w-3 h-3" />
            AGGREGATED
          </span>
        );
      case 'NOISED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Sparkles className="w-3 h-3" />
            LAPLACE NOISED
          </span>
        );
      case 'DROPPED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <EyeOff className="w-3 h-3" />
            DROPPED (EXCLUDED)
          </span>
        );
      default:
        return null;
    }
  };

  const renderTargetBadge = (target: ExecutionTarget) => {
    if (mode === 'TRADITIONAL') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
          <Cloud className="w-3.5 h-3.5" />
          REMOTE (RAW UNSECURED)
        </span>
      );
    }

    if (target === 'LOCAL') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
          <Cpu className="w-3.5 h-3.5" />
          LOCAL (100% IN-BROWSER)
        </span>
      );
    }

    if (target === 'HYBRID') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
          <Layers className="w-3.5 h-3.5" />
          HYBRID (MINIMIZED REMOTE)
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30">
        <Cloud className="w-3.5 h-3.5" />
        REMOTE
      </span>
    );
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              <span>The Data Journey Panel</span>
            </h2>
            <span className="text-[10px] bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded font-mono font-bold border border-cyan-800">
              AUDIT TRAIL
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time execution decisions, sensitivity mapping, and data minimization techniques.
          </p>
        </div>

        {/* Task filter tabs */}
        <div className="flex flex-wrap gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setSelectedTaskId('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
              selectedTaskId === 'all'
                ? 'bg-slate-800 text-cyan-300 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Tasks ({decisions.length})
          </button>
          {decisions.map(d => (
            <button
              key={d.taskId}
              onClick={() => setSelectedTaskId(d.taskId)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition truncate max-w-[130px] ${
                selectedTaskId === d.taskId
                  ? 'bg-slate-800 text-cyan-300 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {d.taskName.split('&')[0].trim()}
            </button>
          ))}
        </div>
      </div>

      {/* Task Cards */}
      <div className="space-y-4">
        {filteredDecisions.map(decision => (
          <div
            key={decision.taskId}
            className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-4 space-y-3 transition hover:border-slate-700"
          >
            {/* Task Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800/70">
              <div>
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <span>{decision.taskName}</span>
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  TaskId: {decision.taskId} &bull; Inputs: [{decision.requiredFields.join(', ')}]
                </span>
              </div>
              <div>{renderTargetBadge(decision.target)}</div>
            </div>

            {/* Human-Readable Explanation Box */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 text-xs flex items-start gap-2.5">
              <div className="p-1.5 bg-cyan-500/10 text-cyan-400 rounded mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <span className="font-semibold text-slate-200 block mb-0.5">
                  Automated Decision Engine Rationale:
                </span>
                <p className="text-slate-400 leading-relaxed">
                  {mode === 'TRADITIONAL'
                    ? 'TRADITIONAL ARCHITECTURE: All raw fields, sensitive diagnosis flags, and direct identifiers are sent unencrypted to backend server without client-side minimization.'
                    : decision.reason}
                </p>
              </div>
            </div>

            {/* Field Transformation Table */}
            <div className="overflow-x-auto rounded-lg border border-slate-800/80">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-[11px] text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-3">Field</th>
                    <th className="py-2 px-3">Sensitivity</th>
                    <th className="py-2 px-3">What Happened</th>
                    <th className="py-2 px-3">Transmitted Value</th>
                    <th className="py-2 px-3">Zero-Trust Rationale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {decision.transformations.map((t, idx) => {
                    const isTraditional = mode === 'TRADITIONAL';
                    const displayTechnique = isTraditional ? 'UNMODIFIED' : t.technique;
                    const displayTransmitted = isTraditional
                      ? t.originalSample
                      : t.transformedSample;

                    return (
                      <tr key={idx} className="hover:bg-slate-900/50 transition">
                        {/* Field */}
                        <td className="py-2 px-3 font-semibold text-slate-200">{t.fieldName}</td>

                        {/* Sensitivity */}
                        <td className="py-2 px-3">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              t.sensitivity === 'HIGHLY_SENSITIVE'
                                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                : t.sensitivity === 'SENSITIVE'
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : 'bg-sky-950 text-sky-300 border border-sky-800'
                            }`}
                          >
                            {t.sensitivity}
                          </span>
                        </td>

                        {/* What happened */}
                        <td className="py-2 px-3">
                          {isTraditional ? (
                            <span className="text-[10px] text-rose-400 font-bold bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800">
                              SENT RAW
                            </span>
                          ) : (
                            renderTechniqueBadge(t.technique)
                          )}
                        </td>

                        {/* Transmitted Value */}
                        <td className="py-2 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] ${
                              isTraditional
                                ? 'text-rose-300 bg-rose-950/60 border border-rose-900'
                                : displayTransmitted.includes('DROPPED') ||
                                  displayTransmitted.includes('KEPT')
                                ? 'text-slate-500 italic bg-slate-900'
                                : 'text-emerald-400 bg-emerald-950/60 border border-emerald-900'
                            }`}
                          >
                            {displayTransmitted}
                          </span>
                        </td>

                        {/* Rationale */}
                        <td className="py-2 px-3 font-sans text-slate-400 text-[11px]">
                          {isTraditional
                            ? 'Transmitted raw without transformation (Insecure traditional architecture)'
                            : t.explanation}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
