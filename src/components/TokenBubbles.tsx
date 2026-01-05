import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { 
  FaChartLine, 
  FaRegClock, 
  FaSearch, 
  FaFilter, 
  FaAngleDown, 
  FaAngleUp,
  FaCheckCircle,
  FaSyncAlt
} from "react-icons/fa";
import tokenData from "../constants/tokenData";
import styles from "../css_modules/TokenBubblesStyles.module.css";

const TokenBubbles = ({ initialTokens = tokenData, priceChangeIntervalProp = "1D" }) => {
  const [bubbleTokens, setBubbleTokens] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(initialTokens === null);
  const [priceChangeInterval, setPriceChangeInterval] = useState(priceChangeIntervalProp);
  const [error, setError] = useState<string | null>(null);
  const [allTokens, setAllTokens] = useState<any[]>([]);
  const [selectedTokenIds, setSelectedTokenIds] = useState<string[]>([]);
  const [showTokenSelector, setShowTokenSelector] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGainers, setFilterGainers] = useState<boolean | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // If initialTokens is provided, use it; otherwise, fetch the data
  useEffect(() => {
    setIsLoading(true);
    
    // Use initialTokens which is either initialTokens or tokenData
    if (initialTokens && initialTokens.length > 0) {
      console.log("Using provided tokens:", initialTokens);
      
      // If the tokens already have price data, use them directly
      if ("priceChange24H" in initialTokens[0] && initialTokens[0].priceChange24H !== undefined) {
        setIsLoading(false);
        processBubbleTokens(initialTokens);
      } else {
        // Otherwise fetch the price data for these tokens
        fetchPriceDataForTokens(initialTokens);
      }
    } else {
      console.log("No tokens available, fetching all data...");
      fetchTokenData();
    }
  }, [initialTokens]);

  // When priceChangeInterval changes, refetch price data
  useEffect(() => {
    if (initialTokens && initialTokens.length > 0) {
      fetchPriceDataForTokens(initialTokens);
    } else {
      fetchTokenData();
    }
  }, [priceChangeInterval]);

  // If priceChangeIntervalProp changes, update our local state
  useEffect(() => {
    setPriceChangeInterval(priceChangeIntervalProp);
  }, [priceChangeIntervalProp]);

  const processBubbleTokens = (tokens: any) => {
    // Add default price change values if missing
    const tokensWithDefaults = tokens.map((token: { priceChange24H: any; fullTVL: any; totalTVL: any; latestPrice: any; holders: any; }) => ({
      ...token,
      priceChange24H: token.priceChange24H || 0,
      fullTVL: token.fullTVL || token.totalTVL || 0,
      totalTVL: token.totalTVL || 0,
      latestPrice: token.latestPrice || 0,
      holders: token.holders || 0
    }));
    
    // Sort tokens by absolute price change (to show the most volatile ones more prominently)
    const sortedTokens = [...tokensWithDefaults].sort((a, b) => 
      Math.abs(b.priceChange24H) - Math.abs(a.priceChange24H)
    );
    
    console.log("Processed tokens:", sortedTokens);
    setAllTokens(sortedTokens);
    
    // If no tokens are selected yet, select the top ones (up to 25)
    if (selectedTokenIds.length === 0) {
      const initialSelected = sortedTokens.slice(0, 25).map(token => token.assetID);
      setSelectedTokenIds(initialSelected);
      setBubbleTokens(sortedTokens.filter(token => initialSelected.includes(token.assetID)));
    } else {
      // Filter by selected tokens
      setBubbleTokens(sortedTokens.filter(token => selectedTokenIds.includes(token.assetID)));
    }
  };

  // New function to fetch price data for existing tokens
  const fetchPriceDataForTokens = async (tokens: any[]) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch price data for each token
      const tokenPromises = tokens.map(async (token: { assetID: any; name: any; }) => {
        try {
          // Fetch price change data
          const priceChangeResponse = await fetch(
            `https://free-api.vestige.fi/asset/${token.assetID}/prices/simple/${priceChangeInterval}`
          );
          const priceChangeData = await priceChangeResponse.json();
          
          let priceChange = 0;
          if (priceChangeData && priceChangeData.length > 0) {
            const startPrice = priceChangeData[0]?.price || 0;
            const endPrice = priceChangeData[priceChangeData.length - 1]?.price || 0;
            priceChange = startPrice > 0 ? ((endPrice - startPrice) / startPrice) * 100 : 0;
          }
          
          // Only update price change data, keep other properties as is
          return {
            ...token,
            priceChange24H: priceChange
          };
        } catch (error) {
          console.error(`Error fetching price data for token ${token.name}:`, error);
          return {
            ...token,
            priceChange24H: 0
          };
        }
      });
      
      const processedTokens = await Promise.all(tokenPromises);
      processBubbleTokens(processedTokens);
    } catch (error) {
      console.error("Error fetching price data:", error);
      setError("Failed to load price data. Please try again later.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Function to fetch all token data when no initial tokens are provided
  const fetchTokenData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use the imported tokenData as the base data source if no API endpoint
      let baseTokens = tokenData;
      
      try {
        // Try to fetch from API if available
        const tokenDataResponse = await axios.get("/api/token-data");
        baseTokens = tokenDataResponse.data;
      } catch (apiError) {
        console.log("Using local token data fallback");
      }
      
      // Fetch TVL and price data for each token
      const tokenPromises = baseTokens.map(async (token) => {
        try {
          // Fetch TVL data
          const tvlResponse = await fetch(
            `https://free-api.vestige.fi/asset/${token.assetID}/tvl/simple/7D?currency=USD`
          );
          const tvlData = await tvlResponse.json();
          const fullTVL = parseFloat(tvlData[tvlData.length - 1]?.tvl || 0);
          
          // Fetch price data
          const priceResponse = await fetch(
            `https://free-api.vestige.fi/asset/${token.assetID}/price?currency=usd`
          );
          const priceData = await priceResponse.json();
          const latestPrice = parseFloat(priceData.price || 0);
          
          // Fetch price change data
          const priceChangeResponse = await fetch(
            `https://free-api.vestige.fi/asset/${token.assetID}/prices/simple/${priceChangeInterval}`
          );
          const priceChangeData = await priceChangeResponse.json();
          
          let priceChange = 0;
          if (priceChangeData && priceChangeData.length > 0) {
            const startPrice = priceChangeData[0]?.price || 0;
            const endPrice = priceChangeData[priceChangeData.length - 1]?.price || 0;
            priceChange = startPrice > 0 ? ((endPrice - startPrice) / startPrice) * 100 : 0;
          }
          
          // Fetch holders data
          const holdersResponse = await fetch(
            `https://free-api.vestige.fi/asset/${token.assetID}/holders?limit=10000000`
          );
          const holdersData = await holdersResponse.json();
          const holders = holdersData.length || 0;
          
          return {
            ...token,
            fullTVL,
            latestPrice,
            priceChange24H: priceChange,
            holders
          };
        } catch (error) {
          console.error(`Error fetching data for token ${token.name}:`, error);
          return {
            ...token,
            fullTVL: 0,
            latestPrice: 0,
            priceChange24H: 0,
            holders: 0
          };
        }
      });
      
      const processedTokens = await Promise.all(tokenPromises);
      processBubbleTokens(processedTokens);
    } catch (error) {
      console.error("Error fetching token data:", error);
      setError("Failed to load token data. Please try again later.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Function to determine bubble size based on price change percentage
  const getBubbleSize = (token: { priceChange24H?: number }) => {
    // Use absolute price change as a measure of size
    const baseSize = 80; // minimum size
    const priceChange = Math.abs(token.priceChange24H || 0);
    
    if (priceChange <= 1) return baseSize; // Very small change
    if (priceChange <= 5) return baseSize + 15; // Small change
    if (priceChange <= 10) return baseSize + 30; // Medium change
    if (priceChange <= 20) return baseSize + 45; // Large change
    return baseSize + 60; // Very large change (> 20%)
  };

  const handleIntervalChange = (e: { target: { value: React.SetStateAction<string>; }; }) => {
    setPriceChangeInterval(e.target.value);
  };
  
  // Handle token selection
  const handleTokenSelection = (assetID: string) => {
    setSelectedTokenIds(prev => {
      // If already selected, remove it
      if (prev.includes(assetID)) {
        return prev.filter(id => id !== assetID);
      }
      // If not selected and under limit, add it
      else if (prev.length < 25) {
        return [...prev, assetID];
      }
      // If at limit, don't add
      return prev;
    });
  };
  
  // Handle refresh button click
  const handleRefresh = () => {
    setIsRefreshing(true);
    if (initialTokens && initialTokens.length > 0) {
      fetchPriceDataForTokens(initialTokens);
    } else {
      fetchTokenData();
    }
  };
  
  // Update displayed tokens when selection changes
  useEffect(() => {
    if (allTokens.length > 0 && selectedTokenIds.length > 0) {
      setBubbleTokens(allTokens.filter(token => selectedTokenIds.includes(token.assetID)));
    } else if (allTokens.length > 0 && selectedTokenIds.length === 0) {
      // If no tokens selected, show none
      setBubbleTokens([]);
    }
  }, [selectedTokenIds]);

  // Generate keyframe animations for floating bubbles
  const generateBubbleKeyframes = (index: number) => {
    const randomAmplitude = Math.random() * 10 + 5; // 5-15px movement
    return `
      @keyframes float${index} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-${randomAmplitude}px); }
      }
    `;
  };
  
  // Filter tokens by search term and gains/losses
  const filteredTokens = allTokens.filter(token => {
    const matchesSearch = token.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          token.assetID.toString().includes(searchTerm);
    
    // Filter by gainers/losers if filter is active
    if (filterGainers === true) {
      return matchesSearch && token.priceChange24H > 0;
    } else if (filterGainers === false) {
      return matchesSearch && token.priceChange24H < 0;
    }
    
    return matchesSearch;
  });

  return (
    <div className={styles.premiumContainer}>
      {/* Left sidebar */}
      <div className={styles.premiumSidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.titleContainer}>
            <FaChartLine className={styles.titleIcon} />
            <h2 className={styles.sidebarTitle}>Token Price Changes</h2>
          </div>
          
          <div className={styles.refreshButton} onClick={handleRefresh}>
            <FaSyncAlt className={`${styles.refreshIcon} ${isRefreshing ? styles.spinning : ''}`} />
          </div>
        </div>
        
        <div className={styles.intervalSelector}>
          <div className={styles.selectorLabel}>
            <FaRegClock className={styles.selectorIcon} />
            <span>Time Interval</span>
          </div>
          <div className={styles.intervalOptions}>
            <button 
              className={`${styles.intervalButton} ${priceChangeInterval === "1H" ? styles.activeInterval : ""}`}
              onClick={() => setPriceChangeInterval("1H")}
            >
              1H
            </button>
            <button 
              className={`${styles.intervalButton} ${priceChangeInterval === "1D" ? styles.activeInterval : ""}`}
              onClick={() => setPriceChangeInterval("1D")}
            >
              1D
            </button>
            <button 
              className={`${styles.intervalButton} ${priceChangeInterval === "7D" ? styles.activeInterval : ""}`}
              onClick={() => setPriceChangeInterval("7D")}
            >
              7D
            </button>
          </div>
        </div>
        
        <div className={styles.selectorToggle} onClick={() => setShowTokenSelector(!showTokenSelector)}>
          <span>Select Tokens</span>
          {showTokenSelector ? <FaAngleUp /> : <FaAngleDown />}
        </div>
        
        {showTokenSelector && (
          <div className={styles.tokenSelector}>
            <div className={styles.tokenSelectorHeader}>
              <div className={styles.searchContainer}>
                <FaSearch className={styles.searchIcon} />
                <input 
                  type="text" 
                  placeholder="Search tokens..." 
                  className={styles.searchInput}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className={styles.filterButtons}>
                <button 
                  className={`${styles.filterButton} ${filterGainers === true ? styles.activeFilter : ""}`}
                  onClick={() => setFilterGainers(filterGainers === true ? null : true)}
                >
                  Gainers
                </button>
                <button 
                  className={`${styles.filterButton} ${filterGainers === false ? styles.activeFilter : ""}`}
                  onClick={() => setFilterGainers(filterGainers === false ? null : false)}
                >
                  Losers
                </button>
              </div>
              
              <div className={styles.selectionCount}>
                Selected: <span className={styles.countHighlight}>{selectedTokenIds.length}/25</span>
              </div>
            </div>
            
            <div className={styles.tokenList}>
              {filteredTokens.map((token) => (
                <div 
                  key={token.assetID}
                  className={`${styles.tokenListItem} ${selectedTokenIds.includes(token.assetID) ? styles.selectedToken : ""}`}
                  onClick={() => handleTokenSelection(token.assetID)}
                >
                  <div className={styles.tokenInfo}>
                    <img 
                      src={token.logo} 
                      alt={token.name}
                      className={styles.tokenLogo}
                    />
                    <span className={styles.tokenName}>{token.name}</span>
                  </div>
                  
                  <div className={styles.tokenChange}>
                    <span className={token.priceChange24H >= 0 ? styles.positiveChange : styles.negativeChange}>
                      {token.priceChange24H > 0 ? "+" : ""}{token.priceChange24H?.toFixed(2)}%
                    </span>
                    <div className={styles.checkboxWrapper}>
                      {selectedTokenIds.includes(token.assetID) && <FaCheckCircle className={styles.checkIcon} />}
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredTokens.length === 0 && (
                <div className={styles.noResults}>
                  No tokens found matching your search
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className={styles.legendContainer}>
          <div className={styles.legendTitle}>Legend</div>
          <div className={styles.legendItem}>
            <div className={styles.legendBubble} style={{ backgroundColor: 'rgba(0, 180, 0, 0.85)' }}></div>
            <span>Price Increase</span>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendBubble} style={{ backgroundColor: 'rgba(220, 0, 0, 0.85)' }}></div>
            <span>Price Decrease</span>
          </div>
          <div className={styles.legendInfo}>
            <em>Bubble size indicates volatility magnitude</em>
          </div>
        </div>
      </div>

      {/* Bubbles container */}
      <div className={styles.bubblesContainer}>
        {/* Keyframe styles */}
        <style>{
          bubbleTokens.map((token, index) => generateBubbleKeyframes(index)).join('\n')
        }</style>

        {isLoading ? (
          <div className={styles.loadingState}>
            <div className={styles.loadingSpinner}></div>
            <span className={styles.loadingText}>Loading token data...</span>
          </div>
        ) : error ? (
          <div className={styles.errorState}>
            <div className={styles.errorIcon}>!</div>
            <span className={styles.errorText}>{error}</span>
            <button className={styles.retryButton} onClick={handleRefresh}>
              Try Again
            </button>
          </div>
        ) : bubbleTokens.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <FaFilter size={32} />
            </div>
            <span className={styles.emptyText}>No tokens selected</span>
            <span className={styles.emptySubtext}>Select tokens from the sidebar to visualize</span>
          </div>
        ) : (
          bubbleTokens.map((token, index) => {
            const isPositive = token.priceChange24H > 0;
            const size = getBubbleSize(token);
            
            // Random position with some constraints to avoid too many overlaps
            const left = 10 + (index % 5) * 18 + Math.random() * 5;
            // Position bubbles higher in the container
            const top = 5 + Math.floor(index / 5) * 18 + Math.random() * 5;
            
            // Darker shade for bigger changes
            const intensity = Math.min(Math.abs(token.priceChange24H || 0) * 3, 100);
            // Make sure we have a default color if priceChange24H is undefined
            const color = (token.priceChange24H === undefined || token.priceChange24H === null) 
              ? "rgba(128, 128, 128, 0.85)" // Gray for undefined price changes
              : isPositive 
                ? `rgba(0, ${128 + intensity}, 0, 0.85)` // Green for positive
                : `rgba(${128 + intensity}, 0, 0, 0.85)`; // Red for negative
            
            return (
              <Link
                key={token.assetID}
                to={`/token-details?assetId=${token.assetID}&name=${token.name}&logo=${token.logo}&price=${token.latestPrice}&change=${token.priceChange24H}&holders=${token.holders}&totalTVL=${token.totalTVL || 0}&fullTVL=${token.fullTVL || 0}&stableTVL=${token.stableTVL || false}`}
                className={styles.bubbleLink}
              >
                <div 
                  className={styles.tokenBubble}
                  style={{
                    position: "absolute",
                    left: `${left}%`,
                    top: `${top}%`,
                    width: `${size}px`,
                    height: `${size}px`,
                    backgroundColor: color,
                    fontSize: size > 90 ? "14px" : size > 70 ? "12px" : "10px",
                    animation: `float${index} ${Math.random() * 2 + 3}s ease-in-out infinite`,
                    zIndex: Math.round(Math.abs(token.priceChange24H || 0)),
                  }}
                >
                  <img 
                    src={token.logo} 
                    alt={token.name}
                    className={styles.bubbleLogo}
                    style={{
                      width: `${size * 0.4}px`,
                      height: `${size * 0.4}px`,
                    }}
                  />
                  <div className={styles.bubbleName} style={{ 
                    fontSize: size > 90 ? "12px" : size > 70 ? "10px" : "8px",
                  }}>
                    {token.name}
                  </div>
                  <div className={styles.bubbleChange} style={{ 
                    fontSize: size > 90 ? "14px" : size > 70 ? "12px" : "10px",
                  }}>
                    {token.priceChange24H > 0 ? "+" : ""}{token.priceChange24H?.toFixed(2)}%
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TokenBubbles;