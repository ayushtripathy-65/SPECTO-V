import React from 'react';
import {
  Award,
  CheckCircle2,
  TrendingUp,
  HeartPulse,
  DollarSign,
  Percent,
  ShieldCheck,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { ReconstructedResults } from '../core/types';

interface Props {
  results: ReconstructedResults | null;
  mode: 'DATASHADOW' | 'TRADITIONAL';
}

export const ResultsCard: React.FC<Props> = ({ results, mode }) => {
  if (!results) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 text-center shadow-xl">
        <Sparkles className="w-8 h-8 text-cyan-400 mx-auto mb-2 opacity-60" />
        <h3 className="text-sm font-semibold text-slate-200">Awaiting Pipeline Execution</h3>
        <p className="text-xs text-slate-400 mt-1">
          Fill in the underwriting form or click &quot;Load Sample User&quot; above to view merged
          local + server results.
        </p>
      </div>
    );
  }

  const { local, benchmark, premium, finalScoreMerged, finalRecommendation } = results;

  return (
    <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-cyan-500/30 rounded-2xl p-6 shadow-2xl space-y-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-6 h-6 text-cyan-400" />
            <h2 className="text-lg font-extrabold text-slate-100 tracking-tight">
              Reconstructed Evaluation &amp; Underwriting
            </h2>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
              MERGED RESULT
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Computed on-client by synthesizing local metrics with anonymous population percentiles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1 bg-cyan-950/80 border border-cyan-800/80 text-cyan-300 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 shadow-inner">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Zero Raw Sensitive Data Exposed</span>
          </div>
        </div>
      </div>

      {/* Main Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Merged Final Score */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 relative group hover:border-cyan-500/50 transition">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold uppercase tracking-wider">Merged Credit Score</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-cyan-300">
              {finalScoreMerged}
            </span>
            <span className="text-xs font-bold text-slate-400">/ 850</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                local.loanApprovalTier === 'PRIME'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : local.loanApprovalTier === 'NEAR_PRIME'
                  ? 'bg-blue-950 text-blue-300 border border-blue-800'
                  : 'bg-amber-950 text-amber-300 border border-amber-800'
              }`}
            >
              {local.loanApprovalTier} TIER
            </span>
            <span className="text-[10px] text-slate-400">Local base: {local.loanEligibilityScore}</span>
          </div>
        </div>

        {/* Card 2: Population Percentile Benchmark */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 hover:border-indigo-500/50 transition">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold uppercase tracking-wider">Cohort Percentile</span>
            <Percent className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold font-mono text-indigo-300">
              {benchmark ? `${benchmark.populationPercentile}th` : 'Pending'}
            </span>
            <span className="text-xs text-slate-400">percentile</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-2 truncate">
            {benchmark ? (
              <span>
                Quartile {benchmark.riskQuartile} &bull; Cohort Size: {benchmark.cohortSize}
              </span>
            ) : (
              'Awaiting server sync'
            )}
          </div>
        </div>

        {/* Card 3: Debt-To-Income (DTI) */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 hover:border-emerald-500/50 transition">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold uppercase tracking-wider">Debt-To-Income</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold font-mono text-emerald-300">
              {local.debtToIncomeRatio}%
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                local.dtiStatus === 'HEALTHY'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : local.dtiStatus === 'MODERATE'
                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                  : 'bg-rose-950 text-rose-300 border border-rose-800'
              }`}
            >
              {local.dtiStatus}
            </span>
            {benchmark && (
              <span className="text-[10px] text-slate-400">
                Avg: {benchmark.cohortAverageDti}%
              </span>
            )}
          </div>
        </div>

        {/* Card 4: Insurance Premium Band */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 hover:border-amber-500/50 transition">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold uppercase tracking-wider">Insurance Premium</span>
            <HeartPulse className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold font-mono text-amber-300">
              {premium ? `$${premium.baseAnnualRateUsd}` : '$1,100'}
            </span>
            <span className="text-xs text-slate-400">/ yr</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
              {premium?.premiumBand || 'STANDARD'}
            </span>
            <span className="text-[10px] text-slate-400">BMI {local.bmi} ({local.bmiCategory})</span>
          </div>
        </div>
      </div>

      {/* Merged Recommendation Box */}
      <div className="bg-slate-950/90 border border-slate-800/90 rounded-xl p-4 flex items-start gap-3">
        <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg mt-0.5">
          <CheckCircle2 className="w-5 h-5 text-cyan-400" />
        </div>
        <div className="flex-1 space-y-1">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Reconstructed Zero-Trust Verdict:
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">{finalRecommendation}</p>
        </div>
      </div>

      {/* Architecture Proof Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
        <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 space-y-1">
          <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Computed On-Device (In Client Web Worker):
          </span>
          <p className="text-slate-400 text-[11px]">
            &bull; Raw Credit Score ({local.loanEligibilityScore}) &bull; DTI Ratio ({local.debtToIncomeRatio}%)
            &bull; BMI ({local.bmi}) &bull; KYC format verification &bull; Laplace Noise Generation
          </p>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 space-y-1">
          <span className="font-semibold text-indigo-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Supplied By Server (Zero Raw Identity):
          </span>
          <p className="text-slate-400 text-[11px]">
            &bull; Cohort Percentile ({benchmark?.populationPercentile ?? 82}th) &bull; Cohort Approval Rate
            ({benchmark?.cohortLoanApprovalRate ?? 78}%) &bull; Base Actuarial Premium Rates
          </p>
        </div>
      </div>
    </div>
  );
};
