import React from "react";
import styles from "../css_modules/AboutUsStyles.module.css";

export const AboutUs: React.FC = () => {
  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>About Us</h1>
      <p className={styles.intro}>
        Welcome to <strong>Algoadoptairdrop</strong>, where we're spearheading a viral movement to amplify the Algorand ecosystem. Here, we're all about driving adoption, education, and innovation within the Algorand community.
      </p>

      <h2 className={styles.subHeading}>Our Mission</h2>
      <p className={styles.text}>
        Algoadoptairdrop is dedicated to educating and integrating new users into the world of Algorand-based DeFi. We aim to make the transition into this space as straightforward and rewarding as possible, boosting the visibility and utilization of Algorand's cutting-edge technology.
      </p>

      <h2 className={styles.subHeading}>How We Work</h2>
      <ul className={styles.list}>
        <li>
          <strong>Reward System:</strong> New members instantly receive 5 AAA tokens upon creating an account. But that's just the beginning! Refer a friend, and you both earn another 5 AAA tokens. This referral reward cascades down 5 levels, creating a dynamic incentive for growth and community building.
        </li>
        <li>
          <strong>Comprehensive Education:</strong> We provide all the training you need to navigate Algorand DeFi. Learn how to:
          <ul className={styles.subList}>
            <li>Set up a wallet that supports Algorand Standard Assets (ASAs)</li>
            <li>Purchase your first Algorand tokens</li>
            <li>Swap tokens within the Algorand ecosystem</li>
            <li>Add liquidity to ASA pools</li>
            <li>Discover and engage in farming and staking opportunities</li>
          </ul>
        </li>
        <li>
          <strong>Self-Service Listing Portal:</strong> Any Algorand-based project can list their ASA through our platform. This feature democratizes exposure for smaller or newer projects, fostering a vibrant, diverse ecosystem.
        </li>
        <li>
          <strong>Member-Driven Advertising:</strong> With a growing audience, we offer self-service advertising options for members to promote their own projects or services, enhancing community interaction and support.
        </li>
      </ul>

      <h2 className={styles.subHeading}>Why Algoadoptairdrop?</h2>
      <ul className={styles.list}>
        <li>
          <strong>Community Growth:</strong> By rewarding both new and existing members, we incentivize the expansion of the Algorand community, making it more robust and vibrant.
        </li>
        <li>
          <strong>Education and Adoption:</strong> We believe that understanding leads to adoption. Our platform is designed to demystify blockchain technology, specifically Algorand's offerings, for everyone.
        </li>
        <li>
          <strong>Developer Empowerment:</strong> We spotlight the incredible technology Algorand provides, encouraging developers to build and innovate within this ecosystem.
        </li>
      </ul>
    </div>
  );
};

export default AboutUs;
