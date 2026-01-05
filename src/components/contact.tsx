import React from "react";
import styles from "../css_modules/ContactStyles.module.css";

export const Contact: React.FC = () => (
  <div className={styles.container}>
    <h1 className={styles.heading}>Contact Us</h1>
    <p className={styles.description}>
      We'd love to hear from you! Reach out to us with any questions or
      feedback.
    </p>
    <strong className={styles.email}>Email us at: algoadoptairdrop@gmail.com</strong>
  </div>
);
