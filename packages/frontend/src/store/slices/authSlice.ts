import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User } from '@/types';
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
export const signIn = createAsyncThunk(
  'auth/signIn',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      // Backend login: email + password (no token required)
      const { jwtToken, user } = await apiService.backendLogin(email, password);
      if (jwtToken) {
        localStorage.setItem('jwtToken', jwtToken);
      }
      if (!user) {
        throw new Error('User data missing from login response');
      }
      return user as User;
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Invalid credentials';
      return rejectWithValue(message);
    }
  }
);

export const signUp = createAsyncThunk(
  'auth/signUp',
  async (
    { email, password, name }: { email: string; password: string; name: string },
    { rejectWithValue }
  ) => {
    try {
      const { jwtToken, user } = await apiService.backendRegister(name, email, password);
      if (jwtToken) {
        localStorage.setItem('jwtToken', jwtToken);
      }
      if (!user) {
        throw new Error('User data missing from register response');
      }
      // Map backend user to frontend User shape if needed
      const mappedUser: User = {
        id: user.id || user.uid,
        email: user.email,
        name: user.name || user.displayName || '',
        avatar: user.avatar,
        skillLevel: user.skillLevel || 'beginner',
        learningObjectives: user.learningObjectives || [],
        preferences: user.preferences || {
          studyMode: 'mixed',
          difficultyAdjustment: 'automatic',
          sessionLength: 15,
          notifications: true,
          language: 'fr',
        },
        createdAt: user.createdAt || new Date().toISOString(),
        updatedAt: user.updatedAt || new Date().toISOString(),
      };
      return mappedUser;
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Sign up failed';
      return rejectWithValue(message);
    }
  }
);

export const signOut = createAsyncThunk('auth/signOut', async () => {
  try {
    localStorage.removeItem('jwtToken');
    return null;
  } catch {
    return null;
  }
});

export const loadUserProfile = createAsyncThunk(
  'auth/loadUserProfile',
  async (userId: string, { rejectWithValue }) => {
    try {
      const userProfile = await AuthService.getUserProfile(userId);
      return userProfile as User;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to load user profile');
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'auth/updateUserProfile',
  async (
    { userId, userData }: { userId: string; userData: Partial<User> },
    { rejectWithValue }
  ) => {
    try {
      // TODO: Implement API call to update user profile
      // For now, return the updated user data
      return { ...userData, id: userId } as User;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update user profile');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: state => {
      state.error = null;
    },
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
  extraReducers: builder => {
    builder
      // Sign In
      .addCase(signIn.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signIn.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(signIn.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.user = null;
      })
      // Sign Up
      .addCase(signUp.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signUp.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(signUp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.user = null;
      })
      // Sign Out
      .addCase(signOut.pending, state => {
        state.isLoading = true;
      })
      .addCase(signOut.fulfilled, state => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(signOut.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Load User Profile
      .addCase(loadUserProfile.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loadUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.user = null;
      })
      // Update User Profile
      .addCase(updateUserProfile.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setUser, setLoading } = authSlice.actions;
export default authSlice.reducer;
