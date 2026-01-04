"use client";
import { useUser, UserButton, SignInButton } from "@clerk/nextjs";
import { usePhantom } from "@/hooks/usePhantom";
import bs58 from "bs58";
import { useState, useEffect } from "react";
import { ArrowRight, Wallet, Github, ExternalLink, Shield, Zap, Check } from "lucide-react";

export default function Home() {
  const { isSignedIn, user } = useUser();
  const { walletAddress, connect, signMessage } = usePhantom();
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [linkedWallet, setLinkedWallet] = useState<string | null>(null);
  const [extensionToken, setExtensionToken] = useState<string>("");

  useEffect(() => {
    if (isSignedIn) {
      fetch('/api/extension-auth')
        .then(res => res.json())
        .then(data => {
          if (data.token) {
            setExtensionToken(data.token);
            localStorage.setItem('git-voucher-auth-token', data.token);
          }
        })
        .catch(err => console.error('Failed to get extension token:', err));
    }
  }, [isSignedIn, user?.publicMetadata]);

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

        const tokenRes = await fetch('/api/extension-auth');
        const tokenData = await tokenRes.json();
        if (tokenData.token) {
          setExtensionToken(tokenData.token);
          localStorage.setItem('git-voucher-auth-token', tokenData.token);
        }
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

  const currentWallet = linkedWallet || (user?.publicMetadata?.wallets as any)?.solana;

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background grid pattern */}
      <div className="absolute inset-0 bg-grid opacity-50" />

      {/* Navigation */}
      <nav className="relative z-10 border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <Wallet className="w-4 h-4 text-black" />
            </div>
            <span className="font-bold text-lg">Git Voucher</span>
          </div>

          <div className="flex items-center gap-4">
            {isSignedIn && (
              <a
                href="/dashboard"
                className="text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Dashboard
              </a>
            )}
            {isSignedIn ? (
              <UserButton afterSignOutUrl="/" />
            ) : (
              <SignInButton mode="modal">
                <button className="text-sm text-zinc-400 hover:text-white transition-colors">
                  Sign In
                </button>
              </SignInButton>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-24 pb-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-800 bg-zinc-900/50 text-sm text-zinc-400 mb-8">
            <span className="w-2 h-2 bg-zinc-400 rounded-full" />
            Now live on Solana Devnet
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-gradient mb-6 leading-tight">
            Send Crypto via<br />GitHub Comments
          </h1>

          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-12">
            Reward contributors, tip developers, and incentivize open source work with SOL vouchers that recipients can claim directly from GitHub.
          </p>

          {!isSignedIn ? (
            <SignInButton mode="modal">
              <button className="group inline-flex items-center gap-3 bg-white text-black font-semibold px-8 py-4 rounded-xl hover:bg-zinc-200 transition-all">
                <Github className="w-5 h-5" />
                Get Started with GitHub
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </SignInButton>
          ) : (
            <a
              href="/dashboard"
              className="group inline-flex items-center gap-3 bg-white text-black font-semibold px-8 py-4 rounded-xl hover:bg-zinc-200 transition-all"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
          )}
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 card-hover">
            <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center mb-4">
              <Github className="w-6 h-6 text-zinc-300" />
            </div>
            <h3 className="text-lg font-semibold mb-2">GitHub Integration</h3>
            <p className="text-zinc-500 text-sm leading-relaxed">
              Create vouchers directly from GitHub issue and PR comments. Just type /pay @username 1 SOL.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 card-hover">
            <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-zinc-300" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Secure Escrow</h3>
            <p className="text-zinc-500 text-sm leading-relaxed">
              Funds are held in on-chain escrow until the recipient claims. Unclaimed vouchers can be cancelled.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 card-hover">
            <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-zinc-300" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Instant Claims</h3>
            <p className="text-zinc-500 text-sm leading-relaxed">
              Recipients connect their wallet and claim SOL directly. No intermediaries, no delays.
            </p>
          </div>
        </div>

        {/* Auth Card */}
        {isSignedIn && (
          <div className="max-w-lg mx-auto">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-zinc-800">
                <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center">
                  <span className="text-xl font-bold">{user?.username?.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <p className="font-semibold">{user?.username}</p>
                  <p className="text-sm text-zinc-500">Connected via GitHub</p>
                </div>
                <a
                  href="/dashboard"
                  className="ml-auto text-xs bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                >
                  Dashboard
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="space-y-4">
                {!walletAddress ? (
                  <button
                    onClick={connect}
                    className="w-full flex items-center justify-center gap-3 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-4 rounded-xl transition-all border border-zinc-700"
                  >
                    <Wallet className="w-5 h-5" />
                    Connect Phantom Wallet
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Wallet Connected</p>
                          <p className="text-xs text-zinc-500 font-mono">
                            {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {!currentWallet && (
                      <button
                        onClick={handleLink}
                        disabled={isLoading}
                        className="w-full bg-white hover:bg-zinc-200 text-black font-semibold py-4 rounded-xl transition-all disabled:opacity-50"
                      >
                        {isLoading ? "Linking..." : "Link Wallet to Account"}
                      </button>
                    )}
                  </div>
                )}

                {status && (
                  <p className={`text-sm text-center py-2 px-4 rounded-lg ${status.includes('Success') ? 'bg-zinc-800 text-white' :
                      status.includes('Failed') || status.includes('Error') ? 'bg-zinc-800 text-zinc-300' :
                        'bg-zinc-800 text-zinc-400'
                    }`}>
                    {status}
                  </p>
                )}

                {currentWallet && (
                  <div className="pt-4 border-t border-zinc-800">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Linked Wallet</p>
                    <code className="block bg-black p-3 rounded-lg text-xs text-zinc-400 font-mono break-all border border-zinc-800">
                      {currentWallet}
                    </code>
                  </div>
                )}

                {extensionToken && (
                  <div className="pt-4 border-t border-zinc-800">
                    <div className="flex items-center gap-2 text-zinc-400 text-sm">
                      <Check className="w-4 h-4" />
                      Extension authenticated
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-800 py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm text-zinc-600">
          <p>Built on Solana</p>
          <p>© 2026 Git Voucher</p>
        </div>
      </footer>
    </div>
  );
}
