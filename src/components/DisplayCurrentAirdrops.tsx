import { useEffect, useState } from "react";
import axios from "axios";
import styles from "../css_modules/DisplayAirdropsStyles.module.css";

export const DisplayCurrentAirdrops = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [airdrops, setAirdrops] = useState<
    Array<{ id: string; tokenName: string; tokenId: string }>
  >([]);

  const BASE_URL = "https://aaa-api.onrender.com/api/v1/airdrop";

  useEffect(() => {
    const fetchAirdrops = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await axios.post(
          `${BASE_URL}/get-airdrops`,
          {},
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        setAirdrops(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to fetch airdrops");
      } finally {
        setLoading(false);
      }
    };

    fetchAirdrops();
  }, []);

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Current Airdrops</h1>
      {loading && <p className={styles.loading}>Loading airdrops...</p>}
      {error && <p className={styles.error}>{error}</p>}

      {!loading && !error && airdrops.length === 0 && (
        <p className={styles.noAirdrops}>No active airdrops found.</p>
      )}

      {!loading && !error && airdrops.length > 0 && (
        <div className={styles.airdropList}>
          {airdrops.map((airdrop) => (
            <div key={airdrop.id} className={styles.airdropCard}>
              <h2 className={styles.tokenName}>{`${airdrop.tokenName}`.toUpperCase()}</h2>
              <a
                href={`https://allo.info/asset/${airdrop.tokenId}/token`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <p className={styles.tokenId}>Token ID: {airdrop.tokenId}</p>
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
