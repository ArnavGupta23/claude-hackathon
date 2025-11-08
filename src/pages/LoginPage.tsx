import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import HeroPanel from '../components/HeroPanel';
import AuthFormCard from '../components/cards/AuthFormCard';
import LoadingCard from '../components/cards/LoadingCard';
import VerifyEmailCard from '../components/cards/VerifyEmailCard';
import type { AuthMode, FeedbackState, FormState } from '../types/auth';
import { formatAuthError } from '../utils/formatAuthError';
import { useAuth } from '../context/AuthContext';
import '../App.css';

const initialFormState: FormState = {
  name: '',
  email: '',
  password: '',
  role: 'seeker',
};

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

const LoginPage = () => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [form, setForm] = useState<FormState>(initialFormState);
  const [feedback, setFeedback] = useState<FeedbackState>({ status: 'idle', message: '' });
  const [busy, setBusy] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const navigate = useNavigate();
  const { user, profile, checkingSession, profileLoading, ensureProfile, refreshUser } = useAuth();
  const demoMode = import.meta.env.VITE_USE_DUMMY_DATA === 'true';

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

  const handleFieldChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    if (!demoMode && user && user.emailVerified && profile) {
      navigate('/dashboard', { replace: true });
    }
  }, [demoMode, navigate, profile, user]);

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
        await ensureProfile(credential.user, { role: form.role, fullName: form.name.trim() });
        await sendEmailVerification(credential.user);
        setFeedback({
          status: 'success',
          message: `Account created! We sent a verification link to ${email}.`,
        });
        setForm((prev) => ({ ...prev, password: '' }));
      } else {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        await ensureProfile(credential.user);
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
      const credential = await signInWithPopup(auth, provider);
      await ensureProfile(credential.user);
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
      await refreshUser();
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

  const handleOpenDemoDashboard = () => {
    navigate('/dashboard');
  };

  const renderCard = () => {
    const shouldShowLoader = checkingSession || (user?.emailVerified ? profileLoading : false);

    if (shouldShowLoader) {
      return <LoadingCard />;
    }

    if (user && !user.emailVerified) {
      return (
        <VerifyEmailCard
          email={user.email}
          busy={busy}
          resendTimer={resendTimer}
          onRefresh={handleRefreshUser}
          onResend={handleSendVerification}
          onSignOut={handleSignOut}
        />
      );
    }

    return (
      <AuthFormCard
        mode={mode}
        busy={busy}
        form={form}
        feedback={feedback}
        canSubmit={canSubmit}
        passwordHint={passwordHint}
        onToggleMode={toggleMode}
        onSubmit={handleEmailAuth}
        onFieldChange={handleFieldChange}
        onGoogleSignIn={handleGoogleSignIn}
      />
    );
  };

  return (
    <div className="app-shell">
      <HeroPanel />

      {demoMode && (
        <div className="card">
          <p className="eyebrow">Demo mode enabled</p>
          <h2>Jump straight into the Local Repair Matchmaker dashboard.</h2>
          <p className="muted">
            We seeded Firestore-style data locally so you can demo seeker and fixer flows without
            creating accounts. Use the auth form below only if you want to show the login UX.
          </p>
          <button type="button" className="primary" onClick={handleOpenDemoDashboard}>
            Open demo dashboard
          </button>
        </div>
      )}

      {renderCard()}

      <div className="glow glow-one" />
      <div className="glow glow-two" />
    </div>
  );
};

export default LoginPage;
