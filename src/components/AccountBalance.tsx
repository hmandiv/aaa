import React, { useEffect, useState } from "react";
import axios from "axios";

interface AccountBalanceProps {
  userId: string | null;
}

export const AccountBalance = ({ userId }: AccountBalanceProps) => {
  const [totalPayout, setTotalPayout] = useState<number | null>(null);
  const [totalValueUSD, setTotalValueUSD] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const BASE_URL = "https://aaa-api-4lv4.onrender.com/api/v1/pay";
  const assetId = "2004387843"; // AAA Token Asset ID
  const vestigeApiUrl = `https://free-api.vestige.fi/asset/${assetId}/price?currency=usd`;

  useEffect(() => {
    if (userId) {
      const fetchData = async () => {
        setLoading(true);
        try {
          // Fetch total payout data
          const payoutResponse = await axios.get(
            `${BASE_URL}/payouts/total/${userId}`
          );
          const totalPayout = payoutResponse.data.totalPayout;
          setTotalPayout(totalPayout);

          // Fetch current AAA price
          const priceResponse = await axios.get(vestigeApiUrl);
          const currentPrice = priceResponse.data?.price || 0;

          // Calculate total value in USD
          if (totalPayout && currentPrice) {
            setTotalValueUSD(totalPayout * currentPrice);
          }
        } catch (err: any) {
          setError("An error occurred while fetching data.");
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [userId]);

  return (
    <div>
      <h2>Payments Received</h2>
      {loading && <p>Loading...</p>}
      {/* {error && <p style={{ color: "red" }}>{error}</p>} */}
      {!loading && (
        <div>
          <p>
            Total Payout: {totalPayout === null ? 0 : totalPayout} AAA Tokens
          </p>
          <p>
            Total Value in USD:{" "}
            {totalValueUSD !== null ? `$${totalValueUSD.toFixed(6)}` : "$0.00"}
          </p>
        </div>
      )}
    </div>
  );
};
