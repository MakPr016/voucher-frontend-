"use client";
import { useUser, UserButton, SignInButton, SignUpButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePhantom } from "@/hooks/usePhantom";
import { ArrowRight, Wallet, Github, Shield, Zap, Download } from "lucide-react";

export default function Home() {
    const { isSignedIn } = useUser();

    return (
        <div className="min-h-screen bg-black text-white selection:bg-zinc-800">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-black/50 backdrop-blur-xl border-b border-zinc-900">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                            <Wallet className="w-5 h-5 text-black" />
                        </div>
                        <span className="font-bold text-xl tracking-tight">Git Pay</span>
                    </div>

                    <div className="flex items-center gap-6">
                        {isSignedIn ? (
                            <div className="flex items-center gap-6">
                                <button className="text-sm font-medium text-zinc-400 hover:text-white transition-colors flex items-center gap-2">
                                    <Download className="w-4 h-4" />
                                    Install
                                </button>
                                <Link href="/dashboard" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                                    Dashboard
                                </Link>
                                <UserButton afterSignOutUrl="/" />
                            </div>
                        ) : (
                            <div className="flex items-center gap-6">
                                <button className="text-sm font-medium text-zinc-400 hover:text-white transition-colors flex items-center gap-2">
                                    <Download className="w-4 h-4" />
                                    Install
                                </button>
                                <SignInButton mode="modal">
                                    <button className="text-sm font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer">
                                        Sign In
                                    </button>
                                </SignInButton>
                                <SignUpButton mode="modal">
                                    <button className="px-5 py-2 bg-white text-black text-sm font-bold rounded-xl hover:bg-zinc-200 transition-all">
                                        Sign Up
                                    </button>
                                </SignUpButton>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="pt-40 pb-20 px-6">
                <div className="max-w-7xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/40 text-[12px] font-medium text-zinc-500 mb-10 tracking-wide">
                        <span className="text-zinc-700">ALPHA</span>
                        <span className="w-1 h-1 rounded-full bg-zinc-800" />
                        Now live on Solana Devnet
                    </div>

                    <h1 className="text-7xl md:text-8xl font-medium tracking-tight mb-8 leading-[1.1]">
                        Send Crypto via<br />
                        <span className="text-zinc-500">GitHub Comments</span>
                    </h1>

                    <p className="text-[17px] text-zinc-500 max-w-2xl mx-auto mb-12 leading-relaxed font-light">
                        Reward contributors, tip developers, and incentivize open source work<br />
                        with SOL vouchers that recipients can claim directly from GitHub.
                    </p>

                    <div className="flex items-center justify-center gap-4 mb-32">
                        <button className="px-8 py-3.5 bg-white text-black font-semibold rounded-xl hover:bg-zinc-200 transition-all flex items-center gap-2.5 shadow-[0_0_40px_rgba(255,255,255,0.1)]">
                            Install Extension
                        </button>
                        <Link href="/dashboard" className="px-8 py-3.5 bg-zinc-900/50 border border-zinc-800 text-white font-semibold rounded-xl hover:bg-zinc-900 transition-all">
                            Go to Dashboard
                        </Link>
                    </div>

                    <div className="flex items-center justify-center gap-8 mb-40 text-[13px] text-zinc-600 font-medium tracking-wide">
                        <span className="flex items-center gap-2">• Secure Escrow</span>
                        <span className="flex items-center gap-2">• Instant Settlement</span>
                        <span className="flex items-center gap-2">• Solana-Native</span>
                    </div>

                    {/* Feature Cards */}
                    <div className="grid md:grid-cols-3 gap-6 mb-40 max-w-6xl mx-auto">
                        <div className="p-10 rounded-[32px] bg-[#0c0c0c] border border-zinc-900 text-left group hover:border-zinc-800 transition-all duration-500">
                            <div className="w-12 h-12 rounded-2xl bg-zinc-900/50 flex items-center justify-center mb-8 border border-zinc-800/50">
                                <Github className="w-6 h-6 text-zinc-400" />
                            </div>
                            <h3 className="text-2xl font-semibold mb-4 tracking-tight">GitHub Integration</h3>
                            <p className="text-zinc-500 leading-relaxed font-light">
                                Create vouchers directly from GitHub issue and PR comments. Just type /pay @username 1 SOL.
                            </p>
                        </div>

                        <div className="p-10 rounded-[32px] bg-[#0c0c0c] border border-zinc-900 text-left group hover:border-zinc-800 transition-all duration-500">
                            <div className="w-12 h-12 rounded-2xl bg-zinc-900/50 flex items-center justify-center mb-8 border border-zinc-800/50">
                                <Shield className="w-6 h-6 text-zinc-400" />
                            </div>
                            <h3 className="text-2xl font-semibold mb-4 tracking-tight">Secure Escrow</h3>
                            <p className="text-zinc-500 leading-relaxed font-light">
                                Funds are held in on-chain escrow until the recipient claims. Unclaimed vouchers can be cancelled.
                            </p>
                        </div>

                        <div className="p-10 rounded-[32px] bg-[#0c0c0c] border border-zinc-900 text-left group hover:border-zinc-800 transition-all duration-500">
                            <div className="w-12 h-12 rounded-2xl bg-zinc-900/50 flex items-center justify-center mb-8 border border-zinc-800/50">
                                <Zap className="w-6 h-6 text-zinc-400" />
                            </div>
                            <h3 className="text-2xl font-semibold mb-4 tracking-tight">Instant Claims</h3>
                            <p className="text-zinc-500 leading-relaxed font-light">
                                Recipients connect their wallet and claim SOL directly. No intermediaries, no delays.
                            </p>
                        </div>
                    </div>

                    {/* Standard Section */}
                    <div className="max-w-6xl mx-auto mb-40">
                        <div className="p-20 rounded-[48px] bg-[#0c0c0c] border border-zinc-900 relative overflow-hidden">
                            <div className="relative z-10 flex flex-col items-center">
                                <h2 className="text-6xl font-medium tracking-tight mb-8">
                                    The standard for <span className="italic font-light opacity-80 underline underline-offset-8 decoration-1">developer rewards.</span>
                                </h2>
                                <p className="text-zinc-500 mb-12 max-w-xl leading-relaxed">
                                    Git Pay bridges the gap between open-source contributions and financial incentives using the speed and security of Solana.
                                </p>
                                <div className="flex items-center gap-4">
                                    <button className="px-8 py-3.5 bg-white text-black font-semibold rounded-2xl hover:bg-zinc-200 transition-all flex items-center gap-2.5">
                                        <Download className="w-5 h-5" />
                                        Install Extension
                                    </button>
                                    <Link href="/dashboard" className="px-8 py-3.5 bg-zinc-900/50 border border-zinc-800 text-white font-semibold rounded-2xl hover:bg-zinc-900 transition-all flex items-center gap-2">
                                        Open Dashboard
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            </div>
                            {/* Decorative glow */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-white/[0.02] blur-[120px] rounded-full pointer-events-none" />
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-zinc-900 py-12 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-4 text-[13px] font-medium text-zinc-400">
                        <span className="text-white font-bold">Git Pay</span>
                        <span className="text-zinc-800">|</span>
                        <span>© 2024 Built on Solana</span>
                    </div>

                    <div className="flex items-center gap-8 text-[13px] font-medium text-zinc-500">
                        <a href="#" className="hover:text-white transition-colors">Documentation</a>
                        <a href="#" className="hover:text-white transition-colors">GitHub</a>
                        <a href="#" className="hover:text-white transition-colors">Twitter</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
