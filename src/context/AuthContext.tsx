import { createContext, type ReactNode, useContext } from 'react';
import useAuthProfile from '../hooks/useAuthProfile';

const AuthContext = createContext<ReturnType<typeof useAuthProfile> | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const value = useAuthProfile();
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
