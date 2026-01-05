import React from "react";
import styles from "../css_modules/TermsOfServicesStyles.module.css";

export const TermsOfServices = () => {
  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Terms of Service for Algo Adopt Airdrop</h1>
      <p className={styles.updatedDate}>Last Updated: [2025-01-20]</p>

      <div className={styles.section}>
        <h2 className={styles.subHeading}>Acceptance of Terms</h2>
        <p className={styles.text}>
          By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the Service.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.subHeading}>Use of Service</h2>
        <p className={styles.text}>
          Algo Adopt Airdrop is a platform designed to educate users on how to utilize Algorand DeFi to earn, featuring a referral system that allows users to refer others to the platform to earn AAA tokens. By using our Service, you agree to comply with all applicable laws and regulations.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.subHeading}>Results Not Guaranteed</h2>
        <p className={styles.text}>
          Please Note: The results provided by Algo Adopt Airdrop are not guaranteed. The educational content, tools, or outcomes associated with using Algorand DeFi and the earning potential of AAA tokens through our referral system can vary and are subject to numerous external factors beyond our control.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.subHeading}>User Conduct</h2>
        <p className={styles.text}>
          You agree not to use the Service for:
          <ul className={styles.list}>
            <li>Any unlawful purpose or in violation of any local, state, national, or international law.</li>
            <li>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate based on gender, sexual orientation, religion, ethnicity, race, age, national origin, or disability.</li>
            <li>To submit false or misleading information or to manipulate the referral system for unfair gain.</li>
          </ul>
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.subHeading}>Intellectual Property</h2>
        <p className={styles.text}>
          The Service and its original content (excluding User Content), features, and functionality are and will remain the exclusive property of Algo Adopt Airdrop and its licensors.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.subHeading}>Referral System</h2>
        <p className={styles.text}>
          Our referral system allows users to earn AAA tokens by inviting new users to join the platform. Abuse of the referral system, such as creating fake accounts or using bots, will result in account suspension or termination.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.subHeading}>Limitation of Liability</h2>
        <p className={styles.text}>
          In no event shall Algo Adopt Airdrop or its affiliates be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the Service.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.subHeading}>Indemnification</h2>
        <p className={styles.text}>
          You agree to defend, indemnify, and hold harmless Algo Adopt Airdrop and its affiliates from any claims, damages, obligations, or expenses arising out of your use of the Service.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.subHeading}>Changes to Terms</h2>
        <p className={styles.text}>
          We reserve the right to modify these Terms at our discretion. Material changes will be notified at least 30 days before they take effect.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.subHeading}>Contact Us</h2>
        <p className={styles.text}>
          If you have any questions about these Terms, please contact us at [Contact us page].
        </p>
      </div>
    </div>
  );
};
