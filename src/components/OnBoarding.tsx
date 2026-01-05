// PremiumOnBoardingGuide.tsx
import React from "react";
import styles from "../css_modules/OnBoardingStyles.module.css";

const PremiumOnBoardingGuide: React.FC = () => {
  return (
    <div className={styles.guideContainer}>
      <div className={styles.premiumBadge}>Premium</div>
      
      <div className={styles.guideHeader}>
        <div className={styles.logoContainer}>
          <span className={styles.logo}>✨</span>
        </div>
        <h2>Welcome to the AAA DeFi Hub</h2>
        <p className={styles.subtitle}>Your exclusive gateway to financial prosperity</p>
      </div>

      <div className={styles.content}>
        <h3 className={styles.sectionTitle}>Your Premium Journey</h3>
        
        <div className={styles.stepsList}>
          <div className={styles.step}>
            <div className={styles.stepNumber}>1</div>
            <div className={styles.stepContent}>
              <h4>
                <span className={styles.stepIcon}>🔐</span>
                Secure Your Access
              </h4>
              <p>Navigate to the Wallet section in your dashboard menu. Select "Setup & Verify" to register your wallet address with a one-time 5 Algo activation fee for premium benefits.</p>
            </div>
          </div>

          <div className={styles.step}>
            <div className={styles.stepNumber}>2</div>
            <div className={styles.stepContent}>
              <h4>
                <span className={styles.stepIcon}>💎</span>
                Exclusive Airdrops
              </h4>
              <p>Access the Premium Airdrops page to claim your high-value tokens based on your elite badge status: Learner, Diamond Hands, or Wealth Builder tiers.</p>
            </div>
          </div>

          <div className={styles.step}>
            <div className={styles.stepNumber}>3</div>
            <div className={styles.stepContent}>
              <h4>
                <span className={styles.stepIcon}>🌐</span>
                Expand Your Influence
              </h4>
              <p>Leverage your premium status to earn enhanced AAA Token rewards by inviting partners through your exclusive referral link and participating in VIP daily check-ins.</p>
            </div>
          </div>

          <div className={styles.step}>
            <div className={styles.stepNumber}>4</div>
            <div className={styles.stepContent}>
              <h4>
                <span className={styles.stepIcon}>🏆</span>
                Elite Competitions
              </h4>
              <p>Participate in members-only contests with premium rewards. Showcase your achievements on X and complete special missions to earn substantial AAA token bonuses.</p>
            </div>
          </div>
        </div>

        <div className={styles.tipBox}>
          <div className={styles.tipHeader}>
            <span className={styles.tipIcon}>💡</span>
            <span className={styles.tipTitle}>Insider Advantage</span>
          </div>
          <p>Premium members who maintain high activity levels progress 2x faster through rank tiers, unlocking exclusive investment opportunities and elevated rewards unavailable to standard users.</p>
        </div>
      </div>
    </div>
  );
};

export default PremiumOnBoardingGuide;