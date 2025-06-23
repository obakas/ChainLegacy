"use client";

import { readContract, writeContract, waitForTransactionReceipt } from '@wagmi/core';
import { useEffect, useState } from 'react';
import { useAccount, useChainId, useConfig, useWatchContractEvent } from 'wagmi';
import { ChainLegacy_ABI, ChainLegacy_Address } from '@/constants';
import toast from 'react-hot-toast';
import { useUnallocatedPercent } from '@/hooks/usePlan';

export default function Dashboard() {
  const { address } = useAccount();
  const chainId = useChainId();
  const config = useConfig();

  const [planData, setPlanData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [inheritorsRaw, tokens, timeout, lastPing, active] = planData || [];

  const { data: unallocatedPercent, isLoading: isLoadingUnallocated } = useUnallocatedPercent();



  useWatchContractEvent({
    address: ChainLegacy_Address,
    abi: ChainLegacy_ABI,
    eventName: 'InheritanceExecuted',
    listener(logs) {
      logs.forEach((log: any) => {
        const planOwner = log.args?.planOwner;
        const timestamp = log.args?.timestamp;

        if (address?.toLowerCase() === planOwner?.toLowerCase()) {
          toast.success(
            `✅ Inheritance executed at ${new Date(Number(timestamp) * 1000).toLocaleTimeString()}`
          );
          window.location.reload();
        }
      });
    },
  });






  useEffect(() => {
    const fetchPlan = async () => {
      if (!address) return;

      try {
        setLoading(true);
        const data = await readContract(config, {
          address: ChainLegacy_Address,
          abi: ChainLegacy_ABI,
          functionName: 'getPlan',
          args: [address],
          chainId
        });

        console.log("✅ Raw Plan Data from readContract:", data);
        setPlanData(data);
      } catch (err) {
        console.error("❌ Failed to fetch plan:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [address, config, chainId]);

  // Handle Remove Inheritor
  const handleRemoveInheritor = async (inheritor: string) => {
    try {
      const tx = await writeContract(config, {
        address: ChainLegacy_Address,
        abi: ChainLegacy_ABI,
        functionName: "removeInheritor",
        args: [inheritor],
      });

      await waitForTransactionReceipt(config, { hash: tx });
      toast.success("Inheritor removed successfully!");
      window.location.reload(); // temporary brute-force refresh
    } catch (err: any) {
      console.error("Error removing inheritor:", err);
      toast.error(err?.message || "Failed to remove inheritor.");
    }
  };

  // UI Guards
  if (!address) return <p className="text-center mt-12">Please connect your wallet.</p>;
  if (loading) return <p className="text-center mt-12">Loading your plan...</p>;
  if (error) return <p className="text-center mt-12">Failed to load your plan.</p>;
  if (!planData || !Array.isArray(planData) || planData.length === 0) {
    return <p className="text-center mt-12">No plan data found.</p>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Your ChainLegacy Plan</h2>

      <div className="bg-white shadow text-black rounded p-4 space-y-2 mb-6">
        <p><strong>Inheritor Count:</strong> {inheritorsRaw.length}</p>
        <p><strong>Timeout (seconds):</strong> {timeout.toString()}</p>
        <p><strong>Last Ping:</strong> {lastPing !== BigInt(0) ? new Date(Number(lastPing) * 1000).toLocaleString() : "N/A"}</p>
        <p><strong>Plan Active:</strong> {active ? "Yes" : "No"}</p>
      </div>

      {inheritorsRaw.length > 0 ? (
        <ul className="list-disc list-inside space-y-2">
          {inheritorsRaw.map((i: any, idx: number) => (
            <li key={idx} className="flex justify-between items-center bg-gray-800 rounded p-2">
              <div>
                <strong>{i.inheritor}</strong> — {i.percent}% — Unlocks on{" "}
                {new Date(Number(i.unlockTimestamp) * 1000).toLocaleString()}
              </div>
              <button
                onClick={() => handleRemoveInheritor(i.inheritor)}
                className="ml-4 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p>No inheritors registered yet.</p>
      )}

      <button
        onClick={async () => {
          try {
            const tx = await writeContract(config, {
              address: ChainLegacy_Address,
              abi: ChainLegacy_ABI,
              functionName: "keepAlive",
            });
            await waitForTransactionReceipt(config, { hash: tx });
            toast.success("KeepAlive pinged successfully!");
          } catch (err: any) {
            toast.error(err?.message || "Failed to ping KeepAlive.");
          }
        }}
        className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 mt-6"
      >
        Ping KeepAlive
      </button>

      {!isLoadingUnallocated && unallocatedPercent !== undefined && (
        <p className="text-sm text-gray-400 mt-4">
          🧮 Remaining unassigned: <span className="font-bold">{unallocatedPercent?.toString() ?? "0"}%</span>
        </p>
      )}
    </div>
  );
}
