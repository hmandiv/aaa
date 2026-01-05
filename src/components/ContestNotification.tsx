import React, { useState } from "react";
import styles from "../css_modules/ContestNotificationStyles.module.css";

interface Contest {
  id: string;
  title: string;
  description: string;
  platform: string;
  instructionsPartOne: string;
  instructionsPartTwo?: string;
  reward: number;
  contactHandle: string;
  expiryDate: string;
}

interface ContestNotificationProps {
  contests: Contest[];
}

const ContestNotification: React.FC<ContestNotificationProps> = ({
  contests = [],
}) => {
  const [expandedContests, setExpandedContests] = useState<
    Record<string, boolean>
  >({});

  // Initialize all contests as expanded
  React.useEffect(() => {
    const initialExpandState: Record<string, boolean> = {};
    contests.forEach((contest) => {
      initialExpandState[contest.id] = true;
    });
    setExpandedContests(initialExpandState);
  }, [contests]);

  const toggleExpand = (contestId: string) => {
    setExpandedContests((prev) => ({
      ...prev,
      [contestId]: !prev[contestId],
    }));
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className={styles.contestsContainer}>
      <h2 className={styles.contestsHeader}>
        <span className={styles.contestsIcon}>🏆</span>
        {contests.length > 0
          ? `Active ${contests.length > 1 ? "Contests" : "Contest"}`
          : "Contests"}
      </h2>

      {contests.length > 0 ? (
        contests.map((contest) => (
          <div
            key={contest.id}
            className={`${styles.contestCard} ${
              expandedContests[contest.id] ? styles.expanded : ""
            }`}
          >
            <div
              className={styles.contestHeader}
              onClick={() => toggleExpand(contest.id)}
            >
              <h3 className={styles.contestTitle}>{contest.title}</h3>
              <div className={styles.contestMeta}>
                <span className={styles.contestReward}>
                  {contest.reward} AAA
                </span>
                {/* <span className={styles.contestExpiry}>Ends: {formatDate(contest.expiryDate)}</span> */}
                <span
                  className={`${styles.expandIcon} ${
                    expandedContests[contest.id] ? styles.expanded : ""
                  }`}
                >
                  ▼
                </span>
              </div>
            </div>

            {expandedContests[contest.id] && (
              <div className={styles.contestDetails}>
                <p className={styles.contestDescription}>
                  {contest.description}
                </p>

                <div className={styles.contestInstructions}>
                  <h4>How to participate:</h4>
                  <ol>
                    <li>
                      Go to{" "}
                      <span className={styles.platformName}>
                        {contest.platform}
                      </span>
                    </li>
                    <li>{contest.instructionsPartOne}</li>
                    {contest.instructionsPartTwo && (
                      <li>{contest.instructionsPartTwo}</li>
                    )}
                    <li>
                      DM{" "}
                      <span className={styles.contactHandle}>
                        {contest.contactHandle}
                      </span>{" "}
                      to claim your reward
                    </li>
                  </ol>
                </div>

                <a
                  href={`https://${contest.platform.toLowerCase()}.com`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.participateButton}
                >
                  Go to {contest.platform}
                </a>
              </div>
            )}
          </div>
        ))
      ) : (
        <div className={styles.noContestsMessage}>
          Currently no contests available. Check back soon for new
          opportunities!
        </div>
      )}
    </div>
  );
};

// Default export
export default ContestNotification;

// Export a version with default values for simpler usage
export const SimpleContestNotification: React.FC<{
  contest?: Partial<Contest>;
}> = ({ contest = {} }) => {
  const defaultContest: Contest = {
    id: "default-contest",
    title: "AAA Community Contest",
    description:
      "Hey AAA family! Join our latest contest and earn AAA tokens for your participation.",
    platform: "Twitter",
    instructionsPartOne:
      "Follow @TinyLionCoder @TLPCoin @ConnectionMach then, create a post on X saying: 'Just discovered Algo Adopt Airdrop - a platform where you earn 5 AAA tokens just for joining, plus 5 AAA tokens for each person you refer! Check it out at algoadoptairdrop.com #Algorand #Crypto #Airdrop'",
    reward: 350,
    contactHandle: "@TinyLionCoder",
    expiryDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
  };

  const mergedContest = { ...defaultContest, ...contest };

  return <ContestNotification contests={[mergedContest]} />;
};
