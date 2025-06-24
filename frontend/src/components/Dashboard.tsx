// app/dashboard.tsx
"use client";

import { writeContract, waitForTransactionReceipt, watchContractEvent } from '@wagmi/core';
import { JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal, useEffect } from 'react';
import { useAccount, useChainId, useConfig } from 'wagmi';
import { ChainLegacy_ABI, ChainLegacy_Address } from '@/constants';
import toast from 'react-hot-toast';
import {   usePlan, useAllocatedPercent, useUnallocatedPercent } from '@/hooks/usePlan';

export default function Dashboard() {
  const { address } = useAccount();
  const chainId = useChainId();
  const config = useConfig();

  const { data: plan, loading, error } = usePlan();

  const allocatedPercent = plan?.totalAssignedPercent ?? 0;
  const unallocatedPercent = 100 - allocatedPercent;

  const getWarningColor = () => {
    if (unallocatedPercent === 100) return "bg-red-100 border-red-500 text-red-700";
    if (unallocatedPercent >= 50) return "bg-orange-100 border-orange-500 text-orange-700";
    return "bg-yellow-100 border-yellow-500 text-yellow-700";
  };

  watchContractEvent(config, {
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
      window.location.reload();
    } catch (err: any) {
      console.error("Error removing inheritor:", err);
      toast.error(err?.message || "Failed to remove inheritor.");
    }
  };

  if (!address) return <p className="text-center mt-12">Please connect your wallet.</p>;
  if (loading) return <p className="text-center mt-12">Loading your plan...</p>;
  if (error) return <p className="text-center mt-12">Failed to load your plan.</p>;
  if (!plan) return <p className="text-center mt-12">No plan data found.</p>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Your ChainLegacy Plan</h2>

      <div className="bg-white shadow text-black rounded p-4 space-y-2 mb-6">
        <p><strong>Inheritor Count:</strong> {plan.inheritors.length}</p>
        <p><strong>Timeout (seconds):</strong> {plan.timeout.toString()}</p>
        <p><strong>Last Ping:</strong> {plan.lastPing !== BigInt(0) ? new Date(Number(plan.lastPing) * 1000).toLocaleString() : "N/A"}</p>
        <p><strong>Plan Active:</strong> {plan.active ? "Yes" : "No"}</p>
      </div>

      {plan.inheritors.length > 0 ? (
        <ul className="list-disc list-inside space-y-2">
          {plan.inheritors.map((i: { inheritor: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; percent: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; unlockTimestamp: any; }, idx: Key | null | undefined) => (
            <li key={idx} className="flex justify-between items-center bg-gray-800 rounded p-2">
              <div>
                <strong>{i.inheritor}</strong> — {i.percent}% — Unlocks on {new Date(Number(i.unlockTimestamp) * 1000).toLocaleString()}
              </div>
              <button
                onClick={() => {
                  if (typeof i.inheritor === "string") {
                    handleRemoveInheritor(i.inheritor);
                  } else {
                    toast.error("Invalid inheritor address.");
                  }
                }}
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

      {unallocatedPercent > 0 && (
        <div className={`${getWarningColor()} border-l-4 p-4 rounded-xl my-4`}>
          <p className="font-bold">Warning</p>
          <p>
            You’ve only assigned {allocatedPercent}% of your inheritance.
            The remaining {unallocatedPercent}% will be refunded to you if your plan is executed.
          </p>
        </div>
      )}
    </div>
  );
}
