import axios from "axios";
import { algoIndexerClient } from "../algorand/config";

const assetId = "2004387843"; // AAA Token Asset ID
const tinymanLPAssetId = "2004411684"; // Tinyman LP Asset ID
const vestigeApiUrl = `https://free-api.vestige.fi/asset/${assetId}/price?currency=usd`;
export const noWalletMsg = "Connect wallet to see badge / ranking status";
export const learner = "Learner";
export const wealthBuilder = "Wealth Builder";
export const diamondHands = "Diamond Hands";

export const setBadgeStatus = async (walletAddress: string | null) => {
  if (!walletAddress) {
    localStorage.setItem("badgeRanking", noWalletMsg);
    return;
  }

  try {
    let badge = learner; // Default to Learner

    // Fetch AAA price in USD
    const priceResponse = await axios.get(vestigeApiUrl);
    const aaaPrice = priceResponse.data?.price || 0;

    // Fetch wallet balances from Algorand indexer
    const accountInfo = await algoIndexerClient.lookupAccountByID(walletAddress).do();

    const algoBalance = (accountInfo.account.amount || 0) / 1e6; // Convert microAlgos to ALGO
    const aaaBalance =
      (accountInfo.account.assets?.find((asset: any) => asset["asset-id"] === parseInt(assetId))
        ?.amount || 0) / 1e10; // Convert microTokens to tokens
    const aaaUsdValue = aaaBalance * aaaPrice; // Convert AAA balance to USD

    // Fetch Tinyman LP value
    const tinymanLPBalance =
      (accountInfo.account.assets?.find((asset: any) => asset["asset-id"] === parseInt(tinymanLPAssetId))
        ?.amount || 0) / 1e6; // Convert LP tokens to full units
    const tinymanLPPrice = await fetchTinymanPrice();
    const tinymanLPValue = tinymanLPBalance * tinymanLPPrice; // Convert LP balance to USD

    // Determine badge status
    if (tinymanLPValue >= 200) {
      badge = wealthBuilder;
    } else if (algoBalance >= 100 || aaaUsdValue >= 100) {
      badge = diamondHands;
    }

    localStorage.setItem("badgeRanking", badge);
  } catch (error) {
    console.error("Error fetching wallet data:", error);
  }
};

const fetchTinymanPrice = async () => {
  try {
    const response = await fetch(
      `https://mainnet.api.perawallet.app/v1/public/assets/${tinymanLPAssetId}`
    );
    const data = await response.json();
    return parseFloat(data.usd_value) || 0;
  } catch (error) {
    console.error(`Error fetching Tinyman price for asset ID ${tinymanLPAssetId}:`, error);
    return 0;
  }
};
