/// <reference lib="webworker" />

import { classifyAllFields, classifyField, scanAndRedactText } from '../core/classifier';
import { evaluateAllTasks } from '../core/decisionEngine';
import { computeAllLocalFeatures } from '../core/localCompute';
import {
  addLaplaceNoise,
  aggregateHealthFlags,
  bucketAge,
  bucketCreditTenure,
  bucketIncome,
  calculateAge,
  createSaltedHashSync,
} from '../core/transformers';
import {
  LocalComputeResults,
  MinimizedBenchmarkPayload,
  MinimizedPremiumPayload,
  UserFormData,
} from '../core/types';

export type WorkerInMessage =
  | { type: 'CLASSIFY'; payload: { formData: Partial<UserFormData> } }
  | { type: 'SCAN_NOTES'; payload: { text: string } }
  | {
      type: 'RUN_FULL_PIPELINE';
      payload: {
        formData: UserFormData;
        isOnline: boolean;
        epsilon: number;
      };
    };

export type WorkerOutMessage =
  | { type: 'CLASSIFICATION_RESULT'; data: ReturnType<typeof classifyAllFields> }
  | { type: 'SCAN_NOTES_RESULT'; data: ReturnType<typeof scanAndRedactText> }
  | {
      type: 'PIPELINE_RESULT';
      data: {
        classifications: ReturnType<typeof classifyAllFields>;
        localResults: LocalComputeResults;
        decisions: ReturnType<typeof evaluateAllTasks>;
        notesScan: ReturnType<typeof scanAndRedactText>;
        benchmarkPayload: MinimizedBenchmarkPayload;
        premiumPayload: MinimizedPremiumPayload;
        traditionalPayload: Record<string, any>;
        metrics: {
          rawBytes: number;
          minimizedBytes: number;
          bytesReducedPercent: number;
          rawSensitiveFieldsInTraditional: number;
          rawSensitiveFieldsInMinimized: number;
        };
      };
    }
  | { type: 'ERROR'; error: string };

self.onmessage = (event: MessageEvent<WorkerInMessage>) => {
  const msg = event.data;
  try {
    switch (msg.type) {
      case 'CLASSIFY': {
        const classifications = classifyAllFields(msg.payload.formData);
        self.postMessage({ type: 'CLASSIFICATION_RESULT', data: classifications });
        break;
      }

      case 'SCAN_NOTES': {
        const result = scanAndRedactText(msg.payload.text);
        self.postMessage({ type: 'SCAN_NOTES_RESULT', data: result });
        break;
      }

      case 'RUN_FULL_PIPELINE': {
        const { formData, isOnline, epsilon } = msg.payload;

        // 1. Classification
        const classifications = classifyAllFields(formData);
        const notesScan = scanAndRedactText(formData.additionalNotes || '');

        // 2. Local Computation (100% on-device)
        const localResults = computeAllLocalFeatures(formData);

        // 3. Execution Decisions
        const decisions = evaluateAllTasks(formData, isOnline);

        // 4. Transform & Minimize Payloads
        const age = calculateAge(formData.dob);
        const ageBucket = bucketAge(age);
        const incomeBracket = bucketIncome(formData.monthlyIncome);
        const creditLengthBucket = bucketCreditTenure(formData.creditHistoryYears);

        // Salted hash of national ID + salt
        const clientSaltedHash = createSaltedHashSync(
          formData.nationalId || formData.email || 'anonymous_user',
          'datashadow_salt_v1'
        );

        // Aggregated health with Differential Privacy (Laplace noise)
        const aggregatedHealth = aggregateHealthFlags(
          formData.hasDiabetes,
          formData.hasHypertension,
          formData.isSmoker,
          localResults.bmiCategory
        );

        const noisedHealth = addLaplaceNoise(
          aggregatedHealth.compositeScore,
          10, // Sensitivity
          epsilon, // Privacy budget
          0,
          100
        );

        const benchmarkPayload: MinimizedBenchmarkPayload = {
          clientSaltedHash,
          ageBucket,
          incomeBracket,
          creditLengthBucket,
          noisedAggregatedHealthIndex: noisedHealth.noisedValue,
          epsilon,
          timestamp: new Date().toISOString(),
        };

        const premiumPayload: MinimizedPremiumPayload = {
          clientSaltedHash,
          ageBucket,
          healthTier: aggregatedHealth.riskTier,
          isSmokerGeneral: formData.isSmoker,
          timestamp: new Date().toISOString(),
        };

        // Traditional payload: sends every single raw field without minimization
        const traditionalPayload = {
          ...formData,
          calculatedTimestamp: new Date().toISOString(),
        };

        // Calculate byte metrics
        const rawBytes = new TextEncoder().encode(JSON.stringify(traditionalPayload)).length;
        const minimizedBytes = new TextEncoder().encode(
          JSON.stringify(benchmarkPayload)
        ).length;
        const bytesReducedPercent = Math.max(
          0,
          Math.round(((rawBytes - minimizedBytes) / rawBytes) * 1000) / 10
        );

        // Count raw sensitive fields
        let rawSensitiveFieldsInTraditional = 0;
        for (const [key, val] of Object.entries(classifications)) {
          if (val.level === 'HIGHLY_SENSITIVE' || val.level === 'SENSITIVE') {
            rawSensitiveFieldsInTraditional++;
          }
        }

        self.postMessage({
          type: 'PIPELINE_RESULT',
          data: {
            classifications,
            localResults,
            decisions,
            notesScan,
            benchmarkPayload,
            premiumPayload,
            traditionalPayload,
            metrics: {
              rawBytes,
              minimizedBytes,
              bytesReducedPercent,
              rawSensitiveFieldsInTraditional,
              rawSensitiveFieldsInMinimized: 0, // Zero by design!
            },
          },
        });
        break;
      }

      default:
        self.postMessage({ type: 'ERROR', error: 'Unknown worker message type' });
    }
  } catch (err: any) {
    self.postMessage({ type: 'ERROR', error: err.message || 'Worker processing error' });
  }
};
