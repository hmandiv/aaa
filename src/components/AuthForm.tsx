import React, { useEffect, useRef, useState } from "react";
import styles from "../css_modules/AuthFormStyles.module.css";
import { useParams } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";
import { siteKey } from "../constants/tokenData";

interface AuthFormProps {
  onSignUp: () => void;
  onLogInWithEmail: () => void;
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  setReferralCode: (code: string) => void;
  initialReferralCode?: string;
}

const AuthForm: React.FC<AuthFormProps> = ({
  onSignUp,
  onLogInWithEmail,
  setEmail,
  setPassword,
  setReferralCode,
  initialReferralCode = "",
}) => {
  const recaptcha = useRef<ReCAPTCHA | null>(null);
  const { referralCode: referralCodeParam } = useParams<{
    referralCode?: string;
  }>();
  const [useWalletLogin, setUseWalletLogin] = useState(true);
  const [referralCode, setLocalReferralCode] = useState(
    initialReferralCode || referralCodeParam || ""
  );
  const [password, setLocalPassword] = useState(""); // Local password state
  const [confirmPassword, setConfirmPassword] = useState(""); // Confirm Password
  const [passwordStrength, setPasswordStrength] = useState(""); // Password Strength Feedback
  const [passwordError, setPasswordError] = useState(""); // Confirm Password Error
  const [email, setLocalEmail] = useState(""); // Local email state

  // Update the referral code state from the route parameter
  useEffect(() => {
    if (referralCodeParam) {
      setLocalReferralCode(referralCodeParam);
      setReferralCode(referralCodeParam); // Update parent state
    }
  }, [referralCodeParam, setReferralCode]);

  const handleReferralCodeChange = (code: string) => {
    const captchaValue = recaptcha.current
      ? recaptcha.current.getValue()
      : null;
    if (!captchaValue) {
      alert("Please verify the reCAPTCHA!");
    } else {
      setLocalReferralCode(code);
      setReferralCode(code); // Update parent state
    }
  };

  const handleEmailChange = (emailInput: string) => {
    const captchaValue = recaptcha.current
      ? recaptcha.current.getValue()
      : null;
    if (!captchaValue) {
      alert("Please verify the reCAPTCHA!");
    } else {
      setLocalEmail(emailInput);
      setEmail(emailInput); // Update parent state
    }
  };

  // Check Password Strength
  const handlePasswordChange = (password: string) => {
    const captchaValue = recaptcha.current
      ? recaptcha.current.getValue()
      : null;
    if (!captchaValue) {
      alert("Please verify the reCAPTCHA!");
    } else {
      setLocalPassword(password);

      // Password strength logic
      if (password.length < 8) {
        setPasswordStrength("Password must be at least 8 characters long.");
      } else if (!/[A-Z]/.test(password)) {
        setPasswordStrength(
          "Password must include at least one uppercase letter."
        );
      } else if (!/[0-9]/.test(password)) {
        setPasswordStrength("Password must include at least one number.");
      } else if (!/[!@#$%^&*]/.test(password)) {
        setPasswordStrength(
          "Password must include at least one special character."
        );
      } else {
        setPasswordStrength("Strong password!");
      }
    }
  };

  // Validate Confirm Password
  const handleConfirmPasswordChange = (confirmPasswordInput: string) => {
    const captchaValue = recaptcha.current
      ? recaptcha.current.getValue()
      : null;
    if (!captchaValue) {
      alert("Please verify the reCAPTCHA!");
    } else {
      setConfirmPassword(confirmPasswordInput);
      setPassword(password); // Ensure the parent state gets the final password
      if (confirmPasswordInput !== password) {
        setPasswordError("Passwords do not match.");
      } else {
        setPasswordError("");
      }
    }
  };

  // Check if all fields are valid
  const isSignUpDisabled = !(
    email &&
    password &&
    confirmPassword &&
    passwordStrength === "Strong password!" &&
    passwordError === ""
  );

  return (
    <div className={styles.authFormContainer}>
      {/* Sign Up Card */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Sign Up</h2>
        <div className={styles.authFormInputs}>
          <div className={styles.recaptchaWrapper}>
            <ReCAPTCHA ref={recaptcha} sitekey={siteKey} />
          </div>
          <div className={styles.inputGroup}>
            <span className={styles.inputIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
            </span>
            <input
              className={styles.authInput}
              placeholder="Email..."
              type="email"
              onChange={(e) => handleEmailChange(e.target.value)}
            />
          </div>
          <div className={styles.inputGroup}>
            <span className={styles.inputIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0110 0v4"></path>
              </svg>
            </span>
            <input
              className={styles.authInput}
              placeholder="Password..."
              type="password"
              onChange={(e) => handlePasswordChange(e.target.value)}
            />
          </div>
          <div className={styles.inputGroup}>
            <span className={styles.inputIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0110 0v4"></path>
              </svg>
            </span>
            <input
              className={styles.authInput}
              placeholder="Confirm Password..."
              type="password"
              onChange={(e) => handleConfirmPasswordChange(e.target.value)}
            />
          </div>
          <div className={styles.inputGroup}>
            <span className={styles.inputIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"></path>
                <circle cx="8.5" cy="7" r="4"></circle>
                <line x1="20" y1="8" x2="20" y2="14"></line>
                <line x1="23" y1="11" x2="17" y2="11"></line>
              </svg>
            </span>
            <input
              className={styles.authInput}
              placeholder="Referral Code..."
              value={referralCode}
              type="text"
              onChange={(e) => handleReferralCodeChange(e.target.value)}
            />
          </div>
          <p className={styles.passwordFeedback}>{passwordStrength}</p>
          <p className={styles.errorFeedback}>{passwordError}</p>
        </div>
        <button
          className={styles.authButton}
          onClick={onSignUp}
          disabled={isSignUpDisabled}
        >
          Sign Up
        </button>
        <br />
      </div>

      {/* Login Card */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Log In</h2>
        <div className={styles.toggleContainer}>
          {useWalletLogin ? (
            <button
              className={`${styles.toggleButton} ${
                !useWalletLogin ? styles.active : ""
              }`}
              onClick={() => setUseWalletLogin(false)}
            >
              Click here to login With Email
            </button>
          ) : (
            <></>
          )}
        </div>
        {!useWalletLogin ? (
          <div className={styles.authFormInputs}>
            <div className={styles.inputGroup}>
              <span className={styles.inputIcon}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
              </span>
              <input
                className={styles.authInput}
                placeholder="Email..."
                type="email"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className={styles.inputGroup}>
              <span className={styles.inputIcon}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0110 0v4"></path>
                </svg>
              </span>
              <input
                className={styles.authInput}
                placeholder="Password..."
                type="password"
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button className={styles.authButton} onClick={onLogInWithEmail}>
              Log In with Email
            </button>
          </div>
        ) : (
          <div className={styles.walletLogin}>
            <p className={styles.walletMessage}>
              Connect your wallet to log in.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthForm;