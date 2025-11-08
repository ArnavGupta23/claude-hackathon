import { type FormEvent, useEffect, useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteField,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Timestamp,
} from 'firebase/firestore';
import StatusMessage from '../StatusMessage';
import type { FeedbackState } from '../../types/auth';
import type {
  NewRepairRequestInput,
  RepairEstimate,
  RepairRequest,
  UrgencyLevel,
  UserProfile,
  UserRole,
} from '../../types/repair';
import { db } from '../../firebase';
import { generateRepairEstimate } from '../../utils/generateRepairEstimate';

type PrefilledData = {
  seekerRequests: RepairRequest[];
  openRequests: RepairRequest[];
  myAssignments: RepairRequest[];
};

type RepairDashboardProps = {
  user: User;
  profile: UserProfile;
  roleUpdating: boolean;
  onRoleChange: (role: UserRole) => Promise<void>;
  onSignOut: () => Promise<void>;
  prefilledData?: PrefilledData;
  demoEstimate?: RepairEstimate;
};

type RequestFormState = NewRepairRequestInput;

const initialRequestForm: RequestFormState = {
  itemName: '',
  issueDescription: '',
  additionalDetails: '',
  referencePhotoUrl: '',
  location: '',
  urgency: 'medium',
};

const toRepairRequest = (docSnap: QueryDocumentSnapshot<DocumentData>): RepairRequest => {
  const data = docSnap.data() as Omit<RepairRequest, 'id'>;
  return {
    id: docSnap.id,
    ...data,
  };
};

const formatDate = (timestamp?: Timestamp) => {
  if (!timestamp) {
    return 'Scheduling...';
  }

  try {
    return timestamp.toDate().toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return 'Scheduling...';
  }
};

const sanitize = (value?: string | null) => value?.trim() || undefined;

const RepairDashboard = ({
  user,
  profile,
  roleUpdating,
  onRoleChange,
  onSignOut,
  prefilledData,
  demoEstimate,
}: RepairDashboardProps) => {
  const demoMode = Boolean(prefilledData);
  const [requestForm, setRequestForm] = useState<RequestFormState>(initialRequestForm);
  const [requestBusy, setRequestBusy] = useState(false);
  const [requestFeedback, setRequestFeedback] = useState<FeedbackState>({
    status: 'idle',
    message: '',
  });
  const [aiPreview, setAiPreview] = useState<RepairEstimate | null>(null);
  const [aiStatus, setAiStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [seekerRequests, setSeekerRequests] = useState<RepairRequest[]>(
    () => prefilledData?.seekerRequests ?? [],
  );
  const [openRequests, setOpenRequests] = useState<RepairRequest[]>(
    () => prefilledData?.openRequests ?? [],
  );
  const [myAssignments, setMyAssignments] = useState<RepairRequest[]>(
    () => prefilledData?.myAssignments ?? [],
  );
  const [boardFeedback, setBoardFeedback] = useState<FeedbackState>({
    status: 'idle',
    message: '',
  });

  const displayName =
    profile.fullName || user.displayName || user.email || 'Community member';

  useEffect(() => {
    if (demoMode) {
      return;
    }

    if (profile.role === 'seeker') {
      const q = query(collection(db, 'repairRequests'), where('ownerId', '==', user.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const requests = snapshot.docs.map(toRepairRequest);
        requests.sort((a, b) => {
          const aTime = a.createdAt?.seconds ?? 0;
          const bTime = b.createdAt?.seconds ?? 0;
          return bTime - aTime;
        });
        setSeekerRequests(requests);
      });

      setOpenRequests([]);
      setMyAssignments([]);
      return unsubscribe;
    }

    const openQuery = query(collection(db, 'repairRequests'), where('status', '==', 'open'));
    const mineQuery = query(collection(db, 'repairRequests'), where('fixerId', '==', user.uid));

    const unsubscribes = [
      onSnapshot(openQuery, (snapshot) => {
        const requests = snapshot.docs.map(toRepairRequest);
        requests.sort((a, b) => {
          const aTime = a.createdAt?.seconds ?? 0;
          const bTime = b.createdAt?.seconds ?? 0;
          return bTime - aTime;
        });
        setOpenRequests(requests);
      }),
      onSnapshot(mineQuery, (snapshot) => {
        const requests = snapshot.docs.map(toRepairRequest);
        requests.sort((a, b) => {
          const aTime = a.createdAt?.seconds ?? 0;
          const bTime = b.createdAt?.seconds ?? 0;
          return bTime - aTime;
        });
        setMyAssignments(requests);
      }),
    ];

    setSeekerRequests([]);
    return () => unsubscribes.forEach((fn) => fn());
  }, [demoMode, profile.role, user.uid]);

  const handleRequestChange = (field: keyof RequestFormState, value: string) => {
    setRequestForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const formIsValid =
    requestForm.itemName.trim().length > 2 &&
    requestForm.issueDescription.trim().length > 10 &&
    requestForm.location.trim().length > 2;

  const handleCreateRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formIsValid || requestBusy) {
      return;
    }

    setRequestBusy(true);
    setRequestFeedback({ status: 'idle', message: '' });
    setAiPreview(null);

    const requestPayload: NewRepairRequestInput = {
      itemName: requestForm.itemName.trim(),
      issueDescription: requestForm.issueDescription.trim(),
      location: requestForm.location.trim(),
      urgency: requestForm.urgency,
      additionalDetails: sanitize(requestForm.additionalDetails),
      referencePhotoUrl: sanitize(requestForm.referencePhotoUrl),
    };

    if (demoMode) {
      const fallbackEstimate: RepairEstimate =
        demoEstimate ?? {
          estimateSummary: 'Expect ~$25 in parts and under an hour of labor for most fixes like this.',
          estimatedCost: '$25-$50',
          estimatedHours: '45-60 minutes',
          recommendedSteps: [
            'Inspect the item and identify loose or worn components',
            'Tighten hardware or replace the worn part',
            'Test functionality and leave the area tidy',
          ],
          materialsList: ['Multitool', 'Replacement hardware', 'Cleaner rag'],
        };

      const newRequest: RepairRequest = {
        id: `demo-${Date.now()}`,
        ownerId: user.uid,
        ownerName: displayName,
        ownerContact: user.email ?? 'demo@repair.local',
        status: 'open',
        estimateStatus: 'complete',
        ...requestPayload,
        estimateSummary: fallbackEstimate.estimateSummary,
        estimatedCost: fallbackEstimate.estimatedCost,
        estimatedHours: fallbackEstimate.estimatedHours,
        recommendedSteps: fallbackEstimate.recommendedSteps,
        materialsList: fallbackEstimate.materialsList,
      };

      setSeekerRequests((prev) => [newRequest, ...prev]);
      setOpenRequests((prev) => [newRequest, ...prev]);
      setAiPreview(fallbackEstimate);
      setAiStatus('success');
      setRequestFeedback({
        status: 'success',
        message: 'Demo request posted with a sample estimate. Nothing was saved to Firestore.',
      });
      setRequestForm(initialRequestForm);
      setRequestBusy(false);
      return;
    }

    try {
      const docRef = await addDoc(collection(db, 'repairRequests'), {
        ...requestPayload,
        ownerId: user.uid,
        ownerName: displayName,
        ownerContact: user.email ?? '',
        status: 'open',
        estimateStatus: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setRequestForm(initialRequestForm);
      setRequestFeedback({
        status: 'success',
        message: 'Request posted. Drafting your GPT-powered estimate...',
      });
      setAiStatus('pending');

      try {
        const estimate = await generateRepairEstimate(requestPayload);
        await updateDoc(doc(db, 'repairRequests', docRef.id), {
          estimateSummary: estimate.estimateSummary,
          estimatedCost: estimate.estimatedCost,
          estimatedHours: estimate.estimatedHours,
          recommendedSteps: estimate.recommendedSteps,
          materialsList: estimate.materialsList,
          estimateStatus: 'complete',
          updatedAt: serverTimestamp(),
        });
        setAiPreview(estimate);
        setAiStatus('success');
        setRequestFeedback({
          status: 'success',
          message: 'Estimate ready! Share it with your local fixer.',
        });
      } catch (error) {
        console.error(error);
        await updateDoc(doc(db, 'repairRequests', docRef.id), {
          estimateStatus: 'error',
          updatedAt: serverTimestamp(),
        });
        setAiStatus('error');
        setRequestFeedback({
          status: 'error',
          message:
            error instanceof Error
              ? error.message
              : 'Unable to generate an estimate. Try again shortly.',
        });
      }
    } catch (error) {
      console.error(error);
      setRequestFeedback({
        status: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Unable to submit your request. Please try again.',
      });
    } finally {
      setRequestBusy(false);
    }
  };

  const handleClaimRequest = async (request: RepairRequest) => {
    setBoardFeedback({ status: 'idle', message: '' });
    if (demoMode) {
      const claimedRequest: RepairRequest = {
        ...request,
        status: 'claimed',
        fixerId: user.uid,
        fixerName: displayName,
      };
      setOpenRequests((prev) => prev.filter((job) => job.id !== request.id));
      setMyAssignments((prev) => {
        const filtered = prev.filter((job) => job.id !== request.id);
        return [claimedRequest, ...filtered];
      });
      setSeekerRequests((prev) =>
        prev.map((job) => (job.id === request.id ? claimedRequest : job)),
      );
      setBoardFeedback({
        status: 'success',
        message: `Demo mode: You claimed ${request.itemName}.`,
      });
      return;
    }
    try {
      await updateDoc(doc(db, 'repairRequests', request.id), {
        status: 'claimed',
        fixerId: user.uid,
        fixerName: displayName,
        updatedAt: serverTimestamp(),
      });
      setBoardFeedback({
        status: 'success',
        message: `You claimed ${request.itemName}. Coordinate with ${request.ownerName}.`,
      });
    } catch (error) {
      console.error(error);
      setBoardFeedback({
        status: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Unable to claim this job. Refresh and try again.',
      });
    }
  };

  const handleReleaseRequest = async (request: RepairRequest) => {
    setBoardFeedback({ status: 'idle', message: '' });
    if (demoMode) {
      const releasedRequest: RepairRequest = {
        ...request,
        status: 'open',
        fixerId: undefined,
        fixerName: undefined,
      };
      setMyAssignments((prev) => prev.filter((job) => job.id !== request.id));
      setOpenRequests((prev) => [releasedRequest, ...prev.filter((job) => job.id !== request.id)]);
      setSeekerRequests((prev) =>
        prev.map((job) => (job.id === request.id ? releasedRequest : job)),
      );
      setBoardFeedback({
        status: 'success',
        message: `Demo mode: ${request.itemName} returned to the open board.`,
      });
      return;
    }
    try {
      await updateDoc(doc(db, 'repairRequests', request.id), {
        status: 'open',
        fixerId: deleteField(),
        fixerName: deleteField(),
        updatedAt: serverTimestamp(),
      });
      setBoardFeedback({
        status: 'success',
        message: `Released ${request.itemName} back to the board.`,
      });
    } catch (error) {
      console.error(error);
      setBoardFeedback({
        status: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Unable to release this request right now.',
      });
    }
  };

  const handleCompleteRequest = async (request: RepairRequest) => {
    setBoardFeedback({ status: 'idle', message: '' });
    if (demoMode) {
      const completedRequest: RepairRequest = { ...request, status: 'completed' };
      setMyAssignments((prev) =>
        prev.map((job) => (job.id === request.id ? completedRequest : job)),
      );
      setSeekerRequests((prev) =>
        prev.map((job) => (job.id === request.id ? completedRequest : job)),
      );
      setOpenRequests((prev) =>
        prev.map((job) => (job.id === request.id ? completedRequest : job)),
      );
      setBoardFeedback({
        status: 'success',
        message: `Demo mode: Marked ${request.itemName} as completed.`,
      });
      return;
    }
    try {
      await updateDoc(doc(db, 'repairRequests', request.id), {
        status: 'completed',
        updatedAt: serverTimestamp(),
      });
      setBoardFeedback({
        status: 'success',
        message: `Great work! ${request.itemName} marked as fixed.`,
      });
    } catch (error) {
      console.error(error);
      setBoardFeedback({
        status: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Unable to update the status. Try again.',
      });
    }
  };

  const seekerSummary = useMemo(() => {
    if (seekerRequests.length === 0) {
      return 'No open tickets yet. Share your first repair need below.';
    }

    const completed = seekerRequests.filter((req) => req.status === 'completed').length;
    if (completed) {
      return `You have completed ${completed} ${completed === 1 ? 'repair' : 'repairs'} so far.`;
    }

    return `You have ${seekerRequests.length} active request${
      seekerRequests.length > 1 ? 's' : ''
    }.`;
  }, [seekerRequests]);

  const fixerSummary = useMemo(() => {
    if (profile.role !== 'fixer') {
      return '';
    }

    if (myAssignments.length === 0) {
      return 'Claim a request to let your neighbors know you are on it.';
    }

    return `You currently own ${myAssignments.length} repair ${
      myAssignments.length === 1 ? 'ticket' : 'tickets'
    }.`;
  }, [myAssignments, profile.role]);

  const renderRequestCard = (request: RepairRequest, role: UserRole, showActions = false) => (
    <article className={`job-card status-${request.status}`} key={request.id}>
      <header>
        <div>
          <p className="eyebrow">{request.itemName}</p>
          <h4>{request.issueDescription}</h4>
        </div>
        <span className={`status-pill urgency-${request.urgency}`}>{request.urgency} urgency</span>
      </header>

      <p className="muted">{request.additionalDetails ?? 'No extra details shared.'}</p>

      <dl className="job-meta">
        {request.estimatedCost && (
          <div>
            <dt>Estimated cost</dt>
            <dd>{request.estimatedCost}</dd>
          </div>
        )}
        {request.estimatedHours && (
          <div>
            <dt>Estimated effort</dt>
            <dd>{request.estimatedHours}</dd>
          </div>
        )}
        <div>
          <dt>Posted</dt>
          <dd>{formatDate(request.createdAt)}</dd>
        </div>
      </dl>

      {request.estimateSummary && (
        <div className="estimate-summary">
          <strong>GPT guidance</strong>
          <p>{request.estimateSummary}</p>
          {request.recommendedSteps && (
            <ul>
              {request.recommendedSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {role === 'fixer' && (
        <p className="muted owner-line">
          Requested by <strong>{request.ownerName}</strong> · {request.location}
        </p>
      )}

      {role === 'seeker' && request.fixerName && (
        <p className="muted owner-line">
          Claimed by <strong>{request.fixerName}</strong> — coordinate via email.
        </p>
      )}

      {showActions && role === 'fixer' && (
        <div className="job-actions">
          {request.status === 'open' && (
            <button
              type="button"
              className="primary"
              onClick={() => handleClaimRequest(request)}
            >
              Offer to fix
            </button>
          )}
          {request.status === 'claimed' && request.fixerId === user.uid && (
            <>
              <button
                type="button"
                className="ghost"
                onClick={() => handleReleaseRequest(request)}
              >
                Release
              </button>
              <button
                type="button"
                className="primary"
                onClick={() => handleCompleteRequest(request)}
              >
                Mark complete
              </button>
            </>
          )}
        </div>
      )}
    </article>
  );

  const renderSeekerView = () => (
    <>
      <section className="card">
        <div className="card-header">
          <div>
            <p className="eyebrow">Post a repair need</p>
            <h2>Tell neighbors what broke</h2>
            <p className="muted">
              Share enough context so fixers can decide if they have the parts or time.
            </p>
            {demoMode && (
              <p className="muted">Demo mode: submissions stay local and never touch Firestore.</p>
            )}
          </div>
        </div>

        <StatusMessage feedback={requestFeedback} />

        <form className="stack" onSubmit={handleCreateRequest}>
          <label className="field">
            <span>Item</span>
            <input
              type="text"
              value={requestForm.itemName}
              onChange={(event) => handleRequestChange('itemName', event.target.value)}
              placeholder="E.g. Kitchen faucet, bike brakes, record player"
              disabled={requestBusy}
              required
            />
          </label>

          <label className="field">
            <span>Issue description</span>
            <input
              type="text"
              value={requestForm.issueDescription}
              onChange={(event) => handleRequestChange('issueDescription', event.target.value)}
              placeholder="Describe what is happening or any noises/lights"
              disabled={requestBusy}
              required
            />
          </label>

          <label className="field">
            <span>Neighborhood / meetup spot</span>
            <input
              type="text"
              value={requestForm.location}
              onChange={(event) => handleRequestChange('location', event.target.value)}
              placeholder="E.g. Mission District near 24th"
              disabled={requestBusy}
              required
            />
          </label>

          <label className="field">
            <span>Urgency</span>
            <select
              value={requestForm.urgency}
              onChange={(event) => handleRequestChange('urgency', event.target.value as UrgencyLevel)}
              disabled={requestBusy}
            >
              <option value="low">Low — whenever</option>
              <option value="medium">Medium — this week</option>
              <option value="high">High — ASAP</option>
            </select>
          </label>

          <label className="field">
            <span>Extra details</span>
            <input
              type="text"
              value={requestForm.additionalDetails}
              onChange={(event) => handleRequestChange('additionalDetails', event.target.value)}
              placeholder="Model numbers, past fixes, or access notes"
              disabled={requestBusy}
            />
          </label>

          <label className="field">
            <span>Reference photo URL</span>
            <input
              type="url"
              value={requestForm.referencePhotoUrl}
              onChange={(event) => handleRequestChange('referencePhotoUrl', event.target.value)}
              placeholder="Paste a shareable image link"
              disabled={requestBusy}
            />
          </label>

          <button type="submit" className="primary" disabled={!formIsValid || requestBusy}>
            {requestBusy ? 'Submitting...' : 'Post repair request'}
          </button>
        </form>
      </section>

      {aiStatus !== 'idle' && (
        <section className="card ai-preview">
          <p className="eyebrow">Auto estimate</p>
          <h3>
            {aiStatus === 'pending'
              ? 'Gathering GPT guidance...'
              : aiStatus === 'error'
                ? 'Estimate unavailable'
                : 'Share these notes with your fixer'}
          </h3>
          {aiStatus === 'pending' && <p className="muted">This takes about 5 seconds.</p>}
          {aiStatus === 'error' && (
            <p className="muted">
              We could not reach OpenAI. Double-check your API key and try posting again.
            </p>
          )}

          {aiPreview && (
            <>
              <div className="estimate-grid">
                <div>
                  <span className="muted">Estimated cost</span>
                  <strong>{aiPreview.estimatedCost}</strong>
                </div>
                <div>
                  <span className="muted">Estimated effort</span>
                  <strong>{aiPreview.estimatedHours}</strong>
                </div>
              </div>
              <p>{aiPreview.estimateSummary}</p>
              <h4>Suggested steps</h4>
              <ul>
                {aiPreview.recommendedSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
              <h4>Bring these</h4>
              <p>{aiPreview.materialsList.join(', ')}</p>
            </>
          )}
        </section>
      )}

      <section className="card">
        <div className="card-header">
          <div>
            <p className="eyebrow">Your requests</p>
            <h3>{seekerSummary}</h3>
          </div>
        </div>

        {seekerRequests.length === 0 ? (
          <p className="muted">Requests you post will appear here with live status updates.</p>
        ) : (
          <div className="jobs-list">
            {seekerRequests.map((request) => renderRequestCard(request, 'seeker'))}
          </div>
        )}
      </section>
    </>
  );

  const renderFixerView = () => (
    <>
      <section className="card">
        <div className="card-header">
          <div>
            <p className="eyebrow">Open board</p>
            <h2>Pick a neighborhood repair</h2>
            <p className="muted">
              Claim a job to let the requester know someone is on the way. Keep the updates flowing in
              chat or email.
            </p>
            {demoMode && (
              <p className="muted">Demo mode: claiming or completing jobs only updates sample data.</p>
            )}
          </div>
        </div>

        <StatusMessage feedback={boardFeedback} />

        {openRequests.length === 0 ? (
          <p className="muted">No pending requests right now. Check back in a few minutes.</p>
        ) : (
          <div className="jobs-list">
            {openRequests.map((request) => renderRequestCard(request, 'fixer', true))}
          </div>
        )}
      </section>

      <section className="card">
        <div className="card-header">
          <div>
            <p className="eyebrow">Your queue</p>
            <h3>{fixerSummary}</h3>
          </div>
        </div>

        {myAssignments.length === 0 ? (
          <p className="muted">Jobs you claim will show up here so you can track progress.</p>
        ) : (
          <div className="jobs-list">
            {myAssignments.map((request) => renderRequestCard(request, 'fixer', true))}
          </div>
        )}
      </section>
    </>
  );

  return (
    <div className="dashboard-grid">
      <section className="card">
        <div className="card-header">
          <div>
            <p className="eyebrow">Hi {displayName}!</p>
            <h2>
              {profile.role === 'seeker'
                ? 'Tell neighbors what needs fixing.'
                : 'Put your skills to work for the block.'}
            </h2>
            <p className="muted">
              Toggle roles at any time. Firebase keeps your identity secure, Firestore organizes the
              queue, and GPT drafts repair plans.
            </p>
            {demoMode && (
              <p className="muted">
                Demo mode is on—every action stays in the browser so you can pitch the flow without
                configuring auth or Firestore.
              </p>
            )}
          </div>
          <button type="button" className="ghost" onClick={onSignOut}>
            Sign out
          </button>
        </div>

        <div className="role-toggle">
          <button
            type="button"
            className={`role-chip ${profile.role === 'seeker' ? 'active' : ''}`}
            onClick={() => onRoleChange('seeker')}
            disabled={roleUpdating}
          >
            I need a fixer
          </button>
          <button
            type="button"
            className={`role-chip ${profile.role === 'fixer' ? 'active' : ''}`}
            onClick={() => onRoleChange('fixer')}
            disabled={roleUpdating}
          >
            I can fix things
          </button>
        </div>
      </section>

      {profile.role === 'seeker' ? renderSeekerView() : renderFixerView()}
    </div>
  );
};

export default RepairDashboard;
