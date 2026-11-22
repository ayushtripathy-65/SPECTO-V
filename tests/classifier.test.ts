import { describe, it, expect } from 'vitest';
import { classifyField, scanAndRedactText } from '../src/core/classifier';

describe('Sensitive Data Classifier', () => {
  it('classifies national ID / Aadhaar / SSN as HIGHLY_SENSITIVE with high confidence', () => {
    const aadhaarResult = classifyField('nationalId', '4123 4567 8901');
    expect(aadhaarResult.level).toBe('HIGHLY_SENSITIVE');
    expect(aadhaarResult.confidence).toBeGreaterThanOrEqual(0.95);
    expect(aadhaarResult.detectedPatterns).toContain('GOV_IDENTIFIER_PATTERN');

    const ssnResult = classifyField('nationalId', '123-45-6789');
    expect(ssnResult.level).toBe('HIGHLY_SENSITIVE');
  });

  it('classifies phone and email as HIGHLY_SENSITIVE', () => {
    const phoneRes = classifyField('phone', '+1-555-019-2834');
    expect(phoneRes.level).toBe('HIGHLY_SENSITIVE');
    expect(phoneRes.confidence).toBeGreaterThanOrEqual(0.95);

    const emailRes = classifyField('email', 'alice.smith@secure-bank.org');
    expect(emailRes.level).toBe('HIGHLY_SENSITIVE');
    expect(emailRes.confidence).toBeGreaterThanOrEqual(0.95);
  });

  it('classifies financial figures as SENSITIVE', () => {
    const incomeRes = classifyField('monthlyIncome', 8500);
    expect(incomeRes.level).toBe('SENSITIVE');

    const debtRes = classifyField('existingDebt', 1200);
    expect(debtRes.level).toBe('SENSITIVE');
  });

  it('classifies medical conditions as SENSITIVE', () => {
    const diabetesRes = classifyField('hasDiabetes', true);
    expect(diabetesRes.level).toBe('SENSITIVE');

    const smokerRes = classifyField('isSmoker', false);
    expect(smokerRes.level).toBe('SENSITIVE');
  });

  it('classifies personal names and dates of birth as PERSONAL', () => {
    const nameRes = classifyField('fullName', 'Alex Chen');
    expect(nameRes.level).toBe('PERSONAL');

    const dobRes = classifyField('dob', '1992-08-14');
    expect(dobRes.level).toBe('PERSONAL');
  });

  describe('Free-text PII scanning & redaction', () => {
    it('detects and redacts hidden emails, phone numbers, and SSNs in free-text notes', () => {
      const dirtyText =
        'Please call my personal cell at 555-234-5678 or reach me at secret_agent99@gmail.com. My old SSN was 123-45-6789.';

      const scan = scanAndRedactText(dirtyText);

      expect(scan.hasHighlySensitive).toBe(true);
      expect(scan.pii.length).toBe(3);
      expect(scan.redactedText).toContain('[REDACTED_PHONE]');
      expect(scan.redactedText).toContain('[REDACTED_EMAIL]');
      expect(scan.redactedText).toContain('[REDACTED_NATIONAL_ID]');
      expect(scan.redactedText).not.toContain('555-234-5678');
      expect(scan.redactedText).not.toContain('secret_agent99@gmail.com');
      expect(scan.redactedText).not.toContain('123-45-6789');
    });

    it('detects embedded financial amounts in notes', () => {
      const note = 'I earn $12,500 monthly and pay 2500/mo in alimony.';
      const scan = scanAndRedactText(note);
      expect(scan.hasSensitive).toBe(true);
      expect(scan.redactedText).toContain('[REDACTED_FINANCIAL_AMOUNT]');
    });

    it('escalates additionalNotes classification level when hidden PII is detected', () => {
      const safeNote = 'Looking for a 15-year fixed mortgage pre-approval.';
      const safeClassification = classifyField('additionalNotes', safeNote);
      expect(safeClassification.level).toBe('PERSONAL');

      const riskyNote = 'Contact me urgently at +1 800 555 0199 or email user@test.com';
      const riskyClassification = classifyField('additionalNotes', riskyNote);
      expect(riskyClassification.level).toBe('HIGHLY_SENSITIVE');
      expect(riskyClassification.redactedPreview).toContain('[REDACTED_');
    });
  });
});
