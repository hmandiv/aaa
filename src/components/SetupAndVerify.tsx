import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { algodClient } from "../algorand/config";
import algosdk from "algosdk";
import PeraWalletButton from "./PeraWalletButton";
import { PeraWalletContext } from "./PeraWalletContext";
import styles from "../css_modules/SetupAndVerifyStyles.module.css";

interface SetupAndVerifyProps {
  userId: string | null;
}

export const SetupAndVerify = ({ userId }: SetupAndVerifyProps) => {
  const BASE_SETUP_URL =
    "https://aaa-api.onrender.com/api/v1/config/setup-wallet";
  const BASE_VERIFY_URL = "https://aaa-api.onrender.com/api/v1/verify";
  const verificationAddress =
    "HE7225SD6ZKYO45QWYCE4BZ3ITFEK7WI7XGMAVAMB56FZREJVPMHNRSL2E";

  const peraWallet = useContext(PeraWalletContext);
  const [step, setStep] = useState(1); // Step 1: Setup Wallet, Step 2: Verify
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionStatus, setTransactionStatus] = useState<string | null>(
    null
  );
  const [isVerified, setIsVerified] = useState(false);

  // Fetch verification status on load
  useEffect(() => {
    if (userId) {
      fetchVerificationStatus();
    }
  }, [userId]);

  const fetchVerificationStatus = async () => {
    try {
      const response = await axios.get(
        `${BASE_VERIFY_URL}/verification-status/${userId}`
      );
      setIsVerified(response.data.verified);
    } catch (error) {
      console.error("Error fetching verification status:", error);
    }
  };

  const handleWalletConnect = async (address: string) => {
    setWalletAddress(address);
    setError(null);

    if (step === 1 && userId) {
      try {
        setProcessing(true);

        // Call the API to set up the wallet address
        const response = await axios.post(
          BASE_SETUP_URL,
          {
            userId,
            email: localStorage.getItem("userEmail"),
            walletAddress: address,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.status === 200) {
          setStep(2); // Proceed to verification step
        } else {
          setError(response.data.message || "Failed to set up wallet.");
        }
      } catch (err: any) {
        console.error("Error during wallet setup:", err);
        setError(
          err.response?.data?.message ||
            "An error occurred during wallet setup."
        );
        if (
          err.response?.data?.message ===
          "Wallet address is already up-to-date."
        ) {
          setStep(2);
        }
      } finally {
        setProcessing(false);
      }
    }
  };

  const handleWalletDisconnect = () => {
    setWalletAddress(null);
    setError(null);
  };

  const handleVerification = async () => {
    if (!walletAddress || !userId) {
      setError("Please connect your wallet and ensure you are logged in.");
      return;
    }

    try {
      setProcessing(true);

      // Fetch transaction parameters
      const suggestedParams = await algodClient.getTransactionParams().do();

      // Create a payment transaction for verification
      const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: walletAddress,
        to: verificationAddress,
        amount: 6000000, // 1 ALGO in microAlgos
        note: new Uint8Array(Buffer.from("AAA app: Verification Fee")),
        suggestedParams,
      });

      // Sign the transaction using PeraWallet
      if (!peraWallet) throw new Error("PeraWallet is not available.");
      const singleTxnGroup = [{ txn, signers: [walletAddress] }];
      const signedTxn = await peraWallet.signTransaction([singleTxnGroup]);

      // Send the signed transaction
      const { txId } = await algodClient.sendRawTransaction(signedTxn).do();

      // Wait for transaction confirmation
      await algosdk.waitForConfirmation(algodClient, txId, 4);

      // Call the backend API to update the user's verification status
      const response = await axios.post(
        `${BASE_VERIFY_URL}/verify`,
        {
          userId,
          email: localStorage.getItem("userEmail"),
          walletAddress,
          txId,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.status === 200) {
        setTransactionStatus("Verification successful!");
        setIsVerified(true);
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        setTransactionStatus("Verification failed. Please try again.");
      }
    } catch (error) {
      console.error("Verification transaction failed:", error);
      setTransactionStatus("Verification failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Setup Wallet & Verify</h1>
      {step === 1 && (
        <>
          <h2 className={styles.subheading}>Step 1: Setup Wallet</h2>
          <p className={styles.description}>
            Connect your wallet to associate it with your account.
          </p>
          <PeraWalletButton
            onConnect={handleWalletConnect}
            onDisconnect={handleWalletDisconnect}
          />
          {walletAddress && (
            <p className={styles.walletInfo}>
              Connected Wallet: {walletAddress}
            </p>
          )}
          {error && <p className={styles.error}>{error}</p>}
        </>
      )}
      {step === 2 && (
        <>
          <h2 className={styles.subheading}>Step 2: Verify Account</h2>
          <p className={styles.description}>
            Pay a verification fee of <strong>6 ALGO</strong> to verify your
            account.
          </p>
          <PeraWalletButton
            onConnect={handleWalletConnect}
            onDisconnect={handleWalletDisconnect}
          />
          {walletAddress && (
            <p className={styles.walletInfo}>
              Connected Wallet: {walletAddress}
            </p>
          )}
          <button
            onClick={handleVerification}
            disabled={!walletAddress || isVerified || processing}
            className={`${styles.button} ${
              processing || isVerified ? styles.disabledButton : ""
            }`}
          >
            {isVerified
              ? "Already Verified"
              : processing
              ? "Processing..."
              : "Verify Now"}
          </button>
          {transactionStatus && (
            <p
              className={`${styles.transactionStatus} ${
                transactionStatus.includes("successful")
                  ? styles.success
                  : styles.error
              }`}
            >
              {transactionStatus}
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default SetupAndVerify;
