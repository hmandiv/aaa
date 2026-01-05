import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "../css_modules/DailyCheckinStyles.module.css";
import Confetti from "react-confetti";

const DailyCheckIn = ({ userId }: { userId: string }) => {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const handleCheckIn = async () => {
    const BASE_URL = "https://aaa-api.onrender.com/api/v1/checkin";
    setLoading(true);
    try {
      const res = await axios.post(
        `${BASE_URL}/daily-checkin`,
        {
          userId: localStorage.getItem("userId"),
          email: localStorage.getItem("userEmail"),
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setStatus(res.data.message);
      setShowConfetti(true);

      // Wait 2.5 seconds before reloading
      setTimeout(() => {
        window.location.reload();
      }, 5000);
    } catch (err: any) {
      setStatus(err.response?.data?.message || "Error checking in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "1rem" }}>
      <h3>🎁 Daily Check-In</h3>
      <button
        onClick={handleCheckIn}
        disabled={loading}
        style={{
          padding: "10px 20px",
          fontSize: "16px",
          backgroundColor: "#222",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        {loading ? "Checking in..." : "Check In Today"}
      </button>

      {status && (
        <div style={{ marginTop: "1rem", fontSize: "18px" }}>
          {status.includes("earned") ? (
            <div style={{ animation: `${styles.pop} 0.4s ease-out` }}>
              <svg
                width="60"
                height="60"
                viewBox="0 0 24 24"
                fill="none"
                stroke="green"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ marginBottom: "10px" }}
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
              <p style={{ color: "green", fontWeight: "bold" }}>{status}</p>
            </div>
          ) : (
            <p style={{ color: "crimson" }}>{status}</p>
          )}
        </div>
      )}

      {showConfetti && <Confetti numberOfPieces={250} />}
    </div>
  );
};

export default DailyCheckIn;
