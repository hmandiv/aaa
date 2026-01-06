import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import AuthWrapper from "./components/AuthWrapper";
import Navbar from "./components/Navbar";
import { PeraWalletProvider } from "./components/PeraWalletProvider";
import { TermsOfServices } from "./components/TermsOfServices";
import { PrivacyPolicy } from "./components/PrivacyPolicy";
import { TokenListing } from "./components/TokenListing";
import { AboutUs } from "./components/Aboutus";
import { AAASwap } from "./components/AAASwap";
import BestAlgoDefi from "./components/BestAlgoDefi";
import { Contact } from "./components/contact";
import TokenDetailsPage from "./components/TokenDetailsPage";
import TokenBubbles from "./components/TokenBubbles";

const App = () => {
  return (
    <div>
      <Router>
        <PeraWalletProvider>
          <Navbar />
          <Routes>
            {/* <Route path="/" element={<LandingPage />} /> */}
            <Route path="/" element={<AuthWrapper />} />
            <Route path="/referral/:referralCode" element={<AuthWrapper />} />
            <Route path="/terms-of-services" element={<TermsOfServices />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/aboutus" element={<AboutUs />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="token-listing" element={<TokenListing />} />
            <Route path="swap-tokens" element={<AAASwap />} />
            {/* <Route path="current-airdrops" element={<DisplayCurrentAirdrops />} /> */}
            <Route path="best-algo-defi" element={<BestAlgoDefi />} />
            {/* <Route path="best-algo-defi" element={<PublicBestAlgoDefi />} /> */}
            <Route path="/token-details" element={<TokenDetailsPage />} />
            <Route path="/algo-bubbles" element={<TokenBubbles />} />
          </Routes>
        </PeraWalletProvider>
      </Router>
      <Analytics />
    </div>
  );
};

export default App;
