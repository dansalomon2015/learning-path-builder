import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { AuthService } from '../services/firebase';
import {
  loadUserProfile,
  signOut as signOutAction,
  setUser,
  clearError as clearAuthError,
  signIn as signInAction,
  signUp as signUpAction,
} from '../store/slices/authSlice';
import { clearPlans } from '../store/slices/learningPlansSlice';

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

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChanged(async firebaseUser => {
      if (firebaseUser) {
        try {
          // Load user profile from Redux
          await dispatch(loadUserProfile(firebaseUser.uid)).unwrap();
        } catch (error) {
          console.error('Error loading user profile:', error);
          // If profile doesn't exist, sign out
          await dispatch(signOutAction()).unwrap();
        }
      } else {
        // User is signed out
        dispatch(setUser(null));
        dispatch(clearPlans());
      }
    });

    return () => unsubscribe();
  }, [dispatch]);

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
