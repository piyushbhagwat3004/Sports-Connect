// postReducer.js - FIXED VERSION
import { createSlice } from "@reduxjs/toolkit";
import { getAllPosts, deletePost, togglePostLike, getallComments, postComment } from "../../action/postAction";

const initialState = {
  posts: [],
  isError: false,
  postFetched: false,
  isLoading: false,
  loggedIn: false,
  message: "",
  comments: [],
  postId: "",
};

const postSlice = createSlice({
  name: "post",
  initialState,
  reducers: {
    reset: () => initialState,
    resetPostId: (state) => {
      state.postId = "";
      state.comments = []; // ✅ Also clear comments when resetting postId
    },
    // ✅ ADD THIS: Handle setPostId action
    setPostId: (state, action) => {
      state.postId = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllPosts.pending, (state) => {
        state.isLoading = true;
        state.message = "Fetching all the posts..";
      })
      .addCase(getAllPosts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isError = false;
        state.postFetched = true;
        state.posts = action.payload.posts;
      })
      .addCase(getAllPosts.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(deletePost.fulfilled, (state, action) => {
        const { postId } = action.payload;
        state.posts = state.posts.filter((post) => post._id !== postId);
        state.message = "Post deleted successfully";
      })
      .addCase(deletePost.rejected, (state, action) => {
        state.isError = true;
        state.message = action.payload || "Failed to delete post";
      })
      .addCase(togglePostLike.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(togglePostLike.fulfilled, (state, action) => {
        state.loading = false;
        const { post_id, likes, likeCount } = action.payload;
        
        const postIndex = state.posts.findIndex(post => post._id === post_id);
        if (postIndex !== -1) {
          state.posts[postIndex].likes = likes;
          state.posts[postIndex].likeCount = likeCount;
        }
      })
      .addCase(togglePostLike.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to toggle like';
      })
      // ✅ FIXED: Better comments handling
      .addCase(getallComments.pending, (state) => {
        state.isLoading = true;
        console.log('Getting comments...');
      })
      .addCase(getallComments.fulfilled, (state, action) => {
        console.log('Comments received:', action.payload);
        state.postId = action.payload.post_id;
        state.comments = Array.isArray(action.payload.comments) ? action.payload.comments : [];
        state.isLoading = false;
        state.isError = false;
        console.log('Comments stored in state:', state.comments);
      })
      .addCase(getallComments.rejected, (state, action) => {
        console.error('Comments fetch failed:', action.payload);
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        state.comments = [];
      })
      // ✅ ADDED: Handle postComment action
      .addCase(postComment.fulfilled, (state, action) => {
        state.message = "Comment posted successfully";
        // Note: You might want to add the new comment to state.comments here
        // or refresh comments after posting
      })
      .addCase(postComment.rejected, (state, action) => {
        state.isError = true;
        state.message = action.payload || "Failed to post comment";
      })
  },
});

// ✅ EXPORT setPostId from the slice actions
export const { reset, resetPostId, setPostId } = postSlice.actions;
export default postSlice.reducer;