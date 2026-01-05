import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
import { algodClient } from "../algorand/config";
import algosdk from "algosdk";
import PeraWalletButton from "./PeraWalletButton";
import { PeraWalletContext } from "./PeraWalletContext";
import styles from "../css_modules/CreateAirdropStyles.module.css";
import {
  allMembers,
  diamondHands,
  wealthBuilders,
} from "../constants/airdrops";

// Enhanced icons for look
const icons = {
  all: "👥",
  diamond: "💎",
  wealth: "💰",
  tip: "✨",
  step1: "1️⃣",
  step2: "2️⃣",
  step3: "3️⃣",
  step4: "4️⃣",
  success: "🎉",
};

export const CreateAirdrop = () => {
  const BASE_URL = "https://aaa-api-4lv4.onrender.com/api/v1/airdrop";
  const AIRDROP_FEE_ADDRESS =
    "HE7225SD6ZKYO45QWYCE4BZ3ITFEK7WI7XGMAVAMB56FZREJVPMHNRSL2E";

  const peraWallet = useContext(PeraWalletContext);
  const [step, setStep] = useState(1);
  const [airdropType, setAirdropType] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionStatus, setTransactionStatus] = useState<string | null>(
    null
  );
  const [walletAddress, setWalletAddress] = useState(null);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  const [formData, setFormData] = useState({
    tokenName: "",
    tokenId: "",
    tokenDecimals: "",
    amountOfTokenPerClaim: "",
    totalAmountOfTokens: "",
    shortDescription: "",
  });

  // Progress tracker steps
  const steps = [
    { label: "Select Type", id: 1 },
    { label: "Details", id: 2 },
    { label: "Deposit", id: 3 },
    { label: "Complete", id: 4 },
  ];

  // Handle airdrop type selection with animation
  const handleTypeSelect = (type: string | null) => {
    setAirdropType(type);
    // Small delay for animation effect
    setTimeout(() => {
      setStep(2);
    }, 300);
  };

  const handleWalletConnect = (address: React.SetStateAction<null>) =>
    setWalletAddress(address);
  const handleWalletDisconnect = () => setWalletAddress(null);

  const handleChange = (e: { target: { name: any; value: any } }) => {
    const { name, value } = e.target;
    if (["amountOfTokenPerClaim", "totalAmountOfTokens"].includes(name)) {
      if (!/^\d*$/.test(value)) return;
    }
    if (name === "shortDescription" && value.length > 200) return;
    setFormData({ ...formData, [name]: value });
  };

  // Copy wallet address to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(AIRDROP_FEE_ADDRESS);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  // Get custom recommendation based on airdrop type
  const getAirdropRecommendation = () => {
    switch (airdropType) {
      case "all-members":
        return "Pro Tip: Keep tokens to max 0.1 ALGO per claim to attract quality collectors while maintaining engagement metrics.";
      case "diamond-hands":
        return "Pro Tip: Diamond Hand holders respond best to exclusive perks.";
      case "wealth-builders":
        return "Pro Tip: LP providers value stability.";
      default:
        return "";
    }
  };

  const handlePayFeeAndNext = async () => {
    if (!walletAddress) return setError("Please connect your wallet first.");
    if (
      !formData.tokenName ||
      !formData.tokenId ||
      !formData.tokenDecimals ||
      !formData.amountOfTokenPerClaim ||
      !formData.totalAmountOfTokens ||
      !formData.shortDescription
    ) {
      return setError("All fields are required to proceed.");
    }

    try {
      setLoading(true);
      setError(null);

      const suggestedParams = await algodClient.getTransactionParams().do();
      const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: walletAddress,
        to: AIRDROP_FEE_ADDRESS,
        amount: 10000000, // 10 ALGO in microAlgos
        note: new Uint8Array(Buffer.from("AAA APP: Airdrop Creation Fee")),
        suggestedParams,
      });

      if (!peraWallet) throw new Error("PeraWallet is not available.");
      const singleTxnGroup = [{ txn, signers: [walletAddress] }];
      if (!peraWallet) throw new Error("PeraWallet is not available.");
      const signedTxn = await peraWallet.signTransaction([singleTxnGroup]);
      const { txId } = await algodClient.sendRawTransaction(signedTxn).do();

      await algosdk.waitForConfirmation(algodClient, txId, 4);
      setTransactionStatus(
        "Fee payment successful! Proceeding to airdrop setup..."
      );
      await handleCreateAirdrop(txId);
    } catch (error) {
      console.error(error);
      setError("Transaction failed. Please check your wallet and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAirdrop = async (txId: any) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/create-airdrop`,
        {
          userId: localStorage.getItem("userId"),
          email: localStorage.getItem("userEmail"),
          tokenName: formData.tokenName.toUpperCase(),
          tokenId: Number(formData.tokenId),
          tokenDecimals: Number(formData.tokenDecimals),
          amountOfTokenPerClaim: Number(formData.amountOfTokenPerClaim),
          totalAmountOfTokens: Number(formData.totalAmountOfTokens),
          shortDescription: formData.shortDescription,
          airdropType,
          txId,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.status === 201) {
        // Success animation before moving to next step
        setTransactionStatus("✅ Airdrop created successfully!");
        setTimeout(() => {
          setStep(3);
        }, 1000);
      } else setError("Airdrop creation failed. Please try again.");
    } catch (err) {
      setError((err as any).response?.data?.message || "An error occurred.");
    }
  };

  const handleSendTokenTransaction = async () => {
    if (!walletAddress) return setError("Please connect your wallet.");

    try {
      setLoading(true);
      setError(null);

      const suggestedParams = await algodClient.getTransactionParams().do();
      const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        from: walletAddress,
        to: AIRDROP_FEE_ADDRESS,
        assetIndex: Number(formData.tokenId),
        amount:
          Number(formData.totalAmountOfTokens) *
          10 ** Number(formData.tokenDecimals),
        note: new Uint8Array(Buffer.from("AAA APP: Airdrop Token Deposit")),
        suggestedParams,
      });

      const singleTxnGroup = [{ txn, signers: [walletAddress] }];
      if (!peraWallet) throw new Error("PeraWallet is not available.");
      const signedTxn = await peraWallet.signTransaction([singleTxnGroup]);
      const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
      await algosdk.waitForConfirmation(algodClient, txId, 4);

      setTransactionStatus("✅ Token deposit successful!");

      // Show success animation
      setShowSuccessAnimation(true);
      setTimeout(() => {
        setShowSuccessAnimation(false);
        setStep(4); // Move to final step
      }, 2000);
    } catch (err) {
      console.error("Token transaction failed", err);
      setError("Token transaction failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Render progress tracker
  const renderProgressTracker = () => {
    return (
      <div className={styles.progressTracker}>
        {steps.map((s) => (
          <div
            key={s.id}
            className={`${styles.progressStep} 
              ${step === s.id ? styles.active : ""} 
              ${step > s.id ? styles.completed : ""}`}
          >
            <div className={styles.progressDot}>{step > s.id ? "" : s.id}</div>
            <div className={styles.progressLabel}>{s.label}</div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>
        <span>Airdrop Creator</span>
      </h1>

      {/* Progress tracker */}
      {renderProgressTracker()}

      {step === 1 && (
        <>
          <h2 className={styles.subheading}>Select Your Airdrop Type</h2>
          <p className={styles.description}>
            Choose the most strategic airdrop type for your project goals. Each
            option targets different user segments for maximum impact.
          </p>
          <div className={styles.airdropOptions}>
            {[
              {
                label: "All Members",
                value: allMembers,
                icon: icons.all,
                desc: "Broad distribution to maximize reach and community growth.",
              },
              {
                label: "Diamond Hands",
                value: diamondHands,
                icon: icons.diamond,
                desc: "Target proven long-term holders with strong retention.",
              },
              {
                label: "Wealth Builders",
                value: wealthBuilders,
                icon: icons.wealth,
                desc: "Focus on liquidity providers and high-value investors.",
              },
            ].map((option) => (
              <div
                key={option.value}
                className={`${styles.airdropCard} ${
                  airdropType === option.value ? styles.selected : ""
                }`}
                onClick={() => handleTypeSelect(option.value)}
              >
                <h3 className={styles.airdropTitle}>
                  {option.icon} {option.label}
                </h3>
                <p className={styles.airdropText}>{option.desc}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <h2 className={styles.subheading}>Configure Your Airdrop</h2>
          {getAirdropRecommendation() && (
            <p className={styles.tip}>{getAirdropRecommendation()}</p>
          )}

          <div className={styles.cardSection}>
            <div className={styles.sectionTitle}>Token Details</div>
            <form className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Token Name</label>
                <input
                  className={styles.input}
                  type="text"
                  name="tokenName"
                  placeholder="Enter token name (e.g. ALGO)"
                  value={formData.tokenName}
                  onChange={handleChange}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Token ID</label>
                <input
                  className={styles.input}
                  type="number"
                  name="tokenId"
                  placeholder="Enter ASA ID number"
                  value={formData.tokenId}
                  onChange={handleChange}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Token Decimals</label>
                <input
                  className={styles.input}
                  type="number"
                  name="tokenDecimals"
                  placeholder="Number of decimal places (e.g. 6)"
                  value={formData.tokenDecimals}
                  onChange={handleChange}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Amount per Claim</label>
                <input
                  className={styles.input}
                  type="number"
                  name="amountOfTokenPerClaim"
                  placeholder="Tokens received per user claim"
                  value={formData.amountOfTokenPerClaim}
                  onChange={handleChange}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Total Token Amount</label>
                <input
                  className={styles.input}
                  type="number"
                  name="totalAmountOfTokens"
                  placeholder="Total tokens for this airdrop"
                  value={formData.totalAmountOfTokens}
                  onChange={handleChange}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Description</label>
                <textarea
                  className={styles.textarea}
                  name="shortDescription"
                  placeholder="Describe your airdrop (max 200 characters)"
                  value={formData.shortDescription}
                  onChange={handleChange}
                  rows={3}
                />
                <small className={styles.charCount}>
                  {formData.shortDescription.length}/200
                </small>
              </div>
            </form>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <PeraWalletButton
            onConnect={handleWalletConnect}
            onDisconnect={handleWalletDisconnect}
          />

          <button
            className={styles.button}
            disabled={loading}
            onClick={handlePayFeeAndNext}
          >
            {loading ? "Processing..." : "Pay Fee & Create Airdrop"}
          </button>

          {transactionStatus && (
            <p className={styles.tip}>{transactionStatus}</p>
          )}
        </>
      )}

      {step === 3 && (
        <>
          <h2 className={styles.subheading}>
            Deposit Your Tokens By Clicking the Send Tokens Button below
          </h2>

          <div className={styles.cardSection}>
            <div className={styles.sectionTitle}>Airdrop Summary</div>
            <div className={styles.summaryList}>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Token:</span>
                <span className={styles.summaryValue}>
                  {formData.tokenName}
                </span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Token ID:</span>
                <span className={styles.summaryValue}>{formData.tokenId}</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Per Claim:</span>
                <span className={styles.summaryValue}>
                  {formData.amountOfTokenPerClaim}
                </span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Total Tokens:</span>
                <span className={styles.summaryValue}>
                  {formData.totalAmountOfTokens}
                </span>
              </div>
            </div>
          </div>

          <p className={styles.instructions}>
            Click the address below to copy, for your reference.
          </p>

          <div className={styles.walletAddress} onClick={copyToClipboard}>
            {AIRDROP_FEE_ADDRESS}
            {copiedAddress && (
              <span className={styles.copiedIndicator}>Copied!</span>
            )}
          </div>

          <button
            className={`${styles.button} ${styles.buttonGold}`}
            disabled={loading}
            onClick={handleSendTokenTransaction}
          >
            {loading ? "Sending..." : "Send Tokens"}
          </button>

          {transactionStatus && (
            <p className={styles.tip}>{transactionStatus}</p>
          )}

          {error && <p className={styles.error}>{error}</p>}

          {showSuccessAnimation && (
            <div className={styles.successAnimation}>
              <div className={styles.successIcon}>✓</div>
            </div>
          )}
        </>
      )}

      {step === 4 && (
        <>
          <div className={styles.successAnimation}>
            <div className={styles.successIcon}>🎉</div>
          </div>

          <h2 className={styles.subheading}>Airdrop Successfully Created!</h2>

          <p className={styles.description}>
            Your airdrop is now <strong>live</strong> and ready to be claimed by
            eligible users.
          </p>

          <div className={`${styles.statusBadge} ${styles.statusSuccess}`}>
            Active
          </div>
        </>
      )}
    </div>
  );
};

export default CreateAirdrop;
