import React, { useEffect } from "react";
import styles from "../css_modules/WelcomeScreenStyles.module.css";

interface WelcomeScreenProps {
  userName: string;
  setActiveComponent: (component: string) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  userName,
  setActiveComponent
}) => {
  // Add animation sequence effect when component mounts
  useEffect(() => {
    const elements = [
      document.querySelector(`.${styles.welcomeCard}`),
      document.querySelector(`.${styles.welcomeTitle}`),
      document.querySelector(`.${styles.welcomeSubtitle}`),
      document.querySelector(`.${styles.welcomeContent}`),
      document.querySelector(`.${styles.welcomeFeatures}`),
      document.querySelector(`.${styles.videoSection}`),
      document.querySelector(`.${styles.verifyButton}`),
      document.querySelector(`.${styles.welcomeNote}`)
    ];
    
    elements.forEach((el, index) => {
      if (el) {
        setTimeout(() => {
          el.classList.add(styles.visible);
        }, 100 * index);
      }
    });
  }, []);
  
  return (
    <div className={styles.welcomeScreen}>
      <div className={styles.backgroundEffect}></div>
      
      <div className={styles.welcomeCard}>
        <div className={styles.glowEffect}></div>
        
        <h1 className={styles.welcomeTitle}>Welcome to Algo Adopt Airdrop</h1>
        <h2 className={styles.welcomeSubtitle}>Hey there, {userName}!</h2>
        
        <div className={styles.welcomeContent}>
          <p>We're excited to have you join the AAA community! To unlock all features 
          and start maximizing your rewards, please complete the quick verification process.</p>
          
          <div className={styles.welcomeFeatures}>
            <h3>Your Verification Benefits:</h3>
            <ul>
              <li>Exclusive access to monthly AAA Payments</li>
              <li>Participation in all airdrop campaigns</li>
              <li>Unlock team building and referral bonuses</li>
              <li>Verified member badge and status</li>
              <li>Gain access to social contests</li>
            </ul>
          </div>
          
          <div className={styles.videoSection}>
            <h3>Quick Start Guide</h3>
            <div className={styles.videoContainer}>
              <iframe 
                className={styles.tutorialVideo}
                src="https://www.youtube.com/embed/v9VvR7i4a2c" 
                title="AAA Platform Walkthrough"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            </div>
            <p className={styles.videoCaption}>Watch this short video to learn how to navigate the platform and maximize your rewards.</p>
          </div>
          
          <button
            className={styles.verifyButton}
            onClick={() => setActiveComponent("setupAndVerify")}
          >
            <span>Verify My Account</span>
            <div className={styles.buttonShine}></div>
          </button>
          
          <p className={styles.welcomeNote}>
            Feel free to explore the platform while verification is pending. 
            Some features will be limited until verification is complete.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;