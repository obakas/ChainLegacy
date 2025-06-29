"use client";

import { useState, useEffect } from "react";
import { useWriteContract, useSendTransaction, useAccount, useConfig, useChainId, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { ChainLegacy_ABI, ChainLegacy_Address, LegacyToken_ABI, LegacyToken_Address } from "@/constants";
import toast from "react-hot-toast";
import { readContract } from "@wagmi/core";

export default function DepositAssetsPage() {
    const { address } = useAccount();
    const config = useConfig();
    const chainId = useChainId();
    const [amount, setAmount] = useState("0.1");
    const [mode, setMode] = useState<"native" | "erc20">("native");

    const { sendTransaction, isPending: nativePending } = useSendTransaction();
    const { writeContract, isPending: tokenPending } = useWriteContract();

    const [nativeBalance, setNativeBalance] = useState<bigint>(BigInt(0));
    const [erc20Balance, setErc20Balance] = useState<bigint>(BigInt(0));

    const handleDeposit = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            return toast.error("Enter a valid amount");
        }

        try {
            if (mode === "native") {
                sendTransaction(
                    {
                        to: ChainLegacy_Address,
                        value: parseEther(amount),
                    },
                    {
                        onError: (err) => toast.error(err?.message || "Native deposit failed"),
                        onSuccess: () => toast.success("Native token deposited!"),
                    }
                );
            } else {
                writeContract(
                    {
                        address: LegacyToken_Address,
                        abi: LegacyToken_ABI,
                        functionName: "transfer",
                        args: [ChainLegacy_Address, parseEther(amount)],
                    },
                    {
                        onError: (err) => toast.error(err?.message || "Token deposit failed"),
                        onSuccess: () => toast.success("ERC20 token deposited!"),
                    }
                );
            }
        } catch (err) {
            console.error("Deposit error:", err);
            toast.error("Something went wrong");
        }
    };

    const isPending = mode === "native" ? nativePending : tokenPending;

    useEffect(() => {
        if (!address) return;

        const fetchBalances = async () => {
            try {
                const native = await readContract(config, {
                    address: ChainLegacy_Address,
                    abi: ChainLegacy_ABI,
                    functionName: "getPlan",
                    args: [address],
                    chainId,
                });

                const nativeBal = (native as any[])[6];
                setNativeBalance(BigInt(nativeBal));

                const erc20 = await readContract(config, {
                    address: ChainLegacy_Address,
                    abi: ChainLegacy_ABI,
                    functionName: "getERC20Balance",
                    args: [address, LegacyToken_Address],
                    chainId,
                });

                setErc20Balance(BigInt(erc20 as string | number | bigint));
            } catch (err) {
                console.error("❌ Failed to fetch balances:", err);
            }
        };

        fetchBalances();
    }, [address, config, chainId]);

    return (
        <div className="max-w-md mx-auto p-6 bg-gray-900 rounded-xl shadow-lg border border-gray-800 mt-10">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Deposit Assets</h2>

            {/* Balance Cards */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <p className="text-gray-400 text-sm font-medium">Native Balance</p>
                    <p className="text-white text-xl font-bold">
                        {(Number(nativeBalance) / 1e18).toFixed(4)} ETH
                    </p>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <p className="text-gray-400 text-sm font-medium">$LEGACY Balance</p>
                    <p className="text-white text-xl font-bold">
                        {(Number(erc20Balance) / 1e18).toFixed(4)} LEGACY
                    </p>
                </div>
            </div>

            {/* Asset Selection */}
            <div className="mb-6">
                <p className="text-gray-400 mb-2">Select Asset Type</p>
                <div className="flex space-x-4">
                    <button
                        onClick={() => setMode("native")}
                        className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${mode === "native"
                                ? "bg-blue-600 text-white"
                                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                            }`}
                    >
                        Native Token
                    </button>
                    <button
                        onClick={() => setMode("erc20")}
                        className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${mode === "erc20"
                                ? "bg-blue-600 text-white"
                                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                            }`}
                    >
                        $LEGACY Token
                    </button>
                </div>
            </div>

            {/* Amount Input */}
            <div className="mb-6">
                <label htmlFor="amount" className="block text-gray-400 mb-2">
                    Amount to Deposit
                </label>
                <div className="relative">
                    <input
                        id="amount"
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.0"
                        min="0"
                        step="any"
                    />
                    <span className="absolute right-3 top-3 text-gray-400">
                        {mode === "native" ? "ETH" : "LEGACY"}
                    </span>
                </div>
            </div>

            {/* Deposit Button */}
            <button
                onClick={handleDeposit}
                disabled={isPending}
                className={`w-full py-3 px-4 rounded-lg font-bold text-white transition-colors ${isPending
                        ? "bg-blue-700 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
            >
                {isPending ? (
                    <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                    </span>
                ) : (
                    `Deposit ${mode === "native" ? "ETH" : "$LEGACY"}`
                )}
            </button>
        </div>
    );
}