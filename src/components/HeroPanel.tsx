const HeroPanel = () => (
  <div className="hero">
    <p className="badge">Local Repair Matchmaker</p>
    <h1>
      Neighbors post fixes,
      <br />
      makers jump in fast.
    </h1>
    <p className="muted">
      Pair residents who need help with community fixers. Firebase keeps identities and requests
      organized while GPT drafts cost and repair guidance in seconds.
    </p>
    <ul className="hero-list">
      <li>Dual login for seekers and fixers</li>
      <li>Firestore-backed repair requests</li>
      <li>Auto-generated GPT repair estimates</li>
    </ul>
    <div className="hero-gradient" />
  </div>
);

export default HeroPanel;
