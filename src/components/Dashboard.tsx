import React from "react";
import styles from "../css_modules/DashboardStyles.module.css";

interface DashboardProps {
  userReferralCode: string;
  walletAddress: string; // Add walletAddress to props
  aaaBalance: number;
  userReferrals: string[];
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  userReferralCode,
  walletAddress, // Destructure walletAddress
  aaaBalance,
  userReferrals,
  onLogout,
}) => {
  return (
    <div className={styles.dashboard}>
      <h2 className={styles.dashboardTitle}>Welcome Back!</h2>
      <div className={styles.dashboardInfo}>
        <p>
          <strong>Referral Code:</strong> {userReferralCode}
        </p>
        <p>
          <strong>Wallet Address:</strong> {walletAddress}
        </p>
        <p>
          <strong>Balance:</strong> {aaaBalance} AAA Tokens
        </p>
      </div>
      <div className={styles.dashboardReferrals}>
        <h3>Your Referrals</h3>
        {userReferrals.length > 0 ? (
          <ul className={styles.referralList}>
            {userReferrals.map((referralId) => (
              <li key={referralId} className={styles.referralItem}>
                {referralId}
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.noReferrals}>
            No referrals yet. Share your code to start earning rewards!
          </p>
        )}
      </div>
      <div className={styles.dashboardActions}>
        <button className={styles.actionButton} onClick={onLogout}>
          Log Out
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
