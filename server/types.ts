export interface SyntheticRecord {
  id: string;
  ageBucket: string;
  incomeBracket: string;
  creditLengthBucket: string;
  healthTier: 'LOW_RISK' | 'MODERATE_RISK' | 'ELEVATED_RISK' | 'HIGH_RISK';
  creditScore: number;
  dti: number;
  approved: boolean;
}

export interface RejectionLogItem {
  id: string;
  timestamp: string;
  endpoint: string;
  clientIp?: string;
  violations: Array<{
    field: string;
    rule: string;
    detail: string;
  }>;
  payloadSummary: string;
}
