"use client";
import { useUser, UserButton, SignInButton } from "@clerk/nextjs";
import { usePhantom } from "@/hooks/usePhantom";
import bs58 from "bs58";
import { useState } from "react";

export default function Home() {
  const { isSignedIn, user } = useUser();
  const { walletAddress, connect, signMessage } = usePhantom();
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [linkedWallet, setLinkedWallet] = useState<string | null>(null);

  const handleLink = async () => {
    if (!walletAddress || !user) return;
    setIsLoading(true);
    setStatus("Please sign the message in Phantom...");

    try {
      const msg = `Link Solana Wallet ${walletAddress} to GitHub user ${user.username}`;
      const signatureUint8 = await signMessage(msg);
      
      if (!signatureUint8) {
        setStatus("Signature rejected");
        setIsLoading(false);
        return;
      }

      const signatureStr = bs58.encode(signatureUint8);
      setStatus("Verifying signature...");
      
      const res = await fetch("/api/link-wallet", {
        method: "POST",
        body: JSON.stringify({
          address: walletAddress,
          signature: signatureStr
        })
      });

      if (res.ok) {
        setStatus("Success! Wallet Linked.");
        await user.reload();
        setLinkedWallet(walletAddress);
      } else {
        const txt = await res.text();
        setStatus(`Failed: ${txt}`);
      }
    } catch (err) {
      setStatus("Error linking wallet.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-md border border-white/10 rounded-xl p-8 bg-[#111]">
        <h1 className="text-2xl font-bold mb-8 text-center">Git Voucher Bridge</h1>

        {!isSignedIn ? (
          <div className="text-center">
             <SignInButton mode="modal">
               <button className="bg-white text-black px-6 py-2 rounded-lg font-bold hover:bg-gray-200 transition">
                 Sign In with GitHub
               </button>
             </SignInButton>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between bg-white/5 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <UserButton />
                <div>
                  <p className="font-bold">{user.username}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {!walletAddress ? (
                <button 
                  onClick={connect} 
                  className="w-full bg-[#AB9FF2] text-black font-bold py-3 rounded-lg hover:bg-[#9a8ee0] transition"
                >
                  Connect Phantom
                </button>
              ) : (
                <div className="text-center">
                  <div className="text-xs text-green-400 mb-2 bg-green-900/20 py-1 px-2 rounded inline-block">
                    Connected: {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
                  </div>
                  <button 
                    onClick={handleLink}
                    disabled={isLoading}
                    className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
                  >
                    {isLoading ? "Linking..." : "Link Wallet to Account"}
                  </button>
                </div>
              )}
            </div>
            
            {status && <p className="text-sm text-center text-yellow-400 font-mono">{status}</p>}

            <div className="mt-4 border-t border-white/10 pt-4">
              <p className="text-xs text-gray-500 uppercase mb-2">Linked Wallet:</p>
              <code className="block bg-black p-2 rounded text-xs text-blue-400 break-all">
                {linkedWallet || (user.publicMetadata.wallets as any)?.solana || "None"}
              </code>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
