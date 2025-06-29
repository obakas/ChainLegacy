"use client";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { FaGithub, FaYoutube } from "react-icons/fa";
import Image from "next/image";
import Link from "next/link";
import { useAccount, useChainId } from "wagmi";
import { TriggerUpkeepButton } from "@/components/TriggerUpkeepButton";

interface HeaderProps {
    githubUrl?: string;
    appName?: string;
    logoUrl?: string;
    videoUrl?: string;
}

export default function Header({
    githubUrl = "https://github.com/obakas/ChainLegacy",
    appName = "CHAIN LEGACY",
    logoUrl,
    videoUrl = "https://youtu.be/cOxl-miweWI",
}: HeaderProps) {
    const { isConnected } = useAccount();
    const chainId = useChainId();
    const isLocalDev = chainId === 31337

    return (
        <header className="w-full border-b border-gray-700 bg-gray-900/80 backdrop-blur-sm px-4 py-3">
            <div className="mx-auto flex max-w-7xl items-center justify-between">
                {/* Left side - Logo/Title and GitHub */}
                <div className="flex items-center gap-4">
                    {logoUrl ? (
                        <Image
                            src={logoUrl}
                            alt={`${appName} logo`}
                            width={32}
                            height={32}
                            className="h-8 w-auto"
                        />
                    ) : (
                        <Link
                            href="/"
                            className="text-xl font-bold text-gray-100 hover:text-blue-400 transition-colors"
                        >
                            {appName}
                        </Link>
                    )}

                    <a
                        href={githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="GitHub repository"
                        className="text-gray-400 hover:text-gray-200 transition-colors"
                        title="GitHub Repository"
                    >
                        <FaGithub size={24} />
                    </a>

                    <a
                        href={videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="YouTube video"
                        className="text-gray-400 hover:text-gray-200 transition-colors"
                        title="Introductory YouTube Video"
                    >
                        <FaYoutube size={28} />
                    </a>
                </div>

                {/* Right side - Nav + TriggerUpkeep + Wallet */}
                <div className="flex items-center gap-4">
                    {isConnected && (
                        <>
                            <nav className="space-x-4">
                                <Link
                                    href="/register"
                                    className="text-gray-300 font-bold hover:text-blue-400"
                                >
                                    Register
                                </Link>
                                <Link
                                    href="/deposit"
                                    className="text-gray-300 font-bold hover:text-blue-400"
                                >
                                    Deposit
                                </Link>
                                <Link
                                    href="/inheritor"
                                    className="text-gray-300 font-bold hover:text-blue-400"
                                >
                                    Inheritor
                                </Link>
                            </nav>

                            {/* 🔧 Trigger upkeep button (dev/demo only) */}
                            {isLocalDev && <TriggerUpkeepButton />}
                        </>
                    )}

                    <ConnectButton
                        showBalance={true}
                        accountStatus="address"
                        chainStatus="icon"
                    />
                </div>
            </div>
        </header>
    );
}