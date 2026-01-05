import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { algoIndexerClient } from "../algorand/config";
import styles from "../css_modules/DonateAAAStyles.module.css";

export const DonateAAA = () => {
  const [aaaBalance, setAaaBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [donationAmount, setDonationAmount] = useState<number | null>(null);
  const [assetId, setAssetId] = useState<number | null>(null);
  const aaaPaymentAddress =
    "HE7225SD6ZKYO45QWYCE4BZ3ITFEK7WI7XGMAVAMB56FZREJVPMHNRSL2E";

  const basePeraWalletUrl = "perawallet://";

  const generatePaymentUrl = (): string | null => {
    if (!donationAmount || donationAmount <= 0) return null;

    // Adjust for ALGO (6 decimals) or AAA (10 decimals)
    const amountInMicro = donationAmount * (assetId ? 1e10 : 1e6);
    if (assetId) {
      return `${basePeraWalletUrl}${aaaPaymentAddress}?amount=${amountInMicro}&asset=${assetId}`;
    } else {
      return `${basePeraWalletUrl}${aaaPaymentAddress}?amount=${amountInMicro}`;
    }
  };

  useEffect(() => {
    const fetchAaaBalance = async () => {
      try {
        const accountInfo = await algoIndexerClient
          .lookupAccountByID(aaaPaymentAddress)
          .do();

        const aaaAsset = accountInfo.account.assets.find(
          (asset: any) => asset["asset-id"] === 2004387843 // Replace with your AAA token asset ID
        );

        setAaaBalance(aaaAsset ? aaaAsset.amount / 1e10 : 0); // Divide by 1e10 for AAA (10 decimals)
      } catch (error) {
        console.error("Error fetching AAA balance:", error);
        setAaaBalance(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAaaBalance();
  }, []);

  const paymentUrl = generatePaymentUrl();

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Support AAA Tokens</h1>
      <p className={styles.description}>
        Your contributions help maintain and grow the AAA platform. You can
        donate ALGO or AAA tokens using your Pera Wallet. Simply enter the
        desired amount below, and scan the generated QR code to complete your
        donation.
      </p>

      <div className={styles.balanceSection}>
        <h2 className={styles.subtitle}>Remaining AAA Tokens</h2>
        {loading ? (
          <p className={styles.loading}>Loading...</p>
        ) : aaaBalance !== null ? (
          <p className={styles.balance}>{aaaBalance.toLocaleString()} AAA</p>
        ) : (
          <p className={styles.error}>
            Error fetching balance. Please try again later.
          </p>
        )}
      </div>

      <div className={styles.donationSection}>
        <h2 className={styles.subtitle}>Donate to AAA</h2>
        <div className={styles.addressContainer}>
          <h3 className={styles.addressLabel}>Donation Address:</h3>
          <p className={styles.address}>{aaaPaymentAddress}</p>
        </div>
        <div className={styles.inputContainer}>
          <label className={styles.label}>
            Enter Donation Amount ({assetId ? "AAA" : "ALGO"}):
          </label>
          <input
            type="number"
            min="0"
            step="0.000001"
            value={donationAmount || ""}
            onChange={(e) => setDonationAmount(Number(e.target.value))}
            className={styles.input}
          />
          <p className={styles.helperText}>
            Enter the amount you wish to donate. Ensure it is greater than 0.
          </p>
        </div>
        <button
          className={styles.toggleButton}
          onClick={() => setAssetId(assetId ? null : 2004387843)}
        >
          Switch to {assetId ? "ALGO" : "AAA"} Donation
        </button>
      </div>

      <div className={styles.qrSection}>
        {paymentUrl ? (
          <>
            <h3 className={styles.subtitle}>Scan to Donate</h3>
            <QRCodeSVG value={paymentUrl} size={200} />
            <p className={styles.qrHelperText}>
              Open your Pera Wallet app and scan this QR code to send your
              donation. Thank you for your generosity!
            </p>
          </>
        ) : (
          <p className={styles.error}>
            Enter a valid amount to generate a QR code for your donation.
          </p>
        )}
      </div>

      <footer className={styles.footer}>
        <p>
          Thank you for supporting the AAA community! Your contributions make a
          meaningful difference.
        </p>
      </footer>
    </div>
  );
};

export default DonateAAA;
