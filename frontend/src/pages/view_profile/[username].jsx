import { BASE_URL, clientServer, serverClient } from '@/config';
import DashboardLayout from '@/layout/DashboardLayout';
import UserLayout from '@/layout/UserLayout';
import React, { useEffect, useState } from 'react';
import styles from "./index.module.css";
import { getAllPosts } from '@/config/redux/action/postAction';
import { getConnectionRequest, sendConnectionsRequest, getMyConnectionRequests } from '@/config/redux/action/authAction';
import { useRouter } from 'next/router';
import { useDispatch, useSelector } from 'react-redux';

export default function ViewProfilePage({userProfile}) {
  const router = useRouter();
  const postReducer = useSelector((state) => state.posts);
  const authState = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const [userPosts, setUserPosts] = useState([]);
  const [userTeams, setUserTeams] = useState([]);
  const [userConnections, setUserConnections] = useState([]);
  const [activeTab, setActiveTab] = useState("posts"); // "posts" | "teams" | "connections"
  
  const [connectionStatus, setConnectionStatus] = useState({
    isConnected: false,
    isPending: false,
    canConnect: true
  });

  const getUsersPost = async () => {
    await dispatch(getAllPosts());
    await dispatch(getConnectionRequest({token:localStorage.getItem("token")}));
    await dispatch(getMyConnectionRequests({token:localStorage.getItem("token")}));
  }

  useEffect(() => {
    if (postReducer.posts && Array.isArray(postReducer.posts)) {
      let post = postReducer.posts.filter((post) => {
        return post.userId.username === router.query.username
      })
      setUserPosts(post);
    }
  }, [postReducer.posts]);

  useEffect(() => {
    if (!userProfile?.userId?._id) return;

    const targetUserId = userProfile.userId._id;
    let isConnected = false;
    let isPending = false;

    // Check in connection array (requests you sent)
    if (authState.connection && Array.isArray(authState.connection)) {
      const foundConnection = authState.connection.find(conn => 
        conn.connectionId?._id === targetUserId
      );
      
      if (foundConnection) {
        if (foundConnection.status_accepted === true) {
          isConnected = true;
        } else if (foundConnection.status_accepted === null || foundConnection.status_accepted === false) {
          isPending = true;
        }
      }
    }

    // Check in connectionRequest array (requests sent to you)
    if (authState.connectionRequest && Array.isArray(authState.connectionRequest)) {
      const foundRequest = authState.connectionRequest.find(req => 
        req.userId?._id === targetUserId
      );
      
      if (foundRequest) {
        if (foundRequest.status_accepted === true) {
          isConnected = true;
        } else if (foundRequest.status_accepted === null || foundRequest.status_accepted === false) {
          isPending = true;
        }
      }
    }

    setConnectionStatus({
      isConnected,
      isPending,
      canConnect: !isConnected && !isPending
    });

  }, [authState.connection, authState.connectionRequest, userProfile?.userId?._id]);

  const fetchUserConnections = async () => {
    try {
      if (!userProfile?.userId?._id) return;
      const res = await clientServer.get(`/user/get_user_connections?userId=${userProfile.userId._id}`);
      setUserConnections(res.data.connections || []);
    } catch (error) {
      console.error("Failed to fetch user connections:", error);
    }
  };

  const fetchUserTeams = async () => {
    try {
      if (!userProfile?.userId?._id) return;
      const res = await clientServer.get(`/teams/user/${userProfile.userId._id}`);
      setUserTeams(res.data.teams || []);
    } catch (error) {
      console.error("Failed to fetch user teams:", error);
    }
  };

  useEffect(() => {
    getUsersPost();
    if (userProfile?.userId?._id) {
      fetchUserTeams();
      fetchUserConnections();
    }
  }, [userProfile?.userId?._id]);

  const handleConnect = async () => {
    await dispatch(sendConnectionsRequest({
      token: localStorage.getItem("token"),
      user_id: userProfile.userId._id
    }));
    
    // Refresh connection data after sending request
    setTimeout(() => {
      dispatch(getConnectionRequest({token:localStorage.getItem("token")}));
      dispatch(getMyConnectionRequests({token:localStorage.getItem("token")}));
    }, 1000);
  };

  const handleDownloadResume = async () => {
    try {
      const response = await clientServer.get(`/user/download_resume?id=${userProfile.userId._id}`);
      window.open(`${BASE_URL}/uploads/${response.data.message}`, "_blank");
    } catch (error) {
      console.error("Failed to download resume:", error);
    }
  };

  if (!userProfile) {
    return (
      <UserLayout>
        <DashboardLayout>
          <div className={styles.profileMissing}>
            <div className={styles.missingCard}>
              <i className="fa-solid fa-user-slash"></i>
              <h2>Profile not found</h2>
              <p>The user profile you're looking for doesn't exist or has been removed.</p>
            </div>
          </div>
        </DashboardLayout>
      </UserLayout>
    );
  }

  const getConnectionButtonText = () => {
    if (connectionStatus.isConnected) return "✓ Connected";
    if (connectionStatus.isPending) return "⏳ Pending";
    return "🤝 Connect";
  };

  const getConnectionButtonClass = () => {
    if (connectionStatus.isConnected || connectionStatus.isPending) {
      return styles.connectedButton;
    }
    return styles.connectBtn;
  };

  const getSportIcon = (sport) => {
    switch (sport) {
      case 'Football': return 'fa-futbol';
      case 'Basketball': return 'fa-basketball-ball';
      case 'Tennis': return 'fa-tennis-ball';
      case 'Cricket': return 'fa-baseball';
      case 'Fitness': return 'fa-dumbbell';
      default: return 'fa-users';
    }
  };

  return (
    <UserLayout>
       <DashboardLayout>
          <div className={styles.container}>
              {/* Cover Backdrop Banner */}
              <div className={styles.backDropContainer}></div>

              {/* Scouting Layout Grid */}
              <div className={styles.profileLayoutGrid}>
                
                {/* Left Side: Athlete Scouting Card */}
                <div className={styles.scoutingCard}>
                  <div className={styles.avatarWrapper}>
                    <img 
                      className={styles.profileAvatar} 
                      src={
                        !userProfile.userId.profilePicture || userProfile.userId?.profilePicture === 'default.jpg'
                          ? `${BASE_URL}/uploads/default.jpg`
                          : `${BASE_URL}/uploads/${userProfile.userId.profilePicture}`
                      } 
                      alt={`${userProfile.userId.name}'s profile`} 
                    />
                  </div>

                  <div className={styles.profileNameSection}>
                    <h2>{userProfile.userId.name}</h2>
                    <p>@{userProfile.userId.username}</p>
                  </div>

                  {userProfile.sport && (
                    <div className={styles.sportsBadge}>
                      <i className={`fa-solid ${getSportIcon(userProfile.sport)}`}></i> {userProfile.sport}
                    </div>
                  )}

                  <div className={styles.actionButtons}>
                    <button
                      onClick={connectionStatus.canConnect ? handleConnect : undefined}
                      className={getConnectionButtonClass()}
                      disabled={!connectionStatus.canConnect}
                    >
                      {getConnectionButtonText()}
                    </button>
                    
                    <div
                      onClick={handleDownloadResume}
                      className={styles.downloadBtn}
                      title="Download Resume"
                    >
                      <svg
                        style={{ width: "1.25em", height: "1.25em" }}
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="2.5"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M7.5 7.5h-.75A2.25 2.25 0 0 0 4.5 9.75v7.5a2.25 2.25 0 0 0 2.25 2.25h7.5a2.25 2.25 0 0 0 2.25-2.25v-7.5a2.25 2.25 0 0 0-2.25-2.25h-.75m-6 3.75 3 3m0 0 3-3m-3 3V1.5m6 9h.75a2.25 2.25 0 0 1 2.25 2.25v7.5a2.25 2.25 0 0 1-2.25 2.25h-7.5a2.25 2.25 0 0 1-2.25-2.25v-.75"
                        />
                      </svg>
                    </div>
                  </div>

                  {userProfile.bio && (
                    <div className={styles.bioSection}>
                      <p>"{userProfile.bio}"</p>
                    </div>
                  )}

                  {/* Vertical Timeline for Club/Sport History */}
                  {userProfile.pastWork && userProfile.pastWork.length > 0 && (
                    <div className={styles.workHistory}>
                      <h3>🏆 Club Timeline</h3>
                      <div className={styles.workHistoryContainer}>
                        {userProfile.pastWork.map((work, index) => (
                          <div key={index} className={styles.workHistoryCard}>
                            <p>Club: {work.company}</p>
                            <p>Position: {work.position}</p>
                            <p>Tenure: {work.years}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Side: Performance Panels */}
                <div className={styles.performancePanels}>
                  
                  {/* Dynamic Stats Grid */}
                  <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                      <div className={styles.statIcon}>
                        <i className="fa-solid fa-camera"></i>
                      </div>
                      <div className={styles.statDetails}>
                        <span className={styles.statNumber}>{userPosts.length}</span>
                        <span className={styles.statLabel}>Posts</span>
                      </div>
                    </div>

                    <div className={styles.statCard}>
                      <div className={styles.statIcon}>
                        <i className="fa-solid fa-user-friends"></i>
                      </div>
                      <div className={styles.statDetails}>
                        <span className={styles.statNumber}>{userConnections.length}</span>
                        <span className={styles.statLabel}>Connections</span>
                      </div>
                    </div>

                    <div className={styles.statCard}>
                      <div className={styles.statIcon}>
                        <i className="fa-solid fa-shield-halved"></i>
                      </div>
                      <div className={styles.statDetails}>
                        <span className={styles.statNumber}>{userTeams.length}</span>
                        <span className={styles.statLabel}>Teams Joined</span>
                      </div>
                    </div>
                  </div>

                  {/* Feed Panel containing Tabs */}
                  <div className={styles.feedPanel}>
                    <div className={styles.profileTabs}>
                      <button 
                        className={`${styles.tabBtn} ${activeTab === 'posts' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('posts')}
                      >
                        <i className="fa-solid fa-grid-2"></i> Posts
                      </button>
                      <button 
                        className={`${styles.tabBtn} ${activeTab === 'teams' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('teams')}
                      >
                        <i className="fa-solid fa-shield-halved"></i> Teams
                      </button>
                      <button 
                        className={`${styles.tabBtn} ${activeTab === 'connections' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('connections')}
                      >
                        <i className="fa-solid fa-user-friends"></i> Connections
                      </button>
                    </div>

                    {/* Posts Tab Content */}
                    {activeTab === 'posts' && (
                      <div className={styles.postsGridSection}>
                        {userPosts && userPosts.length > 0 ? (
                          <div className={styles.postsGrid}>
                            {userPosts.map((post) => (
                              <div key={post._id} className={styles.postGridItem}>
                                {post.media && post.media !== "" ? (
                                  <img 
                                    src={`${BASE_URL}/uploads/${post.media}`} 
                                    alt={`Post by ${post.userId.username}`} 
                                  />
                                ) : (
                                  <div className={styles.textPostCard}>
                                    <p>{post.body}</p>
                                  </div>
                                )}
                                <div className={styles.postGridOverlay}>
                                  <span><i className="fa-solid fa-heart"></i> {post.likes?.length || 0}</span>
                                  <span><i className="fa-solid fa-comment"></i> {post.comments?.length || 0}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className={styles.emptyState}>
                            <i className="fa-solid fa-camera"></i>
                            <p>No posts yet</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Teams Tab Content */}
                    {activeTab === 'teams' && (
                      <div className={styles.teamsSection}>
                        {userTeams && userTeams.length > 0 ? (
                          <div className={styles.teamsGrid}>
                            {userTeams.map((team) => (
                              <div key={team._id} className={styles.teamProfileCard}>
                                <div className={styles.teamProfileHeader}>
                                  <i className={`fa-solid ${getSportIcon(team.sport)}`}></i>
                                  <span className={styles.teamSportLabel}>{team.sport}</span>
                                </div>
                                <h4>{team.name}</h4>
                                <p className={styles.teamDescription}>{team.description}</p>
                                <div className={styles.teamMeta}>
                                  <span>👥 {team.members?.length || 0} members</span>
                                  {team.creatorId?._id === userProfile.userId._id && (
                                    <span className={styles.ownerTag}>Owner</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className={styles.emptyState}>
                            <i className="fa-solid fa-shield-halved"></i>
                            <p>Not a member of any team yet</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Connections Tab Content */}
                    {activeTab === 'connections' && (
                      <div className={styles.connectionsSection}>
                        {userConnections && userConnections.length > 0 ? (
                          <div className={styles.connectionsGrid}>
                            {userConnections.map((conn) => (
                              <div 
                                key={conn._id} 
                                className={styles.connectionCard}
                                onClick={() => router.push(`/view_profile/${conn.username}`)}
                              >
                                <img 
                                  src={
                                    !conn.profilePicture || conn.profilePicture === 'default.jpg'
                                      ? `${BASE_URL}/uploads/default.jpg`
                                      : `${BASE_URL}/uploads/${conn.profilePicture}`
                                  } 
                                  alt={conn.name} 
                                  className={styles.connectionAvatar}
                                />
                                <div className={styles.connectionNameInfo}>
                                  <h4>{conn.name}</h4>
                                  <p>@{conn.username}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className={styles.noConnections}>
                            <i className="fa-solid fa-user-friends"></i>
                            <p>No connections yet</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
          </div>
       </DashboardLayout>
    </UserLayout>
  )
}

export async function getServerSideProps(context) {
  try {
    const res = await serverClient.get(`/user/get_profile_based_on_username`, {
      params: {
        username: context.params.username
      }
    });

    return {
      props: {
        userProfile: res.data.profile || null
      }
    };
  } catch (err) {
    console.error("Error fetching profile:", err.message);
    return {
      props: {
        userProfile: null
      }
    };
  }
}