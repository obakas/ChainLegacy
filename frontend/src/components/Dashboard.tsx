"use client";

import { writeContract, waitForTransactionReceipt, watchContractEvent, readContract } from '@wagmi/core';
import { useEffect, useState } from 'react';
import { useAccount, useChainId, useConfig } from 'wagmi';
import { ChainLegacy_ABI, ChainLegacy_Address, LegacyToken_Address } from '@/constants';
import toast from 'react-hot-toast';
import { usePlan } from '@/hooks/usePlan';
import { TimeoutCountdown } from '@/components/TimeoutCountdown';

interface Inheritor {
  name: string;
  inheritor: string;
  percent: number;
  unlockTimestamp: bigint | number | string;
}

export default function Dashboard() {
  const { address } = useAccount();
  const chainId = useChainId();
  const config = useConfig();

  const [nativeBalance, setNativeBalance] = useState<bigint>(BigInt(0));
  const [erc20Balance, setErc20Balance] = useState<bigint>(BigInt(0));
  const [removing, setRemoving] = useState<string | null>(null);
  const [pinging, setPinging] = useState(false);

  const { data: plan, loading, error, refetch } = usePlan();

  const allocatedPercent = plan?.totalAssignedPercent ?? 0;
  const unallocatedPercent = 100 - allocatedPercent;

  const currentTime = Math.floor(Date.now() / 1000);
  const pingDeadline = Number(plan?.lastPing) + Number(plan?.timeout);
  const canPing = currentTime < (pingDeadline - 10);

  const fetchBalances = async () => {
    if (!address) return;
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
      console.error("❌ Balance fetch error:", err);
    }
  };

  useEffect(() => {
    fetchBalances();
  }, [address, config, chainId]);

  const getWarningColor = () => {
    if (!plan) return "bg-gray-100 border-gray-400 text-gray-600";
    const remaining = 100 - plan.totalAssignedPercent;
    if (remaining === 100) return "bg-red-100 border-red-500 text-red-700";
    if (remaining >= 50) return "bg-orange-100 border-orange-500 text-orange-700";
    return "bg-yellow-100 border-yellow-500 text-yellow-700";
  };

  watchContractEvent(config, {
    address: ChainLegacy_Address,
    abi: ChainLegacy_ABI,
    eventName: 'InheritanceExecuted',
    onLogs(logs) {
      logs.forEach((log: any) => {
        const planOwner = log.args?.planOwner;
        const timestamp = log.args?.timestamp;

        if (address?.toLowerCase() === planOwner?.toLowerCase()) {
          toast.success(
            `✅ Inheritance executed at ${new Date(Number(timestamp) * 1000).toLocaleTimeString()}`
          );
          refetch();
        }
      });
    },
  });

  if (!address) return <p className="text-center mt-12">Please connect your wallet.</p>;
  if (loading) return <p className="text-center mt-12">Loading your plan...</p>;
  if (error) return <p className="text-center mt-12">Failed to load your plan.</p>;
  if (!plan) return <p className="text-center mt-12">No plan data found.</p>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Your ChainLegacy Plan</h2>

      {plan && plan.inheritors.length > 0 && (
        <TimeoutCountdown
          timeout={Number(plan.timeout)}
          lastPing={Number(plan.lastPing)}
        />
      )}

      <div className="bg-white shadow text-black rounded p-4 space-y-2 mb-6">
        <p><strong>Inheritor Count:</strong> {plan.inheritors.length}</p>
        <p><strong>Timeout (seconds):</strong> {plan.timeout.toString()}</p>
        <p><strong>Last Ping:</strong> {plan.lastPing !== BigInt(0) ? new Date(Number(plan.lastPing) * 1000).toLocaleString() : "N/A"}</p>
        <p><strong>Plan Active:</strong> {plan.active ? "Yes" : "No"}</p>
      </div>

      <div className="bg-gray-900 text-white p-4 rounded-lg shadow mb-4">
        <h3 className="font-semibold text-lg mb-2">Deposited Assets</h3>
        <p><strong>Native Token (e.g. ETH):</strong> {Number(nativeBalance) / 1e18}</p>
        <p><strong>$LEGACY Tokens:</strong> {Number(erc20Balance) / 1e18}</p>
      </div>

      {plan.inheritors.length > 0 ? (
        <ul className="list-disc list-inside space-y-2">
          {plan.inheritors.map((i: Inheritor, idx: number) => {
            const nowInSeconds = Math.floor(Date.now() / 1000);
            const unlockTimeWithBuffer = Number(i.unlockTimestamp) - 10;
            const canRemove = nowInSeconds < unlockTimeWithBuffer;

            return (
              <li key={idx} className="flex justify-between items-center bg-gray-800 rounded p-2">
                <div>
                  <strong>{i.name}</strong> ({i.inheritor}) — {i.percent}% — Unlocks on {new Date(Number(i.unlockTimestamp) * 1000).toLocaleString()}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={async () => {
                      setRemoving(i.inheritor);
                      try {
                        await plan?.handleRemoveInheritor(i.inheritor, i.name);
                      } finally {
                        setRemoving(null);
                      }
                    }}
                    className={`px-3 py-1 text-sm text-white rounded transition ${canRemove ? "bg-red-600 hover:bg-red-700" : "bg-gray-500 cursor-not-allowed"}`}
                    disabled={!canRemove || removing === i.inheritor}
                  >
                    {removing === i.inheritor ? "Removing..." : "Remove"}
                  </button>
                  {!canRemove && <span className="text-sm text-gray-300">🔒 Locked</span>}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p>No inheritors registered yet.</p>
      )}

      {canPing ? (
        <button
          onClick={async () => {
            setPinging(true);
            try {
              const tx = await writeContract(config, {
                address: ChainLegacy_Address,
                abi: ChainLegacy_ABI,
                functionName: "keepAlive",
              });
              await waitForTransactionReceipt(config, { hash: tx });
              toast.success("KeepAlive pinged successfully!");
              await refetch();
            } catch (err: any) {
              toast.error(err?.message || "Failed to ping KeepAlive.");
            } finally {
              setPinging(false);
            }
          }}
          className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 mt-6"
        >
          {pinging ? "Pinging..." : "Ping KeepAlive"}
        </button>
      ) : (
        <p className="text-red-600 font-semibold mt-4">
          ⏱️ KeepAlive window has expired or is too close to timeout. Plan execution may occur anytime now.
        </p>
      )}

      {plan?.inheritors?.length > 0 && unallocatedPercent > 0 && (
        <div className={`${getWarningColor()} border-l-4 p-4 rounded-xl my-4`}>
          <p className="font-bold">Warning</p>
          <p>
            You’ve only assigned {plan?.totalAssignedPercent}% of your inheritance.
            The remaining {100 - plan?.totalAssignedPercent}% will be refunded to you if your plan is executed.
          </p>
        </div>
      )}
    </div>
  );
}
