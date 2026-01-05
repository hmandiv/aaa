import { ReactNode } from "react";
import { PeraWalletConnect } from "@perawallet/connect";
import { PeraWalletContext } from "../PeraWalletContext";

const peraWallet = new PeraWalletConnect();

export const PeraWalletProvider = ({ children }: { children: ReactNode }) => {
  return (
    <PeraWalletContext.Provider value={peraWallet}>
      {children}
    </PeraWalletContext.Provider>
  );
};
