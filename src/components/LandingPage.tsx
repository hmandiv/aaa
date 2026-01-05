import React from "react";
import { Link } from "react-router-dom";
import styles from "../css_modules/LandingPageStyles.module.css";

const LandingPage = () => {
  return (
    <div className={styles.landingPage}>
      <h1>Welcome to The AAA App</h1>
      <p>
        The ultimate platform for seamless authentication and wallet integration.
      </p>
      <Link to="/dashboard" className={styles.ctaButton}>
        Get Started
      </Link>
    </div>
  );
};

export default LandingPage;
