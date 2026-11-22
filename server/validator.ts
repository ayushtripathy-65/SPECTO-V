import { PATTERNS } from '../src/core/classifier';

export interface ValidationViolation {
  field: string;
  rule: string;
  detail: string;
}

// Keys that are strictly forbidden from entering zero-trust minimized endpoints
const FORBIDDEN_RAW_KEYS = [
  'nationalid',
  'aadhaar',
  'ssn',
  'pan',
  'phone',
  'phonenumber',
  'mobile',
  'email',
  'fullname',
  'firstname',
  'lastname',
  'name',
  'additionalnotes',
  'notes',
  'hasdiabetes',
  'hashypertension',
  'heightcm',
  'weightkg',
  'monthlyincome', // raw exact number
  'existingdebt',  // raw exact number
  'dob',           // exact unbucketed date
];

/**
 * Server-Side Zero-Trust Validator
 * Second line of defense: rejects payloads with raw sensitive fields or recognizable PII patterns.
 */
export function validateMinimizedPayload(
  payload: Record<string, any>
): {
  isValid: boolean;
  violations: ValidationViolation[];
} {
  const violations: ValidationViolation[] = [];

  if (!payload || typeof payload !== 'object') {
    return {
      isValid: false,
      violations: [{ field: 'root', rule: 'INVALID_PAYLOAD', detail: 'Payload must be a JSON object' }],
    };
  }

  // 1. Inspect all keys recursively
  const checkObject = (obj: Record<string, any>, prefix: string = '') => {
    for (const [key, val] of Object.entries(obj)) {
      const fieldPath = prefix ? `${prefix}.${key}` : key;
      const lowerKey = key.toLowerCase();

      // Check key name against forbidden list
      if (FORBIDDEN_RAW_KEYS.includes(lowerKey)) {
        violations.push({
          field: fieldPath,
          rule: 'FORBIDDEN_RAW_FIELD',
          detail: `Direct sensitive field "${key}" is prohibited in zero-trust endpoints. Use client-side generalization or hashing.`,
        });
      }

      // Check values for embedded regex patterns
      if (typeof val === 'string') {
        PATTERNS.NATIONAL_ID.lastIndex = 0;
        if (PATTERNS.NATIONAL_ID.test(val)) {
          violations.push({
            field: fieldPath,
            rule: 'EMBEDDED_NATIONAL_ID_PATTERN',
            detail: `Value resembles a government identity number (Aadhaar/SSN). Raw identifiers are rejected by server.`,
          });
        }

        PATTERNS.EMAIL.lastIndex = 0;
        if (PATTERNS.EMAIL.test(val)) {
          violations.push({
            field: fieldPath,
            rule: 'EMBEDDED_EMAIL_PATTERN',
            detail: `Value contains a raw email address. Raw contact info is rejected by server.`,
          });
        }

        PATTERNS.PHONE.lastIndex = 0;
        if (PATTERNS.PHONE.test(val) && val.replace(/\D/g, '').length >= 10) {
          violations.push({
            field: fieldPath,
            rule: 'EMBEDDED_PHONE_PATTERN',
            detail: `Value contains an unmasked phone number.`,
          });
        }
      } else if (typeof val === 'number') {
        // Reject raw unbucketed financial numbers if sent with suspicious field names
        if (val > 1000 && (lowerKey.includes('income') || lowerKey.includes('debt') || lowerKey.includes('salary'))) {
          violations.push({
            field: fieldPath,
            rule: 'UNBUCKETED_FINANCIAL_VALUE',
            detail: `Exact raw financial value ($${val}) detected. Must be bucketed into income brackets before transmission.`,
          });
        }
      } else if (typeof val === 'object' && val !== null) {
        checkObject(val, fieldPath);
      }
    }
  };

  checkObject(payload);

  return {
    isValid: violations.length === 0,
    violations,
  };
}
