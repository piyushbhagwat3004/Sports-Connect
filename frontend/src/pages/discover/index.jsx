import UserLayout from '@/layout/UserLayout';
import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/layout/DashboardLayout';
import { getAllUsers, getAboutUser } from '@/config/redux/action/authAction';
import { useDispatch, useSelector } from 'react-redux';
import { BASE_URL } from '@/config';
import styles from "./index.module.css";
import { useRouter } from 'next/router';

export default function Discoverpage() {
  const authState = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!authState.all_profiles_fetched) {
      dispatch(getAllUsers());
    }
    if (!authState.user) {
      const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
      if (token) {
        dispatch(getAboutUser({ token }));
      }
    }
  }, []);

  const filteredUsers = authState.all_users?.filter(user => {
    const selfId = authState.user?.userId?._id;
    const selfUsername = authState.user?.userId?.username;
    const isSelf = (selfId && user.userId?._id === selfId) || (selfUsername && user.userId?.username === selfUsername);
    if (isSelf) return false;

    return (
      user.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.userId?.username?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <UserLayout>
      <DashboardLayout>
        <div className={styles.container}>
          <h1 className={styles.title}>Discover Profiles</h1>

          <input
            type="text"
            placeholder="Search by name or username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchBar}
          />

          <div  className={styles.allUserProfile}>
            {filteredUsers?.map((user) => (
              <div onClick={() => {
                   router.push(`/view_profile/${user.userId.username}`)
                   }} key={user._id} className={styles.userProfile}>
                <img
                  src={
                    !user.userId?.profilePicture || user.userId.profilePicture === 'default.jpg'
                      ? `${BASE_URL}/uploads/default.jpg`
                      : `${BASE_URL}/uploads/${user.userId.profilePicture}`
                  }
                  alt="User Profile"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/100x100/cccccc/666666?text=User';
                  }}
                  className={styles.profileImage}
                />
                <div className={styles.profileInfo}>
                  <h2>{user.userId?.name}</h2>
                  <p>@{user.userId?.username}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    </UserLayout>
  );
}
