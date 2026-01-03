import { useState, useEffect } from 'react';
import { PublicKey } from '@solana/web3.js';

export const usePhantom = () => {
  const [provider, setProvider] = useState<any>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  useEffect(() => {
    if ("solana" in window) {
      const solana = (window as any).solana;
      if (solana?.isPhantom) {
        setProvider(solana);
        solana.connect({ onlyIfTrusted: true })
          .then(({ publicKey }: { publicKey: PublicKey }) => {
            setWalletAddress(publicKey.toString());
          })
          .catch(() => {});
      }
    }
  }, []);

  const connect = async () => {
    if (provider) {
      try {
        const { publicKey } = await provider.connect();
        setWalletAddress(publicKey.toString());
        return publicKey.toString();
      } catch (err) {
        console.error(err);
      }
    } else {
      window.open("https://phantom.app/", "_blank");
    }
  };

  const signMessage = async (message: string) => {
    if (!provider) return;
    const encodedMessage = new TextEncoder().encode(message);
    const { signature } = await provider.signMessage(encodedMessage, "utf8");
    return signature;
  };

  return { provider, walletAddress, connect, signMessage };
};
