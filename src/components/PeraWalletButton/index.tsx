import {
  useEffect,
  useState,
  useContext,
  forwardRef,
  useImperativeHandle,
} from "react";
import { PeraWalletContext } from "../PeraWalletContext";
import styled from "styled-components";

// Premium styled button with animations and effects
interface StyledButtonProps {
  isConnected: boolean;
}

const StyledButton = styled.button<StyledButtonProps>`
  width: 45% !important; /* Ensure the button is responsive and fits well on various screens */
  padding: 18px;
  position: relative;
  background: ${props => 
    props.isConnected 
      ? "linear-gradient(135deg, #9333EA, #7928CA)" 
      : "linear-gradient(135deg, #3B82F6, #1D4ED8)"} !important; /* Gradient background based on connection status */
  border-radius: 12px;
  cursor: pointer;
  border: none;
  margin-bottom: 1.25em;
  color: white;
  font-weight: 600;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 4px 12px ${props => 
    props.isConnected 
      ? "rgba(147, 51, 234, 0.2)" 
      : "rgba(59, 130, 246, 0.2)"};
  overflow: hidden;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px ${props => 
      props.isConnected 
        ? "rgba(147, 51, 234, 0.3)" 
        : "rgba(59, 130, 246, 0.3)"};
  }
  
  &:active {
    transform: translateY(1px);
    box-shadow: 0 2px 8px ${props => 
      props.isConnected 
        ? "rgba(147, 51, 234, 0.3)" 
        : "rgba(59, 130, 246, 0.3)"};
  }
  
  /* Shine effect */
  &::before {
    content: "";
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(
      to right,
      rgba(255, 255, 255, 0),
      rgba(255, 255, 255, 0.3),
      rgba(255, 255, 255, 0)
    );
    transform: rotate(30deg);
    transition: transform 0.7s ease;
    opacity: 0;
  }
  
  &:hover::before {
    opacity: 1;
    transform: rotate(30deg) translate(50%, 50%);
  }

  /* Status indicator */
  &::after {
    content: "";
    position: absolute;
    top: 8px;
    right: 8px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: ${props => 
      props.isConnected 
        ? "#10B981" /* green when connected */
        : "#6B7280" /* gray when disconnected */};
    box-shadow: 0 0 10px ${props => 
      props.isConnected 
        ? "rgba(16, 185, 129, 0.6)" 
        : "rgba(107, 114, 128, 0.3)"};
    transition: all 0.3s ease;
  }
  
  &:hover::after {
    transform: scale(1.2);
  }
`;

interface ButtonTextProps {
  isConnected: boolean;
}

const ButtonText = styled.h2<ButtonTextProps>`
  color: white;
  font-size: 16px;
  margin: 0;
  text-align: center;
  letter-spacing: 0.5px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  
  /* Icon before text */
  &::before {
    content: ${({ isConnected }) => (isConnected ? "'🔒'" : "'🔑'")};
    font-size: 18px;
    transition: transform 0.3s ease;
  }
  
  /* Animation on hover */
  ${StyledButton}:hover &::before {
    transform: ${({ isConnected }) => (isConnected ? "rotate(10deg)" : "rotate(-10deg)")};
  }
`;

const PeraWalletButton = forwardRef(({ onConnect, onDisconnect }: any, ref) => {
  const [accountAddress, setAccountAddress] = useState<string | null>(null);
  const isConnectedToPeraWallet = !!accountAddress;

  const peraWallet = useContext(PeraWalletContext);

  useImperativeHandle(ref, () => ({
    disconnectWallet: handleDisconnectWalletClick,
  }));

  useEffect(() => {
    if (peraWallet) {
      peraWallet
        .reconnectSession()
        .then((accounts) => {
          peraWallet.connector?.on("disconnect", handleDisconnectWalletClick);

          if (accounts.length) {
            const address = accounts[0];
            setAccountAddress(address);
            onConnect(address);
          }
        })
        .catch((e: any) => console.error(e));
    }
  }, []);

  function handleConnectWalletClick() {
    if (peraWallet) {
      peraWallet
        .connect()
        .then((newAccounts: any) => {
          peraWallet.connector?.on("disconnect", handleDisconnectWalletClick);
          const address = newAccounts[0];
          setAccountAddress(address);
          onConnect(address);
        })
        .catch((error: any) => {
          if (error?.data?.type !== "CONNECT_MODAL_CLOSED") {
            console.error(error);
          }
        });
    }
  }

  function handleDisconnectWalletClick() {
    if (peraWallet) {
      peraWallet.disconnect();
    }
    setAccountAddress(null);
    onDisconnect();
  }

  return (
    <StyledButton
      isConnected={isConnectedToPeraWallet}
      onClick={
        isConnectedToPeraWallet
          ? handleDisconnectWalletClick
          : handleConnectWalletClick
      }
    >
      <ButtonText isConnected={isConnectedToPeraWallet}>
        {isConnectedToPeraWallet
          ? "Disconnect Wallet"
          : "Connect Wallet"}
      </ButtonText>
    </StyledButton>
  );
});

export default PeraWalletButton;