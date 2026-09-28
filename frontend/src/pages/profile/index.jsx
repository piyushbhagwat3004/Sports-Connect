import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAboutUser } from '@/config/redux/action/authAction';
import { clientServer } from '@/config';
import DashboardLayout from '@/layout/DashboardLayout';
import UserLayout from '@/layout/UserLayout';

export default function UpdateProfile() {
  const dispatch = useDispatch();
  const authState = useSelector((state) => state.auth);
  
  // Form states
  const [userFormData, setUserFormData] = useState({
    name: '',
    username: '',
    email: ''
  });
  
  const [profileFormData, setProfileFormData] = useState({
    bio: '',
    currentPosition: '',
    pastWork: [],
    education: []
  });
  
  const [profilePicture, setProfilePicture] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  // Initialize form data when user data is loaded
  useEffect(() => {
    dispatch(getAboutUser({ token: localStorage.getItem("token") }));
  }, [dispatch]);

  useEffect(() => {
    if (authState.user && authState.user.userId) {
      const user = authState.user;
      setUserFormData({
        name: user.userId.name || '',
        username: user.userId.username || '',
        email: user.userId.email || ''
      });
      
      setProfileFormData({
        bio: user.bio || '',
        currentPosition: user.currentPosition || '',
        pastWork: user.pastWork || [],
        education: user.education || []
      });
    }
  }, [authState.user]);

  // Handle user form changes
  const handleUserFormChange = (e) => {
    setUserFormData({
      ...userFormData,
      [e.target.name]: e.target.value
    });
  };

  // Handle profile form changes
  const handleProfileFormChange = (e) => {
    setProfileFormData({
      ...profileFormData,
      [e.target.name]: e.target.value
    });
  };

  // Handle work experience changes
  const handleWorkChange = (index, field, value) => {
    const updatedWork = [...profileFormData.pastWork];
    updatedWork[index] = {
      ...updatedWork[index],
      [field]: value
    };
    setProfileFormData({
      ...profileFormData,
      pastWork: updatedWork
    });
  };

  // Add new work experience
  const addWorkExperience = () => {
    setProfileFormData({
      ...profileFormData,
      pastWork: [
        ...profileFormData.pastWork,
        { company: '', position: '', years: '' }
      ]
    });
  };

  // Remove work experience
  const removeWorkExperience = (index) => {
    const updatedWork = profileFormData.pastWork.filter((_, i) => i !== index);
    setProfileFormData({
      ...profileFormData,
      pastWork: updatedWork
    });
  };

  // Handle education changes
  const handleEducationChange = (index, field, value) => {
    const updatedEducation = [...profileFormData.education];
    updatedEducation[index] = {
      ...updatedEducation[index],
      [field]: value
    };
    setProfileFormData({
      ...profileFormData,
      education: updatedEducation
    });
  };

  // Add new education
  const addEducation = () => {
    setProfileFormData({
      ...profileFormData,
      education: [
        ...profileFormData.education,
        { school: '', degree: '', fieldOfStudy: '' }
      ]
    });
  };

  // Remove education
  const removeEducation = (index) => {
    const updatedEducation = profileFormData.education.filter((_, i) => i !== index);
    setProfileFormData({
      ...profileFormData,
      education: updatedEducation
    });
  };

  // Handle profile picture change
  const handleProfilePictureChange = (e) => {
    setProfilePicture(e.target.files[0]);
  };

  // Show message helper
  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  // Update user basic info
  const updateUserInfo = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem("token");
      const response = await clientServer.post('/user_update', {
        token,
        ...userFormData
      });
      
      showMessage('User information updated successfully!', 'success');
      dispatch(getAboutUser({ token })); // Refresh user data
    } catch (error) {
      showMessage(error.response?.data?.message || 'Failed to update user info', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Update profile data
  const updateProfileData = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem("token");
      const response = await clientServer.post('/update_profile_data', {
        token,
        ...profileFormData
      });
      
      showMessage('Profile data updated successfully!', 'success');
      dispatch(getAboutUser({ token })); // Refresh user data
    } catch (error) {
      showMessage(error.response?.data?.message || 'Failed to update profile data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Update profile picture
  const updateProfilePicture = async (e) => {
    e.preventDefault();
    if (!profilePicture) {
      showMessage('Please select a profile picture', 'error');
      return;
    }
    
    setLoading(true);
    
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append('token', token);
      formData.append('profilePicture', profilePicture);
      
      const response = await clientServer.post('/update_profile_picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      showMessage('Profile picture updated successfully!', 'success');
      setProfilePicture(null);
      dispatch(getAboutUser({ token })); // Refresh user data
    } catch (error) {
      showMessage(error.response?.data?.message || 'Failed to update profile picture', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!authState.user) {
    return (
      <UserLayout>
        <DashboardLayout>
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <p>Loading profile data...</p>
          </div>
        </DashboardLayout>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <DashboardLayout>
        <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ marginBottom: '2rem', textAlign: 'center' }}>Update Profile</h1>
          
          {/* Message Display */}
          {message && (
            <div style={{
              padding: '1rem',
              marginBottom: '1rem',
              borderRadius: '8px',
              backgroundColor: messageType === 'success' ? '#d4edda' : '#f8d7da',
              color: messageType === 'success' ? '#155724' : '#721c24',
              border: `1px solid ${messageType === 'success' ? '#c3e6cb' : '#f5c6cb'}`
            }}>
              {message}
            </div>
          )}

          {/* Profile Picture Update */}
          <div style={{ marginBottom: '3rem', padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px' }}>
            <h2 style={{ marginBottom: '1rem' }}>Profile Picture</h2>
            <form onSubmit={updateProfilePicture}>
              <div style={{ marginBottom: '1rem' }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  style={{ padding: '0.5rem', width: '100%', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !profilePicture}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading || !profilePicture ? 'not-allowed' : 'pointer',
                  opacity: loading || !profilePicture ? 0.6 : 1
                }}
              >
                {loading ? 'Updating...' : 'Update Profile Picture'}
              </button>
            </form>
          </div>

          {/* User Basic Information */}
          <div style={{ marginBottom: '3rem', padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px' }}>
            <h2 style={{ marginBottom: '1rem' }}>Basic Information</h2>
            <form onSubmit={updateUserInfo}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Name</label>
                <input
                  type="text"
                  name="name"
                  value={userFormData.name}
                  onChange={handleUserFormChange}
                  style={{ padding: '0.75rem', width: '100%', border: '1px solid #ccc', borderRadius: '4px' }}
                  required
                />
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Username</label>
                <input
                  type="text"
                  name="username"
                  value={userFormData.username}
                  onChange={handleUserFormChange}
                  style={{ padding: '0.75rem', width: '100%', border: '1px solid #ccc', borderRadius: '4px' }}
                  required
                />
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Email</label>
                <input
                  type="email"
                  name="email"
                  value={userFormData.email}
                  onChange={handleUserFormChange}
                  style={{ padding: '0.75rem', width: '100%', border: '1px solid #ccc', borderRadius: '4px' }}
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? 'Updating...' : 'Update Basic Info'}
              </button>
            </form>
          </div>

          {/* Profile Data */}
          <div style={{ marginBottom: '3rem', padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px' }}>
            <h2 style={{ marginBottom: '1rem' }}>Profile Details</h2>
            <form onSubmit={updateProfileData}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Bio</label>
                <textarea
                  name="bio"
                  value={profileFormData.bio}
                  onChange={handleProfileFormChange}
                  rows="4"
                  style={{ padding: '0.75rem', width: '100%', border: '1px solid #ccc', borderRadius: '4px', resize: 'vertical' }}
                  placeholder="Tell us about yourself..."
                />
              </div>
              
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Current Position</label>
                <input
                  type="text"
                  name="currentPosition"
                  value={profileFormData.currentPosition}
                  onChange={handleProfileFormChange}
                  style={{ padding: '0.75rem', width: '100%', border: '1px solid #ccc', borderRadius: '4px' }}
                  placeholder="Your current job title or position"
                />
              </div>

              {/* Work Experience Section */}
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3>Work Experience</h3>
                  <button
                    type="button"
                    onClick={addWorkExperience}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#17a2b8',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Add Work Experience
                  </button>
                </div>
                
                {profileFormData.pastWork.map((work, index) => (
                  <div key={index} style={{ 
                    marginBottom: '1rem', 
                    padding: '1rem', 
                    border: '1px solid #eee', 
                    borderRadius: '4px',
                    backgroundColor: '#f9f9f9'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h4>Work Experience {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeWorkExperience(index)}
                        style={{
                          padding: '0.25rem 0.5rem',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                      >
                        Remove
                      </button>
                    </div>
                    
                    <div style={{ marginBottom: '0.5rem' }}>
                      <input
                        type="text"
                        placeholder="Company"
                        value={work.company || ''}
                        onChange={(e) => handleWorkChange(index, 'company', e.target.value)}
                        style={{ padding: '0.5rem', width: '100%', border: '1px solid #ccc', borderRadius: '4px' }}
                      />
                    </div>
                    
                    <div style={{ marginBottom: '0.5rem' }}>
                      <input
                        type="text"
                        placeholder="Position"
                        value={work.position || ''}
                        onChange={(e) => handleWorkChange(index, 'position', e.target.value)}
                        style={{ padding: '0.5rem', width: '100%', border: '1px solid #ccc', borderRadius: '4px' }}
                      />
                    </div>
                    
                    <div>
                      <input
                        type="text"
                        placeholder="Years (e.g., 2020-2023)"
                        value={work.years || ''}
                        onChange={(e) => handleWorkChange(index, 'years', e.target.value)}
                        style={{ padding: '0.5rem', width: '100%', border: '1px solid #ccc', borderRadius: '4px' }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Education Section */}
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3>Education</h3>
                  <button
                    type="button"
                    onClick={addEducation}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#17a2b8',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Add Education
                  </button>
                </div>
                
                {profileFormData.education.map((edu, index) => (
                  <div key={index} style={{ 
                    marginBottom: '1rem', 
                    padding: '1rem', 
                    border: '1px solid #eee', 
                    borderRadius: '4px',
                    backgroundColor: '#f9f9f9'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h4>Education {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeEducation(index)}
                        style={{
                          padding: '0.25rem 0.5rem',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                      >
                        Remove
                      </button>
                    </div>
                    
                    <div style={{ marginBottom: '0.5rem' }}>
                      <input
                        type="text"
                        placeholder="School/University"
                        value={edu.school || ''}
                        onChange={(e) => handleEducationChange(index, 'school', e.target.value)}
                        style={{ padding: '0.5rem', width: '100%', border: '1px solid #ccc', borderRadius: '4px' }}
                      />
                    </div>
                    
                    <div style={{ marginBottom: '0.5rem' }}>
                      <input
                        type="text"
                        placeholder="Degree"
                        value={edu.degree || ''}
                        onChange={(e) => handleEducationChange(index, 'degree', e.target.value)}
                        style={{ padding: '0.5rem', width: '100%', border: '1px solid #ccc', borderRadius: '4px' }}
                      />
                    </div>
                    
                    <div>
                      <input
                        type="text"
                        placeholder="Field of Study"
                        value={edu.fieldOfStudy || ''}
                        onChange={(e) => handleEducationChange(index, 'fieldOfStudy', e.target.value)}
                        style={{ padding: '0.5rem', width: '100%', border: '1px solid #ccc', borderRadius: '4px' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? 'Updating...' : 'Update Profile Details'}
              </button>
            </form>
          </div>
        </div>
      </DashboardLayout>
    </UserLayout>
  );
}