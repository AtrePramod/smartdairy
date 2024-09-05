import { configureStore } from "@reduxjs/toolkit";
import dateReducer from "./Features/Customers/Date/dateSlice";
import milkReducer from "./Features/Customers/Milk/milkSlice";
import dairySlice from "./Features/Admin/Dairyinfo/dairySlice";
import milkrSlice from "./Features/Customers/Milk/milkrSlice";
import profileSlice from "./Features/Customers/Profile/profileSlice";
import masterdateSlice from "./Features/Customers/Date/masterdateSlice";
import purchaseReducer from "./Features/Purchase/purchaseSlice";

export const store = configureStore({
  reducer: {
    date: dateReducer,
    milk: milkReducer,
    milkr: milkrSlice,
    dairy: dairySlice,
    profile: profileSlice,
    master: masterdateSlice,
    purchase: purchaseReducer,
  },
});
