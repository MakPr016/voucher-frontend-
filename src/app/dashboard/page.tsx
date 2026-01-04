"use client";

import { useUser, UserButton } from "@clerk/nextjs";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import {
    Loader2, ArrowUpRight, ArrowDownLeft, RefreshCw,
    Copy, Check, Wallet, Home, ExternalLink,
    ChevronRight, LogOut, Github
} from "lucide-react";
import idl from "../../../public/idl.json";
import Link from "next/link";
import { Buffer } from "buffer";

if (typeof window !== 'undefined') {
    (window as any).Buffer = (window as any).Buffer || Buffer;
}

const PROGRAM_ID = new PublicKey("8iRpzhFJF4PJnhyKZRDXk6B3TKjxQGEX6kcsteYq77iR");

type Voucher = {
    publicKey: PublicKey;
    account: {
        voucherId: string;
        amount: number;
        recipientGithubId: string;
        organization: PublicKey;
        state: string;
        created_at: number;
        expires_at: number;
        metadata: string;
    };
};

export default function DashboardPage() {
    const { user, isLoaded } = useUser();
    const { connection } = useConnection();
    const wallet = useAnchorWallet();

    const [loading, setLoading] = useState(true);
    const [vouchersSent, setVouchersSent] = useState<Voucher[]>([]);
    const [vouchersReceived, setVouchersReceived] = useState<Voucher[]>([]);
    const [balance, setBalance] = useState<number>(0);
    const [githubId, setGithubId] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
    const [copied, setCopied] = useState(false);
    const [tokenCopied, setTokenCopied] = useState(false);
    const [extensionToken, setExtensionToken] = useState("");

    useEffect(() => {
        if (isLoaded && user) {
            fetchUserData();
            if (wallet) {
                fetchBalance();
            }
        }
    }, [isLoaded, user, wallet]);

    useEffect(() => {
        if (githubId) {
            fetchVouchers();
        }
    }, [githubId, wallet]);

    const fetchUserData = async () => {
        try {
            const res = await fetch("/api/me");
            const data = await res.json();
            if (data.githubId) {
                setGithubId(Number(data.githubId));
            }

            const tokenRes = await fetch('/api/extension-auth');
            const tokenData = await tokenRes.json();
            if (tokenData.token) {
                setExtensionToken(tokenData.token);
            }
        } catch (err) {
            console.error("Failed to fetch user data", err);
        }
    };

    const fetchBalance = async () => {
        if (!wallet) return;
        try {
            const bal = await connection.getBalance(wallet.publicKey);
            setBalance(bal / 1_000_000_000);
        } catch (err) {
            console.error("Failed to fetch balance", err);
        }
    };

    const fetchVouchers = async () => {
        setLoading(true);
        try {
            const provider = new anchor.AnchorProvider(
                connection,
                wallet || { publicKey: new PublicKey("11111111111111111111111111111111"), signTransaction: async () => { }, signAllTransactions: async () => { } } as any,
                {}
            );
            const program = new anchor.Program(idl as any, provider) as any;

            const allVouchers = await program.account.voucherEscrow.all();

            const sent: Voucher[] = [];
            const received: Voucher[] = [];

            let myOrgPDA: PublicKey | null = null;
            if (githubId) {
                [myOrgPDA] = PublicKey.findProgramAddressSync(
                    [Buffer.from("organization"), new anchor.BN(githubId).toArrayLike(Buffer, "le", 8)],
                    PROGRAM_ID
                );
            }

            allVouchers.forEach((v: any) => {
                const data = v.account;
                const processedVoucher: Voucher = {
                    publicKey: v.publicKey,
                    account: {
                        ...data,
                        amount: data.amount.toNumber() / 1_000_000_000,
                        recipientGithubId: data.recipientGithubId.toString(),
                        state: Object.keys(data.state)[0],
                    }
                };

                if (githubId && processedVoucher.account.recipientGithubId === String(githubId)) {
                    received.push(processedVoucher);
                }

                if (myOrgPDA && processedVoucher.account.organization.toString() === myOrgPDA.toString()) {
                    sent.push(processedVoucher);
                }
            });

            setVouchersSent(sent.sort((a, b) => b.account.created_at - a.account.created_at));
            setVouchersReceived(received.sort((a, b) => b.account.created_at - a.account.created_at));

        } catch (err) {
            console.error("Error fetching vouchers:", err);
        } finally {
            setLoading(false);
        }
    };

    const copyWallet = () => {
        if (wallet) {
            navigator.clipboard.writeText(wallet.publicKey.toString());
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const copyToken = () => {
        navigator.clipboard.writeText(extensionToken);
        setTokenCopied(true);
        setTimeout(() => setTokenCopied(false), 2000);
    };

    if (!isLoaded) return null;

    const pendingCount = vouchersReceived.filter(v => v.account.state.toLowerCase() === 'pending').length;
    const totalReceived = vouchersReceived.reduce((acc, v) => acc + v.account.amount, 0);
    const totalSent = vouchersSent.reduce((acc, v) => acc + v.account.amount, 0);

    const activeVouchers = activeTab === 'received' ? vouchersReceived : vouchersSent;

    return (
        <div className="min-h-screen bg-black text-white selection:bg-zinc-800">
            {/* Header / Nav */}
            <nav className="border-b border-zinc-900 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                                <Wallet className="w-4 h-4 text-black" />
                            </div>
                            <span className="font-bold">Git Voucher</span>
                        </Link>
                        <div className="flex items-center gap-3 text-[13px] text-zinc-500">
                            <Link href="/" className="hover:text-white transition-colors">
                                <Home className="w-4 h-4" />
                            </Link>
                            <ChevronRight className="w-3 h-3 text-zinc-800" />
                            <span className="text-zinc-300 font-medium">Dashboard</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/50 border border-zinc-800 text-[13px] text-zinc-400">
                            <div className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                            {balance.toFixed(4)} SOL
                        </div>
                        <WalletMultiButton className="!bg-white !text-black !font-bold !h-9 !px-4 !rounded-xl !text-[13px] !transition-all hover:!bg-zinc-200 !border-none !shadow-none" />
                        <UserButton afterSignOutUrl="/" />
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="mb-12">
                    <h1 className="text-5xl font-bold mb-3 tracking-tight">Dashboard</h1>
                    <p className="text-zinc-500 font-light">Welcome back, {user?.username}</p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-16">
                    <div className="bg-[#0c0c0c] border border-zinc-900 rounded-2xl p-6 relative group">
                        <div className="w-10 h-10 rounded-xl bg-zinc-900/50 flex items-center justify-center mb-6 border border-zinc-800">
                            <ArrowDownLeft className="w-5 h-5 text-zinc-500" />
                        </div>
                        <div className="absolute top-6 right-6 text-[11px] font-bold text-zinc-700 tracking-widest uppercase">Received</div>
                        <div className="text-4xl font-bold mb-1 tracking-tight">{vouchersReceived.length}</div>
                        <div className="text-[13px] text-zinc-600 font-medium">{totalReceived.toFixed(2)} SOL total</div>
                    </div>

                    <div className="bg-[#0c0c0c] border border-zinc-900 rounded-2xl p-6 relative group">
                        <div className="w-10 h-10 rounded-xl bg-zinc-900/50 flex items-center justify-center mb-6 border border-zinc-800">
                            <ArrowUpRight className="w-5 h-5 text-zinc-500" />
                        </div>
                        <div className="absolute top-6 right-6 text-[11px] font-bold text-zinc-700 tracking-widest uppercase">Sent</div>
                        <div className="text-4xl font-bold mb-1 tracking-tight">{vouchersSent.length}</div>
                        <div className="text-[13px] text-zinc-600 font-medium">{totalSent.toFixed(2)} SOL total</div>
                    </div>

                    <div className="bg-[#0c0c0c] border border-zinc-900 rounded-2xl p-6 relative group">
                        <div className="w-10 h-10 rounded-xl bg-zinc-900/50 flex items-center justify-center mb-6 border border-zinc-800">
                            <RefreshCw className="w-5 h-5 text-zinc-500" />
                        </div>
                        <div className="absolute top-6 right-6 text-[11px] font-bold text-zinc-700 tracking-widest uppercase">Pending</div>
                        <div className="text-4xl font-bold mb-1 tracking-tight">{pendingCount}</div>
                        <div className="text-[13px] text-zinc-600 font-medium">Unclaimed vouchers</div>
                    </div>

                    <div className="bg-[#0c0c0c] border border-zinc-900 rounded-2xl p-6 relative group">
                        <div className="w-10 h-10 rounded-xl bg-zinc-900/50 flex items-center justify-center mb-6 border border-zinc-800">
                            <Wallet className="w-5 h-5 text-zinc-500" />
                        </div>
                        <div className="absolute top-6 right-6 text-[11px] font-bold text-zinc-700 tracking-widest uppercase">Balance</div>
                        <div className="text-4xl font-bold mb-1 tracking-tight">{balance.toFixed(4)}</div>
                        <div className="text-[13px] text-zinc-600 font-medium tracking-wide uppercase">SOL</div>
                    </div>
                </div>

                {/* Extension Banner - Functional Restoration */}
                <div className="mb-12 p-6 rounded-2xl border border-zinc-900 bg-[#0c0c0c] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h3 className="font-semibold text-lg mb-1 tracking-tight">Browser Extension</h3>
                        <p className="text-[13px] text-zinc-500 font-light">Copy your authentication token to use the GitHub extension for sending vouchers.</p>
                    </div>
                    <button
                        onClick={copyToken}
                        className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 transition-all text-sm font-semibold shadow-sm"
                    >
                        {tokenCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {tokenCopied ? "Copied!" : "Copy Token"}
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Connection Details */}
                    <div className="lg:col-span-4 space-y-6">
                        <h2 className="text-xl font-bold mb-6 tracking-tight">Connection Details</h2>

                        <div className="bg-[#0c0c0c] border border-zinc-900 rounded-[24px] p-6">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-14 h-14 rounded-[18px] overflow-hidden border border-zinc-800">
                                    <img src={user?.imageUrl} alt="Profile" className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <div className="font-bold text-lg">@{user?.username}</div>
                                    <div className="flex items-center gap-2 text-[13px] text-zinc-500 font-medium">
                                        <Github className="w-3.5 h-3.5" />
                                        GitHub Connected
                                    </div>
                                </div>
                            </div>

                            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-[20px] p-5 mb-4">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2 text-[13px] font-medium text-white">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]" />
                                        Mainnet Wallet
                                    </div>
                                    <button onClick={copyWallet} className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-600 hover:text-white transition-all">
                                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                                <div className="bg-black/50 border border-zinc-800 rounded-xl p-3.5 text-[12px] font-mono text-zinc-500 break-all leading-relaxed">
                                    {wallet?.publicKey.toString()}
                                </div>
                            </div>

                            <button className="w-full py-4 bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800 text-white rounded-[18px] font-semibold text-[14px] flex items-center justify-center gap-2.5 transition-all group">
                                Disconnect
                                <LogOut className="w-4 h-4 text-zinc-600 group-hover:text-white transition-colors" />
                            </button>
                        </div>
                    </div>

                    {/* Right Column: Recent Activity with Tabs */}
                    <div className="lg:col-span-8">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-8">
                                <button
                                    onClick={() => setActiveTab('received')}
                                    className={`text-xl font-bold tracking-tight transition-colors ${activeTab === 'received' ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'}`}
                                >
                                    Received
                                </button>
                                <button
                                    onClick={() => setActiveTab('sent')}
                                    className={`text-xl font-bold tracking-tight transition-colors ${activeTab === 'sent' ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'}`}
                                >
                                    Sent
                                </button>
                            </div>
                            <button className="text-[11px] font-bold text-zinc-700 uppercase tracking-widest hover:text-white transition-colors">View all history</button>
                        </div>

                        <div className="space-y-3">
                            {loading ? (
                                <div className="py-20 flex flex-col items-center justify-center text-zinc-600 gap-4">
                                    <Loader2 className="w-8 h-8 animate-spin" />
                                    <span className="text-[13px] font-medium">Fetching activities...</span>
                                </div>
                            ) : (
                                <>
                                    {activeVouchers.length > 0 ? (
                                        activeVouchers.slice(0, 10).map((v, i) => (
                                            <div key={v.publicKey.toString()} className="bg-[#0c0c0c] border border-zinc-900 rounded-[20px] p-5 flex items-center justify-between group transition-all hover:bg-zinc-900/30">
                                                <div className="flex items-center gap-5">
                                                    <div className={`w-11 h-11 rounded-[14px] flex items-center justify-center border ${activeTab === 'sent' ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                                                        {activeTab === 'sent' ? <ArrowUpRight className="w-5 h-5 text-indigo-400" /> : <ArrowDownLeft className="w-5 h-5 text-emerald-400" />}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-[15px] mb-0.5 tracking-tight group-hover:text-white transition-colors">
                                                            {activeTab === 'sent' ? `Voucher Sent on Issue #${v.account.voucherId.slice(0, 3)}` : 'Voucher Received from Repository'}
                                                        </div>
                                                        <div className="text-[12px] text-zinc-600 font-medium">
                                                            {v.account.amount.toFixed(2)} SOL {activeTab === 'sent' ? `to GitHub ID ${v.account.recipientGithubId}` : 'for contribution'}
                                                            <span className="mx-2 opacity-50">•</span>
                                                            <span className={`capitalize ${v.account.state.toLowerCase() === 'claimed' ? 'text-zinc-400' : 'text-emerald-500'}`}>{v.account.state}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    <div className="text-right">
                                                        <div className="font-bold text-[14px] mb-0.5">{v.account.amount.toFixed(2)} SOL</div>
                                                        <div className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest">
                                                            {new Date(v.account.created_at * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </div>
                                                    </div>
                                                    {activeTab === 'received' && v.account.state.toLowerCase() === 'pending' && (
                                                        <a href={`/claim/${v.account.voucherId}`} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
                                                            <ExternalLink className="w-4 h-4 text-zinc-400" />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-20 text-center text-zinc-600 bg-[#0c0c0c] border border-zinc-900 rounded-[20px]">
                                            <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800 mx-auto mb-4">
                                                <Wallet className="w-6 h-6 text-zinc-800" />
                                            </div>
                                            <p className="text-[14px] font-light">No {activeTab} vouchers found.</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
