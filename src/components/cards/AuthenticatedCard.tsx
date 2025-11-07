import type { User } from 'firebase/auth';

type AuthenticatedCardProps = {
  user: User;
  busy: boolean;
  onSignOut: () => Promise<void>;
};

const AuthenticatedCard = ({ user, busy, onSignOut }: AuthenticatedCardProps) => (
  <div className="card success-card">
    <p className="eyebrow">You are live</p>
    <h2>Welcome, {user.displayName ?? user.email}</h2>
    <p className="muted">
      You are authenticated and ready to build. Jump into your dashboard or sign out to switch accounts.
    </p>
    <button className="primary" onClick={onSignOut} disabled={busy}>
      Sign out
    </button>
  </div>
);

export default AuthenticatedCard;
