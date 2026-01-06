import React, { useEffect, useState } from "react";
import styles from "../css_modules/AaaStatsStyles.module.css";
import axios from "axios";

export const AaaStats = () => {
  const [initialPrice, setInitialPrice] = useState<number | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [percentageIncrease, setPercentageIncrease] = useState<number | null>(
    null
  );

  const assetId = "2004387843"; // AAA Token Asset ID
  const vestigeApiUrl = `https://api.vestigelabs.org/asset/price?asset_ids=${assetId}&network_id=0&denominating_asset_id=1`;

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await axios.get(vestigeApiUrl);
        const priceData = response.data;

        const initial = 0.000031; // Fetch initial price
        const current = priceData?.price || null; // Fetch current price

        setInitialPrice(initial);
        setCurrentPrice(current);

        if (initial && current) {
          const percentage = ((current - initial) / initial) * 100;
          setPercentageIncrease(percentage);
        }
      } catch (error) {
        console.error("Error fetching AAA prices:", error);
      }
    };

    fetchPrices();
  }, []);

  return (
    <div>
      <h1 className={styles.heading}>AAA Lifetime</h1>
      <p className={styles.statValue}>
        {`$${currentPrice?.toFixed(6)}`}
        {percentageIncrease !== null && percentageIncrease > 0 && (
          <span className={styles.upArrow}>&#x2B06;</span> // Unicode for up arrow
        )}
        {percentageIncrease !== null
          ? `(${percentageIncrease.toFixed(2)}%)`
          : "Loading..."}
      </p>
    </div>
  );
};
