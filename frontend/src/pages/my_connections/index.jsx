import React, { useEffect } from 'react';
import UserLayout from '@/layout/UserLayout';
import DashboardLayout from '@/layout/DashboardLayout';
import { useDispatch, useSelector } from 'react-redux';
import { AcceptConnection, getMyConnectionRequests, getConnectionRequest } from '@/config/redux/action/authAction';
import { BASE_URL } from '@/config';
import styles from "./index.module.css";
import { useRouter } from 'next/router';

export default function MyConnectionsPage() {
  const dispatch = useDispatch();
  const authState = useSelector((state) => state.auth);
  const router = useRouter();

  useEffect(() => {
    // Fetch both connection requests and existing connections
    dispatch(getMyConnectionRequests({token:localStorage.getItem("token")}));
    dispatch(getConnectionRequest({token:localStorage.getItem("token")}));
  }, []);

  // Helper function to handle connection acceptance
  const handleAcceptConnection = async (e, user) => {
    e.stopPropagation();
    await dispatch(AcceptConnection({
        requestId: user._id,
        token: localStorage.getItem("token"),
        action: "accept" 
    }));
    
    // Refresh the data after accepting
    setTimeout(() => {
      dispatch(getMyConnectionRequests({token:localStorage.getItem("token")}));
      dispatch(getConnectionRequest({token:localStorage.getItem("token")}));
    }, 1000);
  };

  // Get pending requests (not accepted yet) - these are requests I RECEIVED
  const pendingRequests = authState.connectionRequest ? 
    authState.connectionRequest.filter((connection) => connection.status_accepted === null || connection.status_accepted === false) : [];

  // Get all accepted connections from both arrays
  const getAcceptedConnections = () => {
    const acceptedConnections = [];
    
    // Get accepted connections from connectionRequest (requests I received and accepted)
    if (authState.connectionRequest && Array.isArray(authState.connectionRequest)) {
      const acceptedFromRequests = authState.connectionRequest
        .filter(connection => connection.status_accepted === true)
        .map(connection => ({
          ...connection,
          otherUser: connection.userId, // The person who sent me the request
          connectionType: 'received'
        }));
      acceptedConnections.push(...acceptedFromRequests);
    }

    // Get accepted connections from connection array (requests I sent that were accepted)
    if (authState.connection && Array.isArray(authState.connection)) {
      const acceptedFromConnections = authState.connection
        .filter(connection => connection.status_accepted === true)
        .map(connection => ({
          ...connection,
          otherUser: connection.connectionId, // The person I sent the request to
          connectionType: 'sent'
        }));
      acceptedConnections.push(...acceptedFromConnections);
    }

    // Remove duplicates based on user ID
    const uniqueConnections = acceptedConnections.filter((connection, index, self) => {
      const currentUserId = connection.otherUser?._id;
      return index === self.findIndex(c => c.otherUser?._id === currentUserId);
    });

    return uniqueConnections;
  };

  const allAcceptedConnections = getAcceptedConnections();

  return (
    <UserLayout>
      <DashboardLayout>
         <div className={styles.container}>
            {/* Header Section */}
            <div className={styles.headerSection}>
              <h1>My Network Dashboard</h1>
              <p>Manage your incoming connection requests and browse your athlete network.</p>
            </div>

            {/* Layout Grid Split */}
            <div className={styles.networkLayoutGrid}>
              
              {/* Left Panel: Incoming Connection Requests */}
              <div className={styles.requestsPanel}>
                <h2><i className="fa-solid fa-user-clock"></i> Requests ({pendingRequests.length})</h2>
                
                {pendingRequests.length > 0 ? (
                  <div className={styles.requestsList}>
                    {pendingRequests.map((user, index) => (
                      <div 
                        onClick={() => router.push(`/view_profile/${user.userId.username}`)} 
                        className={styles.requestCard} 
                        key={user._id || index}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", justifyContent: "space-between" }}>
                           <img 
                             src={`${BASE_URL}/uploads/${user.userId.profilePicture}`} 
                             alt={user.userId.name} 
                             className={styles.requestAvatar}
                           />
                           <div className={styles.requestNameInfo}>
                                <h3>{user.userId.name}</h3>
                                <p>@{user.userId.username}</p>
                           </div>
                           <button 
                             onClick={(e) => handleAcceptConnection(e, user)} 
                             className={styles.acceptBtn}
                           >
                             Accept
                           </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptyPanel}>
                    <i className="fa-solid fa-user-check"></i>
                    <p>No pending requests</p>
                  </div>
                )}
              </div>

              {/* Right Panel: Network connections grid */}
              <div className={styles.membersPanel}>
                <h2><i className="fa-solid fa-user-group"></i> My Network ({allAcceptedConnections.length})</h2>
                
                {allAcceptedConnections.length > 0 ? (
                  <div className={styles.membersGrid}>
                    {allAcceptedConnections.map((connection, index) => {
                      const userToShow = connection.otherUser;
                      if (!userToShow) return null; // Safety check
                      
                      return (
                        <div 
                          onClick={() => router.push(`/view_profile/${userToShow.username}`)} 
                          className={styles.memberCard} 
                          key={connection._id || index}
                        >
                          <div className={styles.memberAvatarWrapper}>
                            <img 
                              src={
                                !userToShow.profilePicture || userToShow.profilePicture === 'default.jpg'
                                  ? `${BASE_URL}/uploads/default.jpg`
                                  : `${BASE_URL}/uploads/${userToShow.profilePicture}`
                              } 
                              alt={userToShow.name} 
                              className={styles.memberAvatar}
                            />
                          </div>
                          
                          <div className={styles.memberNameInfo}>
                            <h3>{userToShow.name}</h3>
                            <p>@{userToShow.username}</p>
                          </div>
                          
                          <span className={styles.connectedBadge}>Connected</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className={styles.emptyPanel}>
                    <i className="fa-solid fa-user-group"></i>
                    <p>No connections in your network yet.</p>
                  </div>
                )}
              </div>

            </div>
         </div>
      </DashboardLayout>
    </UserLayout>
  );
}