import React, { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import styles from "../css_modules/TokenDetailsPageStyles.module.css";
import axios from "axios";
import { algoIndexerClient } from "../algorand/config";
import { Pie, Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  ArcElement,
  BarElement,
  Legend,
} from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";
import {
  FaChartLine,
  FaProjectDiagram,
  FaInfoCircle,
  FaChartPie,
  FaWater,
  FaExchangeAlt,
  FaTwitter,
  FaDiscord,
  FaTelegram,
  FaGlobe,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaArrowUp,
  FaArrowDown,
  FaSyncAlt,
  FaDollarSign,
  FaPercentage,
  FaUsers,
  FaTag,
  FaHistory,
  FaLink,
} from "react-icons/fa";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  zoomPlugin,
  ArcElement,
  BarElement
);

interface Asset {
  assetId: number;
  amount: number;
  name: string;
  unitName: string;
  decimals: number;
  usdValue: number;
  logoUrl: string | null;
  verified: boolean;
}

interface AssetWithLogo {
  id: number;
  unitName: string;
  logoUrl: string | null;
}

const TokenDetailsPage = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [tokenData, setTokenData] = useState<any>(null);
  const [priceHistory, setPriceHistory] = useState<
    { timestamp: number; price: number }[]
  >([]);
  const [alloMetadata, setAlloMetadata] = useState<any>(null);
  const [assetID, setAssetID] = useState<string>("");
  const [priceInterval, setPriceInterval] = useState("7D");
  const [liquidityPools, setLiquidityPools] = useState<any[]>([]);
  const [txCounts, setTxCounts] = useState<number[]>([]);
  const [txDates, setTxDates] = useState<string[]>([]);
  const [tvlHistory, setTvlHistory] = useState<
    { timestamp: number; tvl: number }[]
  >([]);
  const [poolAssetLogos, setPoolAssetLogos] = useState<
    Record<number, string | null>
  >({});

  // Fetch asset verification and logo from Pera - defined at the top level of the component
  const fetchPeraVerification = useCallback(async (assetId: number) => {
    try {
      const response = await fetch(
        `https://mainnet.api.perawallet.app/v1/public/assets/${assetId}`,
        {
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(5000), // 5 second timeout
        }
      );

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      const data = await response.json();

      setAsset(data);
      return {
        verified: data.verification_tier === "verified",
        logoUrl: data.logo || null,
        usdValue: parseFloat(data.usd_value) || 0,
      };
    } catch (error) {
      console.error(`Error verifying asset ID ${assetId}:`, error);
      return { verified: false, logoUrl: null, usdValue: 0 };
    }
  }, []);

  // Default placeholder for token logos - defined at the top level of the component
  const getTokenLogoUrl = useCallback(
    (assetId: number, logoUrl: string | null) => {
      return (
        logoUrl || `https://app.perawallet.app/assets/images/tokens/unknown.svg`
      );
    },
    []
  );

  useEffect(() => {
    if (assetID) {
      fetchPeraVerification(parseInt(assetID));
    }
  }, [assetID, fetchPeraVerification]);

  useEffect(() => {
    const fetchRealTxData = async () => {
      if (!assetID) return;

      const txsPerDay: number[] = [];
      const labels: string[] = [];
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 29);

      for (let i = 0; i < 30; i++) {
        const dayStart = new Date(startDate);
        dayStart.setDate(startDate.getDate() + i);
        dayStart.setHours(0, 0, 0, 0);

        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);

        try {
          const res = await algoIndexerClient
            .searchForTransactions()
            .assetID(parseInt(assetID))
            .afterTime(dayStart.toISOString())
            .beforeTime(dayEnd.toISOString())
            .do();

          txsPerDay.push(res.transactions.length);
          labels.push(dayStart.toISOString().split("T")[0]);
        } catch (err) {
          console.error("Failed to fetch tx data for", dayStart, err);
          txsPerDay.push(0);
          labels.push(dayStart.toISOString().split("T")[0]);
        }
      }

      setTxDates(labels);
      setTxCounts(txsPerDay);
    };

    fetchRealTxData();
  }, [assetID]);

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const assetId = query.get("assetId");
    setAssetID(assetId || "");

    const fetchTokenData = async () => {
      try {
        if (!assetId) throw new Error("Invalid asset ID");

        const name = query.get("name") || "";
        const logo = query.get("logo") || "";
        const stableTVL = query.get("stableTVL") === "true";
        const totalTVL = parseFloat(query.get("totalTVL") || "0");
        const fullTVL = parseFloat(query.get("fullTVL") || "0");
        const holders = parseInt(query.get("holders") || "0");
        const price = parseFloat(query.get("price") || "0");
        const change = parseFloat(query.get("change") || "0");

        const [tvlRes, metaRes, searchRes, alloRes] = await Promise.all([
          axios.get(
            `https://free-api.vestige.fi/asset/${assetId}/tvl/simple/7D?currency=USD`
          ),
          axios.get(`https://free-api.vestige.fi/asset/${assetId}`),
          axios.get(
            `https://free-api.vestige.fi/assets/search?query=${assetId}&page=0&page_size=1`
          ),
          axios.get("https://commons.allo.info/api/v1/datasets/metadata"),
        ]);

        const meta = metaRes.data;
        const search = searchRes.data?.[0] || {};
        const tvl = tvlRes.data?.[tvlRes.data.length - 1]?.tvl || 0;

        const circulatingPercent =
          (parseFloat(search.circulating_supply) / parseFloat(search.supply)) *
          100;
        const burnedPercent =
          (parseFloat(search.burned_supply) / parseFloat(search.supply)) * 100;

        const matchedEntry = alloRes.data.entries.find(
          (entry: any) => entry.entry.id.toString() === assetId
        );

        setTokenData({
          name: name || meta.name,
          unitName: meta.unit_name,
          id: meta.asset_id,
          verified: meta.verified,
          logo,
          price,
          change,
          holders,
          stableTVL,
          totalTVL,
          fullTVL,
          tvl,
          creator: search.creator,
          reserve: search.reserve,
          url: search.url,
          hasClawback: search.has_clawback,
          hasFreeze: search.has_freeze,
          createdRound: search.created_round,
          totalSupply: search.supply,
          circulatingSupply: search.circulating_supply,
          burnedSupply: search.burned_supply,
          circulatingPercent,
          burnedPercent,
          tags: meta.tags || [],
        });

        setAlloMetadata(matchedEntry?.data || null);
      } catch (err: any) {
        console.error(err);
        setError("Failed to load token stats.");
      } finally {
        setLoading(false);
      }
    };

    fetchTokenData();
  }, [location.search]);

  useEffect(() => {
    const fetchPriceHistory = async () => {
      try {
        if (!assetID) return;
        const res = await axios.get(
          `https://free-api.vestige.fi/asset/${assetID}/prices/simple/${priceInterval}`
        );
        setPriceHistory(res.data || []);
      } catch (err) {
        console.error("Failed to fetch price history", err);
      }
    };

    fetchPriceHistory();
  }, [assetID, priceInterval]);

  useEffect(() => {
    const fetchLiquidityPools = async () => {
      if (!assetID) return;

      const poolProviders = ["T2", "T3", "TM"];
      const poolAddresses: string[] = [];
      const enrichedPools: any[] = [];

      try {
        // Step 1: Fetch pools for each provider from Vestige
        const poolData = await Promise.all(
          poolProviders.map(async (provider) => {
            const res = await axios.get(
              `https://free-api.vestige.fi/asset/${assetID}/pools/${provider}`
            );
            return res.data || [];
          })
        );

        const allPools = poolData.flat();

        // Step 2: Filter Tinyman pools with address
        allPools.forEach((pool) => {
          if (pool.address) {
            poolAddresses.push(pool.address);
            enrichedPools.push({
              ...pool,
              provider: `Tinyman ${
                pool.provider === "T2"
                  ? "V1"
                  : pool.provider === "T3"
                  ? "V2"
                  : pool.provider
              }`, // Adjust provider name for V1 and V2
            });
          }
        });

        // Step 3: Fetch USD TVL for Tinyman pools
        const usdLiquidityData = await Promise.all(
          poolAddresses.map((address) =>
            axios
              .get(
                `https://mainnet.analytics.tinyman.org/api/v1/pools/${address}`
              )
              .then((res) => ({
                address,
                usd: parseFloat(res.data?.liquidity_in_usd || "0"),
              }))
              .catch(() => ({ address, usd: 0 }))
          )
        );

        // Step 4: Merge Tinyman TVL
        const poolsWithTVL = enrichedPools.map((pool) => {
          const usdMatch = usdLiquidityData.find(
            (p) => p.address === pool.address
          );
          return {
            ...pool,
            tvl_usd: usdMatch?.usd || 0,
          };
        });

        // Step 5: Fetch PactFi pools separately
        const pactRes = await axios.get(
          `https://api.pact.fi/api/internal/pools?limit=50&offset=0&search=${assetID}`
        );
        const pactPoolsRaw = pactRes.data.results || [];

        const filteredPactPools = pactPoolsRaw
          .filter((pool: any) =>
            pool.assets.some((a: any) => a.id.toString() === assetID)
          )
          .map((pool: any) => ({
            provider: "PactFi",
            address: pool.address,
            asset_1_id: pool.assets[0].id,
            asset_2_id: pool.assets[1].id,
            tvl_usd: parseFloat(pool.tvl_usd || "0"),
          }))
          .filter((pool: any) => pool.tvl_usd > 0);

        // Step 6: Fetch unit names from indexer
        const assetIdsToFetch = new Set<number>();
        poolsWithTVL.forEach((p) => {
          assetIdsToFetch.add(p.asset_1_id);
          assetIdsToFetch.add(p.asset_2_id);
        });
        filteredPactPools.forEach((p: any) => {
          assetIdsToFetch.add(p.asset_1_id);
          assetIdsToFetch.add(p.asset_2_id);
        });

        const assetIdArray = Array.from(assetIdsToFetch);
        const assetNameMap: Record<number, string> = {};
        const logos: Record<number, string | null> = {};

        // Process assets in batches to avoid overwhelming APIs
        const BATCH_SIZE = 5;
        const assetBatches = [];
        for (let i = 0; i < assetIdArray.length; i += BATCH_SIZE) {
          assetBatches.push(assetIdArray.slice(i, i + BATCH_SIZE));
        }

        for (const batch of assetBatches) {
          await Promise.all(
            batch.map(async (id) => {
              try {
                // Fetch asset details from indexer
                const res = await algoIndexerClient.lookupAssetByID(id).do();
                assetNameMap[id] =
                  res.asset.params["unit-name"] || id?.toString();

                // Fetch logo from Pera
                const response = await fetch(
                  `https://mainnet.api.perawallet.app/v1/public/assets/${id}`,
                  {
                    headers: { Accept: "application/json" },
                    signal: AbortSignal.timeout(5000),
                  }
                );

                if (response.ok) {
                  const data = await response.json();
                  logos[id] = data.logo || null;
                } else {
                  logos[id] = null;
                }
              } catch (error) {
                console.error(
                  `Error fetching details for asset ID ${id}:`,
                  error
                );
                assetNameMap[id] = id?.toString();
                logos[id] = null;
              }
            })
          );

          // Add small delay between batches to avoid rate limiting
          if (batch !== assetBatches[assetBatches.length - 1]) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        }

        // Save all logos to state for use in rendering
        setPoolAssetLogos(logos);

        // Step 7: Add unit names and logos to pools
        const poolsWithDetails = [...poolsWithTVL, ...filteredPactPools].map(
          (pool) => ({
            ...pool,
            asset_1_unit_name: assetNameMap[pool.asset_1_id] || pool.asset_1_id,
            asset_2_unit_name: assetNameMap[pool.asset_2_id] || pool.asset_2_id,
            asset_1_logo_url: logos[pool.asset_1_id] || null,
            asset_2_logo_url: logos[pool.asset_2_id] || null,
          })
        );

        // Step 8: Filter and set
        const nonZeroPools = poolsWithDetails.filter((p) => p.tvl_usd > 0);
        setLiquidityPools(nonZeroPools);
      } catch (err) {
        console.error("Failed to fetch enriched liquidity pool data", err);
      }
    };

    fetchLiquidityPools();
  }, [assetID]);

  useEffect(() => {
    const fetchTvlHistory = async () => {
      try {
        if (!assetID) return;
        const res = await axios.get(
          `https://free-api.vestige.fi/asset/${assetID}/tvl/simple/30D?currency=usd`
        );
        setTvlHistory(res.data || []);
      } catch (err) {
        console.error("Failed to fetch TVL history", err);
      }
    };

    fetchTvlHistory();
  }, [assetID]);

  const tvlChartData = {
    labels: tvlHistory.map((entry) =>
      new Date(entry.timestamp * 1000).toLocaleDateString()
    ),
    datasets: [
      {
        label: "TVL (30D)",
        data: tvlHistory.map((entry) => entry.tvl),
        borderColor: "#10b981",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        tension: 0.3,
        pointRadius: 0,
        fill: true,
      },
    ],
  };

  const tvlChartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            return `TVL: $${context.parsed.y.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value: any) {
            if (value >= 1_000_000_000)
              return `$${(value / 1_000_000_000).toFixed(1)}B`;
            if (value >= 1_000_000)
              return `$${(value / 1_000_000).toFixed(1)}M`;
            if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
            return `$${value}`;
          },
        },
      },
      x: {
        ticks: {
          maxTicksLimit: 8,
          autoSkip: true,
        },
      },
    },
  };

  const txChartData = {
    labels: txDates,
    datasets: [
      {
        label: "Transactions per Day",
        data: txCounts,
        borderColor: "#7c3aed",
        backgroundColor: "rgba(124, 58, 237, 0.1)",
        fill: true,
        tension: 0.3,
        pointRadius: 0,
      },
    ],
  };

  const txChartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            return `Txs: ${context.parsed.y}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          maxTicksLimit: 8,
          autoSkip: true,
        },
      },
      y: {
        beginAtZero: true,
      },
    },
  };

  const priceChartData = {
    labels: priceHistory.map((p) =>
      new Date(p.timestamp * 1000).toLocaleDateString()
    ),
    datasets: [
      {
        label: `Price (${priceInterval})`,
        data: priceHistory.map((p) => p.price),
        borderColor: "#0284c7",
        backgroundColor: "rgba(2, 132, 199, 0.1)",
        tension: 0.3,
        pointRadius: 0,
        fill: true,
      },
    ],
  };

  const priceChartOptions = {
    responsive: true,
    interaction: {
      mode: "index" as
        | "x"
        | "index"
        | "dataset"
        | "point"
        | "nearest"
        | "y"
        | undefined,
      intersect: false,
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: function (context: any) {
            const date = new Date(
              priceHistory[context[0].dataIndex]?.timestamp * 1000
            );
            return date.toLocaleString();
          },
          label: function (context: any) {
            return `Price: ${context.parsed.y.toFixed(6)} A`;
          },
        },
      },
      zoom: {
        zoom: {
          wheel: {
            enabled: true,
          },
          pinch: {
            enabled: true,
          },
          mode: "x" as "x" | "y" | "xy",
        },
        pan: {
          enabled: true,
          mode: "x" as const,
        },
        limits: {
          x: { min: undefined, max: undefined },
          y: { min: undefined, max: undefined },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          maxTicksLimit: 12,
          autoSkip: true,
        },
        grid: {
          display: false,
        },
      },
      y: {
        ticks: {
          callback: function (tickValue: number | string) {
            const value =
              typeof tickValue === "number" ? tickValue : parseFloat(tickValue);
            return `${value.toFixed(6)} A`;
          },
        },
        grid: {
          color: "#f3f4f6",
        },
      },
    },
  };

  const holdersBarData = {
    labels: ["Holders"],
    datasets: [
      {
        label: "Number of Holders",
        data: [tokenData?.holders || 0],
        backgroundColor: ["#6366f1"],
      },
    ],
  };

  const holdersBarOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            return `Holders: ${context.parsed.y.toLocaleString()}`;
          },
        },
      },
    },
  };

  const supplyPieData = {
    labels: ["Circulating", "Burned"],
    datasets: [
      {
        data: [
          tokenData?.circulatingPercent || 0,
          tokenData?.burnedPercent || 0,
        ],
        backgroundColor: ["#10b981", "#ef4444"],
        hoverOffset: 6,
        borderWidth: 2,
        borderColor: "#ffffff",
      },
    ],
  };

  const supplyPieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: "circle",
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const label = context.label;
            const value = context.raw;
            return `${label}: ${value.toFixed(2)}%`;
          },
        },
      },
    },
    cutout: "50%",
  };

  const formatNumber = (value: number, decimals = 2) => {
    if (value >= 1_000_000_000)
      return `${(value / 1_000_000_000).toFixed(decimals)}B`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(decimals)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(decimals)}K`;
    return value.toFixed(decimals);
  };

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    // Re-trigger the initial data load by forcing a URL change
    window.location.reload();
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p className={styles.loadingText}>Loading token details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorIcon}>
          <FaExclamationTriangle />
        </div>
        <p className={styles.errorText}>{error}</p>
        <button className={styles.retryButton} onClick={handleRetry}>
          <FaSyncAlt /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderContent}>
          <h1 className={styles.title}>Token Details</h1>
          {tokenData?.logo && (
            <img
              src={tokenData.logo}
              alt={`${tokenData.name} logo`}
              className={styles.tokenLogo}
            />
          )}
        </div>
      </div>

      <div className={styles.pageBody}>
        {/* Top Stats */}
        <div className={styles.topStats}>
          <div className={styles.statCard}>
            <div className={styles.statTitle}>
              <FaDollarSign /> Current Price (USD)
            </div>
            <div className={styles.statValue}>
              ${tokenData?.price?.toFixed(6)}
              <span
                className={`${styles.statChange} ${
                  tokenData?.change >= 0
                    ? styles.statPositive
                    : styles.statNegative
                }`}
              >
                {tokenData?.change >= 0 ? <FaArrowUp /> : <FaArrowDown />}
                {tokenData?.change?.toFixed(2)}%
              </span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statTitle}>
              <FaWater /> Total Value Locked (TVL)
            </div>
            <div className={styles.statValue}>
              ${formatNumber(tokenData?.tvl || 0)}
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statTitle}>
              <FaUsers /> Holders
            </div>
            <div className={styles.statValue}>
              {formatNumber(tokenData?.holders || 0, 0)}
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statTitle}>
              <FaTag /> Unit Name
            </div>
            <div className={styles.statValue}>
              {tokenData?.unitName}
              {tokenData?.verified && (
                <span className={styles.verifiedBadge}>
                  <FaCheckCircle /> Verified
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Price Chart Section */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIcon}>
              <FaChartLine />
            </div>
            <h2 className={styles.subTitle}>Price History</h2>
          </div>

          <div className={styles.sectionContent}>
            <div className={styles.chartHeader}>
              <h3 className={styles.chartTitle}>Price Trend</h3>
              <div className={styles.chartControls}>
                <select
                  id="priceInterval"
                  value={priceInterval}
                  onChange={(e) => setPriceInterval(e.target.value)}
                  className={styles.chartSelect}
                >
                  <option value="1H">1 Hour</option>
                  <option value="1D">1 Day</option>
                  <option value="7D">7 Days</option>
                </select>
              </div>
            </div>
            <Line data={priceChartData} options={priceChartOptions} />
          </div>
        </div>

        {/* Project Info Section */}
        {alloMetadata?.pera && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIcon}>
                <FaProjectDiagram />
              </div>
              <h2 className={styles.subTitle}>Project Information</h2>
            </div>

            <div className={styles.sectionContent}>
              <div className={styles.projectInfo}>
                <div className={styles.projectInfoItem}>
                  {alloMetadata.pera.icon && (
                    <img
                      src={alloMetadata.pera.icon}
                      alt="Project Icon"
                      className={styles.projectIcon}
                    />
                  )}
                  <h3>{alloMetadata.pera.projectName}</h3>
                  <p>{alloMetadata.pera.projectDescription}</p>

                  {alloMetadata.pera.verificationTier && (
                    <div className={styles.tierBadge}>
                      <FaCheckCircle /> Tier:{" "}
                      {alloMetadata.pera.verificationTier}
                    </div>
                  )}
                </div>

                <div className={styles.projectInfoItem}>
                  <div className={styles.socialLinks}>
                    {alloMetadata.pera.projectUrl && (
                      <a
                        href={alloMetadata.pera.projectUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.socialLink}
                        title="Website"
                      >
                        <FaGlobe />
                      </a>
                    )}

                    {alloMetadata.pera.twitterUsername && (
                      <a
                        href={`https://twitter.com/${alloMetadata.pera.twitterUsername}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.socialLink}
                        title="Twitter"
                      >
                        <FaTwitter />
                      </a>
                    )}

                    {alloMetadata.pera.discordUrl && (
                      <a
                        href={alloMetadata.pera.discordUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.socialLink}
                        title="Discord"
                      >
                        <FaDiscord />
                      </a>
                    )}

                    {alloMetadata.pera.telegramUrl && (
                      <a
                        href={alloMetadata.pera.telegramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.socialLink}
                        title="Telegram"
                      >
                        <FaTelegram />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Token Stats */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIcon}>
              <FaInfoCircle />
            </div>
            <h2 className={styles.subTitle}>Token Stats</h2>
          </div>

          <div className={styles.sectionContent}>
            <div className={styles.statsGrid}>
              <div className={styles.statItem}>
                <div className={styles.statLabel}>Name</div>
                <div className={styles.statData}>{tokenData?.name}</div>
              </div>

              <div className={styles.statItem}>
                <div className={styles.statLabel}>Asset ID</div>
                <div className={styles.statData}>{assetID}</div>
              </div>

              <div className={styles.statItem}>
                <div className={styles.statLabel}>Created at Round</div>
                <div className={styles.statData}>{tokenData?.createdRound}</div>
              </div>

              <div className={styles.statItem}>
                <div className={styles.statLabel}>Has Clawback</div>
                <div className={styles.statData}>
                  {tokenData?.hasClawback ? (
                    <span className={styles.unverifiedBadge}>
                      <FaCheckCircle /> Yes
                    </span>
                  ) : (
                    <span className={styles.verifiedBadge}>
                      <FaTimesCircle /> No
                    </span>
                  )}
                </div>
              </div>

              <div className={styles.statItem}>
                <div className={styles.statLabel}>Has Freeze</div>
                <div className={styles.statData}>
                  {tokenData?.hasFreeze ? (
                    <span className={styles.unverifiedBadge}>
                      <FaCheckCircle /> Yes
                    </span>
                  ) : (
                    <span className={styles.verifiedBadge}>
                      <FaTimesCircle /> No
                    </span>
                  )}
                </div>
              </div>

              <div className={styles.statItem}>
                <div className={styles.statLabel}>Official URL</div>
                <div className={styles.statData}>
                  {tokenData?.url ? (
                    <a
                      href={tokenData.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.socialLink}
                    >
                      <FaLink /> {tokenData.url.substring(0, 30)}...
                    </a>
                  ) : (
                    "N/A"
                  )}
                </div>
              </div>

              {tokenData?.tags && tokenData.tags.length > 0 && (
                <div className={styles.statItem}>
                  <div className={styles.statLabel}>Tags</div>
                  <div className={styles.tagList}>
                    {tokenData.tags.map((tag: string, index: number) => (
                      <span key={index} className={styles.tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Token Distribution */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIcon}>
              <FaChartPie />
            </div>
            <h2 className={styles.subTitle}>Token Distribution & Analytics</h2>
          </div>

          <div className={styles.sectionContent}>
            <div className={styles.tokenDistribution}>
              <div className={styles.chartContainer}>
                <h3 className={styles.chartContainerTitle}>Holders</h3>
                <Bar data={holdersBarData} options={holdersBarOptions} />
              </div>

              <div className={styles.chartContainer}>
                <h3 className={styles.chartContainerTitle}>Supply Breakdown</h3>
                <Pie data={supplyPieData} options={supplyPieOptions} />
              </div>

              <div className={styles.chartContainer}>
                <h3 className={styles.chartContainerTitle}>
                  30-Day Transaction Count
                </h3>
                <Line data={txChartData} options={txChartOptions} />
              </div>

              <div className={styles.chartContainer}>
                <h3 className={styles.chartContainerTitle}>
                  30-Day TVL History
                </h3>
                <Line data={tvlChartData} options={tvlChartOptions} />
              </div>
            </div>
          </div>
        </div>

        {/* Liquidity Pools */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIcon}>
              <FaExchangeAlt />
            </div>
            <h2 className={styles.subTitle}>Liquidity Pools</h2>
          </div>

          <div className={styles.sectionContent}>
            <div className={styles.lpScrollBox}>
              {liquidityPools.map((pool, index) => (
                <div key={index} className={styles.poolItem}>
                  <div className={styles.poolItemHeader}>
                    <span className={styles.poolProvider}>{pool.provider}</span>
                    <span className={styles.poolTVL}>
                      ${parseFloat(pool.tvl_usd || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className={styles.poolAssets}>
                    {/* First Token with Logo */}
                    <div className={styles.assetWithLogo}>
                      <img
                        src={getTokenLogoUrl(
                          pool.asset_1_id,
                          pool.asset_1_logo_url
                        )}
                        alt={pool.asset_1_unit_name}
                        className={styles.tokenLogoSmall}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://app.perawallet.app/assets/images/tokens/unknown.svg";
                        }}
                        loading="lazy"
                      />
                      <span className={styles.assetPair}>
                        {pool.asset_1_unit_name || pool.asset_1_id}
                      </span>
                    </div>

                    <span>+</span>

                    {/* Second Token with Logo */}
                    <div className={styles.assetWithLogo}>
                      <img
                        src={getTokenLogoUrl(
                          pool.asset_2_id,
                          pool.asset_2_logo_url
                        )}
                        alt={pool.asset_2_unit_name}
                        className={styles.tokenLogoSmall}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://app.perawallet.app/assets/images/tokens/unknown.svg";
                        }}
                        loading="lazy"
                      />
                      <span className={styles.assetPair}>
                        {pool.asset_2_unit_name || pool.asset_2_id}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenDetailsPage;
