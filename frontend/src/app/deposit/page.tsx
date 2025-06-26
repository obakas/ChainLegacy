"use client";

import { useState } from "react";
import { useWriteContract, useSendTransaction, useAccount, useConfig, useChainId, useWaitForTransactionReceipt, } from "wagmi";
import { parseEther } from "viem";
import { ChainLegacy_ABI, ChainLegacy_Address, LegacyToken_ABI, LegacyToken_Address, } from "@/constants";
import toast from "react-hot-toast";
import { readContract } from "@wagmi/core";
import { useEffect } from "react";


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
                    functionName: "getPlan", // returns `nativeBalance` in latest contract
                    args: [address],
                    chainId,
                });

                const nativeBal = (native as any[])[6]; // assuming nativeBalance is 7th item returned
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
        <div className="max-w-md mx-auto p-6">
            <div className="mb-4 bg-gray-100 p-4 rounded shadow-sm text-sm text-black">
                <p>
                    <strong>Native Token Balance:</strong>{" "}
                    {Number(nativeBalance) / 1e18} ETH
                </p>
                <p>
                    <strong>$LEGACY Token Balance:</strong>{" "}
                    {Number(erc20Balance) / 1e18} $LEGACY
                </p>
            </div>

            <h2 className="text-xl font-semibold mb-4">Deposit Assets</h2>

            <div className="mb-4 flex space-x-4">
                <label className="flex items-center space-x-2 ">
                    <input
                        type="radio"
                        name="assetType"
                        value="native"
                        checked={mode === "native"}
                        onChange={() => setMode("native")}
                    />
                    <span>Native Token (e.g. ETH)</span>
                </label>

                <label className="flex items-center space-x-2 ">
                    <input
                        type="radio"
                        name="assetType"
                        value="erc20"
                        checked={mode === "erc20"}
                        onChange={() => setMode("erc20")}
                    />
                    <span>$LEGACY Token</span>
                </label>
            </div>

            <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-2 border rounded mb-4"
                placeholder="Amount to deposit"
                min="0"
            />

            <button
                onClick={handleDeposit}
                disabled={isPending}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
                {isPending ? "Depositing..." : `Deposit ${mode === "native" ? "Native" : "$LEGACY"}`}
            </button>
        </div>
    );
}
