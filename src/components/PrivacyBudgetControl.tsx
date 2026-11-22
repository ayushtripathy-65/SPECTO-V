import React from 'react';
import { Sliders, Shield, Zap } from 'lucide-react';

interface Props {
  epsilon: number;
  onChange: (val: number) => void;
  noisedValue?: number;
  rawScore?: number;
}

export const PrivacyBudgetControl: React.FC<Props> = ({
  epsilon,
  onChange,
  noisedValue,
  rawScore = 35,
}) => {
  // Laplace scale b = delta_f / epsilon
  const sensitivity = 10;
  const scale = Math.round((sensitivity / epsilon) * 10) / 10;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg backdrop-blur">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
              Differential Privacy Budget (<span className="font-mono text-indigo-400">&epsilon; = {epsilon.toFixed(1)}</span>)
            </h3>
            <p className="text-xs text-slate-400">
              Calibrated Laplace noise mechanism applied to aggregated health index
            </p>
          </div>
        </div>
        <div className="text-right">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
              epsilon < 0.8
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : epsilon < 1.8
                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            {epsilon < 0.8 ? 'Ultra-High Privacy' : epsilon < 1.8 ? 'Balanced Privacy' : 'High Precision'}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-4">
          <span className="text-xs font-medium text-slate-400 min-w-[70px]">Strict (&epsilon;=0.2)</span>
          <input
            type="range"
            min="0.2"
            max="3.0"
            step="0.1"
            value={epsilon}
            onChange={e => onChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <span className="text-xs font-medium text-slate-400 min-w-[70px] text-right">Relaxed (&epsilon;=3.0)</span>
        </div>

        {/* Live metric preview */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-xs">
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 block mb-0.5">Noise Scale (b):</span>
            <span className="font-mono font-semibold text-indigo-300">
              b = &Delta;f / &epsilon; = {scale}
            </span>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 block mb-0.5">True Local Risk:</span>
            <span className="font-mono font-semibold text-slate-200">{rawScore} pts</span>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 block mb-0.5">Transmitted Risk (Noised):</span>
            <span className="font-mono font-semibold text-emerald-400">
              {noisedValue !== undefined ? `${noisedValue} pts` : `${rawScore} pts`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
