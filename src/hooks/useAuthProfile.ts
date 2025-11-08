import { useCallback, useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import type { UserProfile, UserRole } from '../types/repair';

const useAuthProfile = () => {
  const [user, setUser] = useState<User | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [roleUpdating, setRoleUpdating] = useState(false);

  const ensureProfile = useCallback(
    async (firebaseUser: User, overrides?: Partial<UserProfile>) => {
      const profileRef = doc(db, 'profiles', firebaseUser.uid);
      const snapshot = await getDoc(profileRef);

      if (!snapshot.exists()) {
        const payload: UserProfile = {
          uid: firebaseUser.uid,
          role: overrides?.role ?? 'seeker',
          fullName: overrides?.fullName ?? firebaseUser.displayName ?? firebaseUser.email ?? 'Neighbor',
          email: firebaseUser.email ?? undefined,
          createdAt: undefined,
          updatedAt: undefined,
        };

        await setDoc(
          profileRef,
          {
            role: payload.role,
            fullName: payload.fullName,
            email: payload.email,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );

        setProfile(payload);
        return payload;
      }

      const data = snapshot.data() as UserProfile;
      const existing: UserProfile = {
        uid: firebaseUser.uid,
        role: data.role ?? 'seeker',
        fullName: data.fullName ?? firebaseUser.displayName ?? firebaseUser.email ?? 'Neighbor',
        email: data.email ?? firebaseUser.email ?? undefined,
        skills: data.skills,
        serviceArea: data.serviceArea,
        bio: data.bio,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };

      const updates: Record<string, unknown> = {};

      if (overrides?.role && overrides.role !== existing.role) {
        updates.role = overrides.role;
        existing.role = overrides.role;
      }

      if (overrides?.fullName && overrides.fullName !== existing.fullName) {
        updates.fullName = overrides.fullName;
        existing.fullName = overrides.fullName;
      }

      if (Object.keys(updates).length > 0) {
        await setDoc(profileRef, { ...updates, updatedAt: serverTimestamp() }, { merge: true });
      }

      setProfile(existing);
      return existing;
    },
    [],
  );

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
      if (!firebaseUser) {
        setProfile(null);
      }
      setCheckingSession(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        return;
      }
      setProfileLoading(true);
      try {
        await ensureProfile(user);
      } catch (error) {
        console.error('Unable to load profile', error);
      } finally {
        setProfileLoading(false);
      }
    };

    void loadProfile();
  }, [user, ensureProfile]);

  const refreshUser = useCallback(async () => {
    if (!auth.currentUser) {
      return null;
    }
    await auth.currentUser.reload();
    setUser(auth.currentUser);
    return auth.currentUser;
  }, []);

  const updateRole = useCallback(
    async (role: UserRole) => {
      if (!user || profile?.role === role || roleUpdating) {
        return;
      }
      setRoleUpdating(true);
      try {
        await setDoc(
          doc(db, 'profiles', user.uid),
          { role, updatedAt: serverTimestamp() },
          { merge: true },
        );
        setProfile((prev) => (prev ? { ...prev, role } : prev));
      } catch (error) {
        console.error('Unable to update role', error);
      } finally {
        setRoleUpdating(false);
      }
    },
    [user, profile?.role, roleUpdating],
  );

  return {
    user,
    profile,
    checkingSession,
    profileLoading,
    roleUpdating,
    ensureProfile,
    refreshUser,
    updateRole,
  };
};

export default useAuthProfile;
