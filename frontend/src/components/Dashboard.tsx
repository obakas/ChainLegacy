"use client";
import { useWriteContract, useAccount, useChainId, useWaitForTransactionReceipt, useReadContract, useConfig } from "wagmi";
import { ChainLegacy_ABI, ChainLegacy_Address } from '@/constants'
import toast from "react-hot-toast";

export default function Dashboard() {
    const { address } = useAccount();

    const {
        data: planData,
        isLoading,
        isError,
    } = useReadContract({
        address: ChainLegacy_Address,
        abi: ChainLegacy_ABI,
        functionName: "getPlan",
        args: [address!],
        enabled: !!address,
        watch: true,
    });

    const { write: keepAlive } = useWriteContract({
        address: ChainLegacy_Address,
        abi: ChainLegacy_ABI,
        functionName: "keepAlive",
        onSuccess: () => toast.success("KeepAlive pinged successfully!"),
        onError: (err) => toast.error(err.message),
    });

    if (!address) return <p className="text-center mt-12">Please connect your wallet.</p>;
    if (isLoading) return <p className="text-center mt-12">Loading your plan...</p>;
    if (isError || !planData) return <p className="text-center mt-12">No plan found or failed to load.</p>;

    // 👇 LOG TO SEE WHAT IT REALLY RETURNS
    console.log("Plan Data:", planData);

    let inheritors = [];
    let timeout = "N/A";
    let lastPing = "N/A";

    // 💡 Defensive destructuring
    try {
        // planData is either a tuple OR object
        if (Array.isArray(planData)) {
            [inheritors, timeout, lastPing] = planData;
        } else if (planData.inheritors) {
            inheritors = planData.inheritors;
            timeout = planData.timeout;
            lastPing = planData.lastPing;
        }
    } catch (e) {
        console.error("Error parsing planData", e);
    }

    return (
        <div className="max-w-2xl mx-auto p-6">
            <h2 className="text-2xl font-bold mb-6">Your ChainLegacy Plan</h2>

            <div className="bg-white shadow rounded p-4 space-y-2 mb-6">
                <p><strong>Inheritor Count:</strong> {inheritors.length ?? "?"}</p>
                <p><strong>Timeout (seconds):</strong> {timeout?.toString()}</p>
                <p><strong>Last Ping:</strong> {lastPing !== "N/A" ? new Date(Number(lastPing) * 1000).toLocaleString() : "N/A"}</p>
            </div>

            <button
                onClick={() => keepAlive()}
                className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
            >
                Ping KeepAlive
            </button>
        </div>
    );
}
