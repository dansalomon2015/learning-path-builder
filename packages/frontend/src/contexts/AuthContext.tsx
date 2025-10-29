import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  signOut as signOutAction,
  clearError as clearAuthError,
  signIn as signInAction,
  signUp as signUpAction,
} from '../store/slices/authSlice';

interface AuthContextType {
  user: any;
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

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isLoading, error } = useAppSelector(state => state.auth);

  // No Firebase listener: rely on Redux (persist) and backend JWT
  useEffect(() => {
    // nothing to do on mount; Redux Persist rehydrates auth state
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await dispatch(signInAction({ email, password })).unwrap();
    } catch (error) {
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      await dispatch(signUpAction({ email, password, name })).unwrap();
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await dispatch(signOutAction()).unwrap();
    } catch (error) {
      throw error;
    }
  };

  const clearError = () => {
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
