import { useCallback } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import GoogleButton from '../GoogleButton';
import StatusMessage from '../StatusMessage';
import type { AuthMode, FeedbackState, FormState } from '../../types/auth';

type AuthFormCardProps = {
  mode: AuthMode;
  busy: boolean;
  form: FormState;
  feedback: FeedbackState;
  canSubmit: boolean;
  passwordHint: string;
  onToggleMode: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onFieldChange: (field: keyof FormState, value: string) => void;
  onGoogleSignIn: () => void;
};

const AuthFormCard = ({
  mode,
  busy,
  form,
  feedback,
  canSubmit,
  passwordHint,
  onToggleMode,
  onSubmit,
  onFieldChange,
  onGoogleSignIn,
}: AuthFormCardProps) => {
  const handleChange =
    useCallback(
      (field: keyof FormState) =>
        (event: ChangeEvent<HTMLInputElement>) =>
          onFieldChange(field, event.target.value),
      [onFieldChange],
    );

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <p className="eyebrow">{mode === 'signup' ? 'Create an account' : 'Welcome back'}</p>
          <h2>{mode === 'signup' ? 'Join the experience' : 'Sign in to continue'}</h2>
        </div>
        <button className="link" type="button" onClick={onToggleMode} disabled={busy}>
          {mode === 'signup' ? 'Already have an account?' : 'Need an account?'}
        </button>
      </div>

      <StatusMessage feedback={feedback} />

      <form className="stack" onSubmit={onSubmit}>
        {mode === 'signup' && (
          <>
            <label className="field">
              <span>Full name</span>
              <input
                type="text"
                placeholder="Ada Lovelace"
                value={form.name}
                onChange={handleChange('name')}
                autoComplete="name"
                disabled={busy}
                required
              />
            </label>

            <fieldset className="role-fieldset" aria-label="Select how you want to use the app">
              <legend>How do you want to use Local Repair Matchmaker?</legend>
              <div className="role-options">
                <label className={`role-option ${form.role === 'seeker' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="role"
                    value="seeker"
                    checked={form.role === 'seeker'}
                    onChange={(event) => onFieldChange('role', event.target.value)}
                    disabled={busy}
                  />
                  <div>
                    <strong>I need something fixed</strong>
                    <p>Share broken items and get instant repair guidance.</p>
                  </div>
                </label>

                <label className={`role-option ${form.role === 'fixer' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="role"
                    value="fixer"
                    checked={form.role === 'fixer'}
                    onChange={(event) => onFieldChange('role', event.target.value)}
                    disabled={busy}
                  />
                  <div>
                    <strong>I can repair things</strong>
                    <p>Offer your skills and claim nearby repair requests.</p>
                  </div>
                </label>
              </div>
            </fieldset>
          </>
        )}

        <label className="field">
          <span>Email</span>
          <input
            type="email"
            placeholder="you@nextbigthing.dev"
            value={form.email}
            onChange={handleChange('email')}
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
            onChange={handleChange('password')}
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

      <GoogleButton onClick={onGoogleSignIn} disabled={busy} />
    </div>
  );
};

export default AuthFormCard;
