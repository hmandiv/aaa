import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import DashboardContent from "./DashboardContent";
import styles from "../css_modules/EnhancedDashboardStyles.module.css";
import BestAlgoDefi from "./BestAlgoDefi";
import { StakingAndFarms } from "./StakingAndFarms";
import BuySellAAA from "./BuySellAAA";
import { AAATeam } from "./AAATeam";
import { DonateAAA } from "./DonateAAA";
import { MyWallet } from "./MyWallet";
import { MyTeam } from "./MyTeam";
import axios from "axios";
import { AAASwap } from "./AAASwap";
import { CreateAirdrop } from "./CreateAirdrop";
import { ClaimAirdrop } from "./ClaimAirdrop";
import SetupAndVerify from "./SetupAndVerify";
import { ClaimAirdropDiamondHands } from "./ClaimAirdropDiamondHands";
import { ClaimAirdropWealthBuilders } from "./ClaimAirdropWealthBuilders";
import VotingAndReviews from "./VotingAndReviews";
import ContestNotification from "./ContestNotification";
import { CONTESTS } from "../constants/contests";
import OnboardingGuide from "./OnBoarding";
import WelcomeScreen from "./WelcomeScreen";

interface EnhancedDashboardProps {
  userName: string;
  userImage: string;
  aaaBalance: number;
  referrals: number;
  verified: boolean;
  referralLink: string;
  userId: string | null;
  onLogout: () => void;
}

const EnhancedDashboard: React.FC<EnhancedDashboardProps> = ({
  userName,
  userImage,
  aaaBalance,
  referrals,
  verified,
  referralLink,
  userId,
  onLogout,
}) => {
  const [activeComponent, setActiveComponent] =
    useState<string>("bestAlgoDefi");
  const [totalMembers, setTotalMembers] = useState<number>(0);
  const [totalVerifiedMembers, setTotalVerifiedMembers] = useState<number>(0);
  const [loadingTotalMembers, setLoadingTotalMembers] = useState<boolean>(true);
  const [loadingTotalVerifiedMembers, setLoadingTotalVerifiedMembers] =
    useState<boolean>(true);
  const [bypassWelcome, setBypassWelcome] = useState<boolean>(false);

  const apiClient = axios.create({
    baseURL: "https://aaa-api.onrender.com/api/v1/members",
    headers: { "Content-Type": "application/json" },
  });

  useEffect(() => {
    getTotalMembers();
    getTotalVerifiedMembers();
  }, []);

  const getTotalMembers = async () => {
    try {
      setLoadingTotalMembers(true);
      const response = await apiClient.post("/get-total-members");
      if (response.data && typeof response.data.totalMembers === "number") {
        setTotalMembers(response.data.totalMembers);
      } else {
        throw new Error("Invalid response format.");
      }
    } catch (error) {
      console.error("Failed to fetch total members:", error);
      setTotalMembers(0);
    } finally {
      setLoadingTotalMembers(false);
    }
  };

  const getTotalVerifiedMembers = async () => {
    try {
      setLoadingTotalVerifiedMembers(true);
      const response = await apiClient.post("/get-total-Verified-members");
      if (
        response.data &&
        typeof response.data.totalVerifiedMembers === "number"
      ) {
        setTotalVerifiedMembers(response.data.totalVerifiedMembers);
      } else {
        throw new Error("Invalid response format.");
      }
    } catch (error) {
      console.error("Failed to fetch total Verified members:", error);
      setTotalVerifiedMembers(0);
    } finally {
      setLoadingTotalVerifiedMembers(false);
    }
  };

  // Custom setActiveComponent handler to also bypass welcome screen if needed
  const handleSetActiveComponent = (component: string) => {
    setActiveComponent(component);

    // If user is selecting a specific component (like setup/verify), allow bypassing welcome screen
    if (
      component === "setupAndVerify" ||
      component === "buySellAAA" ||
      component === "votingForAAA" ||
      component === "stakingAndFarms" ||
      component === "aaaTeam" ||
      component === "myTeam" ||
      component === "bestAlgoDefi" ||
      component === "dashboard"
    ) {
      setBypassWelcome(true);
    }
  };

  // Map active component to corresponding JSX
  const renderActiveComponent = () => {
    // Show welcome screen for unverified users, unless they're trying to verify or bypass is active
    if (!verified && !bypassWelcome && activeComponent !== "setupAndVerify") {
      return (
        <WelcomeScreen
          userName={userName}
          setActiveComponent={handleSetActiveComponent}
        />
      );
    }

    // Otherwise show the selected component
    switch (activeComponent) {
      case "bestAlgoDefi":
        return <BestAlgoDefi />;
      case "stakingAndFarms":
        return <StakingAndFarms />;
      case "buySellAAA":
        return <BuySellAAA />;
      case "aaaTeam":
        return <AAATeam />;
      case "donateAAA":
        return <DonateAAA />;
      case "myWallet":
        return <MyWallet />;
      case "AAASwap":
        return <AAASwap />;
      case "myTeam":
        return <MyTeam userId={userId} />;
      case "createAirdrop":
        return <CreateAirdrop />;
      case "claimAirdrop":
        return <ClaimAirdrop />;
      case "setupAndVerify":
        return <SetupAndVerify userId={userId} />;
      case "diamondHands":
        return <ClaimAirdropDiamondHands />;
      case "wealthBuilders":
        return <ClaimAirdropWealthBuilders />;
      case "votingForAAA":
        return <VotingAndReviews />;
      case "onBoardingGuide":
        return (
          <WelcomeScreen
            userName={userName}
            setActiveComponent={handleSetActiveComponent}
          />
        );
      case "contestNotification":
        return <ContestNotification contests={CONTESTS} />;
      case "dashboard":
        return (
          <DashboardContent
            aaaBalance={aaaBalance}
            referrals={referrals}
            verified={verified}
            userName={userName}
            referralLink={referralLink}
            userId={userId}
          />
        );
      default:
        return (
          <DashboardContent
            aaaBalance={aaaBalance}
            referrals={referrals}
            verified={verified}
            userName={userName}
            referralLink={referralLink}
            userId={userId}
          />
        );
    }
  };

  return (
    <div className={styles.dashboardContainer}>
      {/* Left Sidebar */}
      <Sidebar
        verfied={verified}
        onLogout={onLogout}
        setActiveComponent={handleSetActiveComponent}
      />

      {/* Main Dashboard Content */}
      <main className={styles.dashboardContent}>
        <div className={styles.topbar}>
          <div className={styles.pageInfo}>
            <h1 className={styles.dashboardTitle}>Algo Adopt Airdrop</h1>
            {!loadingTotalVerifiedMembers && (
              <div className={styles.statsWrapper}>
                <div className={styles.statBadge}>
                  <span className={styles.statValue}>
                    {totalVerifiedMembers}
                  </span>
                  <span className={styles.statLabel}>Verified</span>
                </div>
                <div className={styles.statDivider}></div>
                <div className={styles.statBadge}>
                  <span className={styles.statValue}>{totalMembers}</span>
                  <span className={styles.statLabel}>Total Members</span>
                </div>
              </div>
            )}
          </div>

          <div className={styles.userInfoContainer}>
            <div className={styles.userInfo}>
              <div className={styles.userDetails}>
                <p className={styles.welcomeText}>Welcome back</p>
                <h3 className={styles.userName}>{userName}</h3>
              </div>
              <div className={styles.userImageWrapper}>
                {verified && <div className={styles.verifiedBadge}></div>}
                {/* <img src={userImage} className={styles.userImage} /> */}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.contentWrapper}>
          {/* Active component rendered here */}
          {renderActiveComponent()}
        </div>
      </main>
    </div>
  );
};

export default EnhancedDashboard;
