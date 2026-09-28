import React, { useEffect, useState, useRef } from 'react';
import UserLayout from '@/layout/UserLayout';
import DashboardLayout from '@/layout/DashboardLayout';
import { clientServer, BASE_URL } from '@/config';
import { useSelector, useDispatch } from 'react-redux';
import { getAllUsers } from '@/config/redux/action/authAction';
import styles from './styles.module.css';

export default function TeamsPage() {
  const authState = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Live Chat States
  const [activeChatTeamId, setActiveChatTeamId] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const chatMessagesEndRef = useRef(null);

  // Invitations selected user map (teamId -> targetUserId)
  const [inviteUserIdMap, setInviteUserIdMap] = useState({});

  // Create Team Form States
  const [teamForm, setTeamForm] = useState({
    name: "",
    sport: "Football",
    description: "",
    maxSize: 11
  });

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const res = await clientServer.get('/teams');
      setTeams(res.data.teams || []);
    } catch (error) {
      console.error("Failed to fetch teams:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChatMessages = async (teamId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await clientServer.get(`/teams/${teamId}/messages?token=${token}`);
      setChatMessages(res.data.messages || []);
    } catch (err) {
      console.error("Failed to fetch chat messages:", err);
    }
  };

  useEffect(() => {
    fetchTeams();
    dispatch(getAllUsers());
  }, []);

  useEffect(() => {
    let interval;
    if (activeChatTeamId) {
      fetchChatMessages(activeChatTeamId);
      interval = setInterval(() => {
        fetchChatMessages(activeChatTeamId);
      }, 3000); // Poll every 3 seconds for live chat
    } else {
      setChatMessages([]);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeChatTeamId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatMessagesEndRef.current) {
      chatMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const handleFormChange = (e) => {
    setTeamForm({
      ...teamForm,
      [e.target.name]: e.target.value
    });
  };

  const showFeedback = (msg, type) => {
    if (type === "success") {
      setSuccessMsg(msg);
      setErrorMsg("");
    } else {
      setErrorMsg(msg);
      setSuccessMsg("");
    }
    setTimeout(() => {
      setSuccessMsg("");
      setErrorMsg("");
    }, 5000);
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!teamForm.name.trim() || !teamForm.description.trim()) {
      showFeedback("Please fill out all fields", "error");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await clientServer.post('/teams/create', {
        token,
        ...teamForm
      });
      showFeedback("Team created successfully!", "success");
      setIsModalOpen(false);
      setTeamForm({ name: "", sport: "Football", description: "", maxSize: 11 });
      fetchTeams();
    } catch (error) {
      showFeedback(error.response?.data?.message || "Failed to create team", "error");
    }
  };

  const handleJoinTeam = async (teamId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await clientServer.post('/teams/join', { token, teamId });
      showFeedback(res.data.message || "Joined team successfully!", "success");
      fetchTeams();
    } catch (error) {
      showFeedback(error.response?.data?.message || "Failed to join team", "error");
    }
  };

  const handleLeaveTeam = async (teamId) => {
    try {
      const token = localStorage.getItem("token");
      await clientServer.post('/teams/leave', { token, teamId });
      showFeedback("Left team successfully!", "success");
      if (activeChatTeamId === teamId) {
        setActiveChatTeamId(null);
      }
      fetchTeams();
    } catch (error) {
      showFeedback(error.response?.data?.message || "Failed to leave team", "error");
    }
  };

  const handleSendInvite = async (teamId) => {
    const targetUserId = inviteUserIdMap[teamId];
    if (!targetUserId) {
      showFeedback("Please select an athlete to invite", "error");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await clientServer.post('/teams/invite', {
        token,
        teamId,
        targetUserId
      });
      showFeedback(res.data.message || "Invitation sent successfully!", "success");
      setInviteUserIdMap(prev => ({ ...prev, [teamId]: "" }));
    } catch (error) {
      showFeedback(error.response?.data?.message || "Failed to send invitation", "error");
    }
  };

  const handleSendChatMessage = async (e, teamId) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const token = localStorage.getItem("token");
      const res = await clientServer.post(`/teams/${teamId}/messages`, {
        token,
        message: newMessage
      });
      setNewMessage("");
      setChatMessages(prev => [...prev, res.data.messageData]);
    } catch (error) {
      showFeedback(error.response?.data?.message || "Failed to send message", "error");
    }
  };

  const isUserMember = (team) => {
    const currentUserId = authState.user?.userId?._id;
    if (!currentUserId || !team.members) return false;
    return team.members.some(m => m._id === currentUserId);
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

  const currentUserId = authState.user?.userId?._id;
  const activeChatTeam = teams.find(t => t._id === activeChatTeamId);

  return (
    <UserLayout>
      <DashboardLayout>
        <div className={styles.teamsWrapper}>
          <div className={styles.headerSection}>
            <div>
              <h1>🛡️ Sport Teams Hub</h1>
              <p>Join an existing squad or rally your own teammates to compete!</p>
            </div>
            <button className={styles.createBtn} onClick={() => setIsModalOpen(true)}>
              <i className="fa-solid fa-plus"></i> Create New Team
            </button>
          </div>

          {/* Feedback messages */}
          {successMsg && <div className={styles.successAlert}>{successMsg}</div>}
          {errorMsg && <div className={styles.errorAlert}>{errorMsg}</div>}

          {loading ? (
            <div className={styles.loader}>Loading squads...</div>
          ) : teams.length === 0 ? (
            <div className={styles.emptyState}>
              <i className="fa-solid fa-people-group"></i>
              <h2>No teams created yet</h2>
              <p>Be the pioneer! Click the button above to create the first team in the network.</p>
            </div>
          ) : activeChatTeamId && activeChatTeam ? (
            /* Split Screen Layout (New Frontend Engineering) */
            <div className={styles.splitWrapper}>
              {/* Left Squads Sidebar */}
              <div className={styles.leftSquadsPanel}>
                <div className={styles.sidebarHeader}>
                  <h3>Your Squads</h3>
                  <button className={styles.exitSplitBtn} onClick={() => setActiveChatTeamId(null)}>
                    <i className="fa-solid fa-grid-2"></i> Show All Grid
                  </button>
                </div>
                <div className={styles.sidebarList}>
                  {teams.map((t) => {
                    const isMember = isUserMember(t);
                    const isActive = t._id === activeChatTeamId;
                    return (
                      <div 
                        key={t._id} 
                        className={`${styles.simpleTeamCard} ${isActive ? styles.activeSimpleCard : ''} ${!isMember ? styles.nonMemberCard : ''}`}
                        onClick={() => isMember && setActiveChatTeamId(t._id)}
                      >
                        <div className={styles.simpleCardBody}>
                          <div className={styles.simpleCardHeader}>
                            <h4>{t.name}</h4>
                            <span className={styles.simpleSportBadge}>
                              <i className={`fa-solid ${getSportIcon(t.sport)}`}></i>
                            </span>
                          </div>
                          <div className={styles.simpleCardFooter}>
                            <span>👥 {t.members.length} members</span>
                            {!isMember ? (
                              <button 
                                className={styles.simpleJoinBtn}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleJoinTeam(t._id);
                                }}
                              >
                                Join
                              </button>
                            ) : (
                              <button 
                                className={styles.simpleLeaveBtn}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLeaveTeam(t._id);
                                }}
                              >
                                Leave
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Dedicated Chatroom */}
              <div className={styles.rightChatPanel}>
                <div className={styles.chatRoomHeader}>
                  <div className={styles.chatHeaderInfo}>
                    <div className={styles.chatHeaderTitleRow}>
                      <h3>🛡️ {activeChatTeam.name}</h3>
                      <span className={styles.chatSportBadge}>
                        <i className={`fa-solid ${getSportIcon(activeChatTeam.sport)}`}></i> {activeChatTeam.sport}
                      </span>
                    </div>
                    <p className={styles.chatMotto}>{activeChatTeam.description}</p>
                  </div>
                  <button className={styles.closeChatBtn} onClick={() => setActiveChatTeamId(null)}>
                    &times; Close Chat
                  </button>
                </div>

                <div className={styles.chatRoomMessages}>
                  {chatMessages.length > 0 ? (
                    chatMessages.map((msg) => {
                      const isMyMsg = msg.senderId?._id === currentUserId || msg.senderId === currentUserId;
                      return (
                        <div 
                          key={msg._id} 
                          className={`${styles.chatMessageItem} ${isMyMsg ? styles.myMessage : ''}`}
                        >
                          <img 
                            src={
                              !msg.senderId?.profilePicture || msg.senderId?.profilePicture === 'default.jpg'
                                ? `${BASE_URL}/uploads/default.jpg`
                                : `${BASE_URL}/uploads/${msg.senderId?.profilePicture}`
                            } 
                            alt={msg.senderId?.name}
                            className={styles.chatAvatar}
                          />
                          <div className={styles.chatMsgContent}>
                            <span className={styles.chatSenderName}>{msg.senderId?.name}</span>
                            <p className={styles.chatMsgText}>{msg.message}</p>
                            <span className={styles.chatTime}>
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className={styles.emptyChat}>No messages yet. Start the conversation!</div>
                  )}
                  <div ref={chatMessagesEndRef} />
                </div>

                <form onSubmit={(e) => handleSendChatMessage(e, activeChatTeam._id)} className={styles.chatRoomInputForm}>
                  <input 
                    type="text" 
                    value={newMessage} 
                    onChange={(e) => setNewMessage(e.target.value)} 
                    placeholder="Type a message to your squad..."
                    className={styles.chatRoomInput}
                  />
                  <button type="submit" className={styles.chatRoomSendBtn}>
                    <i className="fa-solid fa-paper-plane"></i> Send
                  </button>
                </form>
              </div>
            </div>
          ) : (
            /* Standard Grid View */
            <div className={styles.teamsGrid}>
              {teams.map((team) => {
                const isMember = isUserMember(team);
                const isFull = team.members.length >= team.maxSize;
                const isOwner = team.creatorId?._id === currentUserId || team.creatorId === currentUserId;
                
                return (
                  <div key={team._id} className={styles.teamCard}>
                    <div className={styles.cardHeader}>
                      <div className={styles.sportBadge}>
                        <i className={`fa-solid ${getSportIcon(team.sport)}`}></i> {team.sport}
                      </div>
                      <span className={styles.capacityBadge}>
                        👥 {team.members.length} / {team.maxSize}
                      </span>
                    </div>

                    <div className={styles.cardBody}>
                      <div className={styles.titleSection}>
                        <h3>{team.name}</h3>
                        {isOwner && <span className={styles.ownerBadge}>Owner</span>}
                      </div>
                      
                      <p className={styles.description}>{team.description}</p>
                      
                      <div className={styles.creatorInfo}>
                        <small>Created by: <strong>{team.creatorId?.name || "Unknown"}</strong></small>
                      </div>

                      {/* Owner panel to invite connections */}
                      {isOwner && (
                        <div className={styles.inviteContainer}>
                          <h4>Invite Athlete</h4>
                          <div className={styles.inviteRow}>
                            <select 
                              value={inviteUserIdMap[team._id] || ""} 
                              onChange={(e) => setInviteUserIdMap(prev => ({ ...prev, [team._id]: e.target.value }))}
                              className={styles.inviteSelect}
                            >
                              <option value="">Select an athlete...</option>
                              {authState.all_users && authState.all_users
                                .filter(u => u.userId && u.userId._id !== currentUserId && !team.members.some(m => m._id === u.userId._id))
                                .map(u => (
                                  <option key={u.userId._id} value={u.userId._id}>
                                    {u.userId.name} (@{u.userId.username})
                                  </option>
                                ))
                              }
                            </select>
                            <button 
                              onClick={() => handleSendInvite(team._id)}
                              className={styles.inviteBtn}
                            >
                              Invite
                            </button>
                          </div>
                        </div>
                      )}

                      <div className={styles.membersSection}>
                        <h4>Squad Members:</h4>
                        <div className={styles.avatarList}>
                          {team.members.map((member) => (
                            <div 
                              key={member._id} 
                              className={styles.avatarCircle} 
                              title={`${member.name} (@${member.username})`}
                            >
                              <img 
                                src={
                                  !member.profilePicture || member.profilePicture === 'default.jpg'
                                    ? `${BASE_URL}/uploads/default.jpg`
                                    : `${BASE_URL}/uploads/${member.profilePicture}`
                                } 
                                alt={member.name}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className={styles.cardFooter}>
                      <div className={styles.footerActions}>
                        {isMember ? (
                          <>
                            <button 
                              className={styles.chatToggleBtn}
                              onClick={() => setActiveChatTeamId(team._id)}
                            >
                              <i className="fa-solid fa-comments"></i> Squad Chat
                            </button>
                            
                            <button 
                              className={styles.leaveBtn} 
                              onClick={() => handleLeaveTeam(team._id)}
                            >
                              Leave
                            </button>
                          </>
                        ) : (
                          <button 
                            className={styles.joinBtn} 
                            onClick={() => handleJoinTeam(team._id)}
                            disabled={isFull}
                          >
                            {isFull ? (
                              <>Full Squad</>
                            ) : (
                              <><i className="fa-solid fa-paper-plane"></i> Request to Join</>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Create Team Modal */}
          {isModalOpen && (
            <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
              <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                  <h2>🛡️ Create Sport Team</h2>
                  <button className={styles.closeModalBtn} onClick={() => setIsModalOpen(false)}>&times;</button>
                </div>
                <form onSubmit={handleCreateTeam} className={styles.modalForm}>
                  <div className={styles.formGroup}>
                    <label>Team Name</label>
                    <input 
                      type="text" 
                      name="name" 
                      value={teamForm.name} 
                      onChange={handleFormChange} 
                      placeholder="e.g. Real Madrid PICT"
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Select Sport</label>
                    <select name="sport" value={teamForm.sport} onChange={handleFormChange}>
                      <option value="Football">Football</option>
                      <option value="Basketball">Basketball</option>
                      <option value="Tennis">Tennis</option>
                      <option value="Cricket">Cricket</option>
                      <option value="Fitness">Fitness/Athletics</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Max Squad Size</label>
                    <input 
                      type="number" 
                      name="maxSize" 
                      value={teamForm.maxSize} 
                      onChange={handleFormChange} 
                      min="2" 
                      max="30"
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Description & Motto</label>
                    <textarea 
                      name="description" 
                      value={teamForm.description} 
                      onChange={handleFormChange} 
                      placeholder="Describe your team's goals, level, or location..."
                      rows="4"
                      required
                    />
                  </div>

                  <div className={styles.modalActions}>
                    <button type="button" className={styles.cancelBtn} onClick={() => setIsModalOpen(false)}>
                      Cancel
                    </button>
                    <button type="submit" className={styles.submitBtn}>
                      Create Squad
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </UserLayout>
  );
}
