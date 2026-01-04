"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import * as anchor from "@coral-xyz/anchor";
import { Buffer } from "buffer";
import { Wallet, Loader2, CheckCircle, XCircle } from "lucide-react";
import { Connection, PublicKey } from "@solana/web3.js";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import idl from "../../../../public/idl.json";

const PROGRAM_ID = new PublicKey("8iRpzhFJF4PJnhyKZRDXk6B3TKjxQGEX6kcsteYq77iR");

if (typeof window !== 'undefined') {
    (window as any).Buffer = (window as any).Buffer || Buffer;
}

export default function ClaimPage() {
    const { voucherId } = useParams();
    const wallet = useAnchorWallet();
    const { connection } = useConnection(); // Use the hook to get connection

    const [loading, setLoading] = useState(true);
    const [claiming, setClaiming] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [voucherData, setVoucherData] = useState<any>(null);
    const [userGithubId, setUserGithubId] = useState<string | null>(null);
    const [username, setUsername] = useState<string | null>(null);

    useEffect(() => {
        checkAuth();
    }, []);

    useEffect(() => {
        if (voucherId && userGithubId) {
            fetchVoucher();
        }
    }, [voucherId, userGithubId, wallet]); // Re-fetch on wallet change to update program provider

    const checkAuth = async () => {
        try {
            const res = await fetch("/api/me");
            const data = await res.json();
            if (data.authenticated) {
                setUserGithubId(data.githubId);
                setUsername(data.username);
            } else {
                setError("Please login with GitHub first");
                setLoading(false);
            }
        } catch (err) {
            console.error(err);
            setError("Failed to check auth");
            setLoading(false);
        }
    };

    const fetchVoucher = async () => {
        try {
            setLoading(true);

            // Use a read-only provider if wallet not connected, or the wallet provider
            const provider = new anchor.AnchorProvider(
                connection,
                wallet || { publicKey: new PublicKey("11111111111111111111111111111111"), signTransaction: async () => { }, signAllTransactions: async () => { } } as any,
                {}
            );

            const program = new anchor.Program(idl as any, provider) as any;

            // Derive Voucher PDA
            const [voucherPDA] = PublicKey.findProgramAddressSync(
                [Buffer.from("voucher"), Buffer.from(voucherId as string)],
                PROGRAM_ID
            );

            const account = await program.account.voucherEscrow.fetch(voucherPDA);
            console.log("Fetched voucher:", account);

            setVoucherData({
                ...account,
                amount: account.amount.toNumber() / 1_000_000_000,
                recipientGithubId: account.recipientGithubId.toString(),
                state: Object.keys(account.state)[0] // 'pending', 'claimed', etc.
            });

            setLoading(false);
        } catch (err: any) {
            console.error("Fetch error:", err);
            setError("Voucher not found or invalid: " + err.message);
            setLoading(false);
        }
    };

    const handleClaim = async () => {
        if (!wallet) {
            setError("Please connect your wallet");
            return;
        }

        if (!voucherData) return;

        // Check if user has enough SOL for gas fees
        const balance = await connection.getBalance(wallet.publicKey);
        if (balance < 0.001 * 1_000_000_000) { // Check for at least 0.001 SOL
            setError("Insufficient SOL for transaction fees. You need a small amount of SOL to pay for gas. Please airdrop some Devnet SOL to your wallet.");
            return;
        }

        setClaiming(true);
        setError("");

        try {
            const provider = new anchor.AnchorProvider(connection, wallet, {});
            const program = new anchor.Program(idl as any, provider) as any;

            const [voucherPDA] = PublicKey.findProgramAddressSync(
                [Buffer.from("voucher"), Buffer.from(voucherId as string)],
                PROGRAM_ID
            );

            // Using the updated-contract.rs provided by user:
            // fn claim_voucher(ctx: Context<ClaimVoucher>)
            // Accounts: voucher (mut), recipient (mut, signer), system_program

            const tx = await program.methods
                .claimVoucher()
                .accounts({
                    voucher: voucherPDA,
                    recipient: wallet.publicKey,
                    systemProgram: anchor.web3.SystemProgram.programId,
                })
                .rpc();

            console.log("Claim tx:", tx);
            await connection.confirmTransaction(tx);

            setSuccess(true);
            setVoucherData((prev: any) => ({ ...prev, state: "claimed" }));

        } catch (err: any) {
            console.error("Claim error:", err);
            setError("Claim failed: " + err.message);
        } finally {
            setClaiming(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0d1117]">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0d1117] p-4">
                <div className="bg-[#161b22] border border-red-500/20 p-8 rounded-xl max-w-md w-full text-center">
                    <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-white mb-2">Error</h1>
                    <p className="text-gray-400">{error}</p>
                </div>
            </div>
        );
    }

    // Assuming string comparison works
    // Note: userGithubId from API might be number or string, voucherData.recipientGithubId is string (from BN.toString())
    // We should ensure flexible comparison
    const isOwnerCheck = String(userGithubId) === voucherData?.recipientGithubId;

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#0d1117] p-4 relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-[120px]" />

            <div className="bg-[#161b22] border border-white/10 p-8 rounded-2xl max-w-md w-full shadow-2xl relative z-10 backdrop-blur-sm">
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20">
                        <Wallet className="w-8 h-8 text-green-500" />
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-center text-white mb-2">Claim Voucher</h1>
                <p className="text-center text-gray-400 mb-8 text-sm">
                    Voucher ID: <span className="font-mono text-gray-500">{String(voucherId).substring(0, 8)}...</span>
                </p>

                <div className="space-y-4 mb-8">
                    <div className="bg-[#0d1117] p-4 rounded-lg border border-white/5 flex justify-between items-center">
                        <span className="text-gray-400 text-sm">Value</span>
                        <span className="text-2xl font-bold text-white">{voucherData?.amount} SOL</span>
                    </div>

                    <div className="bg-[#0d1117] p-4 rounded-lg border border-white/5 flex justify-between items-center">
                        <span className="text-gray-400 text-sm">Status</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium uppercase tracking-wider ${voucherData?.state?.toLowerCase() === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                            voucherData?.state?.toLowerCase() === 'claimed' ? 'bg-green-500/20 text-green-500' :
                                'bg-red-500/20 text-red-500'
                            }`}>
                            {voucherData?.state}
                        </span>
                    </div>
                </div>

                {success ? (
                    <div className="text-center bg-green-500/10 border border-green-500/20 rounded-lg p-6">
                        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                        <h3 className="text-lg font-bold text-green-500 mb-1">Claimed Successfully!</h3>
                        <p className="text-green-200/60 text-sm">The funds have been transferred to your wallet.</p>
                    </div>
                ) : (
                    <>
                        {!wallet ? (
                            <div className="flex flex-col items-center gap-4">
                                <p className="text-gray-400 text-sm">Connect wallet to claim</p>
                                <WalletMultiButton className="!bg-[#AB9FF2] hover:!bg-[#9a8ee0] !transition-colors !rounded-lg !h-[56px] w-full justify-center" />
                            </div>
                        ) : (
                            <>
                                {!isOwnerCheck ? (
                                    <div className="p-4 bg-red-900/20 border border-red-500/20 rounded-lg text-center">
                                        <h3 className="text-red-400 font-bold mb-1">Not Authorized</h3>
                                        <p className="text-red-200/60 text-sm">
                                            This voucher belongs to GitHub user ID {voucherData?.recipientGithubId}.
                                            <br />
                                            You are logged in as {username} ({userGithubId}).
                                        </p>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleClaim}
                                        disabled={claiming || voucherData?.state?.toLowerCase() !== 'pending'}
                                        className="w-full bg-[#238636] hover:bg-[#2ea043] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-lg transition-all transform active:scale-[0.98] shadow-lg shadow-green-900/20 flex items-center justify-center gap-2"
                                    >
                                        {claiming ? <Loader2 className="animate-spin" /> : <Wallet className="w-5 h-5" />}
                                        {claiming ? "Processing..." : "Claim to Wallet"}
                                    </button>
                                )}
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
