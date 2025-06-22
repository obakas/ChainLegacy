"use client";
import { useWriteContract, useAccount, useChainId, useWaitForTransactionReceipt, useReadContract, useConfig } from "wagmi";
import { ChainLegacy_ABI, ChainLegacy_Address } from "@/src/constants";
import toast from "react-hot-toast";

export default function DashboardPage() {
    const { address } = useAccount();

    const { data: plan, isLoading } = useReadContract({
        address: ChainLegacy_Address,
        abi: ChainLegacy_ABI,
        functionName: "getPlan",
        args: [address!],
        enabled: !!address
    });

    const { write: keepAlive } = useWriteContract({
        address: ChainLegacy_Address,
        abi: ChainLegacy_ABI,
        functionName: "keepAlive",
        onSuccess: () => toast.success("KeepAlive pinged!"),
        onError: (err) => toast.error(err.message)
    });

    if (!address) return <p className="text-center mt-12">Please connect your wallet.</p>;
    if (isLoading) return <p className="text-center mt-12">Loading your plan...</p>;
    if (!plan) return <p className="text-center mt-12">No plan found.</p>;

    return (
        <div className="max-w-2xl mx-auto p-6">
            <h2 className="text-2xl font-semibold mb-4">Your ChainLegacy Plan</h2>

            <div className="space-y-2 mb-6">
                <p><strong>Timeout (in seconds):</strong> {String(plan.timeout)}</p>
                <p><strong>Inheritor Count:</strong> {plan.inheritors.length}</p>
                <p><strong>Last Ping:</strong> {String(plan.lastPing)}</p>
            </div>

            <button
                onClick={() => keepAlive()}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
                Ping KeepAlive
            </button>
        </div>
    );
}
