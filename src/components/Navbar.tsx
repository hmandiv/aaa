import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import aaa from "../images/aaa.png";
import styles from "../css_modules/NavbarStyles.module.css";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showFarmingDropdown, setShowFarmingDropdown] = useState(false);
  const [showGamingDropdown, setShowGamingDropdown] = useState(false);
  const [showExchangesDropdown, setShowExchangesDropdown] = useState(false);
  const [showDexesDropdown, setShowDexesDropdown] = useState(false);
  const [showRWAsDropdown, setShowRWAsDropdown] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const dropdownRefFarming = useRef<HTMLDivElement>(null);
  const dropdownRefGaming = useRef<HTMLDivElement>(null);
  const dropdownRefExchanges = useRef<HTMLDivElement>(null);
  const dropdownRefDexes = useRef<HTMLDivElement>(null);
  const dropdownRefRWAs = useRef<HTMLDivElement>(null);

  const toggleMenu = () => setMenuOpen((prev) => !prev);
  const toggleFarmingDropdown = () => setShowFarmingDropdown((prev) => !prev);
  const toggleGamingDropdown = () => setShowGamingDropdown((prev) => !prev);
  const toggleExchangesDropdown = () =>
    setShowExchangesDropdown((prev) => !prev);
  const toggleDexesDropdown = () => setShowDexesDropdown((prev) => !prev);
  const toggleRWAsDropdown = () => setShowRWAsDropdown((prev) => !prev);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (menuRef.current && !menuRef.current.contains(target)) {
        setMenuOpen(false);
      }

      if (
        dropdownRefFarming.current &&
        !dropdownRefFarming.current.contains(target)
      ) {
        setShowFarmingDropdown(false);
      }

      if (
        dropdownRefGaming.current &&
        !dropdownRefGaming.current.contains(target)
      ) {
        setShowGamingDropdown(false);
      }

      if (
        dropdownRefExchanges.current &&
        !dropdownRefExchanges.current.contains(target)
      ) {
        setShowExchangesDropdown(false);
      }

      if (
        dropdownRefDexes.current &&
        !dropdownRefDexes.current.contains(target)
      ) {
        setShowDexesDropdown(false);
      }

      if (
        dropdownRefRWAs.current &&
        !dropdownRefRWAs.current.contains(target)
      ) {
        setShowRWAsDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className={styles.navbar}>
      <div className={styles.logo}>
        <Link to="/" onClick={() => setMenuOpen(false)}>
          <img src={aaa} alt="AAA APP" className={styles.tokenLogo} />
        </Link>
      </div>

      <div className={styles.hamburger} onClick={toggleMenu}>
        ☰
      </div>

      <div
        ref={menuRef}
        className={`${styles.navLinks} ${menuOpen ? styles.open : ""}`}
      >
        <Link to="/swap-tokens" onClick={() => setMenuOpen(false)}>
          Swap Tokens
        </Link>

        <div
          ref={dropdownRefFarming}
          className={`${styles.dropdown} ${
            showFarmingDropdown ? styles.open : ""
          }`}
        >
          <div
            className={styles.dropdownToggle}
            onClick={toggleFarmingDropdown}
          >
            Farming ▾
          </div>
          {showFarmingDropdown && (
            <div className={styles.dropdownMenu}>
              <a
                href="https://app.cometa.farm"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  setMenuOpen(false);
                  setShowFarmingDropdown(false);
                }}
              >
                Cometa Hub
              </a>
            </div>
          )}
        </div>

        <div
          ref={dropdownRefRWAs}
          className={`${styles.dropdown} ${
            showRWAsDropdown ? styles.open : ""
          }`}
        >
          <div className={styles.dropdownToggle} onClick={toggleRWAsDropdown}>
            RWAs ▾
          </div>
          {showRWAsDropdown && (
            <div
              className={`${styles.dropdownMenu} ${styles.scrollableDropdown}`}
            >
              {[
                { name: "Lofty.ai", url: "https://www.lofty.ai" },
                { name: "Meld Gold", url: "https://www.meld.gold" },
                { name: "Propy", url: "https://www.propy.com" },
                { name: "AlgoCloud", url: "https://www.algocloud.com" },
                { name: "Koibanx", url: "https://www.koibanx.com" },
                { name: "Reach", url: "https://reach.sh" },
                { name: "Hesab Pay", url: "https://hesab.com/en" },
                { name: "ArgoToken", url: "https://www.justoken.com" },
                { name: "Ureca", url: "https://ureca.com" },
                { name: "Vesta Equity", url: "https://vestaequity.net" },
                { name: "Terano", url: "https://www.terano.io" },
                { name: "Trusty Digital", url: "https://trusty.digital" },
                {
                  name: "Enel EBITTS",
                  url: "https://www.enel.it/it-it/blog/storie/ebitts-blockchain-accesso-rinnovabili",
                },
              ].map((item) => (
                <a
                  key={item.name}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    setMenuOpen(false);
                    setShowRWAsDropdown(false);
                  }}
                >
                  {item.name}
                </a>
              ))}
            </div>
          )}
        </div>

        <div
          ref={dropdownRefExchanges}
          className={`${styles.dropdown} ${
            showExchangesDropdown ? styles.open : ""
          }`}
        >
          <div
            className={styles.dropdownToggle}
            onClick={toggleExchangesDropdown}
          >
            Exchanges ▾
          </div>
          {showExchangesDropdown && (
            <div className={styles.dropdownMenu}>
              {[
                { name: "Binance", url: "https://www.binance.com" },
                { name: "Coinbase", url: "https://www.coinbase.com" },
                { name: "Kraken", url: "https://www.kraken.com" },
                { name: "KuCoin", url: "https://www.kucoin.com" },
                { name: "OKX", url: "https://www.okx.com" },
                { name: "Gate.io", url: "https://www.gate.io" },
                { name: "Bybit", url: "https://www.bybit.com" },
                { name: "Huobi", url: "https://www.huobi.com" },
              ].map((item) => (
                <a
                  key={item.name}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    setMenuOpen(false);
                    setShowExchangesDropdown(false);
                  }}
                >
                  {item.name}
                </a>
              ))}
            </div>
          )}
        </div>

        <div
          ref={dropdownRefDexes}
          className={`${styles.dropdown} ${
            showDexesDropdown ? styles.open : ""
          }`}
        >
          <div className={styles.dropdownToggle} onClick={toggleDexesDropdown}>
            DEXes ▾
          </div>
          {showDexesDropdown && (
            <div className={styles.dropdownMenu}>
              {[
                { name: "Tinyman", url: "https://app.tinyman.org" },
                { name: "CompX", url: "https://app.compx.io" },
                { name: "Pactfi", url: "https://app.pact.fi" },
                { name: "Vestige", url: "https://vestige.fi" },
              ].map((item) => (
                <a
                  key={item.name}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    setMenuOpen(false);
                    setShowDexesDropdown(false);
                  }}
                >
                  {item.name}
                </a>
              ))}
            </div>
          )}
        </div>

        <Link to="/best-algo-defi" onClick={() => setMenuOpen(false)}>
          Best Algo Defi Tokens
        </Link>

        <Link to="/algo-bubbles" onClick={() => setMenuOpen(false)}>
          Algo Bubbles
        </Link>

        <div
          ref={dropdownRefGaming}
          className={`${styles.dropdown} ${
            showGamingDropdown ? styles.open : ""
          }`}
        >
          <div className={styles.dropdownToggle} onClick={toggleGamingDropdown}>
            Algo Games ▾
          </div>
          {showGamingDropdown && (
            <div className={styles.dropdownMenu}>
              {[
                { name: "Astro Explorer", url: "https://astroexplorer.co" },
                { name: "AlgoSeas", url: "https://algoseas.io/play" },
                {
                  name: "Bwombus",
                  url: "https://discord.com/invite/j4b53UqYAw",
                },
                { name: "Cosmic Champs", url: "https://cosmicchamps.com" },
                { name: "Dark Coin", url: "https://dark-coin.com/" },
                {
                  name: "Fracctal Monsters",
                  url: "https://fracctalmonstersnft.com/play",
                },
                {
                  name: "Ghetto Warzones",
                  url: "https://www.ghettopigeon.com/game.html",
                },
                {
                  name: "Gully",
                  url: "https://discord.com/invite/tbeHUrpW",
                },
                {
                  name: "MembersOnly",
                  url: "https://www.membersonlyalgo.com",
                },
                { name: "Rxelms Games", url: "https://rxelms.com/games" },
                { name: "Shep NFTs", url: "https://shepnfts.com" },
                { name: "SuperMeow", url: "https://3dlifestudio.com" },
              ].map((item) => (
                <a
                  key={item.name}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    setMenuOpen(false);
                    setShowGamingDropdown(false);
                  }}
                >
                  {item.name}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
