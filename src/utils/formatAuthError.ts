import { FirebaseError } from 'firebase/app';

const firebaseErrorMessages: Record<string, string> = {
  'auth/email-already-in-use': 'This email already has an account. Try signing in instead.',
  'auth/invalid-email': 'That email looks off. Please double-check it.',
  'auth/weak-password': 'Please pick a stronger password (8+ characters).',
  'auth/invalid-credential': 'Those credentials did not match an account.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/user-not-found': 'We could not find an account with that email.',
  'auth/wrong-password': 'Incorrect password. Try again or reset it.',
  'auth/popup-closed-by-user': 'Popup closed before finishing sign in.',
  'auth/cancelled-popup-request': 'Please close the other sign-in popup first.',
  'auth/too-many-requests': 'Too many attempts. Wait a moment and try again.',
  'auth/network-request-failed': 'Network error. Check your connection.',
};

export const formatAuthError = (error: unknown): string => {
  if (error instanceof FirebaseError) {
    return firebaseErrorMessages[error.code] ?? 'Something went wrong. Please try again.';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
};
