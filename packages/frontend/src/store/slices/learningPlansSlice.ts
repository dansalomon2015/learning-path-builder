import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { LearningPlan } from '@/types';
import { apiService } from '@/services/api';

interface LearningPlansState {
  plans: LearningPlan[];
  isLoading: boolean;
  error: string | null;
  currentPlan: LearningPlan | null;
}

const initialState: LearningPlansState = {
  plans: [],
  isLoading: false,
  error: null,
  currentPlan: null,
};

// Async thunks for learning plans
export const fetchLearningPlans = createAsyncThunk(
  'learningPlans/fetchLearningPlans',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.getLearningPlans();
      return response.data || [];
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch learning plans');
    }
  }
);

export const createLearningPlan = createAsyncThunk(
  'learningPlans/createLearningPlan',
  async (
    planData: {
      title: string;
      description: string;
      topic: string;
      skillLevel: string;
      mode: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiService.createLearningPlan(planData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create learning plan');
    }
  }
);

export const updateLearningPlan = createAsyncThunk(
  'learningPlans/updateLearningPlan',
  async (
    { planId, planData }: { planId: string; planData: Partial<LearningPlan> },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiService.updateLearningPlan(planId, planData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update learning plan');
    }
  }
);

export const deleteLearningPlan = createAsyncThunk(
  'learningPlans/deleteLearningPlan',
  async (planId: string, { rejectWithValue }) => {
    try {
      await apiService.deleteLearningPlan(planId);
      return planId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete learning plan');
    }
  }
);

const learningPlansSlice = createSlice({
  name: 'learningPlans',
  initialState,
  reducers: {
    clearError: state => {
      state.error = null;
    },
    setCurrentPlan: (state, action: PayloadAction<LearningPlan | null>) => {
      state.currentPlan = action.payload;
    },
    clearPlans: state => {
      state.plans = [];
      state.currentPlan = null;
    },
  },
  extraReducers: builder => {
    builder
      // Fetch Learning Plans
      .addCase(fetchLearningPlans.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchLearningPlans.fulfilled, (state, action) => {
        state.isLoading = false;
        state.plans = action.payload;
        state.error = null;
      })
      .addCase(fetchLearningPlans.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create Learning Plan
      .addCase(createLearningPlan.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createLearningPlan.fulfilled, (state, action) => {
        state.isLoading = false;
        state.plans.push(action.payload);
        state.error = null;
      })
      .addCase(createLearningPlan.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update Learning Plan
      .addCase(updateLearningPlan.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateLearningPlan.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          const index = state.plans.findIndex(plan => plan.id === action.payload!.id);
          if (index !== -1) {
            state.plans[index] = action.payload!;
          }
        }
        state.error = null;
      })
      .addCase(updateLearningPlan.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Delete Learning Plan
      .addCase(deleteLearningPlan.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteLearningPlan.fulfilled, (state, action) => {
        state.isLoading = false;
        state.plans = state.plans.filter(plan => plan.id !== action.payload);
        if (state.currentPlan?.id === action.payload) {
          state.currentPlan = null;
        }
        state.error = null;
      })
      .addCase(deleteLearningPlan.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError: clearLearningPlansError,
  setCurrentPlan,
  clearPlans,
} = learningPlansSlice.actions;
export default learningPlansSlice.reducer;
