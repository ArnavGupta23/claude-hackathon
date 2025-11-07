type VerifyEmailCardProps = {
  email: string | null | undefined;
  busy: boolean;
  resendTimer: number;
  onRefresh: () => Promise<void>;
  onResend: () => Promise<void>;
  onSignOut: () => Promise<void>;
};

const VerifyEmailCard = ({
  email,
  busy,
  resendTimer,
  onRefresh,
  onResend,
  onSignOut,
}: VerifyEmailCardProps) => (
  <div className="card verify-card">
    <p className="eyebrow">Confirm your inbox</p>
    <h2>Verify {email}</h2>
    <p className="muted">
      We sent a link to your email. Click it and then tap the refresh button below. Need a new message?
      Resend in just a tap.
    </p>
    <div className="stack">
      <button className="primary" onClick={onRefresh} disabled={busy}>
        I have verified my email
      </button>
      <button className="ghost" onClick={onResend} disabled={busy || resendTimer > 0}>
        {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend verification email'}
      </button>
      <button className="ghost" onClick={onSignOut} disabled={busy}>
        Use a different email
      </button>
    </div>
  </div>
);

export default VerifyEmailCard;
