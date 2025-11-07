type GoogleButtonProps = {
  disabled: boolean;
  onClick: () => void;
};

const GoogleButton = ({ disabled, onClick }: GoogleButtonProps) => (
  <button type="button" className="google-button" onClick={onClick} disabled={disabled}>
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
);

export default GoogleButton;
