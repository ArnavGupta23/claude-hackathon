import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'seeker' | 'fixer';

export type UrgencyLevel = 'low' | 'medium' | 'high';

export type RepairStatus = 'open' | 'claimed' | 'completed';

export type UserProfile = {
  uid: string;
  role: UserRole;
  fullName?: string;
  email?: string;
  skills?: string;
  serviceArea?: string;
  bio?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export type RepairEstimate = {
  estimateSummary: string;
  estimatedCost: string;
  estimatedHours: string;
  recommendedSteps: string[];
  materialsList: string[];
};

export type RepairRequest = {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerContact?: string;
  itemName: string;
  issueDescription: string;
  additionalDetails?: string;
  referencePhotoUrl?: string;
  location: string;
  urgency: UrgencyLevel;
  status: RepairStatus;
  fixerId?: string;
  fixerName?: string;
  fixerNotes?: string;
  estimateSummary?: string;
  estimatedCost?: string;
  estimatedHours?: string;
  recommendedSteps?: string[];
  materialsList?: string[];
  estimateStatus?: 'idle' | 'pending' | 'complete' | 'error';
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export type NewRepairRequestInput = {
  itemName: string;
  issueDescription: string;
  additionalDetails?: string;
  referencePhotoUrl?: string;
  location: string;
  urgency: UrgencyLevel;
};
