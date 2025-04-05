import { useEffect, useState } from "react";
import { JsonRpcProvider } from "ethers";

export const useWalletAddress = () => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  useEffect(() => {
    const getWallet = async () => {
      try {
        const provider = new JsonRpcProvider("http://192.168.112.238:8545");
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        setWalletAddress(address);
      } catch (err) {
        console.error("⚠️ Wallet address fetch failed:", err);
        setWalletAddress(null);
      }
    };

    getWallet();
  }, []);

  return walletAddress;
};
