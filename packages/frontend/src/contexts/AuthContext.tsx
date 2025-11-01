import type React from 'react';
import { createContext, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  signOut as signOutAction,
  clearError as clearAuthError,
  signIn as signInAction,
  signUp as signUpAction,
} from '../store/slices/authSlice';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }): JSX.Element => {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isLoading, error } = useAppSelector(
    (state): typeof state.auth => state.auth
  );

  // No Firebase listener: rely on Redux (persist) and backend JWT
  useEffect((): void => {
    // nothing to do on mount; Redux Persist rehydrates auth state
  }, []);

  const signIn = async (email: string, password: string): Promise<void> => {
    await dispatch(signInAction({ email, password })).unwrap();
  };

  const signUp = async (email: string, password: string, name: string): Promise<void> => {
    await dispatch(signUpAction({ email, password, name })).unwrap();
  };

  const logout = async (): Promise<void> => {
    await dispatch(signOutAction()).unwrap();
  };

  const clearError = (): void => {
    dispatch(clearAuthError());
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    error,
    signIn,
    signUp,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
