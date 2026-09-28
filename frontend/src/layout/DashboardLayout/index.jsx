import React, { useEffect, useState } from 'react';
import styles from "./index.module.css";
import { useRouter } from 'next/router';
import { useDispatch, useSelector } from 'react-redux';
import { setTokenIsThere } from '../../config/redux/reducer/authReducer';
import { BASE_URL, clientServer } from '@/config';

export default function DashboardLayout({children}) {
  const router = useRouter();
  const dispatch = useDispatch();  
  const authState = useSelector((state) => state.auth);

  const [trendingAthletes, setTrendingAthletes] = useState([]);
  const [userStats, setUserStats] = useState({
    connections: 0,
    teams: 0,
    posts: 0,
    likes: 0
  });

  const fetchTrendingAndStats = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      // 1. Fetch user stats
      const statsRes = await clientServer.get(`/user/stats?token=${token}`);
      setUserStats(statsRes.data.stats || { connections: 0, teams: 0, posts: 0, likes: 0 });

      // 2. Fetch trending athletes
      const trendingRes = await clientServer.get('/user/trending_athletes');
      const allTrending = trendingRes.data.trending || [];
      
      // Filter out self from trending list
      const selfUserId = authState.user?.userId?._id;
      const filteredTrending = selfUserId 
        ? allTrending.filter(p => p.userId?._id !== selfUserId)
        : allTrending;
      
      setTrendingAthletes(filteredTrending);
    } catch (err) {
      console.error("DashboardLayout fetch stats/trending error:", err);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    } else{
      dispatch(setTokenIsThere());
    }
  }, []);

  useEffect(() => {
    if (authState.isError && !authState.loggedIn) {
      router.push("/login");
    }
  }, [authState.isError, authState.loggedIn]);

  useEffect(() => {
    if (authState.user || authState.loggedIn) {
      fetchTrendingAndStats();
    }
  }, [authState.user, authState.loggedIn]);

  return (
    <div className={styles.layoutWrapper}>
      <div className={styles.container}>
        <div className={styles.homeContainer}>
          {/* Sports-themed Sidebar */}
          <div className={styles.homeContainer_leftBar}>
            <div className={styles.sidebarContent}>
              {/* Quick Actions */}
              <div className={styles.quickActions}>
                <h3>Quick Actions</h3>
                <div 
                  onClick={() => router.push("/dashboard")}
                  className={`${styles.sideBarOption} ${router.pathname === '/dashboard' ? styles.active : ''}`}
                >
                  <div className={styles.iconWrapper}>
                    <i className="fa-solid fa-home"></i>
                  </div>
                  <div className={styles.optionContent}>
                    <span>Dashboard</span>
                    <small>Your sports hub</small>
                  </div>
                </div>

                <div 
                  onClick={() => router.push("/discover")}
                  className={`${styles.sideBarOption} ${router.pathname === '/discover' ? styles.active : ''}`}
                >
                  <div className={styles.iconWrapper}>
                    <i className="fa-solid fa-search"></i>
                  </div>
                  <div className={styles.optionContent}>
                    <span>Discover</span>
                    <small>Find athletes & teams</small>
                  </div>
                </div>

                <div 
                  onClick={() => router.push("/my_connections")}
                  className={`${styles.sideBarOption} ${router.pathname === '/my_connections' ? styles.active : ''}`}
                >
                  <div className={styles.iconWrapper}>
                    <i className="fa-solid fa-user-friends"></i>
                  </div>
                  <div className={styles.optionContent}>
                    <span>My Network</span>
                    <small>Sport connections</small>
                  </div>
                </div>

                <div 
                  onClick={() => router.push("/calendar")}
                  className={`${styles.sideBarOption} ${router.pathname === '/calendar' ? styles.active : ''}`}
                >
                  <div className={styles.iconWrapper}>
                    <i className="fa-solid fa-calendar-check"></i>
                  </div>
                  <div className={styles.optionContent}>
                    <span>Events</span>
                    <small>Matches & tournaments</small>
                  </div>
                </div>

                <div 
                  onClick={() => router.push("/teams")}
                  className={`${styles.sideBarOption} ${router.pathname === '/teams' ? styles.active : ''}`}
                >
                  <div className={styles.iconWrapper}>
                    <i className="fa-solid fa-users"></i>
                  </div>
                  <div className={styles.optionContent}>
                    <span>Teams</span>
                    <small>Join or create teams</small>
                  </div>
                </div>

                <div 
                  onClick={() => router.push("/events")}
                  className={`${styles.sideBarOption} ${router.pathname.startsWith('/events') ? styles.active : ''}`}
                >
                  <div className={styles.iconWrapper}>
                    <i className="fa-solid fa-trophy"></i>
                  </div>
                  <div className={styles.optionContent}>
                    <span>Sport Events</span>
                    <small>Tournaments & brackets</small>
                  </div>
                </div>
              </div>

              {/* Sports Categories */}
              <div className={styles.sportsCategories}>
                <h3>Sports</h3>
                <div className={styles.sportsList}>
                  <div className={styles.sportItem}>
                    <i className="fa-solid fa-futbol"></i>
                    <span>Football</span>
                  </div>
                  <div className={styles.sportItem}>
                    <i className="fa-solid fa-basketball-ball"></i>
                    <span>Basketball</span>
                  </div>
                  <div className={styles.sportItem}>
                    <i className="fa-solid fa-tennis-ball"></i>
                    <span>Tennis</span>
                  </div>
                  <div className={styles.sportItem}>
                    <i className="fa-solid fa-dumbbell"></i>
                    <span>Fitness</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
           
          {/* Main Feed Container - FIXED: Added scrollable wrapper */}
          <div className={styles.homeContainer_feedContainer}>
            <div className={styles.feedContent}>
              {children}
            </div>
          </div>

          {/* Enhanced Right Sidebar - FIXED: Added scrollable wrapper */}
          <div className={styles.homeContainer_extraContainer}>
            <div className={styles.extraContent}>
              {/* Trending Athletes */}
              <div className={styles.trendingSection}>
                <div className={styles.sectionHeader}>
                  <i className="fa-solid fa-fire"></i>
                  <h3>Trending Athletes</h3>
                </div>
                
                {trendingAthletes.length > 0 ? (
                  trendingAthletes.map((profile) => (
                    <div 
                      key={profile._id} 
                      className={styles.extraContainer__profile}
                      onClick={() => router.push(`/view_profile/${profile.userId.username}`)}
                      style={{ cursor: "pointer" }}
                    >
                      <div className={styles.profileAvatar}>
                        <img 
                          src={
                            !profile.userId.profilePicture || profile.userId.profilePicture === 'default.jpg'
                              ? `${BASE_URL}/uploads/default.jpg`
                              : `${BASE_URL}/uploads/${profile.userId.profilePicture}`
                          } 
                          alt={profile.userId.name}
                          style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                        />
                      </div>
                      <div className={styles.profileInfo}>
                        <p className={styles.profileName}>{profile.userId.name}</p>
                        <span className={styles.profileSport}>@{profile.userId.username}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={styles.emptyNotifications} style={{ padding: "0.5rem 0", fontSize: "0.8rem" }}>
                    No other athletes registered
                  </div>
                )}
              </div>

              {/* Upcoming Events */}
              <div className={styles.upcomingEvents}>
                <div className={styles.sectionHeader}>
                  <i className="fa-solid fa-calendar"></i>
                  <h3>Upcoming Events</h3>
                </div>
                
                <div className={styles.eventItem}>
                  <div className={styles.eventDate}>
                    <span className={styles.day}>25</span>
                    <span className={styles.month}>Dec</span>
                  </div>
                  <div className={styles.eventDetails}>
                    <p>City Football Championship</p>
                    <span>Mumbai Sports Complex</span>
                  </div>
                </div>

                <div className={styles.eventItem}>
                  <div className={styles.eventDate}>
                    <span className={styles.day}>28</span>
                    <span className={styles.month}>Dec</span>
                  </div>
                  <div className={styles.eventDetails}>
                    <p>Basketball League Finals</p>
                    <span>Sports Arena</span>
                  </div>
                </div>

                <div className={styles.eventItem}>
                  <div className={styles.eventDate}>
                    <span className={styles.day}>02</span>
                    <span className={styles.month}>Jan</span>
                  </div>
                  <div className={styles.eventDetails}>
                    <p>Tennis Open Tournament</p>
                    <span>Tennis Club</span>
                  </div>
                </div>
              </div>

              {/* Sports Stats */}
              <div className={styles.sportsStats}>
                <div className={styles.sectionHeader}>
                  <i className="fa-solid fa-chart-line"></i>
                  <h3>Your Stats</h3>
                </div>
                
                <div className={styles.statItem}>
                  <div className={styles.statIcon}>
                    <i className="fa-solid fa-user-friends"></i>
                  </div>
                  <div className={styles.statInfo}>
                    <span className={styles.statNumber}>{userStats.connections}</span>
                    <span className={styles.statLabel}>Connections</span>
                  </div>
                </div>

                <div className={styles.statItem}>
                  <div className={styles.statIcon}>
                    <i className="fa-solid fa-users"></i>
                  </div>
                  <div className={styles.statInfo}>
                    <span className={styles.statNumber}>{userStats.teams}</span>
                    <span className={styles.statLabel}>Teams Joined</span>
                  </div>
                </div>

                <div className={styles.statItem}>
                  <div className={styles.statIcon}>
                    <i className="fa-solid fa-heart"></i>
                  </div>
                  <div className={styles.statInfo}>
                    <span className={styles.statNumber}>{userStats.likes}</span>
                    <span className={styles.statLabel}>Likes Received</span>
                  </div>
                </div>

                <div className={styles.statItem}>
                  <div className={styles.statIcon}>
                    <i className="fa-solid fa-pen-nib"></i>
                  </div>
                  <div className={styles.statInfo}>
                    <span className={styles.statNumber}>{userStats.posts}</span>
                    <span className={styles.statLabel}>Posts Created</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}