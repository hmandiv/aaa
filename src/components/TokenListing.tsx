import React from "react";
import styles from "../css_modules/TokenListingStyles.module.css";

export const TokenListing: React.FC = () => {
  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Token Listing Application ($50 USDC)</h1>
      <p className={styles.instructions}>
        To list your token on our platform, please send an email to{" "}
        <a
          href="mailto:algoadoptairdrop@gmail.com"
          className={styles.emailLink}
        >
          algoadoptairdrop@gmail.com
        </a>{" "}
        with the following information:
      </p>
      <ul className={styles.list}>
        <li>
          <strong>Token Name:</strong> Provide the name of your token for
          display on the platform.
        </li>
        <li>
          <strong>Vestige Link:</strong> Include the URL to your token's Vestige
          page.
        </li>
        <li>
          <strong>X (Twitter) Link:</strong> Add the link to your project's
          Twitter account.
        </li>
        <li>
          <strong>Token Logo:</strong> Attach a PNG image of your token's logo.
        </li>
        <li>
          <strong>Algorand Payment Transaction ID:</strong> Include the
          transaction ID for the <strong>$50 USDC</strong> payment sent to the
          wallet address:
          <div className={styles.walletAddress}>
            HE7225SD6ZKYO45QWYCE4BZ3ITFEK7WI7XGMAVAMB56FZREJVPMHNRSL2E
          </div>
        </li>
        <li>
          <strong>Payment Wallet Address:</strong> Provide the Algorand wallet
          address used to make the payment.
        </li>
      </ul>
      <p className={styles.note}>
        Once we receive your email, we will review the details and confirm your
        listing. Please ensure all information is accurate to avoid delays.
      </p>
    </div>
  );
};
