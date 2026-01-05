import React, { useState, useEffect } from "react";
import styles from "../css_modules/GainFTIntegrationStyles.module.css";
import { FaSpinner } from "react-icons/fa";

const GainFTIntegration: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  // Function to handle when the iframe loads
  const handleLoad = () => {
    setIsLoading(false);
  };

  return (
    <div className={styles.container}>
      {isLoading && (
        <div className={styles.loadingContainer}>
          <FaSpinner className={styles.loadingIcon} />
          <span className={styles.loadingText}>Loading GainFT...</span>
        </div>
      )}

      <iframe
        src="https://app.gainify.xyz/"
        title="GainFT Marketplace"
        className={styles.iframe}
        onLoad={handleLoad}
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
      />
    </div>
  );
};

export default GainFTIntegration;
