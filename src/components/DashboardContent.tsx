import React, { useEffect, useState } from "react";
import {
  FaCoins,
  FaUserFriends,
  FaShieldAlt,
  FaInfoCircle,
  FaWallet,
  FaChartLine,
  FaRegIdBadge,
  FaCheck,
  FaLink,
  FaCalculator,
  FaBell,
} from "react-icons/fa";
import axios from "axios";
import styles from "../css_modules/DashboardContentStyles.module.css";
import { AccountBalance } from "./AccountBalance";
import { ReferralCalculator } from "./ReferralCalculator";
import { AaaStats } from "./AaaStats";
import { learner, wealthBuilder } from "../helpers/setBadgeStatus";
import learn from "../images/learner.png";
import wealthBuilderBadge from "../images/Wealthbuilder.png";
import diamondHandsBadge from "../images/diamonhands.png";
import DailyCheckIn from "./DailyCheckIn";

interface DashboardContentProps {
  aaaBalance: number;
  referrals: number;
  verified: boolean;
  userName: string;
  referralLink: string;
  userId: string | null;
}

const DashboardContent: React.FC<DashboardContentProps> = ({
  aaaBalance,
  referrals,
  verified,
  userName,
  referralLink,
  userId,
}) => {
  const [currentPayout, setCurrentPayout] = useState<number>(0);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  useEffect(() => {
    if (userId) {
      fetchCurrentPayout();
    }
  }, [userId]);

  const fetchCurrentPayout = async () => {
    try {
      const currentPayoutResponse = await axios.post(
        `https://aaa-api-4lv4.onrender.com/api/v1/pay/payouts/current/${userId}`,
        {
          userId,
          email: localStorage.getItem("userEmail"),
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setCurrentPayout(currentPayoutResponse.data.currentPayout);
    } catch (err) {
      console.error("Error fetching verified team members:", err);
      setCurrentPayout(0); // Ensure it does not display incorrect info
    }
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className={styles.dashboardContentWrapper}>
      <h2 className={styles.dashboardTitle}>
        <span className={styles.titleText}>Account Dashboard</span>
      </h2>

      {/* Stats Cards */}
      <div className={styles.statsCards}>
        <div className={`${styles.statCard} ${styles.balanceCard}`}>
          <div className={styles.statCardHeader}>
            <div className={styles.iconWrapper}>
              <FaCoins className={styles.icon} />
            </div>
            <h3>Pending Verification Balance</h3>
          </div>
          <div className={styles.statCardBody}>
            {verified ? (
              <div className={styles.balanceAmount}>
                {aaaBalance.toFixed(1)}{" "}
                <span className={styles.currency}>AAA</span>
              </div>
            ) : (
              <div className={styles.pendingBalance}>
                <div className={styles.balanceAmount}>
                  {aaaBalance.toFixed(1)}{" "}
                  <span className={styles.currency}>AAA</span>
                </div>
                <div className={styles.pendingMessage}>
                  <FaShieldAlt className={styles.warningIcon} /> Requires
                  verification to claim rewards.
                </div>
              </div>
            )}
            <div className={styles.divider}></div>
            <div className={styles.payoutSection}>
              <div className={styles.payoutHeader}>
                <FaCheck className={styles.eligibleForPayout} />
                <h4>Ready for payout</h4>
              </div>
              <div className={styles.payoutAmount}>
                {currentPayout ? currentPayout : "0"}{" "}
                <span className={styles.currency}>AAA</span>
              </div>
            </div>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.badgeCard}`}>
          <div className={styles.statCardHeader}>
            <div className={styles.iconWrapper}>
              <FaRegIdBadge className={styles.icon} />
            </div>
            <h3>Ranking and Badges</h3>
          </div>
          <div className={styles.statCardBody}>
            <div className={styles.badgesContainer}>
              <div className={styles.badgeImage}>
                {localStorage.getItem("badgeRanking") === learner ? (
                  <img src={learn} alt="Learner Badge" />
                ) : localStorage.getItem("badgeRanking") === wealthBuilder ? (
                  <img src={wealthBuilderBadge} alt="Wealth Builder Badge" />
                ) : (
                  <img src={diamondHandsBadge} alt="Diamond Hands Badge" />
                )}
              </div>
              <div className={styles.badgeRank}>
                {localStorage.getItem("badgeRanking") || "Learner"}
              </div>
            </div>
            <a
              href="https://www.algoadoptairdrop.com/badges"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.rankDetailsBtn}
            >
              View Rank Details
            </a>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.referralsCard}`}>
          <div className={styles.statCardHeader}>
            <div className={styles.iconWrapper}>
              <FaUserFriends className={styles.icon} />
            </div>
            <h3>Referrals</h3>
          </div>
          <div className={styles.statCardBody}>
            <div className={styles.referralCount}>{referrals}</div>
            <div className={styles.referralGrowth}>
              <div className={styles.growthLabel}>Team Growth</div>
              <div className={styles.growthBar}>
                <div
                  className={styles.growthFill}
                  style={{ width: `${Math.min(referrals * 5, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.statusCard}`}>
          <div className={styles.statCardHeader}>
            <div className={styles.iconWrapper}>
              <FaShieldAlt className={styles.icon} />
            </div>
            <h3>Account Status</h3>
          </div>
          <div className={styles.statCardBody}>
            <div className={styles.statusDisplay}>
              {verified ? (
                <div className={styles.verifiedStatus}>
                  <div className={styles.statusIcon}>
                    <FaCheck />
                  </div>
                  <div className={styles.statusText}>Verified</div>
                </div>
              ) : (
                <div className={styles.unverifiedStatus}>
                  <div className={styles.statusIcon}>
                    <FaShieldAlt />
                  </div>
                  <div className={styles.statusText}>Not Verified</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Cards */}
      <div className={styles.detailCards}>
        <div className={styles.detailCard}>
          <div className={styles.detailCardHeader}>
            <div className={styles.iconWrapper}>
              <FaInfoCircle className={styles.icon} />
            </div>
            <h3>Account Info</h3>
          </div>
          <div className={styles.detailCardBody}>
            <div className={styles.infoRow}>
              <div className={styles.infoLabel}>Name</div>
              <div className={styles.infoValue}>{userName}</div>
            </div>
            <div className={styles.infoRow}>
              <div className={styles.infoLabel}>Status</div>
              <div className={styles.infoValue}>
                {verified ? (
                  <span className={styles.verifiedLabel}>Verified</span>
                ) : (
                  <span className={styles.unverifiedLabel}>Not Verified</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.detailCard}>
          <div className={styles.detailCardHeader}>
            <div className={styles.iconWrapper}>
              <FaWallet className={styles.icon} />
            </div>
            <h3>Wallet Balance</h3>
          </div>
          <div className={styles.detailCardBody}>
            <AccountBalance userId={userId} />
          </div>
        </div>

        <div className={styles.detailCard}>
          <div className={styles.detailCardHeader}>
            <div className={styles.iconWrapper}>
              <FaChartLine className={styles.icon} />
            </div>
            <h3>AAA Statistics</h3>
          </div>
          <div className={styles.detailCardBody}>
            <AaaStats />
          </div>
        </div>
      </div>

      {/* Notification Section */}
      <div className={styles.notificationSection}>
        <div className={styles.notificationHeader}>
          <div className={styles.iconWrapper}>
            <FaBell className={styles.icon} />
          </div>
          <h3>Important Notice</h3>
        </div>
        <div className={styles.notificationContent}>
          <p>
            Payments will be deposited directly into your wallets the first week
            of every month
          </p>
        </div>
      </div>

      {/* Daily Check-in */}
      <div className={styles.checkInContainer}>
        <DailyCheckIn userId={userId || ""} />
      </div>

      {/* Referral Link */}
      <div className={styles.referralSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.iconWrapper}>
            <FaLink className={styles.icon} />
          </div>
          <h3>Your Referral Link</h3>
        </div>
        <div className={styles.referralLinkContainer}>
          <input
            type="text"
            className={styles.referralLinkInput}
            value={referralLink}
            readOnly
          />
          <button className={styles.copyButton} onClick={copyReferralLink}>
            {copySuccess ? "Copied!" : "Copy"}
          </button>
        </div>
        <p className={styles.referralTip}>
          Share this link to invite new members and earn rewards
        </p>
      </div>

      {/* Calculator */}
      <div className={styles.calculatorSection}>
        <div className={styles.calculatorContainer}>
          <ReferralCalculator />
        </div>
      </div>
    </div>
  );
};

export default DashboardContent;
