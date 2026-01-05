import React, { useState, useEffect, useContext } from "react";
import { algodClient } from "../algorand/config";
import { PeraWalletContext } from "./PeraWalletContext";
import algosdk from "algosdk";
import PeraWalletButton from "./PeraWalletButton";
import axios from "axios";
import styles from "../css_modules/VerificationPageStyles.module.css";

interface VerificationPageProps {
  userId: string | null;
}

const VerificationPage = ({ userId }: VerificationPageProps) => {
  const peraWallet = useContext(PeraWalletContext);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [transactionStatus, setTransactionStatus] = useState<string | null>(
    null
  );
  const [isVerified, setIsVerified] = useState(false);
  const [processing, setProcessing] = useState(false);
  const verificationAddress =
    "HE7225SD6ZKYO45QWYCE4BZ3ITFEK7WI7XGMAVAMB56FZREJVPMHNRSL2E";
  const BASE_URL = "https://aaa-api-4lv4.onrender.com/api/v1/verify";

  useEffect(() => {
    if (userId) {
      fetchVerificationStatus();
    }
  }, [userId]);

  const fetchVerificationStatus = async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/verification-status/${userId}`
      );
      setIsVerified(response.data.verified);
    } catch (error) {
      console.error("Error fetching verification status:", error);
    }
  };

  const handleWalletConnect = (address: string) => {
    setWalletAddress(address);
    console.log("Wallet connected:", address);
  };

  const handleWalletDisconnect = () => {
    setWalletAddress(null);
    console.log("Wallet disconnected.");
  };

  const handleVerification = async () => {
    if (!walletAddress || !userId) {
      alert("Please connect your wallet and ensure you are logged in.");
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
        amount: 500000, // 0.5 ALGO in microAlgos
        note: new Uint8Array(Buffer.from("AAA app: Verification Fee")),
        suggestedParams,
      });

      // Sign the transaction using PeraWallet
      if (!peraWallet) {
        throw new Error("PeraWallet is not available.");
      }
      const singleTxnGroup = [{ txn, signers: [walletAddress] }];
      const signedTxn = await peraWallet.signTransaction([singleTxnGroup]);

      // Send the signed transaction
      const { txId } = await algodClient.sendRawTransaction(signedTxn).do();

      // Wait for transaction confirmation
      await algosdk.waitForConfirmation(algodClient, txId, 4);

      // Call the backend API to update the user's verification status
      const response = await axios.post(
        `${BASE_URL}/verify`,
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
        }, 1500);
      } else {
        setTransactionStatus("Verification failed. Please try again.");
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    } catch (error) {
      console.error("Transaction failed:", error);
      setTransactionStatus("Transaction failed. Please try again.");
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Verify Your Account</h1>
      <strong style={{ color: "red" }}>
        Please go to Setup Wallet under Wallet section to setup your wallet
        first before verifying
      </strong>
      .
      <p className={styles.description}>
        To verify your account, please pay a verification fee of{" "}
        <strong>0.5 ALGO with your registered wallet address</strong>.
      </p>
      <PeraWalletButton
        onConnect={handleWalletConnect}
        onDisconnect={handleWalletDisconnect}
      />
      {walletAddress && (
        <p className={styles.walletInfo}>Connected Wallet: {walletAddress}</p>
      )}
      <button
        onClick={handleVerification}
        disabled={!walletAddress || isVerified || processing}
        className={`${styles.verifyButton} ${
          processing || isVerified ? styles.disabledButton : ""
        }`}
      >
        {isVerified
          ? "Already Verified"
          : processing
          ? "Processing..."
          : "Verify Now"}
      </button>
      <strong className={styles.walletInfo}>
        (Please ensure you are not already verified by checking your dashboard
        to prevent loss of funds)
      </strong>
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
    </div>
  );
};

export default VerificationPage;
