"use client";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { usePhantom } from "@/hooks/usePhantom";
import { getConnection, getVoucherPDA } from "@/lib/solana";

export default function VouchersPage() {
  const { user } = useUser();
  const { walletAddress, connect } = usePhantom();
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && walletAddress) {
      loadVouchers();
    }
  }, [user, walletAddress]);

  const loadVouchers = async () => {
    setLoading(true);
    try {
      // TODO: Fetch vouchers from your database or blockchain
      // For now, this is a placeholder
      setVouchers([]);
    } catch (error) {
      console.error("Load vouchers error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (voucherId: string) => {
    if (!walletAddress) {
      alert("Please connect your wallet first");
      return;
    }

    try {
      const res = await fetch("/api/claim-voucher", {
        method: "POST",
        body: JSON.stringify({ voucherId }),
      });

      const data = await res.json();

      // TODO: Build and send claim transaction
      alert("Voucher claimed! (Implementation pending)");
      loadVouchers();
    } catch (error) {
      console.error("Claim error:", error);
      alert("Failed to claim voucher");
    }
  };

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">My Vouchers</h1>

        {!walletAddress && (
          <button
            onClick={connect}
            className="bg-purple-500 px-6 py-3 rounded-lg font-bold"
          >
            Connect Wallet to View Vouchers
          </button>
        )}

        {loading && <p>Loading vouchers...</p>}

        {vouchers.length === 0 && !loading && (
          <div className="border border-white/10 rounded-lg p-8 text-center">
            <p className="text-gray-400">No vouchers found</p>
          </div>
        )}

        <div className="space-y-4">
          {vouchers.map((voucher) => (
            <div
              key={voucher.id}
              className="border border-white/10 rounded-lg p-6 bg-white/5"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold">{voucher.amount} SOL</p>
                  <p className="text-sm text-gray-400">{voucher.reason}</p>
                </div>
                <button
                  onClick={() => handleClaim(voucher.voucherId)}
                  className="bg-green-500 px-4 py-2 rounded-lg font-bold hover:bg-green-600"
                >
                  Claim
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
