import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { FormPanel } from './components/FormPanel';
import { DataJourneyPanel } from './components/DataJourneyPanel';
import { NetworkTruthPanel } from './components/NetworkTruthPanel';
import { ResultsCard } from './components/ResultsCard';
import { PrivacyBudgetControl } from './components/PrivacyBudgetControl';
import { SAMPLE_PROFILES, PresetProfile } from './mock/sampleUsers';
import { useComputeWorker } from './hooks/useComputeWorker';
import { useNetworkQueue, QueuedRequest } from './hooks/useNetworkQueue';
import {
  NetworkLogEntry,
  ReconstructedResults,
  ServerBenchmarkResponse,
  ServerPremiumResponse,
  UserFormData,
} from './core/types';
import { reconstructResults } from './core/reconstructor';
import { classifyAllFields, scanAndRedactText } from './core/classifier';
import { evaluateAllTasks } from './core/decisionEngine';
import { computeAllLocalFeatures } from './core/localCompute';

export function App() {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  // Mode: DataShadow Zero-Trust vs Traditional Send-All
  const [mode, setMode] = useState<'DATASHADOW' | 'TRADITIONAL'>('DATASHADOW');

  // Privacy budget epsilon for Laplace differential privacy noise
  const [epsilon, setEpsilon] = useState<number>(1.0);

  // Form data state initialized with default realistic applicant
  const [formData, setFormData] = useState<UserFormData>(SAMPLE_PROFILES[0].data);

  // Network logs history
  const [networkLogs, setNetworkLogs] = useState<NetworkLogEntry[]>([]);

  // Last server rejection response for demo display
  const [lastRejectionResult, setLastRejectionResult] = useState<any | null>(null);

  // Server results
  const [benchmarkResponse, setBenchmarkResponse] = useState<ServerBenchmarkResponse | null>(null);
  const [premiumResponse, setPremiumResponse] = useState<ServerPremiumResponse | null>(null);

  // Reconstructed final results
  const [reconstructed, setReconstructed] = useState<ReconstructedResults | null>(null);

  // Web Worker hook
  const { workerReady, isProcessing, pipelineOutput, runPipeline } = useComputeWorker();

  // Network queue handler callback
  const handleDrainQueuedRequest = useCallback(async (req: QueuedRequest): Promise<boolean> => {
    try {
      const res = await fetch(req.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.payload),
      });
      const data = await res.json();
      if (res.ok) {
        if (req.endpoint.includes('benchmark')) {
          setBenchmarkResponse(data.data);
        } else if (req.endpoint.includes('insurance')) {
          setPremiumResponse(data.data);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  // Network status & queue hook
  const {
    effectiveOnline,
    isSimulatedOffline,
    setIsSimulatedOffline,
    lastPingTime,
    queuedRequests,
    enqueueRequest,
  } = useNetworkQueue(handleDrainQueuedRequest);

  // Trigger worker pipeline whenever formData, effectiveOnline, or epsilon changes
  useEffect(() => {
    runPipeline(formData, effectiveOnline, epsilon);
  }, [formData, effectiveOnline, epsilon, runPipeline]);

  // Sync classifications and decisions from worker output (or fallback to synchronous if worker is booting)
  const classifications =
    pipelineOutput?.classifications || classifyAllFields(formData);
  const notesScan =
    pipelineOutput?.notesScan || scanAndRedactText(formData.additionalNotes);
  const decisions =
    pipelineOutput?.decisions || evaluateAllTasks(formData, effectiveOnline);
  const localResults =
    pipelineOutput?.localResults || computeAllLocalFeatures(formData);

  // Update reconstructed results whenever localResults, benchmarkResponse, or premiumResponse change
  useEffect(() => {
    if (localResults) {
      const result = reconstructResults(
        localResults,
        benchmarkResponse || undefined,
        premiumResponse || undefined,
        epsilon
      );
      setReconstructed(result);
    }
  }, [localResults, benchmarkResponse, premiumResponse, epsilon]);

  // Handle form change
  const handleFormChange = (updated: Partial<UserFormData>) => {
    setFormData(prev => ({ ...prev, ...updated }));
  };

  // Profile loader
  const handleSelectProfile = (profile: PresetProfile) => {
    setFormData(profile.data);
    setLastRejectionResult(null);
  };

  // Main pipeline execution / wire submission
  const handleExecutePipeline = async () => {
    if (!pipelineOutput) {
      runPipeline(formData, effectiveOnline, epsilon);
      return;
    }

    const { benchmarkPayload, premiumPayload, traditionalPayload, metrics } = pipelineOutput;

    if (mode === 'DATASHADOW') {
      // ZERO-TRUST MODE
      if (!effectiveOnline) {
        // Queue both minimized requests locally
        enqueueRequest('/api/benchmark', benchmarkPayload, 'Cohort Benchmark');
        enqueueRequest('/api/insurance-premium', premiumPayload, 'Actuarial Premium Band');

        const logEntry: NetworkLogEntry = {
          id: `log_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          endpoint: '/api/benchmark',
          mode: 'DATASHADOW',
          status: 'QUEUED',
          rawPayload: traditionalPayload,
          transmittedPayload: benchmarkPayload,
          rawFieldCount: Object.keys(traditionalPayload).length,
          transmittedFieldCount: Object.keys(benchmarkPayload).length,
          rawBytes: metrics.rawBytes,
          transmittedBytes: metrics.minimizedBytes,
          bytesReducedPercent: metrics.bytesReducedPercent,
          rawSensitiveFieldsCount: 0,
        };
        setNetworkLogs(prev => [logEntry, ...prev]);
        return;
      }

      // Online: send benchmark request
      try {
        const start = performance.now();
        const bRes = await fetch('/api/benchmark', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(benchmarkPayload),
        });
        const bData = await bRes.json();
        const duration = Math.round(performance.now() - start);

        if (bRes.ok && bData.data) {
          setBenchmarkResponse(bData.data);
        }

        // Send premium request
        const pRes = await fetch('/api/insurance-premium', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(premiumPayload),
        });
        const pData = await pRes.json();
        if (pRes.ok && pData.data) {
          setPremiumResponse(pData.data);
        }

        const logEntry: NetworkLogEntry = {
          id: `log_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          endpoint: '/api/benchmark',
          mode: 'DATASHADOW',
          status: bRes.ok ? 'SUCCESS' : 'REJECTED',
          httpStatus: bRes.status,
          rawPayload: traditionalPayload,
          transmittedPayload: benchmarkPayload,
          rawFieldCount: Object.keys(traditionalPayload).length,
          transmittedFieldCount: Object.keys(benchmarkPayload).length,
          rawBytes: metrics.rawBytes,
          transmittedBytes: metrics.minimizedBytes,
          bytesReducedPercent: metrics.bytesReducedPercent,
          rawSensitiveFieldsCount: 0,
          response: bData,
          durationMs: duration,
        };
        setNetworkLogs(prev => [logEntry, ...prev]);
      } catch (err: any) {
        console.error('Network request failed:', err);
      }
    } else {
      // TRADITIONAL INSECURE MODE: Sends every raw field
      try {
        const start = performance.now();
        const res = await fetch('/api/traditional-submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(traditionalPayload),
        });
        const data = await res.json();
        const duration = Math.round(performance.now() - start);

        const logEntry: NetworkLogEntry = {
          id: `log_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          endpoint: '/api/traditional-submit',
          mode: 'TRADITIONAL',
          status: res.ok ? 'SUCCESS' : 'FAILED',
          httpStatus: res.status,
          rawPayload: traditionalPayload,
          transmittedPayload: traditionalPayload,
          rawFieldCount: Object.keys(traditionalPayload).length,
          transmittedFieldCount: Object.keys(traditionalPayload).length,
          rawBytes: metrics.rawBytes,
          transmittedBytes: metrics.rawBytes,
          bytesReducedPercent: 0,
          rawSensitiveFieldsCount: metrics.rawSensitiveFieldsInTraditional,
          response: data,
          durationMs: duration,
        };
        setNetworkLogs(prev => [logEntry, ...prev]);
      } catch (err: any) {
        console.error('Traditional submit failed:', err);
      }
    }
  };

  // Demo action: Trigger deliberate server-side rejection
  const handleTriggerRejectionTest = async () => {
    // Deliberately send raw sensitive fields to zero-trust minimized endpoint
    const dirtyPayload = {
      clientSaltedHash: 'ds_test_probe_99',
      nationalId: formData.nationalId || '4123 4567 8901',
      email: formData.email || 'victim@unencrypted.org',
      monthlyIncome: 12500, // Raw number!
      notes: 'Customer SSN is 123-45-6789 with severe diabetic history.',
    };

    try {
      const res = await fetch('/api/benchmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dirtyPayload),
      });
      const data = await res.json();
      setLastRejectionResult(data);

      const logEntry: NetworkLogEntry = {
        id: `log_rej_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        endpoint: '/api/benchmark',
        mode: 'DATASHADOW',
        status: 'REJECTED',
        httpStatus: res.status,
        rawPayload: dirtyPayload,
        transmittedPayload: dirtyPayload,
        rawFieldCount: Object.keys(dirtyPayload).length,
        transmittedFieldCount: Object.keys(dirtyPayload).length,
        rawBytes: new TextEncoder().encode(JSON.stringify(dirtyPayload)).length,
        transmittedBytes: new TextEncoder().encode(JSON.stringify(dirtyPayload)).length,
        bytesReducedPercent: 0,
        rawSensitiveFieldsCount: 3,
        response: data,
        rejectionMessage: data.message,
      };
      setNetworkLogs(prev => [logEntry, ...prev]);
    } catch (err: any) {
      console.error('Rejection probe failed:', err);
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'}`}>
      {/* Top Navigation */}
      <Navbar
        mode={mode}
        onToggleMode={m => setMode(m)}
        isOnline={effectiveOnline}
        isSimulatedOffline={isSimulatedOffline}
        onToggleSimulatedOffline={() => setIsSimulatedOffline(prev => !prev)}
        lastPingTime={lastPingTime}
        queuedCount={queuedRequests.length}
        onSelectProfile={handleSelectProfile}
        onTriggerRejectionTest={handleTriggerRejectionTest}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(prev => !prev)}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Reconstructed Results (The Final Verdict) */}
        <ResultsCard results={reconstructed} mode={mode} />

        {/* Privacy Budget & Differential Privacy Controls */}
        <PrivacyBudgetControl
          epsilon={epsilon}
          onChange={setEpsilon}
          noisedValue={pipelineOutput?.benchmarkPayload?.noisedAggregatedHealthIndex}
          rawScore={localResults?.healthRiskIndex}
        />

        {/* 3 Main Panels in Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Panel A: Form Panel (Inputs + Live Badges) */}
          <div className="lg:col-span-6 space-y-6">
            <FormPanel
              formData={formData}
              onChange={handleFormChange}
              classifications={classifications}
              notesScan={notesScan}
              onSubmit={handleExecutePipeline}
              isProcessing={isProcessing}
            />
          </div>

          {/* Panel B: Data Journey Panel */}
          <div className="lg:col-span-6 space-y-6">
            <DataJourneyPanel decisions={decisions} mode={mode} />
          </div>
        </div>

        {/* Panel C: Network Truth Panel (Full Width for Side-by-Side Inspection) */}
        <div className="w-full">
          <NetworkTruthPanel
            mode={mode}
            traditionalPayload={pipelineOutput?.traditionalPayload || null}
            minimizedPayload={pipelineOutput?.benchmarkPayload || null}
            metrics={pipelineOutput?.metrics || null}
            networkLogs={networkLogs}
            onTriggerRejectionTest={handleTriggerRejectionTest}
            lastRejectionResult={lastRejectionResult}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>DataShadow Web &mdash; Zero-Trust Personal Data Architecture</span>
          <span className="font-mono text-[11px] text-cyan-400">
            Web Worker Compute &bull; Express Validator &bull; Differential Privacy
          </span>
        </div>
      </footer>
    </div>
  );
}

export default App;
