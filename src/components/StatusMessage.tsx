import type { FeedbackState } from '../types/auth';

type StatusMessageProps = {
  feedback: FeedbackState;
};

const StatusMessage = ({ feedback }: StatusMessageProps) => {
  if (!feedback.message) {
    return null;
  }

  return (
    <p className={`status ${feedback.status === 'error' ? 'error' : 'success'}`}>{feedback.message}</p>
  );
};

export default StatusMessage;
