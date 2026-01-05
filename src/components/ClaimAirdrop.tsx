import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { algodClient } from "../algorand/config";
import algosdk from "algosdk";
import PeraWalletButton from "./PeraWalletButton";
import { PeraWalletContext } from "./PeraWalletContext";
import styles from "../css_modules/ClaimAirdropStyles.module.css";
import { allMembers } from "../constants/airdrops";

export const ClaimAirdrop = () => {
  const BASE_URL = "https://aaa-api-4lv4.onrender.com/api/v1/airdrop";
  const peraWallet = useContext(PeraWalletContext);

  const [airdrops, setAirdrops] = useState<
    Array<{
      id: string;
      tokenName: string;
      tokenId: string;
      shortDescription: string;
      amountOfTokenPerClaim: number;
      totalAmountOfTokens: number;
      totalAmountOfTokensClaimed: number;
      airdropType: string;
    }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [address, setAddress] = useState("");
  const [walletConnected, setWalletConnected] = useState(false);
  const [step, setStep] = useState(1); // 1: Select airdrop, 2: Opt-in, 3: Claim
  const [selectedAirdrop, setSelectedAirdrop] = useState<{
    tokenName: string;
    tokenId: string; // Added tokenId
    shortDescription: string;
    amountOfTokenPerClaim: number;
    totalAmountOfTokens: number;
    totalAmountOfTokensClaimed: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [optInProgress, setOptInProgress] = useState(false);
  const [optInComplete, setOptInComplete] = useState(false);

  useEffect(() => {
    const appWalletWallet: any = localStorage.getItem("appWallet");
    if (appWalletWallet) {
      setAddress(appWalletWallet);
      setWalletConnected(true);
    }
  }, []);

  useEffect(() => {
    const fetchAirdrops = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await axios.post(
          `${BASE_URL}/get-airdrops`,
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

        setAirdrops(
          response.data.filter(
            (airdrop: any) => airdrop.airdropType === allMembers
          )
        );
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to fetch airdrops");
      } finally {
        setLoading(false);
      }
    };

    fetchAirdrops();
  }, []);

  const handleWalletConnect = (connectedAddress: string) => {
    setAddress(connectedAddress);
    setWalletConnected(true);
  };

  const handleWalletDisconnect = () => {
    setAddress("");
    setWalletConnected(false);
  };

  const handleOptIn = async () => {
    if (!selectedAirdrop || !address || !peraWallet) {
      setError("Please select an airdrop and connect your wallet");
      return;
    }

    try {
      setOptInProgress(true);
      setError(null);

      // Check if already opted in
      const accountInfo = await algodClient.accountInformation(address).do();
      const optedInAssets = accountInfo["assets"] || [];
      const alreadyOptedIn = optedInAssets.some(
        (asset: any) => asset["asset-id"] === Number(selectedAirdrop.tokenId)
      );

      if (alreadyOptedIn) {
        setSuccess("You're already opted in to this asset!");
        setOptInComplete(true);
        setStep(3); // Move to claim step
        setOptInProgress(false);
        return;
      }

      // Create opt-in transaction
      const suggestedParams = await algodClient.getTransactionParams().do();
      const optInTxn =
        algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
          from: address,
          to: address,
          assetIndex: Number(selectedAirdrop.tokenId),
          amount: 0, // Opt-in transaction has 0 amount
          note: new Uint8Array(Buffer.from("AAA APP: Airdrop Opt-In")),
          suggestedParams,
        });

      const singleTxnGroup = [{ txn: optInTxn, signers: [address] }];
      const signedTxn = await peraWallet.signTransaction([singleTxnGroup]);
      const { txId } = await algodClient.sendRawTransaction(signedTxn).do();

      // Wait for confirmation
      await algosdk.waitForConfirmation(algodClient, txId, 4);

      setSuccess("Successfully opted in to the asset!");
      setOptInComplete(true);
      setStep(3); // Move to claim step
    } catch (err: any) {
      console.error("Opt-in failed:", err);
      setError("Failed to opt in to the asset. Please try again.");
    } finally {
      setOptInProgress(false);
    }
  };

  const handleClaim = async () => {
    if (!selectedAirdrop || !address) {
      setError("Please select an airdrop and provide a valid address");
      return;
    }

    setClaiming(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.post(
        `${BASE_URL}/update-claimed-address`,
        {
          userId: localStorage.getItem("userId"),
          email: localStorage.getItem("userEmail"),
          tokenName: selectedAirdrop.tokenName,
          address,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.status === 200) {
        setSuccess("Airdrop claimed successfully!");
        setSelectedAirdrop(null);
        setStep(1); // Reset to step 1
        setOptInComplete(false);
        setTimeout(() => {
          setSuccess(null);
          window.location.reload();
        }, 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to claim airdrop");
    } finally {
      setClaiming(false);
    }
  };

  const handleAirdropSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = airdrops.find(
      (airdrop) => airdrop.tokenName === e.target.value
    );
    setSelectedAirdrop(
      selected
        ? {
            tokenName: selected.tokenName,
            tokenId: selected.tokenId,
            shortDescription: selected.shortDescription,
            amountOfTokenPerClaim: selected.amountOfTokenPerClaim,
            totalAmountOfTokens: selected.totalAmountOfTokens,
            totalAmountOfTokensClaimed: selected.totalAmountOfTokensClaimed,
          }
        : null
    );
    setOptInComplete(false);
    if (selected) {
      setStep(2); // Move to opt-in step after selection
    }
  };

  const renderStepIndicator = () => (
    <div className={styles.stepIndicator}>
      <div className={`${styles.step} ${step >= 1 ? styles.active : ""}`}>
        1. Select
      </div>
      <div className={`${styles.step} ${step >= 2 ? styles.active : ""}`}>
        2. Opt-In
      </div>
      <div className={`${styles.step} ${step >= 3 ? styles.active : ""}`}>
        3. Claim
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Claim Airdrop</h1>
      {renderStepIndicator()}

      {loading ? (
        <p className={styles.loading}>Loading available airdrops...</p>
      ) : (
        <>
          {/* Wallet Connection */}
          <div className={styles.walletSection}>
            <h3>Connect Wallet</h3>
            <PeraWalletButton
              onConnect={handleWalletConnect}
              onDisconnect={handleWalletDisconnect}
            />
            {address && (
              <p className={styles.walletAddress}>
                Connected: {address.slice(0, 6)}...{address.slice(-4)}
              </p>
            )}
          </div>

          {/* Step 1: Select Airdrop */}
          <div className={styles.form}>
            <label className={styles.label}>
              <p>Select an Airdrop:</p>
              <select
                className={styles.select}
                value={selectedAirdrop?.tokenName || ""}
                onChange={handleAirdropSelect}
                disabled={step > 1}
              >
                <option value="" disabled>
                  Choose an airdrop
                </option>
                {airdrops.map((airdrop) => (
                  <option key={airdrop.id} value={airdrop.tokenName}>
                    {`${airdrop.tokenName}`.toUpperCase()} (Asset ID:{" "}
                    {airdrop.tokenId})
                  </option>
                ))}
              </select>
            </label>

            {selectedAirdrop && (
              <div className={styles.airdropDetails}>
                <div className={styles.description}>
                  <h3>Description:</h3>
                  <p>{selectedAirdrop.shortDescription}</p>
                </div>
                <div className={styles.tokenDetails}>
                  <p>
                    <strong>Token ID:</strong> {selectedAirdrop.tokenId}
                  </p>
                  <p>
                    <strong>Amount per claim:</strong>{" "}
                    {selectedAirdrop.amountOfTokenPerClaim}
                  </p>
                </div>
              </div>
            )}
          </div>

          {error && <p className={styles.error}>{error}</p>}
          {success && <p className={styles.success}>{success}</p>}

          {/* Step 2: Opt-In */}
          {step === 2 && selectedAirdrop && (
            <div className={styles.optInSection}>
              <h3>Step 2: Opt-In to Token</h3>
              <p>
                Before claiming, you need to opt-in to the token
                <strong> (ASA ID: {selectedAirdrop.tokenId})</strong>
              </p>
              <button
                className={styles.button}
                onClick={handleOptIn}
                disabled={optInProgress || !walletConnected}
              >
                {optInProgress ? "Processing..." : "Opt-In to Token"}
              </button>
            </div>
          )}

          {/* Step 3: Claim */}
          {step === 3 && selectedAirdrop && (
            <div className={styles.claimSection}>
              <h3>Step 3: Claim Airdrop</h3>
              <button
                className={styles.button}
                onClick={handleClaim}
                disabled={claiming || !walletConnected}
              >
                {claiming ? "Claiming..." : "Claim Airdrop"}
              </button>
            </div>
          )}

          {!walletConnected && (
            <p className={styles.warning}>
              <strong>Please connect wallet to claim the airdrop</strong>
            </p>
          )}
        </>
      )}
    </div>
  );
};
