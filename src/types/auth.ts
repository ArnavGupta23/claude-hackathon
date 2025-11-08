import type { UserRole } from './repair';

export type AuthMode = 'signin' | 'signup';

export type FormState = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
};

export type FeedbackState = {
  status: 'idle' | 'success' | 'error';
  message: string;
};
