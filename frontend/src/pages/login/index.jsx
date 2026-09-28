import UserLayout from '@/layout/UserLayout'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'
import { useSelector , useDispatch } from 'react-redux'
import styles from "./style.module.css"
import { loginUser, registerUser } from '@/config/redux/action/authAction'
import { emptyMessage } from '@/config/redux/reducer/authReducer'

export default function LoginComponent(){
  //if user is logged in to push him on direct dashboard
  const authState = useSelector((state) => state.auth)

  const router = useRouter();
  const dispatch = useDispatch();

  const [userLoginMethod , setUserLoginMethod] = useState(false);
  const [email,setEmailAddress] = useState("");
  const [password,setPassword] = useState("");
  const [username,setUsername] = useState("");
  const [name,setName] = useState("");

  useEffect(() => {
    if (authState.loggedIn) {
        router.push("/dashboard");
    }
  }, [authState.loggedIn]);

  useEffect(() => {
    if (authState.isSuccess) {
        setUserLoginMethod(true);
    }
  }, [authState.isSuccess]);

  useEffect(() => {
    if(localStorage.getItem("token")){
      router.push("/dashboard");
    }
  }, [])

  useEffect(() => {
    dispatch(emptyMessage());
  }, [userLoginMethod]);

  const handleRegister = () => {
      dispatch(registerUser({username,password,email,name}))
  }
  
  const handleLogin = () => {
      dispatch(loginUser({email,password}))
  }

  return (
    <UserLayout>
      <div className={styles.container}>
        <div className={styles.authWrapper}>
          {/* Background Sports Elements */}
          <div className={styles.backgroundElements}>
            <div className={styles.floatingIcon} style={{top: '10%', left: '10%'}}>
              <i className="fa-solid fa-futbol"></i>
            </div>
            <div className={styles.floatingIcon} style={{top: '20%', right: '15%'}}>
              <i className="fa-solid fa-basketball-ball"></i>
            </div>
            <div className={styles.floatingIcon} style={{bottom: '30%', left: '8%'}}>
              <i className="fa-solid fa-tennis-ball"></i>
            </div>
            <div className={styles.floatingIcon} style={{bottom: '15%', right: '12%'}}>
              <i className="fa-solid fa-trophy"></i>
            </div>
          </div>

          <div className={styles.authCard}>
            {/* Left Side - Form */}
            <div className={styles.authForm}>
              <div className={styles.formHeader}>
                <div className={styles.logoSection}>
                  <div className={styles.logo}>
                    <i className="fa-solid fa-trophy"></i>
                  </div>
                  <h1 className={styles.brandName}>SportConnect</h1>
                </div>
                <h2 className={styles.authTitle}>
                  {userLoginMethod ? "Welcome Back!" : "Join the Game!"}
                </h2>
                <p className={styles.authSubtitle}>
                  {userLoginMethod 
                    ? "Sign in to continue your sports journey" 
                    : "Create your account and connect with athletes"
                  }
                </p>
              </div>

              {/* Error/Success Message */}
              {authState.message.message && (
                <div className={`${styles.messageAlert} ${authState.isError ? styles.error : styles.success}`}>
                  <i className={`fa-solid ${authState.isError ? 'fa-exclamation-triangle' : 'fa-check-circle'}`}></i>
                  <span>{authState.message.message}</span>
                </div>
              )}

              {/* Form Fields */}
              <div className={styles.formFields}>
                {!userLoginMethod && (
                  <div className={styles.fieldRow}>
                    <div className={styles.inputGroup}>
                      <i className="fa-solid fa-user"></i>
                      <input 
                        onChange={(e) => setUsername(e.target.value)} 
                        className={styles.inputField} 
                        type="text" 
                        placeholder='Username'
                        value={username}
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <i className="fa-solid fa-id-card"></i>
                      <input 
                        onChange={(e) => setName(e.target.value)} 
                        className={styles.inputField} 
                        type="text" 
                        placeholder='Full Name'
                        value={name}
                      />
                    </div>
                  </div>
                )}
                
                <div className={styles.inputGroup}>
                  <i className="fa-solid fa-envelope"></i>
                  <input 
                    onChange={(e) => setEmailAddress(e.target.value)} 
                    className={styles.inputField} 
                    type="email" 
                    placeholder='Email Address'
                    value={email}
                  />
                </div>
                
                <div className={styles.inputGroup}>
                  <i className="fa-solid fa-lock"></i>
                  <input 
                    onChange={(e) => setPassword(e.target.value)} 
                    className={styles.inputField} 
                    type="password" 
                    placeholder='Password'
                    value={password}
                  />
                </div>

                {userLoginMethod && (
                  <div className={styles.forgotPassword}>
                    <a href="#" className={styles.forgotLink}>Forgot Password?</a>
                  </div>
                )}

                <button 
                  onClick={() => {
                    if(userLoginMethod){
                        handleLogin();
                    }else{
                        handleRegister();
                    }
                  }} 
                  className={styles.authButton}
                >
                  <i className={`fa-solid ${userLoginMethod ? 'fa-sign-in-alt' : 'fa-user-plus'}`}></i>
                  <span>{userLoginMethod ? "Sign In" : "Sign Up"}</span>
                </button>
              </div>
            </div>

            {/* Right Side - Toggle & Branding */}
            <div className={styles.authBranding}>
              <div className={styles.brandingContent}>
                <div className={styles.sportsIcons}>
                  <div className={styles.sportIcon}>
                    <i className="fa-solid fa-futbol"></i>
                  </div>
                  <div className={styles.sportIcon}>
                    <i className="fa-solid fa-basketball-ball"></i>
                  </div>
                  <div className={styles.sportIcon}>
                    <i className="fa-solid fa-tennis-ball"></i>
                  </div>
                  <div className={styles.sportIcon}>
                    <i className="fa-solid fa-dumbbell"></i>
                  </div>
                </div>
                
                <h3 className={styles.brandingTitle}>
                  {userLoginMethod ? "New to SportConnect?" : "Already a Member?"}
                </h3>
                <p className={styles.brandingText}>
                  {userLoginMethod 
                    ? "Join thousands of athletes and start your sports networking journey today!"
                    : "Welcome back! Continue connecting with your sports community."
                  }
                </p>
                
                <button
                  className={styles.toggleButton}
                  onClick={() => setUserLoginMethod(!userLoginMethod)}
                >
                  <i className={`fa-solid ${userLoginMethod ? 'fa-user-plus' : 'fa-sign-in-alt'}`}></i>
                  <span>{userLoginMethod ? "Sign Up" : "Sign In"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  )
}