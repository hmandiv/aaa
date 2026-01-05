import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import AuthForm from "./AuthForm";
import EnhancedDashboard from "./EnhancedDashboard";
import PeraWalletButton from "./PeraWalletButton";
import { toast, Toaster } from "react-hot-toast";
import styles from "../css_modules/AuthWrapperStyles.module.css";
import { setBadgeStatus } from "../helpers/setBadgeStatus";

const AuthWrapper = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState("John Doe"); // Dynamically updated with email
  const [userImage, setUserImage] = useState("https://via.placeholder.com/150"); // Replace with user image URL from API
  const [userReferralCode, setUserReferralCode] = useState("");
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [isVerified, setIsVerified] = useState(false); // New state for email verification
  const [userReferrals, setUserReferrals] = useState<number>(0);
  const [aaaBalance, setAaaBalance] = useState(0);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false); // New loading state
  const referralLink = `${window.location.origin}/referral/${userReferralCode}`;
  const peraWalletRef = useRef<{ disconnectWallet: () => void } | null>(null);
  const [disconnecting, setDisconnecting] = useState(false); // New state to handle recursion

  const apiClient = axios.create({
    baseURL: "http://localhost:5000/api/v1",
    // baseURL: "https://aaa-api-4lv4.onrender.com/api/v1",
    headers: { "Content-Type": "application/json" },
  });

  // Intercept requests to include token in headers
  apiClient.interceptors.request.use((config) => {
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Load token from localStorage on initial render
  useEffect(() => {
    const fetchData = async () => {
      const savedToken = localStorage.getItem("token");
      const savedEmail = localStorage.getItem("userEmail");
      const savedUserId = localStorage.getItem("userId");
      if (savedToken) {
        setLoading(true); // Show "Processing..." feedback
        setToken(savedToken);
        setEmail(savedEmail || "");
      }
      const response = await axios.post(
        `http://localhost:5000/api/v1/userDetails/get-user-details`,
        // `https://aaa-api-4lv4.onrender.com/api/v1/userDetails/get-user-details`,
        {
          userId: savedUserId,
          email: savedEmail,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${savedToken}`,
          },
        }
      );

      const {
        referralCode,
        walletAddress: returnedWalletAddress,
        aaaBalance,
        referrals,
        verified, // Add email verification status from the backend
      } = response.data;

      const userName = savedEmail ? savedEmail.split("@")[0] : "Unknown"; // Extract username from email
      setUserName(userName); // Set the username to the email
      setUserLoggedIn(true);
      setIsVerified(verified);
      setUserId(savedUserId);
      setUserReferralCode(referralCode);
      setWalletAddress(returnedWalletAddress);
      setAaaBalance(aaaBalance);
      setUserReferrals(referrals.length);
      setToken(savedToken);

      setLoading(false); // Hide "Processing..." feedback
    };

    try {
      fetchData();
    } catch (error) {
      console.error("Error fetching user details:", error);
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        logout();
        toast.error("Session expired. Please log in again.");
      } else {
        toast.error("Error loading user data. Please try again.");
      }
      setLoading(false); // Hide "Processing..." feedback
    }
  }, []);

  const handleWalletConnect = async (connectedAddress: string | null) => {
    setWalletAddress(connectedAddress);
    if (connectedAddress) {
      // Automatically trigger login upon wallet connection
      try {
        await logInWithWallet(connectedAddress);
      } catch (error) {
        console.error("Auto-login with wallet failed:", error);
      }
    }
  };

  const handleWalletDisconnect = () => {
    if (!disconnecting) {
      logout(false); // Pass `false` to avoid triggering wallet disconnect again
    }
  };

  const signUp = async () => {
    if (!email || !password) {
      toast.error("Please fill in your email and password.");
      return;
    }

    setLoading(true); // Show "Processing..." feedback
    try {
      const safeReferralCode = referralCode || "";
      await apiClient.post("/signup/signup", {
        email,
        password,
        referralCode: safeReferralCode,
      });

      toast.success("Signup successful! Please login with your email account.");

      setTimeout(() => {
        window.location.href = window.location.origin;
      }, 4000);
    } catch (error) {
      console.error("Sign up failed:", error);
      toast.error("Signup failed. Please try again.");
    } finally {
      setLoading(false); // Hide "Processing..." feedback
    }
  };

  const logInWithEmail = async () => {
    if (!email || !password) {
      toast.error("Please fill in your email and password.");
      return;
    }

    setLoading(true); // Show "Processing..." feedback
    try {
      const response = await apiClient.post("/login/login", {
        email,
        password,
      });

      const {
        userId,
        referralCode,
        walletAddress: returnedWalletAddress,
        aaaBalance,
        referrals,
        token,
        verified, // Add email verification status from the backend
      } = response.data;
      const userName = email.split("@")[0]; // Extract username from email
      setUserName(userName); // Set the username to the email
      setUserLoggedIn(true);
      setIsVerified(verified); // Set email verification status
      setUserId(userId);
      setUserReferralCode(referralCode);
      setWalletAddress(returnedWalletAddress);
      setAaaBalance(aaaBalance);
      setUserReferrals(referrals.length);
      setToken(token);
      localStorage.setItem("token", token);
      localStorage.setItem("userId", userId);
      localStorage.setItem("userEmail", email);
      localStorage.setItem("appWallet", returnedWalletAddress);
      await setBadgeStatus(returnedWalletAddress);
    } catch (error) {
      console.error("Login with email failed:", error);
      const errorMessage =
        (error as any).response?.data?.message || "An error occurred";
      toast.error(`${errorMessage}`);
    } finally {
      setLoading(false); // Hide "Processing..." feedback
    }
  };

  const logInWithWallet = async (connectedWallet: string) => {
    setLoading(true); // Show "Processing..." feedback
    try {
      const response = await apiClient.post("/login/login", {
        walletAddress: connectedWallet,
      });

      const {
        userId,
        referralCode,
        walletAddress: returnedWalletAddress,
        aaaBalance,
        referrals,
        token,
        verified, // Add email verification status from the backend
        email,
      } = response.data;

      const userName = email.split("@")[0]; // Extract username from email
      setUserName(userName); // Set the username to the email
      setUserLoggedIn(true);
      setIsVerified(verified); // Set email verification status
      setUserId(userId);
      setUserReferralCode(referralCode);
      setWalletAddress(returnedWalletAddress);
      setAaaBalance(aaaBalance);
      setUserReferrals(referrals.length);
      setToken(token);
      localStorage.setItem("token", token);
      localStorage.setItem("userId", userId);
      localStorage.setItem("userEmail", email);
      localStorage.setItem("appWallet", returnedWalletAddress);
      await setBadgeStatus(returnedWalletAddress);
    } catch (error) {
      console.error("Wallet login failed:", error);
      throw new Error("Wallet login failed. Please try again.");
    } finally {
      setLoading(false); // Hide "Processing..." feedback
    }
  };

  const logout = (triggerWalletDisconnect = true) => {
    setDisconnecting(true); // Prevent recursive calls
    setUserLoggedIn(false);
    setIsVerified(false); // Reset email verification status
    setUserId(null);
    setUserReferralCode("");
    setUserReferrals(0);
    setWalletAddress(null);
    setAaaBalance(0);
    setToken(null);
    setEmail("");
    setPassword("");
    setReferralCode("");
    localStorage.removeItem("token");
    localStorage.removeItem("PeraWallet.Wallet");
    localStorage.removeItem("walletconnect");
    localStorage.removeItem("userId");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("appWallet");
    localStorage.removeItem("badgeRanking");

    if (triggerWalletDisconnect) {
      peraWalletRef.current?.disconnectWallet();
    }

    setTimeout(() => setDisconnecting(false), 100); // Reset disconnecting guard after a short delay
  };

  return (
    <div className={styles.authWrapper}>
      <Toaster toastOptions={{ duration: 4000 }} />
      {!userLoggedIn ? (
        <PeraWalletButton
          ref={peraWalletRef}
          onConnect={handleWalletConnect}
          onDisconnect={handleWalletDisconnect}
        />
      ) : null}
      {loading && (
        <p className={styles.loadingMessage}>Processing request...</p>
      )}
      {userLoggedIn ? (
        <EnhancedDashboard
          userName={userName}
          userImage={userImage}
          aaaBalance={aaaBalance}
          referrals={userReferrals}
          verified={isVerified}
          referralLink={referralLink}
          userId={userId}
          onLogout={logout}
        />
      ) : (
        <AuthForm
          onSignUp={signUp}
          onLogInWithEmail={logInWithEmail}
          setEmail={setEmail}
          setPassword={setPassword}
          setReferralCode={setReferralCode}
          initialReferralCode={referralCode}
        />
      )}
    </div>
  );
};

export default AuthWrapper;
