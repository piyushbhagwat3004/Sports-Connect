import { clientServer } from "@/config";
import { createAsyncThunk } from "@reduxjs/toolkit";

export const getAllPosts = createAsyncThunk(
    "post/getAllPosts",
    async (_, thunkAPI) => {
        try{
            const response = await clientServer.get("/posts");
            return thunkAPI.fulfillWithValue(response.data)
        }catch(error){
           return thunkAPI.rejectWithValue(error.response.data)
        }
    }
)


export const createPost = createAsyncThunk(
    "post/createPost",
    async(userData,thunkAPI) => {
        const {file,body} = userData;

        try{
            const formData = new FormData();
            formData.append('token', localStorage.getItem('token') || '');
            if (body !== undefined && body !== null) formData.append('body', body);
            if (file) formData.append('media', file);

            const response = await clientServer.post("/post",formData,{
                headers:{
                    'Content-Type':'multipart/form-data'
                }
            })

            if(response.status === 200){
                return thunkAPI.fulfillWithValue("Post Uploaded")
            }
            else{
                return thunkAPI.fulfillWithValue("Post not Uploaded")
            }
        }catch(err){
            return thunkAPI.rejectWithValue(err.response.data)
        }
    }
) 

export const deletePost = createAsyncThunk(
  "post/deletePost",
  async ({ post_id }, thunkAPI) => {
    try {
      const response = await clientServer.post("/delete_post", {
        post_id, // ✅ backend expects this exact key
        token: localStorage.getItem("token") // ✅ proper usage
      });

      return thunkAPI.fulfillWithValue({ post_id });
    } catch (error) {
      console.error("Error deleting post:", error.response?.data || error.message);
      return thunkAPI.rejectWithValue(error.response?.data || "Something went wrong");
    }
  }
);



export const togglePostLike = createAsyncThunk(
  "post/toggleLike",
  async ({ post_id, user_id }, thunkAPI) => {
    
    try {
      const requestData = {
        post_id,
        user_id,
      };
      
      const response = await clientServer.post("/increment_post_like", requestData);
      
      return thunkAPI.fulfillWithValue(response.data);
    } catch (error) {
      
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);


// postAction.js - FIXED VERSION
export const getallComments = createAsyncThunk(
  "post/getallComments",
  async ({ post_id }, thunkAPI) => {
    try {
      const response = await clientServer.get(`/get_comments?post_id=${post_id}`);
      console.log('API Response:', response.data); // Debug log
      
      return thunkAPI.fulfillWithValue({
        post_id,
        comments: response.data.comments, // ✅ FIXED: Extract comments array from response
      });
    } catch (error) {
      console.error('getallComments error:', error);
      return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to fetch comments");
    }
  }
);

export const postComment = createAsyncThunk(
  "post/postComment",  
  async (commentData, thunkAPI) => {
    try {
        console.log({
          post_id: commentData.post_id,
          body: commentData.body
        })
        
        const response = await clientServer.post("/comment", {
          token: localStorage.getItem("token"),
          post_id: commentData.post_id,
          commentBody: commentData.body,
        });
        
        return thunkAPI.fulfillWithValue(response.data)
    } catch(error) {
        console.error('postComment error:', error);
        return thunkAPI.rejectWithValue(error.message)
    }
  }
)