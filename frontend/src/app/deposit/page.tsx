// File: app/deposit/page.tsx
"use client";
import { useState } from "react";
import { useWriteContract, useAccount, useChainId, useWaitForTransactionReceipt, useReadContract, useConfig } from "wagmi";
import { parseEther } from "viem";
import { ChainLegacy_ABI, ChainLegacy_Address, LegacyToken_Address, LegacyToken_ABI } from "@/constants";
import toast from "react-hot-toast";

export default function DepositAssetsPage() {
    const { address } = useAccount();
    const [amount, setAmount] = useState("0.1");

    const { write, isLoading } = useWriteContract({
        address: LegacyToken_Address,
        abi: LegacyToken_ABI,
        functionName: "transfer",
        onError: (err) => toast.error(err.message),
        onSuccess: () => toast.success("Deposit successful!"),
    });

    const handleDeposit = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            return toast.error("Enter a valid amount");
        }

        try {
            await write({
                args: [ChainLegacy_Address, parseEther(amount)],
            });
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
                disabled={isLoading}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
                {isLoading ? "Depositing..." : "Deposit"}
            </button>
        </div>
    );
}
