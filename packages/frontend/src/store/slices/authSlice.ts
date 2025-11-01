import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { User } from '@/types';
import { apiService } from '@/services/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Async thunks for authentication actions
export const signIn = createAsyncThunk<
  User,
  { email: string; password: string },
  { rejectValue: string }
>(
  'auth/signIn',
  async (
    { email, password }: { email: string; password: string },
    { rejectWithValue }
  ): Promise<User | ReturnType<typeof rejectWithValue>> => {
    try {
      // Backend login: email + password (no token required)
      const { user } = await apiService.backendLogin(email, password);
      // Cookie is set in apiService; localStorage mirror is also handled there
      if (user == null) {
        throw new Error('User data missing from login response');
      }
      return user as unknown as User;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      const message = error.response?.data?.message ?? error.message ?? 'Invalid credentials';
      return rejectWithValue(message);
    }
  }
);

export const signUp = createAsyncThunk<
  User,
  { email: string; password: string; name: string },
  { rejectValue: string }
>(
  'auth/signUp',
  async (
    { email, password, name }: { email: string; password: string; name: string },
    { rejectWithValue }
  ): Promise<User | ReturnType<typeof rejectWithValue>> => {
    try {
      const { user } = await apiService.backendRegister(name, email, password);
      // Cookie is set in apiService; localStorage mirror is also handled there
      if (user == null) {
        throw new Error('User data missing from register response');
      }
      // Map backend user to frontend User shape if needed
      const userRecord: Record<string, unknown> = user;
      const mappedUser: User = {
        id: (userRecord.id ?? userRecord.uid ?? '') as string,
        email: userRecord.email as string,
        name: (userRecord.name ?? userRecord.displayName ?? '') as string,
        avatar: userRecord.avatar as string | undefined,
        learningObjectives: (userRecord.learningObjectives ?? []) as string[],
        preferences: (userRecord.preferences ?? {
          studyMode: 'mixed',
          difficultyAdjustment: 'automatic',
          sessionLength: 15,
          notifications: true,
          language: 'fr',
        }) as User['preferences'],
        createdAt: (userRecord.createdAt ?? new Date().toISOString()) as string,
        updatedAt: (userRecord.updatedAt ?? new Date().toISOString()) as string,
      };
      return mappedUser;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      const message = error.response?.data?.message ?? error.message ?? 'Sign up failed';
      return rejectWithValue(message);
    }
  }
);

export const signOut = createAsyncThunk<null, void, { rejectValue: string }>(
  'auth/signOut',
  (): null => {
    try {
      localStorage.removeItem('jwtToken');
      // Also clear cookie
      document.cookie = 'jwtToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax';
      return null;
    } catch {
      return null;
    }
  }
);

export const loadUserProfile = createAsyncThunk<User | null, string, { rejectValue: string }>(
  'auth/loadUserProfile',
  (_userId: string, { rejectWithValue }): User | null | ReturnType<typeof rejectWithValue> => {
    try {
      // TODO: Implement API call to load user profile
      // For now, return null as this is not currently used
      return null;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load user profile';
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateUserProfile = createAsyncThunk<
  User,
  { userId: string; userData: Partial<User> },
  { rejectValue: string }
>(
  'auth/updateUserProfile',
  (
    { userId, userData }: { userId: string; userData: Partial<User> },
    { rejectWithValue }
  ): User | ReturnType<typeof rejectWithValue> => {
    try {
      // TODO: Implement API call to update user profile
      // For now, return the updated user data
      return { ...userData, id: userId } as User;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update user profile';
      return rejectWithValue(errorMessage);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state): void => {
      state.error = null;
    },
    setUser: (state, action: PayloadAction<User | null>): void => {
      state.user = action.payload;
      state.isAuthenticated = action.payload != null;
    },
    setLoading: (state, action: PayloadAction<boolean>): void => {
      state.isLoading = action.payload;
    },
  },
  extraReducers: (builder): void => {
    builder
      // Sign In
      .addCase(signIn.pending, (state): void => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signIn.fulfilled, (state, action): void => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(signIn.rejected, (state, action): void => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.user = null;
      })
      // Sign Up
      .addCase(signUp.pending, (state): void => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signUp.fulfilled, (state, action): void => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(signUp.rejected, (state, action): void => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.user = null;
      })
      // Sign Out
      .addCase(signOut.pending, (state): void => {
        state.isLoading = true;
      })
      .addCase(signOut.fulfilled, (state): void => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(signOut.rejected, (state, action): void => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Load User Profile
      .addCase(loadUserProfile.pending, (state): void => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadUserProfile.fulfilled, (state, action): void => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = action.payload != null;
        state.error = null;
      })
      .addCase(loadUserProfile.rejected, (state, action): void => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.user = null;
      })
      // Update User Profile
      .addCase(updateUserProfile.pending, (state): void => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action): void => {
        state.isLoading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(updateUserProfile.rejected, (state, action): void => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setUser, setLoading } = authSlice.actions;
export default authSlice.reducer;
