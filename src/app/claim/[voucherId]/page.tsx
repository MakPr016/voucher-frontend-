"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import * as anchor from "@coral-xyz/anchor";
import { Buffer } from "buffer";
import { Wallet, Loader2, CheckCircle, XCircle, ArrowLeft, ExternalLink } from "lucide-react";
import { PublicKey } from "@solana/web3.js";
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
    const { connection } = useConnection();

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
    }, [voucherId, userGithubId, wallet]);

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

            const provider = new anchor.AnchorProvider(
                connection,
                wallet || { publicKey: new PublicKey("11111111111111111111111111111111"), signTransaction: async () => { }, signAllTransactions: async () => { } } as any,
                {}
            );

            const program = new anchor.Program(idl as any, provider) as any;

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
                state: Object.keys(account.state)[0]
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

        const balance = await connection.getBalance(wallet.publicKey);
        if (balance < 0.001 * 1_000_000_000) {
            setError("Insufficient SOL for transaction fees. Please airdrop some Devnet SOL to your wallet.");
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
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                    <p className="text-zinc-600 text-sm">Loading voucher...</p>
                </div>
            </div>
        );
    }

    if (error && !voucherData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black p-4">
                <div className="max-w-md w-full">
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-6">
                            <XCircle className="w-8 h-8 text-zinc-400" />
                        </div>
                        <h1 className="text-xl font-bold mb-2">Error</h1>
                        <p className="text-zinc-500 text-sm mb-6">{error}</p>
                        <a href="/" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Home
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    const isOwnerCheck = String(userGithubId) === voucherData?.recipientGithubId;

    return (
        <div className="min-h-screen bg-black relative overflow-hidden">
            {/* Background */}
            <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none" />

            {/* Navigation */}
            <nav className="relative z-10 border-b border-zinc-800">
                <div className="max-w-6xl mx-auto px-6 py-4">
                    <a href="/" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </a>
                </div>
            </nav>

            <main className="relative z-10 flex items-center justify-center min-h-[calc(100vh-60px)] p-4">
                <div className="w-full max-w-md">
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8">
                        {/* Header */}
                        <div className="flex justify-center mb-8">
                            <div className="w-20 h-20 rounded-2xl bg-zinc-800 flex items-center justify-center border border-zinc-700">
                                <Wallet className="w-10 h-10 text-zinc-300" />
                            </div>
                        </div>

                        <h1 className="text-2xl font-bold text-center mb-2">Claim Voucher</h1>
                        <p className="text-center text-zinc-600 text-sm mb-8">
                            <span className="font-mono bg-zinc-800 px-2 py-1 rounded border border-zinc-700">
                                {String(voucherId).substring(0, 12)}...
                            </span>
                        </p>

                        {/* Voucher Details */}
                        <div className="space-y-3 mb-8">
                            <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
                                <span className="text-zinc-500 text-sm">Value</span>
                                <span className="text-2xl font-bold">{voucherData?.amount} SOL</span>
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
                                <span className="text-zinc-500 text-sm">Status</span>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${voucherData?.state?.toLowerCase() === 'pending'
                                        ? 'bg-zinc-800 text-zinc-300 border-zinc-600'
                                        : voucherData?.state?.toLowerCase() === 'claimed'
                                            ? 'bg-zinc-800 text-white border-zinc-600'
                                            : 'bg-zinc-800 text-zinc-500 border-zinc-600'
                                    }`}>
                                    {voucherData?.state}
                                </span>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="mb-6 p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
                                <p className="text-zinc-400 text-sm">{error}</p>
                            </div>
                        )}

                        {/* Action Area */}
                        {success ? (
                            <div className="text-center p-6 rounded-xl bg-zinc-800/50 border border-zinc-700">
                                <CheckCircle className="w-12 h-12 text-white mx-auto mb-4" />
                                <h3 className="text-lg font-bold mb-2">Claimed Successfully!</h3>
                                <p className="text-zinc-500 text-sm mb-4">The funds have been transferred to your wallet.</p>
                                <a
                                    href="/dashboard"
                                    className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
                                >
                                    View in Dashboard
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            </div>
                        ) : (
                            <>
                                {!wallet ? (
                                    <div className="text-center">
                                        <p className="text-zinc-500 text-sm mb-4">Connect your wallet to claim</p>
                                        <WalletMultiButton className="!w-full !bg-white !text-black !font-semibold !py-4 !rounded-xl hover:!bg-zinc-200 !justify-center" />
                                    </div>
                                ) : (
                                    <>
                                        {!isOwnerCheck ? (
                                            <div className="p-6 rounded-xl bg-zinc-800/50 border border-zinc-700 text-center">
                                                <h3 className="text-zinc-300 font-semibold mb-2">Not Authorized</h3>
                                                <p className="text-zinc-500 text-sm">
                                                    This voucher is for GitHub ID <span className="font-mono text-zinc-300">{voucherData?.recipientGithubId}</span>.
                                                    <br />
                                                    You are <span className="text-white">{username}</span> ({userGithubId}).
                                                </p>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={handleClaim}
                                                disabled={claiming || voucherData?.state?.toLowerCase() !== 'pending'}
                                                className="w-full bg-white hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
                                            >
                                                {claiming ? (
                                                    <>
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                        Processing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Wallet className="w-5 h-5" />
                                                        Claim {voucherData?.amount} SOL
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
