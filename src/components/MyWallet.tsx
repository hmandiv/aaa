import { useEffect, useState, useCallback } from "react";
import { algoIndexerClient } from "../algorand/config";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Pie } from "react-chartjs-2";
import styles from "../css_modules/MyWalletStyles.module.css";

// Register required Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

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

export const MyWallet = () => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<string>("");
  const [totalPortfolioValue, setTotalPortfolioValue] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());
  const [timeSinceRefresh, setTimeSinceRefresh] = useState<string>("Just now");
  const [error, setError] = useState<string | null>(null);
  
  const PAGE_SIZE = 10;

  // Format currency with proper locale
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Memoized fetch asset details function
  const fetchAssetDetails = useCallback(async (assetId: number) => {
    try {
      const assetInfo = await algoIndexerClient.lookupAssetByID(assetId).do();
      return {
        name: assetInfo?.asset.params?.name || "Unknown Asset",
        unitName: assetInfo?.asset.params["unit-name"] || "N/A",
        decimals: assetInfo?.asset.params?.decimals || 0,
      };
    } catch (error) {
      console.error(`Error fetching asset details for ID ${assetId}:`, error);
      return { name: "Unknown Asset", unitName: "N/A", decimals: 0 };
    }
  }, []);

  // Fetch asset verification and logo from Pera
  const fetchPeraVerification = useCallback(async (assetId: number) => {
    try {
      const response = await fetch(
        `https://mainnet.api.perawallet.app/v1/public/assets/${assetId}`,
        { 
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(5000) // 5 second timeout
        }
      );
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      return {
        verified: data.verification_tier === "verified",
        logoUrl: data.logo || null,
        usdValue: parseFloat(data.usd_value) || 0
      };
    } catch (error) {
      console.error(`Error verifying asset ID ${assetId}:`, error);
      return { verified: false, logoUrl: null, usdValue: 0 };
    }
  }, []);

  // Format amount with proper decimals
  const formatAmount = useCallback((amount: number, decimals: number) => {
    return parseFloat((amount / Math.pow(10, decimals)).toFixed(decimals > 2 ? 4 : 2));
  }, []);

  // Main function to fetch assets
  const fetchAssets = useCallback(async (address: string) => {
    if (!address) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const accountInfo = await algoIndexerClient
        .lookupAccountAssets(address)
        .limit(100) // Limit to 100 assets to avoid rate limiting
        .do();

      if (!accountInfo || !accountInfo.assets) {
        throw new Error("Failed to load account information");
      }

      // Process assets in batches to prevent overwhelming the APIs
      const BATCH_SIZE = 5;
      const assetBatches = [];
      for (let i = 0; i < accountInfo.assets.length; i += BATCH_SIZE) {
        assetBatches.push(accountInfo.assets.slice(i, i + BATCH_SIZE));
      }

      let allResolvedAssets: Asset[] = [];

      for (const batch of assetBatches) {
        const batchPromises = batch.map(async (asset: any) => {
          try {
            const assetId = asset["asset-id"];
            const { name, unitName, decimals } = await fetchAssetDetails(assetId);
            
            if (name === "Unknown Asset" && unitName === "N/A") {
              return null; // Skip assets that couldn't be resolved
            }
            
            const { verified, logoUrl, usdValue } = await fetchPeraVerification(assetId);
            
            // Calculate the formatted amount and USD value
            const amount = formatAmount(asset.amount, decimals);
            const calculatedUsdValue = amount * usdValue;
            
            // Only include assets with values
            if (amount <= 0) {
              return null;
            }
            
            return {
              assetId,
              amount,
              name,
              unitName,
              decimals,
              usdValue: calculatedUsdValue,
              logoUrl,
              verified
            };
          } catch (error) {
            console.error(`Error processing asset:`, error);
            return null;
          }
        });

        const batchResults = await Promise.all(batchPromises);
        const validResults = batchResults.filter(asset => asset !== null) as Asset[];
        allResolvedAssets = [...allResolvedAssets, ...validResults];
        
        // Small delay between batches to avoid rate limiting
        if (batch !== assetBatches[assetBatches.length - 1]) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Sort assets by USD value in descending order
      const sortedAssets = allResolvedAssets.sort((a, b) => b.usdValue - a.usdValue);
      
      setAssets(sortedAssets);
      
      // Calculate total portfolio value
      const totalValue = sortedAssets.reduce(
        (total, asset) => total + asset.usdValue,
        0
      );
      
      setTotalPortfolioValue(totalValue);
      setLastRefreshTime(new Date());
    } catch (error) {
      console.error("Error fetching assets:", error);
      setError("Failed to load wallet assets. Please try again later.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchAssetDetails, fetchPeraVerification, formatAmount]);

  // Load wallet from local storage on component mount
  useEffect(() => {
    const storedWallet = localStorage.getItem("appWallet");
    if (storedWallet) {
      setWalletAddress(storedWallet);
      fetchAssets(storedWallet);
    } else {
      setLoading(false);
    }
  }, [fetchAssets]);

  // Filter assets when filter changes
  useEffect(() => {
    const lowerCaseFilter = filter.toLowerCase();
    const filtered = assets.filter(
      (asset) =>
        asset.name.toLowerCase().includes(lowerCaseFilter) ||
        asset.unitName.toLowerCase().includes(lowerCaseFilter)
    );
    setFilteredAssets(filtered);
    setCurrentPage(1); // Reset to first page when filter changes
  }, [filter, assets]);

  // Update time since last refresh
  useEffect(() => {
    const updateTimeSinceRefresh = () => {
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - lastRefreshTime.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 1) {
        setTimeSinceRefresh("Just now");
      } else if (diffInMinutes === 1) {
        setTimeSinceRefresh("1 minute ago");
      } else if (diffInMinutes < 60) {
        setTimeSinceRefresh(`${diffInMinutes} minutes ago`);
      } else {
        const hours = Math.floor(diffInMinutes / 60);
        setTimeSinceRefresh(`${hours} ${hours === 1 ? 'hour' : 'hours'} ago`);
      }
    };

    updateTimeSinceRefresh();
    const interval = setInterval(updateTimeSinceRefresh, 60000);
    return () => clearInterval(interval);
  }, [lastRefreshTime]);

  // Handle manual refresh
  const handleRefresh = useCallback(() => {
    if (walletAddress && !refreshing && !loading) {
      setRefreshing(true);
      fetchAssets(walletAddress);
    }
  }, [walletAddress, refreshing, loading, fetchAssets]);

  // Handle page change
  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
  }, []);

  // Generate colors for chart
  const generateColors = useCallback((count: number) => {
    const colors = [];
    for (let i = 0; i < count; i++) {
      const hue = (i * 137.5) % 360; // Golden ratio distribution for visually pleasing colors
      colors.push(`hsla(${hue}, 70%, 50%, 0.8)`);
    }
    return colors;
  }, []);

  // Default placeholder for token logos
  const getTokenLogoUrl = useCallback((asset: Asset) => {
    return asset.logoUrl || `https://app.perawallet.app/assets/images/tokens/unknown.svg`;
  }, []);

  // Pagination calculations
  const totalPages = Math.ceil(filteredAssets.length / PAGE_SIZE);
  const displayedAssets = filteredAssets.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // Prepare chart data - based on USD value instead of equal weights
  const chartData = {
    labels: assets
      .filter(asset => asset.usdValue > 0)
      .slice(0, 10) // Limit to top 10 assets by value
      .map(asset => `${asset.name} (${asset.unitName})`),
    datasets: [
      {
        data: assets
          .filter(asset => asset.usdValue > 0)
          .slice(0, 10)
          .map(asset => asset.usdValue),
        backgroundColor: generateColors(Math.min(10, assets.length)),
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.8)',
      },
    ],
  };

  const chartOptions = {
    plugins: {
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const asset = assets.filter(a => a.usdValue > 0)[context.dataIndex];
            return [
              `Asset: ${asset.name}`,
              `Value: ${formatCurrency(asset.usdValue)}`,
              `Amount: ${asset.amount} ${asset.unitName}`
            ];
          },
        },
      },
      legend: {
        position: 'bottom' as const,
        labels: {
          boxWidth: 12,
          font: {
            size: 10
          }
        }
      }
    },
    responsive: true,
    maintainAspectRatio: true,
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>My Wallet</h2>
      {walletAddress ? (
        <>
          <div className={styles.walletHeader}>
            <p className={styles.walletAddress}>
              <span>{walletAddress.substring(0, 8)}...{walletAddress.substring(walletAddress.length - 8)}</span>
              <button 
                className={styles.copyButton}
                onClick={() => {
                  navigator.clipboard.writeText(walletAddress);
                  // You could add a toast notification here
                }}
                title="Copy address to clipboard"
              >
                Copy
              </button>
            </p>
            <div className={styles.refreshSection}>
              <button 
                onClick={handleRefresh}
                disabled={loading || refreshing}
                className={`${styles.refreshButton} ${refreshing ? styles.spinning : ''}`}
                aria-label="Refresh wallet data"
              >
                {refreshing ? "Refreshing..." : "Refresh Assets"}
              </button>
              <span className={styles.lastUpdated}>Last updated: {timeSinceRefresh}</span>
            </div>
          </div>
          
          <p className={styles.totalPortfolioValue}>
            Total Portfolio Value: <span>{formatCurrency(totalPortfolioValue)}</span>
          </p>
          
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}
          
          {loading ? (
            <p className={styles.loading}>Loading assets...</p>
          ) : assets.length > 0 ? (
            <>
              <div className={styles.chartWrapper}>
                <Pie data={chartData} options={chartOptions} />
                <p className={styles.dataAttribution}>Data provided by Pera Wallet</p>
              </div>
              
              <div className={styles.filterContainer}>
                <input
                  type="text"
                  placeholder="Filter tokens..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className={styles.filterInput}
                  aria-label="Filter tokens"
                />
                {filteredAssets.length === 0 && filter !== "" && (
                  <p className={styles.noResults}>No tokens match your filter</p>
                )}
              </div>
              
              {/* Mobile scroll hint */}
              <div className={styles.mobileScrollHint}>Scroll horizontally to view all data</div>
              
              <div className={styles.tableContainer}>
                <table className={styles.assetTable}>
                  <thead>
                    <tr>
                      <th>Asset</th>
                      <th>Amount</th>
                      <th>Value (USD)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedAssets.length > 0 ? (
                      displayedAssets.map((asset) => (
                        <tr key={asset.assetId}>
                          <td className={styles.assetNameCell}>
                            <img 
                              src={getTokenLogoUrl(asset)} 
                              alt={asset.name} 
                              className={styles.assetLogo} 
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://app.perawallet.app/assets/images/tokens/unknown.svg";
                              }}
                              loading="lazy"
                            />
                            <div>
                              <span className={styles.assetSymbol}>
                                {asset.unitName}
                                {asset.verified && (
                                  <span className={styles.verifiedBadge} title="Verified asset">✓</span>
                                )}
                              </span>
                              <div className={styles.assetName} title={asset.name}>{asset.name}</div>
                            </div>
                          </td>
                          <td>{asset.amount.toLocaleString()}</td>
                          <td>{formatCurrency(asset.usdValue)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className={styles.noAssets}>
                          No assets match your filter
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={styles.pageButton}
                    aria-label="Previous page"
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
                    aria-label="Next page"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <p className={styles.noAssets}>
              No verified assets found in this wallet.
            </p>
          )}
        </>
      ) : (
        <p className={styles.noWallet}>
          No wallet connected. Please connect your wallet.
        </p>
      )}
    </div>
  );
};