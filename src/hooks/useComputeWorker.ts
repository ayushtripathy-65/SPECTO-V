import { useState, useEffect, useRef, useCallback } from 'react';
import { UserFormData } from '../core/types';
import { WorkerInMessage, WorkerOutMessage } from '../workers/compute.worker';

export interface WorkerPipelineOutput {
  classifications: Record<string, any>;
  localResults: any;
  decisions: any[];
  notesScan: any;
  benchmarkPayload: any;
  premiumPayload: any;
  traditionalPayload: any;
  metrics: {
    rawBytes: number;
    minimizedBytes: number;
    bytesReducedPercent: number;
    rawSensitiveFieldsInTraditional: number;
    rawSensitiveFieldsInMinimized: number;
  };
}

export function useComputeWorker() {
  const workerRef = useRef<Worker | null>(null);
  const [pipelineOutput, setPipelineOutput] = useState<WorkerPipelineOutput | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [workerReady, setWorkerReady] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const worker = new Worker(
        new URL('../workers/compute.worker.ts', import.meta.url),
        { type: 'module' }
      );

      worker.onmessage = (event: MessageEvent<WorkerOutMessage>) => {
        const msg = event.data;
        if (msg.type === 'PIPELINE_RESULT') {
          setPipelineOutput(msg.data);
          setIsProcessing(false);
          setError(null);
        } else if (msg.type === 'ERROR') {
          setError(msg.error);
          setIsProcessing(false);
        }
      };

      worker.onerror = (e) => {
        console.warn('Worker error:', e);
        setError('Worker communication error');
        setIsProcessing(false);
      };

      workerRef.current = worker;
      setWorkerReady(true);

      return () => {
        worker.terminate();
      };
    } catch (err: any) {
      console.warn('Web Worker initialization failed, falling back:', err);
      setWorkerReady(false);
    }
  }, []);

  const runPipeline = useCallback(
    (formData: UserFormData, isOnline: boolean, epsilon: number) => {
      if (!workerRef.current) return;
      setIsProcessing(true);
      const msg: WorkerInMessage = {
        type: 'RUN_FULL_PIPELINE',
        payload: {
          formData,
          isOnline,
          epsilon,
        },
      };
      workerRef.current.postMessage(msg);
    },
    []
  );

  return {
    workerReady,
    isProcessing,
    pipelineOutput,
    error,
    runPipeline,
  };
}
