import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "../css_modules/MyTeamStyles.module.css";

interface MyTeamProps {
  userId: string | null;
}

interface TeamLevelData {
  level: number;
  count: number;
}

export const MyTeam = ({ userId }: MyTeamProps) => {
  const [teamData, setTeamData] = useState<TeamLevelData[]>([]);
  const [verifiedCount, setVerifiedCount] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch team data
      const teamResponse = await axios.post(
        "https://aaa-api-4lv4.onrender.com/api/v1/referrals/my-team",
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

      setTeamData(teamResponse.data.data);
    } catch (err) {
      console.error("Error fetching team data:", err);
      setError("Failed to load team data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchVerifiedCount = async () => {
    try {
      const verifiedResponse = await axios.post(
        "https://aaa-api-4lv4.onrender.com/api/v1/referrals/verified-team-members",
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

      console.log("Verified response:", verifiedResponse.data);
      setVerifiedCount(verifiedResponse.data.verifiedMembers);
    } catch (err) {
      console.error("Error fetching verified team members:", err);
      setVerifiedCount(null); // Ensure it does not display incorrect info
    }
  };

  useEffect(() => {
    if (userId) {
      fetchTeamData();
      fetchVerifiedCount();
    }
  }, [userId]);

  if (loading) {
    return <p className={styles.loading}>Loading your team data...</p>;
  }

  if (error) {
    return <p className={styles.error}>{error}</p>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>My Team</h1>

      {/* Display verified team members below the title */}
      {verifiedCount !== null && (
        <p className={styles.verifiedCount}>
          <strong>
            {verifiedCount} members in your team are now verified!
          </strong>
        </p>
      )}

      <div className={styles.levels}>
        {teamData.map(({ level, count }) => (
          <div key={level} className={styles.level}>
            <p>
              <strong>Level {level}:</strong> {count} referrals
            </p>
          </div>
        ))}
      </div>

      <p className={styles.info}>
        <strong>Each level earns you at least 5 AAA tokens</strong>
      </p>
    </div>
  );
};
