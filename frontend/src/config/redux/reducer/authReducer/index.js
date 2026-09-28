import { createSlice } from "@reduxjs/toolkit";
import { getAboutUser, getAllUsers, getConnectionRequest, getMyConnectionRequests, loginUser, registerUser } from "../../action/authAction";

// Initial state of auth
const initialState = {
  user: null,
  isError: false,
  isSuccess: false,
  isLoading: false,
  loggedIn: false,
  message: "",
  isTokenThere:false,
  profileFetched: false,
  connection: [],
  connectionRequest: [],
  all_users:[],
  all_profiles_fetched: false
};

const authSlice = createSlice({
  name: "auth",
  // ✅ correct property name
  initialState,

  reducers: {
    reset: () => initialState,
    handleLoginUser: (state) => {
      state.message = "hello";
    },
    emptyMessage: (state) => {
      state.message = ""
    },
    setTokenIsThere: (state) => {
        state.isTokenThere = true
    },

    setTokenIsNotThere: (state) => {
        state.isTokenThere = false
    },
    setLoggedIn: (state, action) => {
    state.loggedIn = action.payload;
    }
  },

  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.message = "Knocking the door..!";
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isError = false;
        state.isSuccess = true;
        state.loggedIn = true;
        state.message = "Login is successful";
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true
        state.message = "Registering please wait"
      })
      .addCase(registerUser.fulfilled, (state,action) => {
        state.isLoading = false
        state.isError = false
        state.isSuccess = true
        state.message = {
          message: "Registration completed!! Now Please Sign In"
        }
      })
      .addCase(registerUser.rejected, (state,action) => {
        state.isLoading = false
        state.isError = true
        state.message = action.payload
      })
      .addCase(getAboutUser.fulfilled, (state,action) => {
        state.isLoading = false;
        state.isError = false;
        state.profileFetched = true;
        // ✅ FIXED: Use correct property name from backend response
        state.user = action.payload.userProfile;  // Changed from 'Profile' to 'userProfile'
      })
      .addCase(getAboutUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.profileFetched = false;
        state.loggedIn = false;
        state.user = null;
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
        }
      })
      .addCase(getAllUsers.fulfilled,(state,action) => {
        state.isLoading = false;
        state.isError = false;
        state.all_profiles_fetched= true;
        state.all_users = action.payload.profiles;
        
      })
      .addCase(getConnectionRequest.fulfilled,(state,action) => {
        state.connection = action.payload
      })
      .addCase(getConnectionRequest.rejected,(state,action) => {
        state.message = action.payload
      })
      .addCase(getMyConnectionRequests.fulfilled, (state,action) => {
        state.connectionRequest = action.payload
      })
      .addCase(getMyConnectionRequests.rejected, (state,action) => {
        state.message = action.payload
      })
  },
});

// Export actions and reducer

export const { reset, emptyMessage, setLoggedIn ,setTokenIsNotThere , setTokenIsThere} = authSlice.actions;


export default authSlice.reducer;