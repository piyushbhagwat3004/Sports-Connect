import Post from "../models/posts.model.js";

import Profile from "../models/profile.model.js";

import User from "../models/user.model.js";

import bcrypt from "bcryptjs";

import Comment from "../models/comments.model.js"; 
import Notification from "../models/notification.model.js"; 

export const activeCheck = async (req, res) => {
    return res.status(200).json({
        message: "Active check",
    });
}


export const createPost = async (req, res) => {
      const { token } = req.body;

      try{
            const user = await User.findOne({ token: token });

            if(!user) return res.status(400).json({ message: "User not found" });

            const post = new Post({
                userId: user._id,
                body: req.body.body,
                media: req.file != undefined ? req.file.filename : "",
                fileType: req.file != undefined ? req.file.mimetype.split("/")[1]:"",
            });

            await post.save();

            return res.status(200).json({ message: "Post created successfully" });
      }catch(error){
          return res.status(500).json({ message: error.message });
      }
}

export const getAllPosts = async (req, res) => {
    try{
        const posts = await Post.find().populate('userId', 'name email username profilePicture');

        return res.json({posts});
    }catch(error){
        return res.status(500).json({ message: error.message });
    }
}


export const deletePost = async (req, res) => {
  const { post_id, token } = req.body;

  try {
    const user = await User.findOne({ token }).select('_id');

    if (!user) return res.status(400).json({ message: "User not found" });

    const post = await Post.findById(post_id);

    if (!post) return res.status(400).json({ message: "Post not found" });

    if (post.userId.toString() !== user._id.toString()) {
      return res.status(401).json({ message: "You are not authorized to delete this post" });
    }

    await Post.deleteOne({ _id: post_id }); // ✅ CORRECTED HERE

    return res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};



export const get_comments_by_post = async (req, res) => {
  const { post_id } = req.query;

  try {
    // Optional: ensure post exists
    const post = await Post.findById(post_id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Fetch comments and populate user data
    const comments = await Comment.find({ postId: post_id })
      .populate("userId", "name username profilePicture")
      .sort({ createdAt: -1 }); // newest first

    return res.status(200).json({ comments });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};



export const delete_comment_of_user = async (req, res) => {

    const {token, comment_id } = req.body;
    try{
        const user = await User
        .findOne({ token: token })
        .select('_id');

        if(!user) return res.status(400).json({ message: "User not found" });

        const comment = await Comment.findOne({ "_id": comment_id });

        if(!comment) return res.status(400).json({ message: "Comment not found" });

        if(comment.userId.toString() !== user._id.toString()) {
            return res.status(401).json({ message: "You are not authorized to delete this comment" });
        }

        await Comment.deleteOne({"_id": comment_id });


        return res.status(200).json({ message: "Comment deleted successfully" });
    }catch(error){
        return res.status(500).json({ message: error.message });
    }
}


// This is the main function that should handle the like toggle
export const increment_likes = async (req, res) => {
  console.log("=== INCREMENT_LIKES FUNCTION CALLED ===");
  console.log("Request body:", JSON.stringify(req.body, null, 2));
  
  const { post_id, user_id } = req.body;
  
  console.log("Extracted post_id:", post_id);
  console.log("Extracted user_id:", user_id);
  console.log("Type of post_id:", typeof post_id);
  console.log("Type of user_id:", typeof user_id);
  
  try {
    if (!post_id || !user_id) {
      console.log("Missing required fields - returning 400");
      return res.status(400).json({ message: "Post ID and User ID are required" });
    }
    
    console.log("About to search for post...");
    const post = await Post.findOne({ _id: post_id });
    console.log("Post found:", post ? "YES" : "NO");
    
    if (!post) {
      console.log("Post not found - returning 404");
      return res.status(404).json({ message: "Post not found" });
    }
    
    if (post) {
      console.log("Post details:");
      console.log("- Post ID:", post._id);
      console.log("- Post userId:", post.userId);
      console.log("- Post likes (current):", post.likes);
      console.log("- Post likes type:", typeof post.likes);
      console.log("- Is likes array?", Array.isArray(post.likes));
    }
    
    // CRITICAL FIX: Ensure likes is always an array
    console.log("Checking if likes is array...");
    if (!Array.isArray(post.likes)) {
      console.log("Likes is not array, converting and saving...");
      // Use MongoDB's findOneAndUpdate to safely convert the field
      await Post.findOneAndUpdate(
        { _id: post_id },
        { $set: { likes: [] } },
        { new: true }
      );
      // Refetch the post to get the updated version
      const updatedPost = await Post.findOne({ _id: post_id });
      post.likes = updatedPost.likes;
      console.log("Post likes converted to array:", post.likes);
    }
    
    console.log("Searching for user_id in likes array...");
    const index = post.likes.indexOf(user_id);
    console.log("User index in likes:", index);
    
    let action = "";
    let newLikes = [...post.likes]; // Create a copy
    
    if (index === -1) {
      console.log("User not found in likes, adding...");
      // User hasn't liked the post, so add like
      newLikes.push(user_id);
      action = "liked";

      // Trigger notification for the post author (if commenter/liker is not the author)
      if (post.userId.toString() !== user_id.toString()) {
        try {
          const userWhoLiked = await User.findById(user_id);
          if (userWhoLiked) {
            const likeNotification = new Notification({
              userId: post.userId,
              senderId: user_id,
              type: "like",
              relatedId: post._id,
              message: `${userWhoLiked.name} liked your post.`
            });
            await likeNotification.save();
            console.log("Like notification saved successfully for user:", post.userId);
          }
        } catch (err) {
          console.error("Error creating like notification:", err);
        }
      }
    } else {
      console.log("User found in likes, removing...");
      // User has already liked the post, so remove like
      newLikes.splice(index, 1);
      action = "unliked";
    }
    
    console.log("New likes array:", newLikes);
    console.log("About to update post with new likes...");
    
    // Use findOneAndUpdate for atomic operation
    const updatedPost = await Post.findOneAndUpdate(
      { _id: post_id },
      { 
        $set: { 
          likes: newLikes,
          updatedAt: new Date()
        }
      },
      { new: true }
    );
    
    console.log("Post updated successfully!");
    console.log("Final likes array:", updatedPost.likes);
    
    const response = {
      message: `Post ${action} successfully`,
      likes: updatedPost.likes,
      likeCount: updatedPost.likes.length,
      action: action,
      post_id: post_id
    };
    
    console.log("Sending response:", JSON.stringify(response, null, 2));
    console.log("=== INCREMENT_LIKES FUNCTION COMPLETED ===");
    
    return res.status(200).json(response);
    
  } catch (error) {
    console.error("=== ERROR IN INCREMENT_LIKES ===");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("=== END ERROR ===");
    
    return res.status(500).json({
      message: error.message,
      errorName: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};