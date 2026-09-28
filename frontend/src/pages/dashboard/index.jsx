import { createPost, getAllPosts, deletePost, togglePostLike, getallComments, postComment } from '@/config/redux/action/postAction';
import UserLayout from '@/layout/UserLayout';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAboutUser, getAllUsers } from '@/config/redux/action/authAction';
import DashboardLayout from '@/layout/DashboardLayout';
import styles from "./styles.module.css";
import { BASE_URL } from '@/config';
import { resetPostId, setPostId } from '@/config/redux/reducer/postReducer';
// Remove the duplicate import line below:
// import { setPostId } from '@/config/redux/action/postAction';

export default function Dashboard() {
  const router = useRouter();
  const dispatch = useDispatch();
  const authState = useSelector((state) => state.auth);
  const postState = useSelector((state) => state.posts);

  const [postContent, setPostContent] = useState("");
  const [fileContent, setFileContent] = useState(null);
  const [commentText, setCommentText] = useState("")
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [lastCommentSubmitted, setLastCommentSubmitted] = useState("");

  const fileInputRef = React.useRef(null);

  useEffect(() => {
    if (authState.isTokenThere) {
      dispatch(getAllPosts());
      dispatch(getAboutUser({ token: localStorage.getItem("token") }));
    }

    if (!authState.all_profiles_fetched) {
      dispatch(getAllUsers());
    }
  }, [authState.isTokenThere]);

  const handleUpload = async () => {
    await dispatch(createPost({ file: fileContent, body: postContent }));
    setPostContent("");
    setFileContent(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    dispatch(getAllPosts());
  };

  const handleDelete = async (postId) => {
    await dispatch(deletePost({ post_id: postId }));
    dispatch(getAllPosts());
  };

  const handleLikeToggle = async (postId, userId) => {
    try {
      await dispatch(togglePostLike({
        post_id: postId,
        user_id: userId,
      }));
      // Refresh posts to get updated like counts
      dispatch(getAllPosts());
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleCommentSubmit = async () => {
    // Prevent duplicate submissions
    if (isSubmittingComment || !commentText.trim()) return;
    
    // Prevent duplicate content
    if (commentText.trim() === lastCommentSubmitted) {
      alert("You've already posted this comment!");
      return;
    }
    
    setIsSubmittingComment(true);
    
    try {
      // Post the comment
      await dispatch(
        postComment({
          post_id: postState.postId,
          body: commentText.trim(),
        })
      );
      
      // Fetch updated comments
      await dispatch(getallComments({ post_id: postState.postId }));
      
      setLastCommentSubmitted(commentText.trim());
      setCommentText("");
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const getProfileImageSrc = () => {
    const profilePicture = authState?.user?.userId?.profilePicture;
    return !profilePicture || profilePicture === 'default.jpg'
      ? `${BASE_URL}/uploads/default.jpg`
      : `${BASE_URL}/uploads/${profilePicture}`;
  };

  const hasUserData = authState?.user?.userId;
  const isLoading = authState.isTokenThere && !hasUserData;

  return (
    <UserLayout>
      <DashboardLayout>
        <div className={styles.scrollComponent}>
          <div className={styles.createPostContainer}>
            <div className={styles.topSection}>
              {isLoading ? (
                <div className={styles.loading}>Loading...</div>
              ) : (
                <img
                  src={getProfileImageSrc()}
                  alt="Profile"
                  className={styles.profileImage}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/100x100/cccccc/666666?text=User';
                  }}
                />
              )}
              <textarea
                onChange={(e) => setPostContent(e.target.value)}
                value={postContent}
                className={styles.textArea}
                placeholder="Start a post..."
              ></textarea>
            </div>

            <div className={styles.bottomSection}>
              <div className={styles.uploadRow}>
                <label htmlFor="fileUpload" className={styles.uploadLabel}>
                  <div className={styles.uploadIcon}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                      strokeWidth="1.5" stroke="currentColor" className={styles.icon}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    <span>Add Photo</span>
                  </div>
                </label>
                {fileContent && (
                  <span className={styles.fileSelectedFeedback}>
                    📎 {fileContent.name}
                    <button type="button" onClick={() => { setFileContent(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} className={styles.clearFileBtn}>✕</button>
                  </span>
                )}
              </div>
              <input ref={fileInputRef} onChange={(e) => setFileContent(e.target.files[0])} type="file" hidden id="fileUpload" accept="image/*" />
              {(postContent.trim().length > 0 || fileContent) && (
                <button onClick={handleUpload} className={styles.postBtn}>Post</button>
              )}
            </div>
          </div>


          <div className={styles.postFeed}>
            {postState.posts.map((post) => {
              const isOwner = post.userId._id === authState?.user?.userId?._id;
              const userId = authState?.user?.userId?._id;
              const likes = Array.isArray(post.likes) ? post.likes : [];
              const hasLiked = likes.includes(userId);
              const likeCount = likes.length;

              return (
                <div key={post._id} className={styles.postCard}>
                  <div className={styles.postHeader}>
                    <img
                      className={styles.userProfile}
                      src={`${BASE_URL}/uploads/${post.userId.profilePicture || 'default.jpg'}`}
                      alt="User"
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/40'; }}
                    />
                    <div className={styles.headerText}>
                      <p className={styles.username}>{post.userId.name}</p>
                      <span className={styles.timestamp}>{new Date(post.createdAt).toLocaleString()}</span>
                    </div>
                    {isOwner && (
                      <button
                        className={styles.deleteBtn}
                        onClick={() => handleDelete(post._id)}
                        title="Delete Post"
                      >
                        🗑️
                      </button>
                    )}
                  </div>

                  <div className={styles.postBody}>
                    <p className={styles.caption}>{post.body}</p>
                    {post.media && (
                      <img
                        className={styles.postImage}
                        src={`${BASE_URL}/uploads/${post.media}`}
                        alt="Post"
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                    )}
                  </div>

                  <div className={styles.postActions}>
                    <button
                      onClick={() => handleLikeToggle(post._id, userId)}
                      className={`${styles.actionBtn} ${hasLiked ? styles.liked : ''}`}
                      disabled={!userId} // Disable if user not logged in
                    >
                      <span className={styles.likeIcon}>
                        {hasLiked ? "❤️" : "🤍"}
                      </span>
                      <span className={styles.likeText}>
                        {hasLiked ? "Liked" : "Like"}
                      </span>
                      <span className={styles.likeCount}>
                        {likeCount > 0 && `(${likeCount})`}
                      </span>
                    </button>

                    <button 
                      onClick={async () => {
                        console.log('Fetching comments for post:', post._id);
                        
                        // First set the postId to open the modal
                        dispatch(setPostId(post._id));
                        
                        // Then fetch comments
                        const result = await dispatch(getallComments({post_id: post._id}));
                        console.log('Comments fetch result:', result);
                      }}
                      className={styles.actionBtn}
                    >
                      💬 Comment
                    </button>

                    <button 
                      className={styles.actionBtn}
                      onClick={() => {
                        const text = encodeURIComponent(post.body);
                        const url = encodeURIComponent("https://aim.in");
                        const twitterURL = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
                        window.open(twitterURL, "_blank");
                      }}
                    >
                      <svg style={{width:"1.2em"}} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

{postState.postId !== "" && (
  <div
    className={styles.commentsContainer}
    onClick={() => dispatch(resetPostId())}
  >
    <div
      className={styles.allCommentsContainer}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Comments</h3>
        <button 
          onClick={() => dispatch(resetPostId())}
          style={{ 
            position: 'absolute', 
            top: '15px', 
            right: '15px', 
            background: 'none', 
            border: 'none', 
            fontSize: '20px', 
            cursor: 'pointer' 
          }}
        >
          ×
        </button>
      </div>

      {/* Comments List */}
      {!Array.isArray(postState.comments) || postState.comments.length === 0 ? (
        <div className={styles.noComments}>
          <p>No comments yet. Be the first to comment!</p>
        </div>
      ) : (
        <div className={styles.commentsList}>
          {postState.comments.map((comment, idx) => (
            <div key={comment._id || idx} className={styles.singleComment}>
              <div className={styles.commentHeader}>
                <img
                  className={styles.commentAvatar}
                  src={
                    comment.userId?.profilePicture && comment.userId.profilePicture !== 'default.jpg'
                      ? `${BASE_URL}/uploads/${comment.userId.profilePicture}`
                      : `${BASE_URL}/uploads/default.jpg`
                  }
                  alt={comment.userId?.name || "User"}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/40x40/cccccc/666666?text=User';
                  }}
                />
                <div className={styles.commentUserInfo}>
                  <p className={styles.commentAuthor}>
                    {comment.userId?.name || "Anonymous User"}
                  </p>
                  <p className={styles.commentUsername}>
                    @{comment.userId?.username || "unknown"}
                  </p>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                  {comment.createdAt && (
                    <p className={styles.commentTimestamp}>
                      {new Date(comment.createdAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  )}
                </div>
              </div>
              <p className={styles.commentText}>{comment.body}</p>
            </div>
          ))}
        </div>
      )}

      {/* Post Comment Input */}
      <div className={styles.postCommentContainer}>
        <img
          className={styles.commentAvatar}
          src={getProfileImageSrc()}
          alt="Your profile"
          style={{ width: '32px', height: '32px' }}
        />
        <input
          type="text"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !isSubmittingComment && commentText.trim()) {
              e.preventDefault();
              handleCommentSubmit();
            }
          }}
          placeholder="Write a comment..."
          className={styles.commentInput}
          disabled={isSubmittingComment}
        />
        <button
          onClick={handleCommentSubmit}
          disabled={isSubmittingComment || !commentText.trim()}
          className={styles.commentBtn}
        >
          {isSubmittingComment ? 'Posting...' : 'Post'}
        </button>
      </div>
    </div>
  </div>
)}
      </DashboardLayout>
    </UserLayout>
  );
}