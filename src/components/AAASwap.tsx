import React, { useState, useRef, useEffect } from "react";
import swapTokens from "../constants/swapTokens";
import styles from "../css_modules/AAASwapStyles.module.css";

interface Token {
  id: string;
  name: string;
  logo: string;
}

interface AAASwapProps {
  title?: string;
  defaultAssetIn?: string;
  defaultAssetOut?: string;
  platformName?: string;
  platformFeeAccount?: string;
  platformFeePercentage?: number;
  themeVariables?: string;
  width?: string;
  height?: string;
  tokens?: Token[];
}

export const AAASwap: React.FC<AAASwapProps> = ({
  title = "AAA Swap",
  defaultAssetIn = "0",
  defaultAssetOut = "2004387843",
  platformName = "AAA Swap",
  platformFeeAccount = "HE7225SD6ZKYO45QWYCE4BZ3ITFEK7WI7XGMAVAMB56FZREJVPMHNRSL2E",
  platformFeePercentage = 0.1,
  themeVariables = "eyJ0aGVtZSI6ImRhcmsiLCJjb250YWluZXJCdXR0b25CZyI6ImJsYWNrIiwid2lkZ2V0QmciOiJnb2xkIiwiaGVhZGVyQnV0dG9uQmciOiIjODM0NmQxIiwiaGVhZGVyQnV0dG9uVGV4dCI6IiNmZmZmZmYiLCJoZWFkZXJUaXRsZSI6ImJsYWNrIiwiY29udGFpbmVyQnV0dG9uVGV4dCI6IiNmZmZmZmYiLCJpZnJhbWVCZyI6IiNGOEY4RjgiLCJib3JkZXJSYWRpdXNTaXplIjoibm9uZSIsInRpdGxlIjoiQUFBIFN3YXAiLCJzaG91bGREaXNwbGF5VGlueW1hbkxvZ28iOmZhbHNlfQ%3D%3D",
  width = "415px",
  height = "440px",
  tokens = swapTokens,
}) => {
  const [assetIn, setAssetIn] = useState(defaultAssetIn);
  const [assetOut, setAssetOut] = useState(defaultAssetOut);
  const [filterTextIn, setFilterTextIn] = useState("");
  const [filterTextOut, setFilterTextOut] = useState("");
  const [isDropdownInOpen, setIsDropdownInOpen] = useState(false);
  const [isDropdownOutOpen, setIsDropdownOutOpen] = useState(false);

  const dropdownInRef = useRef<HTMLDivElement>(null);
  const dropdownOutRef = useRef<HTMLDivElement>(null);

  const handleOutsideClick = (event: MouseEvent) => {
    if (
      dropdownInRef.current &&
      !dropdownInRef.current.contains(event.target as Node)
    ) {
      setIsDropdownInOpen(false);
    }
    if (
      dropdownOutRef.current &&
      !dropdownOutRef.current.contains(event.target as Node)
    ) {
      setIsDropdownOutOpen(false);
    }
  };

  const handleDropdownClick = (
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>,
    isOpen: boolean,
    closeOtherDropdown: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    closeOtherDropdown(false); // Close the other dropdown
    setIsOpen(!isOpen); // Toggle the current dropdown
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const widgetSrc = `https://tinymanorg.github.io/swap-widget/?platformName=${encodeURIComponent(
    platformName
  )}&network=mainnet&themeVariables=${themeVariables}&assetIn=${assetIn}&assetOut=${assetOut}&platformFeeAccount=${platformFeeAccount}&platformFeePercentage=${platformFeePercentage}`;

  const uniqueTokens = Array.from(
    new Map(tokens.map((token) => [token.id, token])).values()
  );

  const filteredTokensIn = uniqueTokens.filter(
    (token) =>
      token.name.toLowerCase().includes(filterTextIn.toLowerCase()) ||
      token.id.includes(filterTextIn)
  );

  const filteredTokensOut = uniqueTokens.filter(
    (token) =>
      token.name.toLowerCase().includes(filterTextOut.toLowerCase()) ||
      token.id.includes(filterTextOut)
  );

  const renderDropdown = (
    value: string,
    setValue: React.Dispatch<React.SetStateAction<string>>,
    filterText: string,
    setFilterText: React.Dispatch<React.SetStateAction<string>>,
    isOpen: boolean,
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>,
    closeOtherDropdown: React.Dispatch<React.SetStateAction<boolean>>,
    ref: React.RefObject<HTMLDivElement>,
    label: string,
    tokens: Token[]
  ) => (
    <div className={styles.dropdownContainer} ref={ref}>
      <label className={styles.label}>{label}</label>
      <div
        className={styles.dropdown}
        onClick={() =>
          handleDropdownClick(setIsOpen, isOpen, closeOtherDropdown)
        }
      >
        <div className={styles.selectedItem}>
          <img
            src={tokens.find((token) => token.id === value)?.logo || ""}
            alt="Token Logo"
            className={styles.tokenLogo}
          />
          {tokens.find((token) => token.id === value)?.name || "Select Token"}
        </div>
        <span>▼</span>
      </div>
      {isOpen && (
        <ul className={styles.dropdownList}>
          <li className={styles.dropdownItem}>
            <input
              type="text"
              placeholder="Filter by Unit Name or Asset ID"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className={styles.customInput}
            />
          </li>
          {tokens.map((token) => (
            <li
              key={token.id}
              className={styles.dropdownItem}
              onClick={() => {
                setValue(token.id);
                setIsOpen(false);
                setFilterText(""); // Clear the filter text on selection
              }}
            >
              <img
                src={token.logo}
                alt={token.name}
                className={styles.tokenLogo}
              />
              {token.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div className={styles.container}>
      {/* <h1 className={styles.title}>{title}</h1> */}
      <div className={styles.dropdownWrapper}>
        {renderDropdown(
          assetIn,
          setAssetIn,
          filterTextIn,
          setFilterTextIn,
          isDropdownInOpen,
          setIsDropdownInOpen,
          setIsDropdownOutOpen,
          dropdownInRef,
          "Swap From",
          filteredTokensIn
        )}
        {renderDropdown(
          assetOut,
          setAssetOut,
          filterTextOut,
          setFilterTextOut,
          isDropdownOutOpen,
          setIsDropdownOutOpen,
          setIsDropdownInOpen,
          dropdownOutRef,
          "Swap To",
          filteredTokensOut
        )}
      </div>
      <iframe
        key={`${assetIn}-${assetOut}`}
        title="Tinyman Swap Widget"
        src={widgetSrc}
        className={styles.iframe}
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
      />
    </div>
  );
};
