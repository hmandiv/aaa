import React from "react";
import styles from "../css_modules/PrivacyPolicyStyles.module.css";

export const PrivacyPolicy = () => {
  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Privacy Policy for Algo Adopt Airdrop</h1>
      <p className={styles.updatedDate}>Last Updated: [2025-01-20]</p>

      <div className={styles.section}>
        <h2 className={styles.subHeading}>Information We Collect</h2>
        <h3 className={styles.smallHeading}>Personal Information</h3>
        <ul className={styles.list}>
          <li>
            <strong>Account Information:</strong> When you create an account, we
            collect your email address, username, and possibly other
            identifiers like your referral code.
          </li>
          <li>
            <strong>Contact Information:</strong> You might provide additional
            contact details if you reach out to us for support or inquiries.
          </li>
        </ul>
        <h3 className={styles.smallHeading}>Automatically Collected Information</h3>
        <ul className={styles.list}>
          <li>
            <strong>Usage Data:</strong> We automatically collect information on
            how you interact with our Service, including but not limited to,
            pages visited, time spent, and actions taken.
          </li>
          <li>
            <strong>Device Information:</strong> We gather data about the device
            you use to access our Service, such as device type, operating
            system, unique device identifiers, and mobile network information.
          </li>
          <li>
            <strong>Log Data:</strong> Our servers automatically record
            information created by your use of the Service, like your login
            times, IP address, and browser type.
          </li>
        </ul>
      </div>

      <div className={styles.section}>
        <h2 className={styles.subHeading}>How We Use Your Information</h2>
        <ul className={styles.list}>
          <li>
            <strong>To Provide and Maintain Our Service:</strong> Including
            processing your transactions for educational content and managing
            the referral system.
          </li>
          <li>
            <strong>To Improve Our Service:</strong> We use data to personalize
            your experience, enhance our platform, and develop new features.
          </li>
          <li>
            <strong>For Communication:</strong> We might send you
            service-related emails, updates, or marketing communications if
            you've opted in.
          </li>
          <li>
            <strong>Compliance and Security:</strong> To comply with legal
            obligations, enforce our policies, and protect our Service from
            abuse.
          </li>
        </ul>
      </div>

      <div className={styles.section}>
        <h2 className={styles.subHeading}>Sharing of Your Information</h2>
        <ul className={styles.list}>
          <li>
            <strong>With Your Consent:</strong> We'll share information for
            purposes you've agreed to.
          </li>
          <li>
            <strong>Service Providers:</strong> We may use third-party companies
            to help us provide, operate, analyze, or improve our Service, like
            cloud hosting or analytics services.
          </li>
          <li>
            <strong>Legal Requirements:</strong> If we're required to by law, or
            if we believe disclosure is necessary to protect our rights, your
            safety, or the public's safety.
          </li>
        </ul>
      </div>

      <div className={styles.section}>
        <h2 className={styles.subHeading}>Data Security</h2>
        <p className={styles.text}>
          We take reasonable measures to protect your information from
          unauthorized access or disclosure. However, no internet or email
          transmission is ever fully secure or error-free.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.subHeading}>Your Data Rights</h2>
        <ul className={styles.list}>
          <li>
            <strong>Access, Update, or Delete Your Information:</strong> You can
            review or update your personal data or ask us to delete it.
          </li>
          <li>
            <strong>Object to Processing:</strong> You can object to certain
            uses of your data.
          </li>
          <li>
            <strong>Data Portability:</strong> Request a copy of your data in a
            common format.
          </li>
        </ul>
        <p className={styles.text}>
          Please contact us if you wish to exercise these rights.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.subHeading}>Cookies and Tracking Technologies</h2>
        <p className={styles.text}>
          We use cookies and similar technologies to enhance your experience,
          analyze trends, administer the site, track users' movements around
          the site, and gather demographic information about our user base as a
          whole.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.subHeading}>Third-Party Links</h2>
        <p className={styles.text}>
          Our Service might contain links to third-party websites or services
          not operated by us. We are not responsible for the privacy practices
          of these third parties.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.subHeading}>Children's Privacy</h2>
        <p className={styles.text}>
          Our Service is not intended for children under 13 years of age. We do
          not knowingly collect personal information from children under 13.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.subHeading}>Changes to This Privacy Policy</h2>
        <p className={styles.text}>
          We may update our Privacy Policy from time to time. We will notify you
          of any changes by posting the new Privacy Policy on this page and
          updating the "Last Updated" date.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.subHeading}>Contact Us</h2>
        <p className={styles.text}>
          If you have any questions about this Privacy Policy, please contact us
          at [contact page].
        </p>
      </div>
    </div>
  );
};
