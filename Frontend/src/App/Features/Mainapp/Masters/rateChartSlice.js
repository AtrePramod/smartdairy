import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../../../axiosInstance";

const initialState = {
  ratechartList: [],
  rateChart: [], //used for milk collection
  selectedRateChart: {}, // selected for operations
  maxRcCode: 1,
  status: "idle",
  error: null,
  progress: 0,
};

//fetch current Number of ratechart

export const fetchMaxRcCode = createAsyncThunk(
  "ratechart/fetchMaxRcCode",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/ratechart/maxrccode");
      return response.data.maxRcCode; // Ensure this exists
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to fetch maxRcCode.";
      return rejectWithValue(errorMessage);
    }
  }
);

//save new ratechart

export const saveRateChart = createAsyncThunk(
  "ratechart/saveRateChart",
  async (
    { rccode, rctype, rcdate, time, animal, rate },
    { rejectWithValue, signal, dispatch }
  ) => {
    try {
      const response = await axiosInstance.post(
        "/upload/ratechart",
        {
          rccode,
          rctype,
          rcdate,
          time,
          animal,
          rate,
        },
        {
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            dispatch(updateProgress(percentCompleted));
          },
          signal, // Attach the signal for cancellation
        }
      );
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "Failed to save Ratechart information.";
      return rejectWithValue(errorMessage);
    }
  }
);

//fetch used ratecharts

export const getRateCharts = createAsyncThunk(
  "ratechart/getRateCharts",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/milkcollection/ratechart");
      return response.data.usedRateChart;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "Failed to fetch ratechart used by this dairy.";
      return rejectWithValue(errorMessage);
    }
  }
);

// fetch selected ratechart

export const fetchRateChart = createAsyncThunk(
  "ratechart/fetchRateChart",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/ratechart/selected");
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to fetch ratechart!.";
      return rejectWithValue(errorMessage);
    }
  }
);

//list all ratecharts

export const listRateCharts = createAsyncThunk(
  "ratechart/listRateCharts",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/ratechart/list");
      return response.data.ratecharts;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to fetch ratechart list!";
      return rejectWithValue(errorMessage);
    }
  }
);

//Fetch Selected rate chart 

export const fetchselectedRateChart = createAsyncThunk(
  "ratechart/fetchselectedRateChart",
  async ({selectedRateChart}, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/selected/ratechart", {
        selectedRateChart,
      });
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to get selected ratechart!.";
      return rejectWithValue(errorMessage);
    }
  }
);

//apply rate chart imcomplete

export const applyRateChart = createAsyncThunk(
  "ratechart/applyRateChart",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/apply/ratechart");
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to apply ratechart!.";
      return rejectWithValue(errorMessage);
    }
  }
);

// 
export const fetchMilkCollRatechart = createAsyncThunk(
  "ratechart/fetchMilkCollRatechart",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("");
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "Failed to fetch milk collection ratechart!.";
      return rejectWithValue(errorMessage);
    }
  }
);


// Slice
const rateChartSlice = createSlice({
  name: "ratechart",
  initialState,
  reducers: {
    updateProgress(state, action) {
      state.progress = action.payload;
    },
    resetProgress(state) {
      state.progress = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMaxRcCode.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchMaxRcCode.fulfilled, (state, action) => {
        state.maxRcCode = action.payload;
        state.status = "succeeded";
      })
      .addCase(fetchMaxRcCode.rejected, (state, action) => {
        state.error = action.payload;
        state.status = "failed";
      })
      .addCase(saveRateChart.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.progress = 0;
      })
      .addCase(saveRateChart.fulfilled, (state) => {
        state.status = "succeeded";
        state.progress = 100;
      })
      .addCase(saveRateChart.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
        state.progress = 0;
      }) // Rate chart used for milk Collection
      .addCase(getRateCharts.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getRateCharts.fulfilled, (state, action) => {
        state.rateChart = action.payload;
        state.status = "succeeded";
      })
      .addCase(getRateCharts.rejected, (state, action) => {
        state.error = action.payload;
        state.status = "failed";
      })
      .addCase(fetchRateChart.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchRateChart.fulfilled, (state, action) => {
        state.selectedRateChart = action.payload;
        state.status = "succeeded";
      })
      .addCase(fetchRateChart.rejected, (state, action) => {
        state.error = action.payload;
        state.status = "failed";
      })
      .addCase(listRateCharts.pending, (state) => {
        state.status = "loading";
      })
      .addCase(listRateCharts.fulfilled, (state, action) => {
        state.ratechartList = action.payload;
        state.status = "succeeded";
      })
      .addCase(listRateCharts.rejected, (state, action) => {
        state.error = action.payload;
        state.status = "failed";
      })
      .addCase(applyRateChart.pending, (state) => {
        state.status = "loading";
      })
      .addCase(applyRateChart.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(applyRateChart.rejected, (state, action) => {
        state.error = action.payload;
        state.status = "failed";
      })
      .addCase(fetchMilkCollRatechart.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchMilkCollRatechart.fulfilled, (state, action) => {
        state.rateChart = action.payload;
        state.status = "succeeded";
      })
      .addCase(fetchMilkCollRatechart.rejected, (state, action) => {
        state.error = action.payload;
        state.status = "failed";
      })
      .addCase(fetchselectedRateChart.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchselectedRateChart.fulfilled, (state, action) => {
        state.selectedRateChart = action.payload;
        state.status = "succeeded";
      })
      .addCase(fetchselectedRateChart.rejected, (state, action) => {
        state.error = action.payload;
        state.status = "failed";
      });
  },
});

export const { updateProgress, resetProgress } = rateChartSlice.actions;

export default rateChartSlice.reducer;
