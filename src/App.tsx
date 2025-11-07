import { FirebaseError } from 'firebase/app';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import type { ChangeEvent, FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { auth } from './firebase';
import './App.css';

type AuthMode = 'signin' | 'signup';

type FormState = {
  name: string;
  email: string;
  password: string;
};

type FeedbackState = {
  status: 'idle' | 'success' | 'error';
  message: string;
};

const initialFormState: FormState = {
  name: '',
  email: '',
  password: '',
};

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

const formatAuthError = (error: unknown): string => {
  if (error instanceof FirebaseError) {
    const messages: Record<string, string> = {
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

    return messages[error.code] ?? 'Something went wrong. Please try again.';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
};

function App() {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [form, setForm] = useState<FormState>(initialFormState);
  const [feedback, setFeedback] = useState<FeedbackState>({ status: 'idle', message: '' });
  const [busy, setBusy] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          await firebaseUser.reload();
        } catch (error) {
          console.warn('Unable to refresh user', error);
        }
      }
      setUser(firebaseUser);
      setCheckingSession(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (resendTimer === 0) {
      return;
    }

    const interval = window.setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [resendTimer]);

  const canSubmit = useMemo(() => {
    const hasEmail = form.email.trim().length > 5;
    const hasPassword = form.password.length >= (mode === 'signup' ? 8 : 1);
    const hasName = mode === 'signin' ? true : form.name.trim().length > 1;
    return hasEmail && hasPassword && hasName && !busy;
  }, [form, mode, busy]);

  const passwordHint =
    mode === 'signup'
      ? 'Use at least 8 characters. Add symbols or numbers for extra strength.'
      : 'Enter the password you used when creating your account.';

  const updateField =
    (field: keyof FormState) => (event: ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleEmailAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    setBusy(true);
    setFeedback({ status: 'idle', message: '' });

    const email = form.email.trim().toLowerCase();
    const password = form.password;

    try {
      if (mode === 'signup') {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        if (form.name.trim()) {
          await updateProfile(credential.user, { displayName: form.name.trim() });
        }
        await sendEmailVerification(credential.user);
        setFeedback({
          status: 'success',
          message: `Account created! We sent a verification link to ${email}.`,
        });
        setForm((prev) => ({ ...prev, password: '' }));
      } else {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        if (!credential.user.emailVerified) {
          await sendEmailVerification(credential.user);
          setFeedback({
            status: 'success',
            message: `Almost there! Please verify ${email} before continuing.`,
          });
        } else {
          setFeedback({ status: 'success', message: 'Welcome back! You are signed in.' });
        }
      }
    } catch (error) {
      console.error(error);
      setFeedback({ status: 'error', message: formatAuthError(error) });
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setBusy(true);
    setFeedback({ status: 'idle', message: '' });
    try {
      await signInWithPopup(auth, provider);
      setFeedback({ status: 'success', message: 'Signed in with Google successfully.' });
    } catch (error) {
      console.error(error);
      setFeedback({ status: 'error', message: formatAuthError(error) });
    } finally {
      setBusy(false);
    }
  };

  const handleSendVerification = async () => {
    if (!auth.currentUser) {
      return;
    }
    setBusy(true);
    try {
      await sendEmailVerification(auth.currentUser);
      setFeedback({
        status: 'success',
        message: `Verification email sent to ${auth.currentUser.email}.`,
      });
      setResendTimer(30);
    } catch (error) {
      console.error(error);
      setFeedback({ status: 'error', message: formatAuthError(error) });
    } finally {
      setBusy(false);
    }
  };

  const handleRefreshUser = async () => {
    if (!auth.currentUser) {
      return;
    }
    setBusy(true);
    try {
      await auth.currentUser.reload();
      setUser(auth.currentUser);
      setFeedback({
        status: 'success',
        message: auth.currentUser.emailVerified
          ? 'Email verified! You are all set.'
          : 'Still waiting for verification. Check your inbox.',
      });
    } catch (error) {
      console.error(error);
      setFeedback({ status: 'error', message: formatAuthError(error) });
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    setBusy(true);
    try {
      await signOut(auth);
      setForm(initialFormState);
      setFeedback({ status: 'success', message: 'Signed out successfully.' });
      setMode('signin');
    } catch (error) {
      console.error(error);
      setFeedback({ status: 'error', message: formatAuthError(error) });
    } finally {
      setBusy(false);
    }
  };

  const toggleMode = () => {
    setMode((prev) => (prev === 'signin' ? 'signup' : 'signin'));
    setFeedback({ status: 'idle', message: '' });
  };

  const renderCard = () => {
    if (checkingSession) {
      return (
        <div className="card loading">
          <div className="spinner" aria-label="Loading" />
          <p>Setting things up...</p>
        </div>
      );
    }

    if (user && user.emailVerified) {
      return (
        <div className="card success-card">
          <p className="eyebrow">You are live</p>
          <h2>Welcome, {user.displayName ?? user.email}</h2>
          <p className="muted">
            You are authenticated and ready to build. Jump into your dashboard or sign out to switch
            accounts.
          </p>
          <button className="primary" onClick={handleSignOut} disabled={busy}>
            Sign out
          </button>
        </div>
      );
    }

    if (user && !user.emailVerified) {
      return (
        <div className="card verify-card">
          <p className="eyebrow">Confirm your inbox</p>
          <h2>Verify {user.email}</h2>
          <p className="muted">
            We sent a link to your email. Click it and then tap the refresh button below. Need a new
            message? Resend in just a tap.
          </p>
          <div className="stack">
            <button className="primary" onClick={handleRefreshUser} disabled={busy}>
              I have verified my email
            </button>
            <button
              className="ghost"
              onClick={handleSendVerification}
              disabled={busy || resendTimer > 0}
            >
              {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend verification email'}
            </button>
            <button className="ghost" onClick={handleSignOut} disabled={busy}>
              Use a different email
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="card">
        <div className="card-header">
          <div>
            <p className="eyebrow">{mode === 'signup' ? 'Create an account' : 'Welcome back'}</p>
            <h2>{mode === 'signup' ? 'Join the experience' : 'Sign in to continue'}</h2>
          </div>
          <button className="link" type="button" onClick={toggleMode} disabled={busy}>
            {mode === 'signup' ? 'Already have an account?' : 'Need an account?'}
          </button>
        </div>

        {feedback.message && (
          <p className={`status ${feedback.status === 'error' ? 'error' : 'success'}`}>
            {feedback.message}
          </p>
        )}

        <form className="stack" onSubmit={handleEmailAuth}>
          {mode === 'signup' && (
            <label className="field">
              <span>Full name</span>
              <input
                type="text"
                placeholder="Ada Lovelace"
                value={form.name}
                onChange={updateField('name')}
                autoComplete="name"
                disabled={busy}
                required
              />
            </label>
          )}

          <label className="field">
            <span>Email</span>
            <input
              type="email"
              placeholder="you@nextbigthing.dev"
              value={form.email}
              onChange={updateField('email')}
              autoComplete="email"
              inputMode="email"
              disabled={busy}
              required
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              placeholder="********"
              value={form.password}
              onChange={updateField('password')}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              disabled={busy}
              minLength={mode === 'signup' ? 8 : 1}
              required
            />
            <small>{passwordHint}</small>
          </label>

          <button type="submit" className="primary" disabled={!canSubmit}>
            {mode === 'signup' ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <div className="divider">
          <span>or continue with</span>
        </div>

        <button type="button" className="google-button" onClick={handleGoogleSignIn} disabled={busy}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 10.2v3.6h5.1c-.2 1.2-.9 2.1-1.9 2.7l3.1 2.4c1.8-1.7 2.8-4.1 2.8-7.1 0-.7-.1-1.4-.2-2H12z"
              fill="#4285F4"
            />
            <path
              d="M5.3 14.4l-.8.6-2.5 1.9C3.6 20.7 7.5 23 12 23c2.7 0 5-.9 6.7-2.4l-3.1-2.4c-.9.6-2.1 1-3.5 1-2.7 0-5-1.8-5.8-4.3z"
              fill="#34A853"
            />
            <path
              d="M2 6.5C1.3 8 1.3 9.6 1.3 12s0 4 0 5.5l2.4-1.8c-.5-1.5-.5-3.1 0-4.6L2 6.5z"
              fill="#FBBC05"
            />
            <path
              d="M12 4.7c1.5 0 2.8.5 3.8 1.5l2.9-2.9C16.9 1.4 14.6.5 12 .5 7.5.5 3.6 2.8 1.3 6.5l2.4 3.1C4.3 6.5 6.6 4.7 9.3 4.7c1.1 0 2.1.3 2.7 1z"
              fill="#EA4335"
            />
          </svg>
          Google
        </button>
      </div>
    );
  };

  return (
    <div className="app-shell">
      <div className="hero">
        <p className="badge">Hackathon ready</p>
        <h1>
          Modern auth,
          <br />
          shipped in minutes.
        </h1>
        <p className="muted">
          Production-ready authentication powered by Firebase. Email magic, Google sign-in, and
          spotless UX so judges focus on your idea, not your login screen.
        </p>
        <ul className="hero-list">
          <li>One-click Google onboarding</li>
          <li>Secure email verification flow baked in</li>
          <li>Responsive, accessible design system</li>
        </ul>
        <div className="hero-gradient" />
      </div>

      {renderCard()}

      <div className="glow glow-one" />
      <div className="glow glow-two" />
    </div>
  );
}

export default App;
