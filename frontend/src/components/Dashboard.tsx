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

interface PlanType {
  inheritors: Inheritor[];
  timeout: bigint | number | string;
  lastPing: bigint | number | string;
  active: boolean;
  allocatedPercent: number;
}

export default function Dashboard() {
  const { address } = useAccount();
  const chainId = useChainId();
  const config = useConfig();
  const [allocatedPercent, setAllocatedPercent] = useState<number>(0);
  const [unallocatedPercent, setUnallocatedPercent] = useState<number>(0);
  const [nativeBalance, setNativeBalance] = useState<bigint>(BigInt(0));
  const [erc20Balance, setErc20Balance] = useState<bigint>(BigInt(0));




  const { data: plan, loading, error } = usePlan();


  useEffect(() => {
    if (!address) return;

    const fetchBalances = async () => {
      try {
        // Native balance (via getPlan or separate mapping)
        const native = await readContract(config, {
          address: ChainLegacy_Address,
          abi: ChainLegacy_ABI,
          functionName: "getPlan",
          args: [address],
          chainId,
        });

        const nativeBal = (native as any[])[6]; // assuming it's the 7th return value (index 6)
        setNativeBalance(BigInt(nativeBal));

        // ERC20 balance via getERC20Balance
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



    const fetchData = async () => {
      if (!address) return;
      try {
        const allocatedRaw = await readContract(config, {
          address: ChainLegacy_Address,
          abi: ChainLegacy_ABI,
          functionName: "getUnallocatedPercent",
          args: [address],
          chainId,
        });
        const allocated = Number(allocatedRaw);
        const unallocated = 100 - allocated;
        setAllocatedPercent(unallocated);
        setUnallocatedPercent(allocated);
      } catch (err: any) {
        toast.error(`Couldn't fetch balance: ${err.message || err}`);
      }
    };

    fetchData();
    fetchBalances();
  }, [address, config, chainId]);



  const getWarningColor = () => {
    if (unallocatedPercent === 100) return "bg-red-100 border-red-500 text-red-700";
    if (unallocatedPercent >= 50) return "bg-orange-100 border-orange-500 text-orange-700";
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
          window.location.reload();
        }
      });
    },
  });

  const handleRemoveInheritor = async (inheritor: string, name: string) => {
    try {
      const tx = await writeContract(config, {
        address: ChainLegacy_Address,
        abi: ChainLegacy_ABI,
        functionName: "removeInheritor",
        args: [inheritor, name],
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

      {plan && (
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
          {plan.inheritors.map((i: Inheritor, idx: number) => (
            <li key={idx} className="flex justify-between items-center bg-gray-800 rounded p-2">
              <div>
                <strong>{i.name}</strong> ({i.inheritor}) — {i.percent}% — Unlocks on{" "}
                {new Date(Number(i.unlockTimestamp) * 1000).toLocaleString()}
              </div>
              <button
                onClick={() => handleRemoveInheritor(i.inheritor, i.name)}
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

      {Number(`${unallocatedPercent}`) > 0 && (
        <div className={`${getWarningColor()} border-l-4 p-4 rounded-xl my-4`}>
          <p className="font-bold">Warning</p>
          <p>
            You’ve only assigned {`${allocatedPercent}`}% of your inheritance.
            The remaining {`${unallocatedPercent}`}% will be refunded to you if your plan is executed.
          </p>
        </div>
      )}
    </div>
  );
}


