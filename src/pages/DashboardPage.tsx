import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut, type User } from 'firebase/auth';
import LoadingCard from '../components/cards/LoadingCard';
import RepairDashboard from '../components/dashboard/RepairDashboard';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebase';
import type { UserProfile, UserRole } from '../types/repair';
import { demoEstimate, demoPrefilledData } from '../data/demoRequests';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, profile, checkingSession, profileLoading, roleUpdating, updateRole } = useAuth();
  const demoMode = import.meta.env.VITE_USE_DUMMY_DATA === 'true';
  const [demoRole, setDemoRole] = useState<UserRole>('seeker');

  const demoUser = useMemo(
    () =>
      ({
        uid: 'demo-user',
        email: 'demo@repair.local',
        displayName: 'Demo Neighbor',
        emailVerified: true,
      }) as User,
    [],
  );

  const demoProfile = useMemo<UserProfile>(
    () => ({
      uid: 'demo-user',
      role: demoRole,
      fullName: 'Demo Neighbor',
      email: 'demo@repair.local',
    }),
    [demoRole],
  );

  const memoizedPrefill = useMemo(
    () => ({
      seekerRequests: demoPrefilledData.seekerRequests.map((req) => ({ ...req })),
      openRequests: demoPrefilledData.openRequests.map((req) => ({ ...req })),
      myAssignments: demoPrefilledData.myAssignments.map((req) => ({ ...req })),
    }),
    [],
  );

  const handleDemoRoleChange = async (role: UserRole) => {
    setDemoRole(role);
  };

  useEffect(() => {
    if (demoMode) {
      return;
    }
    if (!checkingSession && (!user || !user.emailVerified)) {
      navigate('/', { replace: true });
    }
  }, [checkingSession, demoMode, navigate, user]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Unable to sign out', error);
    }
  };

  if (demoMode) {
    return (
      <div className="app-shell">
        <RepairDashboard
          user={demoUser}
          profile={demoProfile}
          roleUpdating={false}
          onRoleChange={handleDemoRoleChange}
          onSignOut={async () => {}}
          prefilledData={memoizedPrefill}
          demoEstimate={demoEstimate}
        />
        <div className="glow glow-one" />
        <div className="glow glow-two" />
      </div>
    );
  }

  const isReady = user && user.emailVerified && profile && !checkingSession && !profileLoading;

  if (!isReady) {
    return (
      <div className="app-shell">
        <LoadingCard />
        <div className="glow glow-one" />
        <div className="glow glow-two" />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <RepairDashboard
        user={user}
        profile={profile}
        roleUpdating={roleUpdating}
        onRoleChange={updateRole}
        onSignOut={handleSignOut}
      />
      <div className="glow glow-one" />
      <div className="glow glow-two" />
    </div>
  );
};

export default DashboardPage;
