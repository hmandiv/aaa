import React, { useEffect, useState, useCallback } from "react";
import styles from "../css_modules/BestAlgoDefiStyles.module.css";
import tokenData from "../constants/tokenData";
import {
  FaCogs,
  FaPlane,
  FaSort,
  FaSortDown,
  FaSortUp,
  FaTruckLoading,
  FaUserFriends,
  FaUikit,
} from "react-icons/fa";
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
  fullTVL: number;
  holders: number;
  latestPrice: number;
  priceChange24H: number;
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

// Define return types for data fetching functions
interface PriceDataResult {
  latestPrices: Record<string, number>;
  priceChangesMap: Record<string, number>;
}

// Extract stableTVL asset IDs once
const stableTVLAssetIDs = tokenData
  .filter((token) => token.stableTVL)
  .map((token) => token.assetID);

const VESTIGE_BASE = "https://api.vestigelabs.org";

// Algorand MainNet USDC ASA id
const USDC_ASSET_ID = 31566704;

const INTERVAL_SECONDS: Record<string, number> = {
  "1D": 60 * 60, // use 1H candles to compute 1D change
  "7D": 24 * 60 * 60, // use 1D candles to compute 7D change
  "30D": 24 * 60 * 60, // use 1D candles to compute 30D change
};

const RANGE_SECONDS: Record<string, number> = {
  "1D": 24 * 60 * 60,
  "7D": 7 * 24 * 60 * 60,
  "30D": 30 * 24 * 60 * 60,
};

const API_ENDPOINTS = {
  // Vestige v4
  ASSET_POOLS: (assetID: string): string =>
    `${VESTIGE_BASE}/pools?network_id=0&asset_1_id=${assetID}&limit=250&offset=0&order_dir=desc`,

  ASSET_PRICE: (assetID: string): string =>
    `${VESTIGE_BASE}/assets/price?asset_ids=${assetID}&network_id=0&denominating_asset_id=${USDC_ASSET_ID}`,

  ASSET_CANDLES: (
    assetID: string,
    intervalSeconds: number,
    start: number,
    end: number
  ): string =>
    `${VESTIGE_BASE}/assets/${assetID}/candles?network_id=0&denominating_asset_id=${USDC_ASSET_ID}&interval=${intervalSeconds}&start=${start}&end=${end}`,

  ASSET_HISTORY: (
    assetID: string,
    intervalSeconds: number,
    start: number,
    end: number
  ): string =>
    `${VESTIGE_BASE}/assets/${assetID}/history?network_id=0&denominating_asset_id=${USDC_ASSET_ID}&interval=${intervalSeconds}&start=${start}&end=${end}`,

  // Pact / Tinyman (unchanged)
  PACT_POOLS: (name: string): string =>
    `https://api.pact.fi/api/internal/pools?limit=50&offset=0&search=${name}`,

  TINYMAN_POOL: (address: string): string =>
    `https://mainnet.analytics.tinyman.org/api/v1/pools/${address}`,
};

// Constants
const PAGE_SIZE = 15;

const BestAlgoDefi: React.FC = () => {
  const [sortedTokens, setSortedTokens] = useState<TokenWithMetrics[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [priceChangeInterval, setPriceChangeInterval] = useState<string>("1D");
  const [searchText, setSearchText] = useState<string>("");
  const [sortField, setSortField] =
    useState<keyof TokenWithMetrics>("totalTVL");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [expandedToken, setExpandedToken] = useState<string | null>(null);

  // Memoized sort handler to avoid recreating on each render
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

  // Fetch data function
  useEffect(() => {
    const fetchAllData = async (): Promise<void> => {
      try {
        setIsLoading(true);

        // Step 1: Fetch pools data
        const poolsData = await fetchPoolsData();

        // Step 2: Fetch additional token metrics in parallel
        const [priceData, fullTVLData] = await Promise.all([
          fetchPriceData(),
          fetchFullTVLData(),
        ]);

        const holdersData: Record<string, number> = {};

        // Step 3: Combine all data and sort
        const combinedData = combineTokenData(
          poolsData,
          priceData,
          fullTVLData,
          holdersData
        );
        setSortedTokens(combinedData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, [priceChangeInterval]);

  // Fetch pools data (Tinyman and PactFi)
  const fetchPoolsData = async (): Promise<Record<string, number>> => {
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
            .then((data: TinymanPool[]) => data)
            .catch(() => [] as TinymanPool[])
        )
      ),
      Promise.all(
        tokenData.map((token) =>
          fetch(API_ENDPOINTS.PACT_POOLS(token.name))
            .then((res) => res.json())
            .then((data: PactFiResponse) => data)
            .catch(() => ({ results: [] } as PactFiResponse))
        )
      ),
    ]);

    // Process Tinyman pools
    // tokenData.forEach((token, index) => {
    //   const pools = tinymanPoolResponses[index] || [];

    //   stableTVLAssetIDs.forEach((stableID) => {
    //     const pairKey = [token.assetID.toString(), stableID.toString()]
    //       .sort()
    //       .join("/");

    //     const relevantPools = pools.filter(
    //       (pool: TinymanPool) =>
    //         ["T3", "T2", "TM"].includes(pool.provider) &&
    //         ((pool.asset_1_id === parseInt(token.assetID) &&
    //           pool.asset_2_id === parseInt(stableID)) ||
    //           (pool.asset_2_id === parseInt(token.assetID) &&
    //             pool.asset_1_id === parseInt(stableID)))
    //     );

    //     if (relevantPools.length > 0) {
    //       poolAddresses[pairKey] = relevantPools.map(
    //         (pool: TinymanPool) => pool.address
    //       );
    //     }
    //   });
    // });

    // Process PactFi pools
    // tokenData.forEach((token, index) => {
    //   const pools = pactFiPoolResponses[index]?.results || [];

    //   pools.forEach((pool: PactFiPool) => {
    //     const [asset1, asset2] = pool.assets;
    //     if (assetIDSet.has(asset1.id) && assetIDSet.has(asset2.id)) {
    //       const pairKey = [asset1.id.toString(), asset2.id.toString()]
    //         .sort()
    //         .join("/");

    //       if (!processedPairs.has(pairKey)) {
    //         processedPairs.add(pairKey);
    //         poolUSDValues[pairKey] =
    //           (poolUSDValues[pairKey] || 0) + parseFloat(pool.tvl_usd);
    //       }
    //     }
    //   });
    // });

    // Fetch Tinyman USD values
    // const usdValuePromises = Object.entries(poolAddresses).map(
    //   ([pairKey, addresses]) =>
    //     Promise.all(
    //       addresses.map((address: string) =>
    //         fetch(API_ENDPOINTS.TINYMAN_POOL(address))
    //           .then((res) => res.json())
    //           .then(
    //             (data: TinymanPoolData) =>
    //               parseFloat(data.liquidity_in_usd) || 0
    //           )
    //           .catch(() => 0)
    //       )
    //     ).then((values: number[]) => {
    //       poolUSDValues[pairKey] =
    //         (poolUSDValues[pairKey] || 0) +
    //         values.reduce((sum: number, value: number) => sum + value, 0);
    //     })
    // );

    // await Promise.all(usdValuePromises);

    // Calculate total TVL for each token
    // tokenData.forEach((token) => {
    //   const tokenPairs = Object.keys(poolUSDValues).filter((pairKey) => {
    //     const [id1, id2] = pairKey.split("/");
    //     return (
    //       id1 === token.assetID.toString() || id2 === token.assetID.toString()
    //     );
    //   });

    //   const totalTVL = tokenPairs.reduce(
    //     (sum, pairKey) => sum + (poolUSDValues[pairKey] || 0),
    //     0
    //   );

    //   tokenTVL[token.name] = totalTVL;
    // });

    return tokenTVL;
  };

  // Fetch price data
  type VestigeAssetPrice = {
    asset_id: number;
    price: number;
  };

  type VestigeCandle = {
    timestamp: number;
    open: number;
    close: number;
  };

  const fetchPriceData = async (): Promise<PriceDataResult> => {
    const now = Math.floor(Date.now() / 1000);
    const rangeSeconds =
      RANGE_SECONDS[priceChangeInterval] ?? RANGE_SECONDS["1D"];
    const intervalSeconds =
      INTERVAL_SECONDS[priceChangeInterval] ?? INTERVAL_SECONDS["1D"];
    const start = now - rangeSeconds;

    // Latest prices
    const latest = await Promise.all(
      tokenData.map(async (token) => {
        try {
          const res = await fetch(API_ENDPOINTS.ASSET_PRICE(token.assetID));
          const data = (await res.json()) as VestigeAssetPrice[];
          const price = data?.[0]?.price ?? 0;
          return { assetID: token.assetID, price };
        } catch {
          return { assetID: token.assetID, price: 0 };
        }
      })
    );

    // Price change from candles
    const changes = await Promise.all(
      tokenData.map(async (token) => {
        try {
          const url = API_ENDPOINTS.ASSET_CANDLES(
            token.assetID,
            intervalSeconds,
            start,
            now
          );
          const res = await fetch(url);
          const candles = (await res.json()) as VestigeCandle[];

          if (!candles || candles.length < 2)
            return { assetID: token.assetID, change: 0 };

          const startPrice = candles[0]?.open ?? 0;
          const endPrice = candles[candles.length - 1]?.close ?? 0;

          const change =
            startPrice > 0 ? ((endPrice - startPrice) / startPrice) * 100 : 0;
          return { assetID: token.assetID, change };
        } catch {
          return { assetID: token.assetID, change: 0 };
        }
      })
    );

    const latestPrices = latest.reduce((acc: Record<string, number>, curr) => {
      acc[curr.assetID] = curr.price;
      return acc;
    }, {});

    const priceChangesMap = changes.reduce(
      (acc: Record<string, number>, curr) => {
        acc[curr.assetID] = curr.change;
        return acc;
      },
      {}
    );

    return { latestPrices, priceChangesMap };
  };

  // Fetch full TVL data
  type VestigeHistoryPoint = {
    tvl: number;
  };

  const fetchFullTVLData = async (): Promise<Record<string, number>> => {
    const now = Math.floor(Date.now() / 1000);
    const start = now - 7 * 24 * 60 * 60; // last 7 days
    const intervalSeconds = 24 * 60 * 60; // daily points

    const results = await Promise.all(
      tokenData.map(async (token) => {
        try {
          const url = API_ENDPOINTS.ASSET_HISTORY(
            token.assetID,
            intervalSeconds,
            start,
            now
          );
          const res = await fetch(url);
          const data = (await res.json()) as VestigeHistoryPoint[];

          const last = data?.[data.length - 1];
          return { assetID: token.assetID, fullTVL: last?.tvl ?? 0 };
        } catch {
          return { assetID: token.assetID, fullTVL: 0 };
        }
      })
    );

    return results.reduce((acc: Record<string, number>, curr) => {
      acc[curr.assetID] = curr.fullTVL;
      return acc;
    }, {});
  };

  // Fetch holders data
  // const fetchHoldersData = async (): Promise<Record<string, number>> => {
  //   const fetchHolders = await Promise.all(
  //     tokenData.map((token) =>
  //       fetch(API_ENDPOINTS.HOLDERS(token.assetID))
  //         .then((res) => res.json())
  //         .then((data: any[]) => ({
  //           assetID: token.assetID,
  //           holders: data.length || 0,
  //         }))
  //         .catch(() => ({ assetID: token.assetID, holders: 0 }))
  //     )
  //   );

  //   return fetchHolders.reduce((acc: Record<string, number>, curr) => {
  //     acc[curr.assetID] = curr.holders;
  //     return acc;
  //   }, {});
  // };

  // Combine all token data
  const combineTokenData = (
    tokenTVL: Record<string, number>,
    priceData: PriceDataResult,
    fullTVLMap: Record<string, number>,
    holdersMap: Record<string, number>
  ): TokenWithMetrics[] => {
    const { latestPrices, priceChangesMap } = priceData;

    return tokenData
      .map((token) => ({
        ...token,
        totalTVL: tokenTVL[token.name] || 0,
        fullTVL: fullTVLMap[token.assetID] || 0,
        holders: holdersMap[token.assetID] || 0,
        latestPrice: latestPrices[token.assetID] || 0,
        priceChange24H: priceChangesMap[token.assetID] || 0,
        memeToken: token.memeToken ?? false, // Ensure memeToken is always a boolean
        useCaseToken: token.useCaseToken ?? false,
        wrappedAsset: token.wrappedAsset ?? false,
      }))
      .sort((a, b) => b.totalTVL - a.totalTVL);
  };

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

  // Token card component (extracted for better organization)
  interface TokenCardProps {
    token: TokenWithMetrics;
  }

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
            Price: ${token.latestPrice.toFixed(6)}
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
            Total TVL: ${token.fullTVL?.toFixed(2) || 0}{" "}
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
                  token.priceChange24H > 0
                    ? "green"
                    : token.priceChange24H < 0
                    ? "red"
                    : "black",
              }}
            >
              {token.priceChange24H > 0 ? "+" : ""}
              {token.priceChange24H?.toFixed(2)}%{" "}
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

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Best Algo Defi Tokens</h1>

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
                    ${token.fullTVL?.toFixed(2) || 0}
                  </div>
                  <div className={styles.tokenCell}>
                    ${token.latestPrice.toFixed(6)}
                  </div>
                  <div className={styles.tokenCell}>
                    <div
                      style={{
                        color:
                          token.priceChange24H > 0
                            ? "green"
                            : token.priceChange24H < 0
                            ? "red"
                            : "black",
                        fontWeight: "bold",
                      }}
                    >
                      {token.priceChange24H > 0 ? "+" : ""}
                      {token.priceChange24H?.toFixed(2)}%
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

export default BestAlgoDefi;
