import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { validateMinimizedPayload } from './validator';
import { computePopulationBenchmark, SYNTHETIC_POPULATION } from './syntheticData';
import {
  MinimizedBenchmarkPayload,
  MinimizedPremiumPayload,
  ServerPremiumResponse,
} from '../src/core/types';
import { RejectionLogItem } from './types';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// In-memory rejection log for zero-trust audit monitoring
const rejectionAuditLog: RejectionLogItem[] = [];

console.log(
  `[DataShadow Server] Initialized with ${SYNTHETIC_POPULATION.length} synthetic demographic records.`
);

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ONLINE',
    serverCohortSize: SYNTHETIC_POPULATION.length,
    zeroTrustValidationActive: true,
    timestamp: new Date().toISOString(),
  });
});

// Benchmark endpoint: accepts ONLY minimized derived representation
app.post('/api/benchmark', (req: Request, res: Response) => {
  const payload = req.body;

  // Server-side Zero-Trust Validation (Second Line of Defense)
  const validation = validateMinimizedPayload(payload);

  if (!validation.isValid) {
    const logItem: RejectionLogItem = {
      id: `rej_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      endpoint: '/api/benchmark',
      violations: validation.violations,
      payloadSummary: JSON.stringify(payload).slice(0, 150),
    };
    rejectionAuditLog.unshift(logItem);
    if (rejectionAuditLog.length > 50) rejectionAuditLog.pop();

    console.warn(
      `[ZERO-TRUST VIOLATION BLOCKED] Endpoint: /api/benchmark. Violations: ${validation.violations.length}`
    );

    return res.status(422).json({
      status: 'REJECTED_ZERO_TRUST_VIOLATION',
      error: 'Zero-Trust Policy Violation',
      message:
        'Server rejected payload: Raw sensitive data or prohibited identifiers detected in a zero-trust endpoint.',
      violations: validation.violations,
      timestamp: new Date().toISOString(),
    });
  }

  // Safe: proceed with population benchmark calculation
  const benchmarkResult = computePopulationBenchmark(payload as MinimizedBenchmarkPayload);

  res.json({
    status: 'SUCCESS',
    data: benchmarkResult,
    dataIntegrity: 'MINIMIZED_ZERO_TRUST_COMPLIANT',
  });
});

// Insurance premium lookup: accepts ONLY derived demographic & health tiers
app.post('/api/insurance-premium', (req: Request, res: Response) => {
  const payload = req.body as MinimizedPremiumPayload;

  // Validate for raw sensitive leaks
  const validation = validateMinimizedPayload(payload);
  if (!validation.isValid) {
    const logItem: RejectionLogItem = {
      id: `rej_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      endpoint: '/api/insurance-premium',
      violations: validation.violations,
      payloadSummary: JSON.stringify(payload).slice(0, 150),
    };
    rejectionAuditLog.unshift(logItem);

    return res.status(422).json({
      status: 'REJECTED_ZERO_TRUST_VIOLATION',
      error: 'Zero-Trust Policy Violation',
      message: 'Server rejected payload containing raw unminimized attributes.',
      violations: validation.violations,
    });
  }

  // Underwriting Actuarial Rate Table Lookup
  let baseRate = 1200; // baseline annual USD
  let premiumBand: ServerPremiumResponse['premiumBand'] = 'STANDARD';
  let cohortDiscount = 10;

  if (payload.healthTier === 'HIGH_RISK') {
    premiumBand = 'HIGH_RISK_SURCHARGE';
    baseRate = 2600;
    cohortDiscount = 0;
  } else if (payload.healthTier === 'ELEVATED_RISK') {
    premiumBand = 'TIER_2';
    baseRate = 1850;
    cohortDiscount = 5;
  } else if (payload.healthTier === 'MODERATE_RISK') {
    premiumBand = 'TIER_1';
    baseRate = 1450;
    cohortDiscount = 8;
  } else {
    premiumBand = 'STANDARD';
    baseRate = 1100;
    cohortDiscount = 15;
  }

  if (payload.isSmokerGeneral) {
    baseRate += 450;
  }

  const response: ServerPremiumResponse = {
    premiumBand,
    baseAnnualRateUsd: baseRate,
    cohortDiscountPercent: cohortDiscount,
    serverTimestamp: new Date().toISOString(),
  };

  res.json({
    status: 'SUCCESS',
    data: response,
  });
});

// Traditional mode endpoint: accepts raw unminimized payload for live side-by-side demonstration
app.post('/api/traditional-submit', (req: Request, res: Response) => {
  const rawPayload = req.body;
  const rawKeys = Object.keys(rawPayload);

  console.log(
    `[TRADITIONAL INSECURE ENDPOINT] Received raw bloated payload containing ${rawKeys.length} fields: ${rawKeys.join(', ')}`
  );

  res.json({
    status: 'SUCCESS',
    mode: 'TRADITIONAL_INSECURE',
    warning:
      'INSECURE ARCHITECTURE: Full raw personal and sensitive data transmitted to server and retained.',
    receivedFieldCount: rawKeys.length,
    receivedFields: rawKeys,
    serverProcessedAt: new Date().toISOString(),
  });
});

// Rejection audit log endpoint
app.get('/api/rejection-log', (req: Request, res: Response) => {
  res.json({
    count: rejectionAuditLog.length,
    logs: rejectionAuditLog,
  });
});

// Serve frontend build in production
const distPath = path.join(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// Fallback for client-side SPA routing
app.get('*', (req: Request, res: Response) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.status(200).send(`
    <!DOCTYPE html>
    <html>
      <head><title>DataShadow Web | Live</title></head>
      <body style="font-family: system-ui, sans-serif; background: #020617; color: #f8fafc; padding: 40px; text-align: center;">
        <h2 style="color: #38bdf8;">DataShadow Backend API is Live!</h2>
        <p>API status: <a href="/api/health" style="color: #38bdf8; text-decoration: underline;">/api/health</a></p>
        <p style="color: #94a3b8; font-size: 14px;">Frontend assets are being generated. Refresh in a few seconds or ensure build step completed.</p>
      </body>
    </html>
  `);
});

export default app;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[DataShadow Server] Listening on http://localhost:${PORT}`);
  });
}
