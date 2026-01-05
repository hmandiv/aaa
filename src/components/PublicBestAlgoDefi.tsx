import React, { useEffect, useState, useCallback } from "react";
import styles from "../css_modules/PublicBestAlgoDefiStyles.module.css";
import tokenData from "../constants/tokenData";
import {
  FaCogs,
  FaPlane,
  FaSort,
  FaSortDown,
  FaSortUp,
  FaTruckLoading,
  FaUikit,
  FaUserFriends,
} from "react-icons/fa";
import axios from "axios";
import { Link } from "react-router-dom";

// Define Token interface for proper type safety
interface TokenBase {
  name: string;
  assetID: string;
  logo: string;
  vestigeLink: string;
  xLink: string;
  stableTVL: boolean;
  useCaseToken?: boolean;
  memeToken?: boolean;
  wrappedAsset?: boolean;
}

interface TokenWithMetrics extends TokenBase {
  totalTVL: number;
  fullTVL?: number;
  holders?: number;
  latestPrice?: number;
  priceChange24H?: number;
}

// Interface for Airdrop
interface Airdrop {
  id: string;
  tokenName: string;
  tokenId: string;
  shortDescription: string;
  amountOfTokenPerClaim: number;
  totalAmountOfTokens: number;
  totalAmountOfTokensClaimed: number;
}

// Type definitions for API responses
interface TinymanPool {
  provider: string;
  asset_1_id: number;
  asset_2_id: number;
  address: string;
}

interface PactFiPool {
  assets: {
    id: string;
  }[];
  tvl_usd: string;
}

interface PactFiResponse {
  results: PactFiPool[];
}

interface TinymanPoolData {
  liquidity_in_usd: string;
}

interface PriceData {
  timestamp: number;
  price: number;
}

interface TVLData {
  tvl: string;
}

interface AssetPrice {
  price: string;
}

// Extract stableTVL asset IDs once
const stableTVLAssetIDs = tokenData
  .filter((token) => token.stableTVL)
  .map((token) => token.assetID);

// API constants
const BASE_URL = "https://aaa-api.onrender.com/api/v1/airdrop";
const PAGE_SIZE = 15;

// API endpoint configuration with proper typing
const API_ENDPOINTS = {
  ASSET_POOLS: (assetID: string): string =>
    `https://free-api.vestige.fi/asset/${assetID}/pools?include_all=true`,
  PACT_POOLS: (name: string): string =>
    `https://api.pact.fi/api/internal/pools?limit=50&offset=0&search=${name}`,
  TINYMAN_POOL: (address: string): string =>
    `https://mainnet.analytics.tinyman.org/api/v1/pools/${address}`,
  ASSET_PRICE: (assetID: string): string =>
    `https://free-api.vestige.fi/asset/${assetID}/price?currency=usd`,
  PRICE_CHANGE: (assetID: string, interval: string): string =>
    `https://free-api.vestige.fi/asset/${assetID}/prices/simple/${interval}`,
  FULL_TVL: (assetID: string): string =>
    `https://free-api.vestige.fi/asset/${assetID}/tvl/simple/7D?currency=USD`,
  HOLDERS: (assetID: string): string =>
    `https://free-api.vestige.fi/asset/${assetID}/holders?limit=10000000`,
  GET_AIRDROPS: `${BASE_URL}/get-airdrops`,
};

const PublicBestAlgoDefi: React.FC = () => {
  // State definitions with proper types
  const [sortedTokens, setSortedTokens] = useState<TokenWithMetrics[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [priceChangeInterval, setPriceChangeInterval] = useState<string>("1D");
  const [searchText, setSearchText] = useState<string>("");
  const [sortField, setSortField] = useState<string>("totalTVL");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [expandedToken, setExpandedToken] = useState<string | null>(null);
  const [airdrops, setAirdrops] = useState<Airdrop[]>([]);

  // Fetch airdrops data
  useEffect(() => {
    const fetchAirdrops = async (): Promise<void> => {
      try {
        const response = await axios.post(
          API_ENDPOINTS.GET_AIRDROPS,
          {
            userId: localStorage.getItem("userId"),
            email: localStorage.getItem("userEmail"),
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        setAirdrops(response.data);
      } catch (err: any) {
        console.log(err.response?.data?.message || "Failed to fetch airdrops");
      }
    };

    fetchAirdrops();
  }, []);

  // Fetch token data
  useEffect(() => {
    const fetchTokenData = async (): Promise<void> => {
      try {
        setIsLoading(true);

        // Step 1: Get pool and TVL data
        const { poolUSDValues, tokenTVL } = await fetchPoolsData();

        // Step 2: Fetch additional metrics in parallel
        const [{ latestPrices, priceChangesMap }, fullTVLMap, holdersMap] =
          await Promise.all([
            fetchPriceData(),
            fetchFullTVLData(),
            fetchHoldersData(),
          ]);

        // Step 3: Combine all data and sort
        const combinedData = combineTokenData(
          tokenTVL,
          latestPrices,
          priceChangesMap,
          fullTVLMap,
          holdersMap
        );
        setSortedTokens(combinedData);
      } catch (error) {
        console.error("Error fetching token data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTokenData();
  }, [priceChangeInterval]);

  // Fetch pools data (Tinyman and PactFi)
  const fetchPoolsData = async (): Promise<{
    poolUSDValues: Record<string, number>;
    tokenTVL: Record<string, number>;
  }> => {
    const poolAddresses: Record<string, string[]> = {};
    const poolUSDValues: Record<string, number> = {};
    const tokenTVL: Record<string, number> = {};
    const processedPairs = new Set<string>();
    const assetIDSet = new Set(tokenData.map((t) => t.assetID));

    // Fetch Tinyman and PactFi pools in parallel
    const [tinymanPoolResponses, pactFiPoolResponses] = await Promise.all([
      Promise.all(
        tokenData.map((token) =>
          fetch(API_ENDPOINTS.ASSET_POOLS(token.assetID))
            .then((res) => res.json())
            .catch(() => [])
        )
      ),
      Promise.all(
        tokenData.map((token) =>
          fetch(API_ENDPOINTS.PACT_POOLS(token.name))
            .then((res) => res.json())
            .catch(() => ({ results: [] }))
        )
      ),
    ]);

    // Process Tinyman pools
    tokenData.forEach((token, index) => {
      const pools = tinymanPoolResponses[index] || [];

      stableTVLAssetIDs.forEach((stableID) => {
        const pairKey = [token.assetID.toString(), stableID.toString()]
          .sort()
          .join("/");

        const relevantPools = pools.filter(
          (pool: TinymanPool) =>
            ["T3", "T2", "TM"].includes(pool.provider) &&
            ((pool.asset_1_id === parseInt(token.assetID) &&
              pool.asset_2_id === parseInt(stableID)) ||
              (pool.asset_2_id === parseInt(token.assetID) &&
                pool.asset_1_id === parseInt(stableID)))
        );

        if (relevantPools.length > 0) {
          poolAddresses[pairKey] = relevantPools.map(
            (pool: any) => pool.address
          );
        }
      });
    });

    // Process PactFi pools
    tokenData.forEach((token, index) => {
      const pools = pactFiPoolResponses[index]?.results || [];

      pools.forEach((pool: PactFiPool) => {
        const [asset1, asset2] = pool.assets;
        if (assetIDSet.has(asset1.id) && assetIDSet.has(asset2.id)) {
          const pairKey = [asset1.id.toString(), asset2.id.toString()]
            .sort()
            .join("/");

          if (!processedPairs.has(pairKey)) {
            processedPairs.add(pairKey);
            poolUSDValues[pairKey] =
              (poolUSDValues[pairKey] || 0) + parseFloat(pool.tvl_usd);
          }
        }
      });
    });

    // Fetch Tinyman USD values
    const usdValuePromises = Object.entries(poolAddresses).map(
      ([pairKey, addresses]) =>
        Promise.all(
          addresses.map((address) =>
            fetch(API_ENDPOINTS.TINYMAN_POOL(address))
              .then((res) => res.json())
              .then(
                (data: TinymanPoolData) =>
                  parseFloat(data.liquidity_in_usd) || 0
              )
              .catch(() => 0)
          )
        ).then((values) => {
          poolUSDValues[pairKey] =
            (poolUSDValues[pairKey] || 0) +
            values.reduce((sum, value) => sum + value, 0);
        })
    );

    await Promise.all(usdValuePromises);

    // Calculate total TVL for each token
    tokenData.forEach((token) => {
      const tokenPairs = Object.keys(poolUSDValues).filter((pairKey) => {
        const [id1, id2] = pairKey.split("/");
        return (
          id1 === token.assetID.toString() || id2 === token.assetID.toString()
        );
      });

      const totalTVL = tokenPairs.reduce(
        (sum, pairKey) => sum + (poolUSDValues[pairKey] || 0),
        0
      );

      tokenTVL[token.name] = totalTVL;
    });

    return { poolUSDValues, tokenTVL };
  };

  // Fetch price data
  const fetchPriceData = async (): Promise<{
    latestPrices: Record<string, number>;
    priceChangesMap: Record<string, number>;
  }> => {
    // Get latest prices
    const fetchLatestPrices = await Promise.all(
      tokenData.map((token) =>
        fetch(API_ENDPOINTS.ASSET_PRICE(token.assetID))
          .then((res) => res.json())
          .then((data: AssetPrice) => ({
            assetID: token.assetID,
            price: parseFloat(data.price || "0"),
          }))
          .catch(() => ({ assetID: token.assetID, price: 0 }))
      )
    );

    // Get price changes
    const fetchPriceChangePromises = tokenData.map((token) => {
      return fetch(
        API_ENDPOINTS.PRICE_CHANGE(token.assetID, priceChangeInterval)
      )
        .then((res) => res.json())
        .then((priceData: PriceData[]) => {
          if (!priceData || priceData.length === 0) {
            return { assetID: token.assetID, change: 0 };
          }

          // Calculate percentage change
          const startPrice = priceData[0]?.price || 0;
          const endPrice = priceData[priceData.length - 1]?.price || 0;
          const change =
            startPrice > 0 ? ((endPrice - startPrice) / startPrice) * 100 : 0;

          return { assetID: token.assetID, change };
        })
        .catch(() => ({ assetID: token.assetID, change: 0 }));
    });

    const priceChanges = await Promise.all(fetchPriceChangePromises);

    // Convert to maps for easier lookup
    const latestPrices = fetchLatestPrices.reduce(
      (acc: Record<string, number>, curr) => {
        acc[curr.assetID] = curr.price;
        return acc;
      },
      {}
    );

    const priceChangesMap = priceChanges.reduce(
      (acc: Record<string, number>, curr) => {
        acc[curr.assetID] = curr.change;
        return acc;
      },
      {}
    );

    return { latestPrices, priceChangesMap };
  };

  // Fetch full TVL data
  const fetchFullTVLData = async (): Promise<Record<string, number>> => {
    const fetchFullTVL = await Promise.all(
      tokenData.map((token) =>
        fetch(API_ENDPOINTS.FULL_TVL(token.assetID))
          .then((res) => res.json())
          .then((data: TVLData[]) => ({
            assetID: token.assetID,
            fullTVL: parseFloat(data[data.length - 1]?.tvl || "0"),
          }))
          .catch(() => ({ assetID: token.assetID, fullTVL: 0 }))
      )
    );

    return fetchFullTVL.reduce((acc: Record<string, number>, curr) => {
      acc[curr.assetID] = curr.fullTVL;
      return acc;
    }, {});
  };

  // Fetch holders data
  const fetchHoldersData = async (): Promise<Record<string, number>> => {
    const fetchHolders = await Promise.all(
      tokenData.map((token) =>
        fetch(API_ENDPOINTS.HOLDERS(token.assetID))
          .then((res) => res.json())
          .then((data: any[]) => ({
            assetID: token.assetID,
            holders: data.length || 0,
          }))
          .catch(() => ({ assetID: token.assetID, holders: 0 }))
      )
    );

    return fetchHolders.reduce((acc: Record<string, number>, curr) => {
      acc[curr.assetID] = curr.holders;
      return acc;
    }, {});
  };

  // Combine all token data
  const combineTokenData = (
    tokenTVL: Record<string, number>,
    latestPrices: Record<string, number>,
    priceChangesMap: Record<string, number>,
    fullTVLMap: Record<string, number>,
    holdersMap: Record<string, number>
  ): TokenWithMetrics[] => {
    return tokenData
      .map((token) => ({
        ...token,
        totalTVL: tokenTVL[token.name] || 0,
        fullTVL: fullTVLMap[token.assetID] || 0,
        holders: holdersMap[token.assetID] || 0,
        latestPrice: latestPrices[token.assetID] || 0,
        priceChange24H: priceChangesMap[token.assetID] || 0,
      }))
      .sort((a, b) => b.totalTVL - a.totalTVL);
  };

  // Sort handler with memoization
  const handleSort = useCallback(
    (field: keyof TokenWithMetrics) => {
      const newDirection =
        sortField === field && sortDirection === "desc" ? "asc" : "desc";
      setSortField(field);
      setSortDirection(newDirection);

      const sorted = [...sortedTokens].sort((a, b) => {
        const valueA = a[field] ?? 0;
        const valueB = b[field] ?? 0;
        const result = valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
        return newDirection === "asc" ? result : -result;
      });

      setSortedTokens(sorted);
    },
    [sortField, sortDirection, sortedTokens]
  );

  // Filter tokens based on search
  const filteredTokens = sortedTokens.filter(
    (token) =>
      token.name.toLowerCase().includes(searchText.toLowerCase()) ||
      token.assetID.toString().includes(searchText)
  );

  // Calculate pagination info
  const totalPages = Math.ceil(filteredTokens.length / PAGE_SIZE);
  const displayedTokens = filteredTokens.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // Pagination handler
  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
  }, []);

  // Render sort icon helper
  const renderSortIcon = useCallback(
    (field: string) => {
      if (sortField !== field) return <FaSort />;
      return sortDirection === "asc" ? <FaSortUp /> : <FaSortDown />;
    },
    [sortField, sortDirection]
  );

  // Component Types
  interface TokenCardProps {
    token: TokenWithMetrics;
  }

  // Token type icon component
  const TokenTypeIcon: React.FC<TokenCardProps> = ({ token }) => {
    if (token.stableTVL) {
      return (
        <div className={styles.tokenNameLogo}>
          <div className={styles.tooltipContainer}>
            <FaPlane />
            <span className={styles.tooltipText}>
              Build LP with this token to rank higher
            </span>
          </div>
        </div>
      );
    } else if (token.useCaseToken) {
      return (
        <div className={styles.useCaseToken}>
          <div className={styles.tooltipContainer}>
            <FaCogs />
            <span className={styles.tooltipText}>Use Case Token</span>
          </div>
        </div>
      );
    } else if (token.memeToken) {
      return (
        <div className={styles.memeToken}>
          <div className={styles.tooltipContainer}>
            <FaUserFriends />
            <span className={styles.tooltipText}>Meme Token</span>
          </div>
        </div>
      );
    } else if (token.wrappedAsset) {
      return (
        <div className={styles.wrappedAsset}>
          <div className={styles.tooltipContainer}>
            <FaUikit />
            <span className={styles.tooltipText}>Wrapped Asset</span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Token links component
  const TokenLinks: React.FC<TokenCardProps> = ({ token }) => (
    <div className={styles.tokenActions}>
      <a
        href={`https://vestige.fi/asset/${token.assetID}`}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.vestigeButton}
      >
        Vestige
      </a>
      <a
        href={`https://allo.info/asset/${token.assetID}/token`}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.allo}
      >
        <img src="https://allo.info/favicons/favicon-16x16.png" alt="Allo" />
      </a>
      <a
        href={token.xLink}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.xButton}
      >
        𝕏
      </a>
    </div>
  );

  // Pagination component
  const PaginationControls: React.FC = () => (
    <div className={styles.pagination}>
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={styles.pageButton}
      >
        Previous
      </button>
      <span className={styles.pageInfo}>
        Page {currentPage} of {totalPages}
      </span>
      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={styles.pageButton}
      >
        Next
      </button>
    </div>
  );

  // Interval selector component
  const IntervalSelector: React.FC = () => (
    <div className={styles.intervalFilterContainer}>
      <label htmlFor="intervalSelector">Select Price Change Interval:</label>
      <select
        id="intervalSelector"
        value={priceChangeInterval}
        onChange={(e) => setPriceChangeInterval(e.target.value)}
        className={styles.intervalSelector}
      >
        <option value="1H">1 Hour</option>
        <option value="1D">1 Day</option>
        <option value="7D">7 Day</option>
      </select>
    </div>
  );

  // Airdrops dropdown component
  const AirdropsDropdown: React.FC = () => (
    <div className={styles.airdropContainer}>
      <div className={styles.form}>
        <label className={styles.label}>
          <p className={styles.liveAirdrops}>Live Airdrops</p>
          <select className={styles.select}>
            <option value="" disabled>
              See Airdrops
            </option>
            {airdrops.map((airdrop) => (
              <option key={airdrop.id} value={airdrop.tokenName}>
                {airdrop.tokenName.toUpperCase()} (Asset ID: {airdrop.tokenId})
              </option>
            ))}
          </select>
        </label>
      </div>
      <button className={styles.loginSignupButton}>
        <a href="/" className={styles.createAirdrop}>
          Login / Signup
        </a>
      </button>
    </div>
  );

  // Mobile Airdrops dropdown component
  const MobileAirdropsDropdown: React.FC = () => (
    <div className={styles.airdropContainer}>
      <div className={styles.form}>
        <label className={styles.label}>
          <p className={styles.liveAirdropsmobile}>Live Airdrops</p>
          <select className={styles.select}>
            <option value="" disabled>
              See Airdrops
            </option>
            {airdrops.map((airdrop) => (
              <option key={airdrop.id} value={airdrop.tokenName}>
                {airdrop.tokenName.toUpperCase()} (Asset ID: {airdrop.tokenId})
              </option>
            ))}
          </select>
        </label>
      </div>
      <button className={styles.loginSignupButton}>
        <a href="/" className={styles.createAirdrop}>
          Login / Signup
        </a>
      </button>
    </div>
  );

  // Token card mobile component
  const TokenCardMobile: React.FC<TokenCardProps> = ({ token }) => (
    <div className={styles.tokenCard}>
      <div className={styles.tokenCardHeader}>
        <Link
          to={`/token-details?assetId=${token.assetID}&name=${token.name}&logo=${token.logo}&price=${token.latestPrice}&change=${token.priceChange24H}&holders=${token.holders}&totalTVL=${token.totalTVL}&fullTVL=${token.fullTVL}&stableTVL=${token.stableTVL}`}
        >
          <img
            src={token.logo}
            alt={`${token.name} logo`}
            className={styles.tokenLogo}
          />
        </Link>
        <div className={styles.tokenInfo}>
          <span className={styles.tokenName}>
            {token.name}
            <TokenTypeIcon token={token} />
          </span>
          <span className={styles.tokenTVL}>
            Price: ${token.latestPrice?.toFixed(6) || "0.000000"}
          </span>
        </div>
        <button
          className={styles.expandButton}
          onClick={() =>
            setExpandedToken(expandedToken === token.name ? null : token.name)
          }
        >
          {expandedToken === token.name ? <FaSortUp /> : <FaSortDown />}
        </button>
      </div>
      {expandedToken === token.name && (
        <div className={styles.tokenDetails}>
          <p
            onClick={() => handleSort("totalTVL")}
            style={{ cursor: "pointer" }}
          >
            Thrust TVL: ${token.totalTVL.toFixed(2)}{" "}
            {renderSortIcon("totalTVL")}
          </p>
          <p
            onClick={() => handleSort("fullTVL")}
            style={{ cursor: "pointer" }}
          >
            Total TVL: ${token.fullTVL?.toFixed(2) || "0.00"}{" "}
            {renderSortIcon("fullTVL")}
          </p>
          <p
            onClick={() => handleSort("priceChange24H")}
            style={{ cursor: "pointer" }}
          >
            Change:{" "}
            <span
              style={{
                color:
                  (token.priceChange24H || 0) > 0
                    ? "green"
                    : (token.priceChange24H || 0) < 0
                    ? "red"
                    : "black",
              }}
            >
              {(token.priceChange24H || 0) > 0 ? "+" : ""}
              {token.priceChange24H?.toFixed(2) || "0.00"}%{" "}
            </span>
            {renderSortIcon("priceChange24H")}
          </p>
          <p
            onClick={() => handleSort("holders")}
            style={{ cursor: "pointer" }}
          >
            Holders: {token.holders || 0} {renderSortIcon("holders")}
          </p>
          <TokenLinks token={token} />
        </div>
      )}
    </div>
  );

  return (
    <div className={styles.container}>
      {isLoading ? (
        <div className={styles.loadingContainer}>
          <FaTruckLoading className={styles.loadingIcon} />
          <span className={styles.loadingText}>
            Loading<span className={styles.dots}>....</span>
          </span>
        </div>
      ) : (
        <>
          {/* Desktop View */}
          <div className={styles.desktopView}>
            <AirdropsDropdown />
            <h1 className={styles.title}>Best Algo Defi Tokens</h1>
            <div className={styles.tokenTable}>
              <IntervalSelector />

              <div className={styles.tokenRowHeader}>
                <div className={styles.tokenCell}>Logo</div>
                <div
                  className={styles.tokenCell}
                  onClick={() => handleSort("name")}
                  style={{ cursor: "pointer" }}
                >
                  Name {renderSortIcon("name")}
                </div>
                <div
                  className={styles.tokenCell}
                  onClick={() => handleSort("totalTVL")}
                  style={{ cursor: "pointer" }}
                >
                  <div className={styles.tooltipContainer}>
                    Thrust TVL {renderSortIcon("totalTVL")}
                    <span className={styles.tooltipText}>
                      Total value locked with trusted ASA pairs
                    </span>
                  </div>
                </div>
                <div
                  className={styles.tokenCell}
                  onClick={() => handleSort("fullTVL")}
                  style={{ cursor: "pointer" }}
                >
                  Total TVL {renderSortIcon("fullTVL")}
                </div>
                <div
                  className={styles.tokenCell}
                  onClick={() => handleSort("latestPrice")}
                  style={{ cursor: "pointer" }}
                >
                  Latest Price {renderSortIcon("latestPrice")}
                </div>
                <div
                  className={styles.tokenCell}
                  onClick={() => handleSort("priceChange24H")}
                  style={{ cursor: "pointer" }}
                >
                  {priceChangeInterval} Change{" "}
                  {renderSortIcon("priceChange24H")}
                </div>
                <div
                  className={styles.tokenCell}
                  onClick={() => handleSort("holders")}
                  style={{ cursor: "pointer" }}
                >
                  Holders {renderSortIcon("holders")}
                </div>
                <div className={styles.tokenCell}>Links</div>
              </div>

              {displayedTokens.map((token) => (
                <div key={token.name} className={styles.tokenRow}>
                  <div className={styles.tokenCell}>
                    <Link
                      to={`/token-details?assetId=${token.assetID}&name=${token.name}&logo=${token.logo}&price=${token.latestPrice}&change=${token.priceChange24H}&holders=${token.holders}&totalTVL=${token.totalTVL}&fullTVL=${token.fullTVL}&stableTVL=${token.stableTVL}`}
                    >
                      <img
                        src={token.logo}
                        alt={`${token.name} logo`}
                        className={styles.tokenLogo}
                      />
                    </Link>
                  </div>
                  <div className={styles.tokenCell}>
                    {token.name}
                    <TokenTypeIcon token={token} />
                  </div>
                  <div className={styles.tokenCell}>
                    ${token.totalTVL.toFixed(2)}
                  </div>
                  <div className={styles.tokenCell}>
                    ${token.fullTVL?.toFixed(2) || "0.00"}
                  </div>
                  <div className={styles.tokenCell}>
                    ${token.latestPrice?.toFixed(6) || "0.000000"}
                  </div>
                  <div className={styles.tokenCell}>
                    <div
                      style={{
                        color:
                          (token.priceChange24H || 0) > 0
                            ? "green"
                            : (token.priceChange24H || 0) < 0
                            ? "red"
                            : "black",
                        fontWeight: "bold",
                      }}
                    >
                      {(token.priceChange24H || 0) > 0 ? "+" : ""}
                      {token.priceChange24H?.toFixed(2) || "0.00"}%
                    </div>
                  </div>
                  <div className={styles.tokenCell}>{token.holders || 0}</div>
                  <div className={styles.tokenCell}>
                    <TokenLinks token={token} />
                  </div>
                </div>
              ))}

              <PaginationControls />
            </div>
          </div>

          {/* Mobile View */}
          <div className={styles.mobileView}>
            <MobileAirdropsDropdown />
            <h1 className={styles.title}>Best Algo Defi Tokens</h1>
            <IntervalSelector />

            {displayedTokens.map((token) => (
              <TokenCardMobile key={token.name} token={token} />
            ))}

            <PaginationControls />
          </div>
        </>
      )}
    </div>
  );
};

export default PublicBestAlgoDefi;
