import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { LearningPlan } from '@/types';
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
export const fetchLearningPlans = createAsyncThunk<LearningPlan[], void, { rejectValue: string }>(
  'learningPlans/fetchLearningPlans',
  async (
    _: void,
    { rejectWithValue }
  ): Promise<LearningPlan[] | ReturnType<typeof rejectWithValue>> => {
    try {
      const response = await apiService.getLearningPlans();
      return response.data ?? [];
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch learning plans';
      return rejectWithValue(errorMessage);
    }
  }
);

export const createLearningPlan = createAsyncThunk<
  LearningPlan,
  {
    title: string;
    description: string;
    topic: string;
    skillLevel: string;
    mode: string;
  },
  { rejectValue: string }
>(
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
  ): Promise<LearningPlan | ReturnType<typeof rejectWithValue>> => {
    try {
      const response = await apiService.createLearningPlan(planData);
      if (response.data == null) {
        return rejectWithValue('No data returned from server');
      }
      return response.data;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create learning plan';
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateLearningPlan = createAsyncThunk<
  LearningPlan,
  { planId: string; planData: Partial<LearningPlan> },
  { rejectValue: string }
>(
  'learningPlans/updateLearningPlan',
  async (
    { planId, planData }: { planId: string; planData: Partial<LearningPlan> },
    { rejectWithValue }
  ): Promise<LearningPlan | ReturnType<typeof rejectWithValue>> => {
    try {
      const response = await apiService.updateLearningPlan(planId, planData);
      if (response.data == null) {
        return rejectWithValue('No data returned from server');
      }
      return response.data;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update learning plan';
      return rejectWithValue(errorMessage);
    }
  }
);

export const deleteLearningPlan = createAsyncThunk<string, string, { rejectValue: string }>(
  'learningPlans/deleteLearningPlan',
  async (
    planId: string,
    { rejectWithValue }
  ): Promise<string | ReturnType<typeof rejectWithValue>> => {
    try {
      await apiService.deleteLearningPlan(planId);
      return planId;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete learning plan';
      return rejectWithValue(errorMessage);
    }
  }
);

const learningPlansSlice = createSlice({
  name: 'learningPlans',
  initialState,
  reducers: {
    clearError: (state): void => {
      state.error = null;
    },
    setCurrentPlan: (state, action: PayloadAction<LearningPlan | null>): void => {
      state.currentPlan = action.payload;
    },
    clearPlans: (state): void => {
      state.plans = [];
      state.currentPlan = null;
    },
  },
  extraReducers: (builder): void => {
    builder
      // Fetch Learning Plans
      .addCase(fetchLearningPlans.pending, (state): void => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchLearningPlans.fulfilled, (state, action): void => {
        state.isLoading = false;
        state.plans = action.payload;
        state.error = null;
      })
      .addCase(fetchLearningPlans.rejected, (state, action): void => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create Learning Plan
      .addCase(createLearningPlan.pending, (state): void => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createLearningPlan.fulfilled, (state, action): void => {
        state.isLoading = false;
        state.plans.push(action.payload);
        state.error = null;
      })
      .addCase(createLearningPlan.rejected, (state, action): void => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update Learning Plan
      .addCase(updateLearningPlan.pending, (state): void => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateLearningPlan.fulfilled, (state, action): void => {
        state.isLoading = false;
        const payload = action.payload;
        const index = state.plans.findIndex(
          (plan: LearningPlan): boolean => plan.id === payload.id
        );
        if (index !== -1) {
          state.plans[index] = payload;
        }
        state.error = null;
      })
      .addCase(updateLearningPlan.rejected, (state, action): void => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Delete Learning Plan
      .addCase(deleteLearningPlan.pending, (state): void => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteLearningPlan.fulfilled, (state, action): void => {
        state.isLoading = false;
        state.plans = state.plans.filter(
          (plan: LearningPlan): boolean => plan.id !== action.payload
        );
        if (state.currentPlan?.id === action.payload) {
          state.currentPlan = null;
        }
        state.error = null;
      })
      .addCase(deleteLearningPlan.rejected, (state, action): void => {
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
