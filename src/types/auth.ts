export type AuthMode = 'signin' | 'signup';

export type FormState = {
  name: string;
  email: string;
  password: string;
};

export type FeedbackState = {
  status: 'idle' | 'success' | 'error';
  message: string;
};
