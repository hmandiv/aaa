import React from "react";
import styles from "../css_modules/StakingAndFarmsStyles.module.css";

export const StakingAndFarms: React.FC = () => {
  return (
    <div className={styles.container}>
      {/* Header Section */}
      <h1 className={styles.heading}>Staking and Farms</h1>
      <p className={styles.introText}>
        Earn even more through staking and farms.
      </p>

      {/* Description Section */}
      <div className={styles.section}>
        <p className={styles.description}>
          As you begin to earn <strong>AAA tokens</strong>, you are able to earn even more from your tokens by finding and participating through staking and farming your tokens.
        </p>
      </div>

      {/* Staking Section */}
      <div className={styles.card}>
        <h2 className={styles.subHeading}>Staking</h2>
        <p className={styles.cardText}>
          Finding and participating in staking tokens to earn more.
        </p>
        <div className={styles.videoWrapper}>
          <iframe
            src="https://www.youtube.com/embed/ZN15s0P713s"
            title="Staking AAA Tokens"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      </div>

      {/* Farming Section */}
      <div className={styles.card}>
        <h2 className={styles.subHeading}>Farming</h2>
        <p className={styles.cardText}>
          Video 1 of 2: Adding the needed LP to participate.
        </p>
        <div className={styles.videoWrapper}>
          <iframe
            src="https://www.youtube.com/embed/mCikspFU-DI"
            title="Adding Liquidity"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>

        <p className={styles.cardText}>
          Video 2 of 2: Finding and participating in farms to earn more.
        </p>
        <div className={styles.videoWrapper}>
          <iframe
            src="https://www.youtube.com/embed/S-UvtvQ3WhM"
            title="Participating in Farms"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      </div>
    </div>
  );
};
