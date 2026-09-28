// src/config/redux/store.js or wherever your store is

import { configureStore } from "@reduxjs/toolkit";
import { createWrapper } from "next-redux-wrapper";
import authReducer from "./reducer/authReducer";
import postReducer from "./reducer/postReducer";

const makeStore = () =>
  configureStore({
    reducer: {
      auth: authReducer,
      posts: postReducer,
    },
    devTools: true,
  });

// Export wrapper so it can be used in _app.js and pages
export const wrapper = createWrapper(makeStore, { debug: true });
