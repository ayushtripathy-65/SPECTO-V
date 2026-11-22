import {
  ExtractedPII,
  FieldClassification,
  SensitivityLevel,
  UserFormData,
} from './types';

// Regular expressions for pattern detection
export const PATTERNS = {
  // Aadhaar: 12 digits with optional spaces or dashes
  // SSN: 3-2-4 digits
  // PAN: 5 letters, 4 numbers, 1 letter
  NATIONAL_ID: /\b(?:\d{4}[-\s]?\d{4}[-\s]?\d{4}|\d{3}[-\s]?\d{2}[-\s]?\d{4}|[A-Z]{5}\d{4}[A-Z])\b/gi,
  
  // Standard RFC 5322 compatible email regex
  EMAIL: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/gi,
  
  // International or standard 10-digit phone
  PHONE: /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b|\b\d{10}\b/g,
  
  // Credit / Debit card: 16 digits
  CREDIT_CARD: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
  
  // Financial amounts: e.g. $5,000, 50000/mo, income: 8500
  FINANCIAL: /(?:[$₹€£]\s?\d+(?:,\d{3})*(?:\.\d{1,2})?|\b(?:salary|income|debt|emi|earn|earning|loan)[:\s]+[$₹€£]?\s?\d+(?:,\d{3})*|\b\d{4,9}\s*(?:USD|INR|\/mo|per month)\b)/gi,
  
  // Medical keywords in free text
  MEDICAL_TERMS: /\b(diabetes|diabetic|hypertension|high bp|blood pressure|asthma|cardiac|heart attack|cancer|chemo|insulin|smoker|nicotine|depression|bipolar|epilepsy|hiv|stroke|surgery)\b/gi,

  // Date of birth pattern (YYYY-MM-DD or DD/MM/YYYY)
  DOB: /\b(?:\d{4}[-/]\d{2}[-/]\d{2}|\d{2}[-/]\d{2}[-/]\d{4})\b/g,
};

/**
 * Scan free-text for embedded PII and return detected items + redacted text
 */
export function scanAndRedactText(text: string): {
  pii: ExtractedPII[];
  redactedText: string;
  hasHighlySensitive: boolean;
  hasSensitive: boolean;
} {
  if (!text || text.trim() === '') {
    return { pii: [], redactedText: '', hasHighlySensitive: false, hasSensitive: false };
  }

  const pii: ExtractedPII[] = [];

  // Helper to extract matches
  const collectMatches = (regex: RegExp, type: ExtractedPII['type']) => {
    regex.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      pii.push({
        type,
        value: match[0],
        start: match.index,
        end: match.index + match[0].length,
      });
    }
  };

  collectMatches(PATTERNS.NATIONAL_ID, 'NATIONAL_ID');
  collectMatches(PATTERNS.EMAIL, 'EMAIL');
  collectMatches(PATTERNS.PHONE, 'PHONE');
  collectMatches(PATTERNS.CREDIT_CARD, 'CREDIT_CARD');
  collectMatches(PATTERNS.FINANCIAL, 'FINANCIAL_AMOUNT');

  // Sort by start position descending so replacements don't offset subsequent indices
  const sortedPii = [...pii].sort((a, b) => b.start - a.start);
  let redacted = text;

  for (const item of sortedPii) {
    const placeholder = `[REDACTED_${item.type}]`;
    redacted =
      redacted.slice(0, item.start) + placeholder + redacted.slice(item.end);
  }

  // Check for medical terms
  PATTERNS.MEDICAL_TERMS.lastIndex = 0;
  const hasMedical = PATTERNS.MEDICAL_TERMS.test(text);

  const hasHighlySensitive = pii.some(
    p => p.type === 'NATIONAL_ID' || p.type === 'PHONE' || p.type === 'EMAIL' || p.type === 'CREDIT_CARD'
  );
  const hasSensitive = hasMedical || pii.some(p => p.type === 'FINANCIAL_AMOUNT');

  return {
    pii,
    redactedText: redacted,
    hasHighlySensitive,
    hasSensitive,
  };
}

/**
 * Classifies an individual field and value
 */
export function classifyField(
  fieldName: keyof UserFormData | string,
  value: any
): FieldClassification {
  const strVal = String(value ?? '').trim();
  const lowerName = fieldName.toLowerCase();

  // 1. National ID / Aadhaar / SSN
  if (
    lowerName.includes('nationalid') ||
    lowerName.includes('aadhaar') ||
    lowerName.includes('ssn')
  ) {
    const matchesPattern = PATTERNS.NATIONAL_ID.test(strVal);
    PATTERNS.NATIONAL_ID.lastIndex = 0;
    return {
      fieldName,
      level: 'HIGHLY_SENSITIVE',
      confidence: matchesPattern ? 1.0 : 0.95,
      reason: 'Government identifier subject to severe identity theft risks; must never leave client',
      detectedPatterns: matchesPattern ? ['GOV_IDENTIFIER_PATTERN'] : ['IDENTIFIER_NAME_RULE'],
    };
  }

  // 2. Phone
  if (lowerName.includes('phone') || lowerName.includes('mobile')) {
    const matchesPhone = PATTERNS.PHONE.test(strVal);
    PATTERNS.PHONE.lastIndex = 0;
    return {
      fieldName,
      level: 'HIGHLY_SENSITIVE',
      confidence: matchesPhone ? 0.98 : 0.90,
      reason: 'Direct contact identifier enabling unsolicited tracking and spam',
      detectedPatterns: matchesPhone ? ['E164_PHONE_PATTERN'] : ['PHONE_FIELD_RULE'],
    };
  }

  // 3. Email
  if (lowerName.includes('email')) {
    const matchesEmail = PATTERNS.EMAIL.test(strVal);
    PATTERNS.EMAIL.lastIndex = 0;
    return {
      fieldName,
      level: 'HIGHLY_SENSITIVE',
      confidence: matchesEmail ? 0.99 : 0.92,
      reason: 'Global unique user identifier across internet services',
      detectedPatterns: matchesEmail ? ['RFC5322_EMAIL_PATTERN'] : ['EMAIL_FIELD_RULE'],
    };
  }

  // 4. Financial: Monthly Income & Existing Debt
  if (
    lowerName.includes('income') ||
    lowerName.includes('debt') ||
    lowerName.includes('salary') ||
    lowerName.includes('emi')
  ) {
    return {
      fieldName,
      level: 'SENSITIVE',
      confidence: 0.95,
      reason: 'Confidential personal financial liability/asset metric; requires bucketing or aggregation',
      detectedPatterns: ['FINANCIAL_METRIC_RULE'],
    };
  }

  // 5. Medical conditions
  if (
    lowerName.includes('diabetes') ||
    lowerName.includes('hypertension') ||
    lowerName.includes('smoker') ||
    lowerName.includes('medical') ||
    lowerName.includes('health')
  ) {
    return {
      fieldName,
      level: 'SENSITIVE',
      confidence: 0.95,
      reason: 'Protected health status (HIPAA/GDPR special category); subject to discrimination risk',
      detectedPatterns: ['HEALTH_STATUS_RULE'],
    };
  }

  // 6. Full Name & Date of Birth
  if (lowerName.includes('fullname') || lowerName.includes('name')) {
    return {
      fieldName,
      level: 'PERSONAL',
      confidence: 0.92,
      reason: 'Direct personal attribute; identifiers must be pseudonymized/salted if retained',
      detectedPatterns: ['PERSONAL_NAME_RULE'],
    };
  }

  if (lowerName.includes('dob') || lowerName.includes('birth')) {
    return {
      fieldName,
      level: 'PERSONAL',
      confidence: 0.90,
      reason: 'Exact birthdate enables re-identification; should be generalized to age cohorts',
      detectedPatterns: ['DOB_RULE'],
    };
  }

  // 7. Biometrics (Height, Weight, Credit History Years)
  if (lowerName.includes('height') || lowerName.includes('weight')) {
    return {
      fieldName,
      level: 'PERSONAL',
      confidence: 0.85,
      reason: 'Physical biometric measurements; should be processed locally into aggregate BMI',
      detectedPatterns: ['BIOMETRIC_ATTRIBUTE_RULE'],
    };
  }

  if (lowerName.includes('credit') || lowerName.includes('history')) {
    return {
      fieldName,
      level: 'PERSONAL',
      confidence: 0.85,
      reason: 'Financial credit profile length; safe to bucket into tenure ranges',
      detectedPatterns: ['CREDIT_TENURE_RULE'],
    };
  }

  // 8. Additional Free-Text Notes: Deep Content Inspection
  if (lowerName.includes('notes') || lowerName.includes('additional')) {
    const scan = scanAndRedactText(strVal);

    if (scan.hasHighlySensitive) {
      return {
        fieldName,
        level: 'HIGHLY_SENSITIVE',
        confidence: 0.98,
        reason: `Hidden PII detected in free-text: ${scan.pii.map(p => p.type).join(', ')}. Redaction required.`,
        detectedPatterns: scan.pii.map(p => p.type),
        extractedPii: scan.pii,
        redactedPreview: scan.redactedText,
      };
    }

    if (scan.hasSensitive) {
      return {
        fieldName,
        level: 'SENSITIVE',
        confidence: 0.90,
        reason: 'Embedded sensitive financial or medical information detected in free-text',
        detectedPatterns: ['EMBEDDED_SENSITIVE_TEXT'],
        extractedPii: scan.pii,
        redactedPreview: scan.redactedText,
      };
    }

    return {
      fieldName,
      level: 'PERSONAL',
      confidence: 0.80,
      reason: 'Free-text unstructured notes; verified clean of direct high-risk identifiers',
      detectedPatterns: ['FREE_TEXT_INSPECTED_CLEAN'],
      redactedPreview: strVal,
    };
  }

  // Default fallback
  return {
    fieldName,
    level: 'PUBLIC',
    confidence: 0.70,
    reason: 'Non-identifying general metadata',
    detectedPatterns: ['DEFAULT_PUBLIC_RULE'],
  };
}

/**
 * Classifies an entire UserFormData object
 */
export function classifyAllFields(
  data: Partial<UserFormData>
): Record<string, FieldClassification> {
  const result: Record<string, FieldClassification> = {};
  for (const [key, val] of Object.entries(data)) {
    result[key] = classifyField(key, val);
  }
  return result;
}
