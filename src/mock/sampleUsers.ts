import { UserFormData } from '../core/types';

export interface PresetProfile {
  id: string;
  label: string;
  subtitle: string;
  data: UserFormData;
}

export const SAMPLE_PROFILES: PresetProfile[] = [
  {
    id: 'priya_sharma',
    label: 'Priya Sharma (Tech Lead)',
    subtitle: 'Prime credit, healthy, hidden email in notes',
    data: {
      fullName: 'Priya Sharma',
      email: 'priya.sharma@fintech.io',
      phone: '+91 98201 54321',
      nationalId: '5421 8902 3341',
      dob: '1993-04-18',
      monthlyIncome: 9200,
      existingDebt: 1200,
      creditHistoryYears: 7,
      hasDiabetes: false,
      hasHypertension: false,
      isSmoker: false,
      heightCm: 168,
      weightKg: 61,
      additionalNotes:
        'Please expedite loan pre-check. If needed, my backup email is priya.personal@cloudmail.com or call home office.',
    },
  },
  {
    id: 'marcus_vance',
    label: 'Marcus Vance (Consultant)',
    subtitle: 'Near-prime, moderate liabilities, hidden SSN & phone in notes',
    data: {
      fullName: 'Marcus Vance',
      email: 'm.vance@advisory.co',
      phone: '415-555-0182',
      nationalId: '492-18-9021',
      dob: '1985-11-09',
      monthlyIncome: 14500,
      existingDebt: 4800,
      creditHistoryYears: 12,
      hasDiabetes: false,
      hasHypertension: true,
      isSmoker: false,
      heightCm: 182,
      weightKg: 86,
      additionalNotes:
        'Consolidating existing debts. Ref: old national tax record 492-18-9021. Reach assistant at 415-555-9988.',
    },
  },
  {
    id: 'david_kim',
    label: 'David Kim (Freelancer)',
    subtitle: 'High DTI, smoker, clean notes',
    data: {
      fullName: 'David Kim',
      email: 'david.kim99@creativeflow.org',
      phone: '312-555-7744',
      nationalId: '8821 0042 1982',
      dob: '1998-09-22',
      monthlyIncome: 3400,
      existingDebt: 1800,
      creditHistoryYears: 2,
      hasDiabetes: true,
      hasHypertension: false,
      isSmoker: true,
      heightCm: 175,
      weightKg: 78,
      additionalNotes:
        'Applying for standard auto loan and supplemental health insurance coverage.',
    },
  },
];
