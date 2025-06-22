// File: app/deposit/page.tsx
"use client";
import { useState } from "react";
import { useWriteContract, useAccount, useChainId, useWaitForTransactionReceipt, useReadContract, useConfig } from "wagmi";
import { parseEther } from "viem";
import { ChainLegacy_ABI, ChainLegacy_Address, LegacyToken_Address, LegacyToken_ABI } from "@/constants";
import toast, { Renderable, Toast, ValueFunction } from "react-hot-toast";

export default function DepositAssetsPage() {
    const { address } = useAccount();
    const [amount, setAmount] = useState("0.1");

    const { writeContract, isPending } = useWriteContract();

    const handleDeposit = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            return toast.error("Enter a valid amount");
        }

        try {
            writeContract(
                {
                    address: LegacyToken_Address,
                    abi: LegacyToken_ABI,
                    functionName: "transfer",
                    args: [ChainLegacy_Address, parseEther(amount)],
                },
                {
                    onError: (err: any) => toast.error(err?.message || "Deposit failed"),
                    onSuccess: () => toast.success("Deposit successful!"),
                }
            );
        } catch (err) {
            console.error("Deposit error:", err);
        }
    };

    return (
        <div className="max-w-md mx-auto p-6">
            <h2 className="text-xl font-semibold mb-4">Deposit $LEGACY Tokens</h2>

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
                {isPending ? "Depositing..." : "Deposit"}
            </button>
        </div>
    );
}
