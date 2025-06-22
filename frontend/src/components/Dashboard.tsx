"use client";
import { useWriteContract, useAccount, useChainId, useWaitForTransactionReceipt, useReadContract, useConfig } from "wagmi";
import { ChainLegacy_ABI, ChainLegacy_Address } from '@/constants'
import toast, { Renderable, Toast, ValueFunction } from "react-hot-toast";
import { useEffect } from "react";

// console.log("📦 Dashboard component loaded");


export default function Dashboard() {
    // console.log("Chain ID:", useChainId());
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
    });

    const { writeContract } = useWriteContract();


    // const { writeContract } = useWriteContract({
    //     address: ChainLegacy_Address,//error 1:Object literal may only specify known properties, and 'address' does not exist in type 'UseWriteContractParameters<Config, unknown>'
    //     abi: ChainLegacy_ABI,
    //     functionName: "keepAlive",
    //     onSuccess: () => toast.success("KeepAlive pinged successfully!"),
    //     onError: (err: { message: Renderable | ValueFunction<Renderable, Toast>; }) => toast.error(err.message),
    // });

    useEffect(() => {
        console.log("Address:", address);
        console.log("PlanData:", planData);
        console.log("Loading:", isLoading);
        console.log("Error:", isError);
    }, [address, planData, isLoading, isError]);


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
        } else if (
            planData &&
            typeof planData === "object" &&
            "inheritors" in planData &&
            "timeout" in planData &&
            "lastPing" in planData
        ) {
            inheritors = (planData as { inheritors: any[] }).inheritors;
            timeout = (planData as { timeout: string }).timeout;
            lastPing = (planData as { lastPing: string }).lastPing;
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
                onClick={() => {
                    try {
                        writeContract({
                            address: ChainLegacy_Address,
                            abi: ChainLegacy_ABI,
                            functionName: "keepAlive",
                        });
                        toast.success("KeepAlive pinged successfully!");
                    } catch (err: any) {
                        toast.error(err?.message || "Failed to ping KeepAlive.");
                    }
                }}
                className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
            >
                Ping KeepAlive
            </button>
        </div>
    );
}
