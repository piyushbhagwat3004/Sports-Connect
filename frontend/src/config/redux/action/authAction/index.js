import { clientServer } from "@/config";
import { createAsyncThunk } from "@reduxjs/toolkit";

export const loginUser = createAsyncThunk(
  "user/login",
  async (userData, thunkAPI) => {
    try {
      const response = await clientServer.post(`/login`, {
        email: userData.email,
        password: userData.password
      });

      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        return thunkAPI.fulfillWithValue(response.data.token);
      } else {
        return thunkAPI.rejectWithValue({
          message: "token not provided"
        });
      }

    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || {
        message: "Unknown error"
      });
    }
  }
);

export const registerUser = createAsyncThunk(
  "user/register",
  async (userData, thunkAPI) => {
    try {
      const response = await clientServer.post(`/register`, {
        username: userData.username,
        password: userData.password,
        email: userData.email,
        name: userData.name,
      });
      console.log("🚀 Backend Register Response:", response.data);
      return thunkAPI.fulfillWithValue(response.data.message);

    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || {
        message: "Unknown error"
      });
    }
  }
);

export const getAboutUser = createAsyncThunk(
  "user/getAboutUser",
  async (user, thunkAPI) => {
    try {
      const response = await clientServer.get("/get_user_and_profile", {
        params: { token: user.token }
      });

      return thunkAPI.fulfillWithValue(response.data);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || {
        message: "Unknown error"
      });
    }
  }
);

export const getAllUsers = createAsyncThunk(
  "user/getAllUsers",
  async(_, thunkAPI) => {
    try{
      const response = await clientServer.get("/user/get_all_users");
      return thunkAPI.fulfillWithValue(response.data);
    }catch(err){
        return thunkAPI.rejectWithValue(err.response.data)
    }
  }
)

// FIXED: Corrected parameter name and endpoint
export const sendConnectionsRequest = createAsyncThunk(
  "user/sendConnectionRequest",
  async (user, thunkAPI) => {
    try{
      const response = await clientServer.post("/user/send_connection_request", {
        token: user.token,
        connectionId: user.user_id  // FIXED: Changed from user_id to connectionId
      })

      thunkAPI.dispatch(getConnectionRequest({token: user.token}))
      return thunkAPI.fulfillWithValue(response.data);
    }catch(error){
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
)

export const getConnectionRequest = createAsyncThunk(
  "user/getConnectionRequests",
  async(user, thunkAPI) => {
    try{
      const response = await clientServer.get("/user/getConnectionRequests", {
        params: {
          token: user.token
        }
      })
      return thunkAPI.fulfillWithValue(response.data.connections);
    }catch(error){
      return thunkAPI.rejectWithValue(error.response.data)
    }
  }
)

export const getMyConnectionRequests = createAsyncThunk(
  "user/getMyConnectionRequests",
  async(user, thunkAPI) => {
    try{
      const response = await clientServer.get("/user/user_connection_requests", {
        params: {
          token: user.token
        }
      });
      return thunkAPI.fulfillWithValue(response.data.connections || response.data ) // FIXED: Changed to connections
    }catch(error){
       return thunkAPI.rejectWithValue(error.response.data)
    }
  }
)

export const AcceptConnection = createAsyncThunk(
  "user/acceptConnection",
  async (user, thunkAPI) => {
    try{
     const response = await clientServer.post("/user/accept_connection_request", {
      token: user.token,
      requestId: user.requestId, // ✅ FIXED: Changed from user.connectionId to user.requestId
      action_type: user.action
     })
     
     // ✅ OPTIONAL: Refresh the connection requests after accepting
     thunkAPI.dispatch(getConnectionRequest({token:user.token}))
     thunkAPI.dispatch(getMyConnectionRequests({token: user.token}))
     
     return thunkAPI.fulfillWithValue(response.data);
    }catch(error){
     return thunkAPI.rejectWithValue(error.response.data)
    }
  }
)