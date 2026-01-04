"use client";

import { useUser } from "@clerk/nextjs";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { Loader2, ArrowUpRight, ArrowDownLeft, RefreshCw, Copy, Check, Wallet, Home, ExternalLink } from "lucide-react";
import idl from "../../../public/idl.json";
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

    const copyToken = () => {
        navigator.clipboard.writeText(extensionToken);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isLoaded) return null;

    const pendingCount = vouchersReceived.filter(v => v.account.state.toLowerCase() === 'pending').length;
    const totalReceived = vouchersReceived.reduce((acc, v) => acc + v.account.amount, 0);
    const totalSent = vouchersSent.reduce((acc, v) => acc + v.account.amount, 0);

    return (
        <div className="min-h-screen bg-black relative">
            {/* Background */}
            <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none" />

            {/* Navigation */}
            <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-black/80 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <a href="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                                <Wallet className="w-4 h-4 text-black" />
                            </div>
                            <span className="font-bold">Git Voucher</span>
                        </a>
                        <div className="hidden md:flex items-center gap-1 text-sm">
                            <a href="/" className="px-3 py-1.5 text-zinc-500 hover:text-white transition-colors rounded-lg hover:bg-zinc-900">
                                <Home className="w-4 h-4" />
                            </a>
                            <span className="text-zinc-700">/</span>
                            <span className="px-3 py-1.5 text-white">Dashboard</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-800 bg-zinc-900/50">
                            <div className="w-2 h-2 rounded-full bg-zinc-400" />
                            <span className="font-mono text-sm">{balance.toFixed(4)} SOL</span>
                        </div>
                        <WalletMultiButton className="!bg-white !text-black !font-semibold !h-10 !rounded-xl !text-sm hover:!bg-zinc-200" />
                    </div>
                </div>
            </nav>

            <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-4xl font-bold text-gradient mb-2">Dashboard</h1>
                    <p className="text-zinc-500">Welcome back, {user?.username}</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
                    <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 card-hover">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 rounded-xl bg-zinc-800">
                                <ArrowDownLeft className="w-5 h-5 text-zinc-300" />
                            </div>
                            <span className="text-xs text-zinc-600 font-medium uppercase tracking-wider">Received</span>
                        </div>
                        <p className="text-3xl font-bold mb-1">{vouchersReceived.length}</p>
                        <p className="text-sm text-zinc-600">{totalReceived.toFixed(2)} SOL total</p>
                    </div>

                    <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 card-hover">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 rounded-xl bg-zinc-800">
                                <ArrowUpRight className="w-5 h-5 text-zinc-300" />
                            </div>
                            <span className="text-xs text-zinc-600 font-medium uppercase tracking-wider">Sent</span>
                        </div>
                        <p className="text-3xl font-bold mb-1">{vouchersSent.length}</p>
                        <p className="text-sm text-zinc-600">{totalSent.toFixed(2)} SOL total</p>
                    </div>

                    <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 card-hover">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 rounded-xl bg-zinc-800">
                                <RefreshCw className="w-5 h-5 text-zinc-300" />
                            </div>
                            <span className="text-xs text-zinc-600 font-medium uppercase tracking-wider">Pending</span>
                        </div>
                        <p className="text-3xl font-bold mb-1">{pendingCount}</p>
                        <p className="text-sm text-zinc-600">Unclaimed vouchers</p>
                    </div>

                    <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 card-hover">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 rounded-xl bg-zinc-800">
                                <Wallet className="w-5 h-5 text-zinc-300" />
                            </div>
                            <span className="text-xs text-zinc-600 font-medium uppercase tracking-wider">Balance</span>
                        </div>
                        <p className="text-3xl font-bold mb-1">{balance.toFixed(4)}</p>
                        <p className="text-sm text-zinc-600">SOL</p>
                    </div>
                </div>

                {/* Extension Banner */}
                <div className="mb-12 p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h3 className="font-semibold text-lg mb-1">Browser Extension</h3>
                        <p className="text-sm text-zinc-500">Copy your auth token to use the GitHub extension</p>
                    </div>
                    <button
                        onClick={copyToken}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 transition-all text-sm font-medium"
                    >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copied ? "Copied!" : "Copy Token"}
                    </button>
                </div>

                {/* Transactions */}
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 overflow-hidden">
                    <div className="flex border-b border-zinc-800">
                        <button
                            onClick={() => setActiveTab('received')}
                            className={`px-6 py-4 text-sm font-medium transition-colors relative ${activeTab === 'received' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                        >
                            Received
                            {activeTab === 'received' && (
                                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-white" />
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('sent')}
                            className={`px-6 py-4 text-sm font-medium transition-colors relative ${activeTab === 'sent' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                        >
                            Sent
                            {activeTab === 'sent' && (
                                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-white" />
                            )}
                        </button>
                        <div className="flex-1" />
                        <button
                            onClick={fetchVouchers}
                            className="px-4 py-4 text-zinc-600 hover:text-white transition-colors"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    <div className="p-6">
                        {loading ? (
                            <div className="flex justify-center py-16">
                                <Loader2 className="w-8 h-8 text-zinc-600 animate-spin" />
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-left text-xs text-zinc-600 uppercase tracking-wider">
                                            <th className="pb-4 pl-4 font-medium">Voucher ID</th>
                                            <th className="pb-4 font-medium">Amount</th>
                                            <th className="pb-4 font-medium">Status</th>
                                            <th className="pb-4 font-medium">Date</th>
                                            <th className="pb-4 pr-4 text-right font-medium">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-800">
                                        {(activeTab === 'received' ? vouchersReceived : vouchersSent).map((v) => (
                                            <tr key={v.publicKey.toString()} className="group hover:bg-zinc-900/50 transition-colors">
                                                <td className="py-4 pl-4">
                                                    <span className="font-mono text-sm text-zinc-400 group-hover:text-white transition-colors">
                                                        {v.account.voucherId.substring(0, 20)}...
                                                    </span>
                                                </td>
                                                <td className="py-4">
                                                    <span className="font-semibold">{v.account.amount} SOL</span>
                                                </td>
                                                <td className="py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border
                                                        ${v.account.state.toLowerCase() === 'pending'
                                                            ? 'bg-zinc-800 text-zinc-300 border-zinc-700'
                                                            : v.account.state.toLowerCase() === 'claimed'
                                                                ? 'bg-zinc-800 text-white border-zinc-700'
                                                                : 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}
                                                    >
                                                        {v.account.state}
                                                    </span>
                                                </td>
                                                <td className="py-4 text-sm text-zinc-500">
                                                    {new Date(v.account.created_at * 1000).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    })}
                                                </td>
                                                <td className="py-4 pr-4 text-right">
                                                    {activeTab === 'received' && v.account.state.toLowerCase() === 'pending' && (
                                                        <a
                                                            href={`/claim/${v.account.voucherId}`}
                                                            className="inline-flex items-center gap-1.5 bg-white hover:bg-zinc-200 text-black text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                                                        >
                                                            Claim
                                                            <ExternalLink className="w-3 h-3" />
                                                        </a>
                                                    )}
                                                    {activeTab === 'sent' && (
                                                        <span className="text-xs text-zinc-700">—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}

                                        {(activeTab === 'received' ? vouchersReceived : vouchersSent).length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="py-16 text-center">
                                                    <div className="flex flex-col items-center gap-3">
                                                        <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800">
                                                            <Wallet className="w-6 h-6 text-zinc-600" />
                                                        </div>
                                                        <p className="text-zinc-600">No vouchers found</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
