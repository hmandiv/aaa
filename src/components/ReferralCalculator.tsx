import React, { useState } from "react";
import styles from "../css_modules/ReferralCalculatorStyles.module.css";
import { FaUsers, FaCoins, FaCalculator, FaAngleDown, FaAngleUp } from "react-icons/fa";

export const ReferralCalculator: React.FC = () => {
  const rewardPerReferral = 5; // Tokens earned per referral at each level
  const referralLabels = [
    "Your Friends",
    "Your Friends' Friends",
    "Your Friends' Friends' Friends",
    "Your Friends' Friends' Friends' Friends",
    "Your Friends' Friends' Friends' Friends' Friends",
  ];

  const [referrals, setReferrals] = useState<number[]>([0, 0, 0, 0, 0]); // Start referrals at 0
  const [expanded, setExpanded] = useState<boolean>(true);

  const calculateEarnings = (): { levelEarnings: number[]; totalEarnings: number } => {
    // Calculate rewards per level based on fixed referral counts
    const levelEarnings = referrals.map((count) => count * rewardPerReferral);

    // Calculate total earnings
    const totalEarnings = levelEarnings.reduce((acc, curr) => acc + curr, 0);

    return { levelEarnings, totalEarnings };
  };
  
  const { levelEarnings, totalEarnings } = calculateEarnings();

  const handleReferralChange = (level: number, value: number) => {
    const updatedReferrals = [...referrals];
    updatedReferrals[level] = value;
    setReferrals(updatedReferrals);
  };

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  return (
    <div className={styles.calculatorContainer}>
      <div className={styles.calculatorHeader} onClick={toggleExpanded}>
        <div className={styles.headerLeft}>
          <div className={styles.iconWrapper}>
            <FaCalculator className={styles.icon} />
          </div>
          <h3 className={styles.calculatorTitle}>Referral Earnings Calculator</h3>
        </div>
        <button className={styles.toggleButton}>
          {expanded ? <FaAngleUp /> : <FaAngleDown />}
        </button>
      </div>
      
      {expanded && (
        <div className={styles.calculatorContent}>
          <p className={styles.description}>
            Customize the number of referrals at each level to estimate your potential AAA token earnings.
          </p>
          
          <div className={styles.levelInputs}>
            {referralLabels.map((label, level) => (
              <div key={level} className={styles.levelRow}>
                <div className={styles.levelInfo}>
                  <div className={styles.levelIconWrapper}>
                    <FaUsers className={styles.levelIcon} />
                    <span className={styles.levelNumber}>{level + 1}</span>
                  </div>
                  <label htmlFor={`level-${level}`} className={styles.label}>
                    {label}
                  </label>
                </div>
                
                <div className={styles.inputGroup}>
                  <input
                    id={`level-${level}`}
                    type="number"
                    min={0}
                    value={referrals[level]}
                    onChange={(e) => handleReferralChange(level, Number(e.target.value))}
                    className={styles.input}
                  />
                  <div className={styles.earningsTag}>
                    <FaCoins className={styles.coinIcon} />
                    <span className={styles.earningsValue}>{levelEarnings[level]}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className={styles.totalEarningsContainer}>
            <div className={styles.totalRow}>
              <div className={styles.totalLabel}>
                <div className={styles.totalIconWrapper}>
                  <FaCoins className={styles.totalIcon} />
                </div>
                <h4 className={styles.totalHeading}>Total Potential Earnings</h4>
              </div>
              <div className={styles.totalAmount}>{totalEarnings} <span className={styles.tokenLabel}>AAA</span></div>
            </div>
            
            <div className={styles.progressContainer}>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill} 
                  style={{ width: `${Math.min(totalEarnings / 100, 100)}%` }}
                ></div>
              </div>
              <div className={styles.milestoneMarkers}>
                <span className={styles.milestone}>0</span>
                <span className={styles.milestone}>100</span>
                <span className={styles.milestone}>500</span>
                <span className={styles.milestone}>1000+</span>
              </div>
            </div>
          </div>
          
          <div className={styles.calculatorFooter}>
            <p className={styles.footerNote}>
              Invite friends to maximize your referral earnings.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};