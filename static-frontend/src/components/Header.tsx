"use client";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { FaGithub, FaYoutube } from "react-icons/fa";
import Image from "next/image";
import Link from "next/link";
import { useAccount, useChainId } from "wagmi";
// import { TriggerUpkeepButton } from "@/components/TriggerUpkeepButton";
import { useState } from "react";
import { FaBars, FaTimes } from "react-icons/fa";

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
    const isLocalDev = chainId === 31337;
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

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

                    <div className="hidden sm:flex items-center gap-4">
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
                </div>

                {/* Mobile menu button */}
                <div className="sm:hidden flex items-center">
                    <button
                        onClick={toggleMenu}
                        className="text-gray-300 hover:text-blue-400 focus:outline-none"
                        aria-label="Toggle menu"
                    >
                        {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
                    </button>
                </div>

                {/* Right side - Nav + TriggerUpkeep + Wallet */}
                <div className="hidden sm:flex items-center gap-4">
                    {isConnected && (
                        <>
                            <nav className="space-x-4">
                                {/* <Link
                                    href="/register"
                                    className="text-gray-300 font-bold hover:text-blue-400"
                                >
                                    Register
                                </Link> */}
                                {/* <Link
                                    href="/deposit"
                                    className="text-gray-300 font-bold hover:text-blue-400"
                                >
                                    Deposit
                                </Link> */}
                                {/* <Link
                                    href="/inheritor"
                                    className="text-gray-300 font-bold hover:text-blue-400"
                                >
                                    Inheritor
                                </Link> */}
                            </nav>

                            {/* 🔧 Trigger upkeep button (dev/demo only) */}
                            {/* {isLocalDev && <TriggerUpkeepButton />} */}
                        </>
                    )}

                    <ConnectButton
                        showBalance={true}
                        accountStatus="address"
                        chainStatus="icon"
                    />
                </div>

                {/* Mobile menu */}
                {isMenuOpen && (
                    <div className="sm:hidden absolute top-16 left-0 right-0 bg-gray-900/95 backdrop-blur-sm z-50 border-b border-gray-700">
                        <div className="px-4 py-3 space-y-4">
                            {isConnected && (
                                <>
                                    <nav className="flex flex-col space-y-3">
                                        {/* <Link
                                            href="/register"
                                            className="text-gray-300 font-bold hover:text-blue-400 py-2"
                                            onClick={toggleMenu}
                                        >
                                            Register
                                        </Link> */}
                                        {/* <Link
                                            href="/deposit"
                                            className="text-gray-300 font-bold hover:text-blue-400 py-2"
                                            onClick={toggleMenu}
                                        >
                                            Deposit
                                        </Link> */}
                                        {/* <Link
                                            href="/inheritor"
                                            className="text-gray-300 font-bold hover:text-blue-400 py-2"
                                            onClick={toggleMenu}
                                        >
                                            Inheritor
                                        </Link> */}
                                    </nav>

                                    {/* 🔧 Trigger upkeep button (dev/demo only) */}
                                    {/* {isLocalDev && (
                                        <div className="py-2">
                                            <TriggerUpkeepButton />
                                        </div>
                                    )} */}
                                </>
                            )}

                            <div className="flex justify-center py-2">
                                <ConnectButton
                                    showBalance={true}
                                    accountStatus="address"
                                    chainStatus="icon"
                                />
                            </div>

                            <div className="flex justify-center gap-6 pt-4 border-t border-gray-700">
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
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}