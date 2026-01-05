import { PeraWalletConnect } from "@perawallet/connect";
import { createContext } from "react";

export const PeraWalletContext = createContext<PeraWalletConnect | null>(null);
