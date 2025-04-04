import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../../axiosInstance";

const initialState = {
  payment: {},
  status: "idle",
  error: null,
};

// Retriving Payments Data
export const getPaymentInfo = createAsyncThunk(
  "payment/getPaymentInfo",
  async ({ fromDate, toDate }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/payment-info", {
        fromDate,
        toDate,
      });
      return response.data;
    } catch (error) {
      const errorMessage = error.response
        ? error.response.data
        : "Failed to fetch payment information.";
      return rejectWithValue(errorMessage);
    }
  }
);

// Retriving Payments Data
export const getSalesPreport = createAsyncThunk(
  "payment/getSalesPreport",
  async ({ fromDate, toDate }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/stock/sale/all", {
        fromDate,
        toDate,
      });
      return response.data;
    } catch (error) {
      const errorMessage = error.response
        ? error.response.data
        : "Failed to fetch payment information.";
      return rejectWithValue(errorMessage);
    }
  }
);


const salesSlice = createSlice({
  name: "sales",
  initialState,
  reducers: {
    reset: () => initialState, // Add reset action to return the initial state
  },
  extraReducers: (builder) => {
    builder
      .addCase(getPaymentInfo.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(getPaymentInfo.fulfilled, (state, action) => {
        state.loading = false;
        state.status = "succeeded";
        state.payment = action.payload.payment;
      })
      .addCase(getPaymentInfo.rejected, (state, action) => {
        state.loading = false;
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export default salesSlice.reducer;
