"use client";

import { writeContract, waitForTransactionReceipt, watchContractEvent, readContract, sendTransaction } from '@wagmi/core';
import { useEffect, useState } from 'react';
import { useAccount, useChainId, useConfig } from 'wagmi';
import { ChainLegacy_ABI, ChainLegacy_Address, LegacyToken_Address, LegacyToken_ABI } from '@/constants';
import toast from 'react-hot-toast';
import { usePlan } from '@/hooks/usePlan';
import { TimeoutCountdown } from '@/components/TimeoutCountdown';
import { parseEther, isAddress } from "viem";

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

  const [isEditingAssets, setIsEditingAssets] = useState(false);
  const [editableNativeBalance, setEditableNativeBalance] = useState(nativeBalance);
  const [editableErc20Balance, setEditableErc20Balance] = useState(erc20Balance);
  const [isAdding, setIsAdding] = useState(false);
  const [newInheritor, setNewInheritor] = useState({
    name: '',
    inheritor: '',
    birthYears: '',
    percent: ''
  });
  const [mode, setMode] = useState<"native" | "erc20">("native");
  // const { sendTransact, isPending: nativePending } = sendTransaction();
  const [amount, setAmount] = useState("0.1");






  // Add this handler function
  const handleAddInheritor = async () => {
    try {
      // Validate the new inheritor data
      if (!newInheritor.name || !newInheritor.inheritor || !newInheritor.percent) {
        toast.error('Please fill all fields');
        return;
      }

      // Trim and check address
      const inheritorAddress = newInheritor.inheritor.trim();
      if (!inheritorAddress) {
        toast.error('Address cannot be empty');
        return;
      }

      // Validate Ethereum address format
      const addressRegex = /^0x[a-fA-F0-9]{40}$/;
      if (!addressRegex.test(inheritorAddress)) {
        toast.error('Invalid Ethereum address format (must be 0x followed by 40 hex characters)');
        return;
      }

      // Validate checksum if needed (optional but recommended)
      try {
        const { isAddress } = await import('viem');
        if (!isAddress(inheritorAddress)) {
          toast.error('Invalid Ethereum address (checksum mismatch)');
          return;
        }
      } catch (e) {
        console.warn('Could not validate checksum', e);
      }

      // Convert percent to number and validate
      const percent = Number(newInheritor.percent);
      if (isNaN(percent) || percent <= 0 || percent > 100) {
        toast.error('Percentage must be a number between 1 and 100');
        return;
      }

      // Validate birth years
      const birthYears = Number(newInheritor.birthYears);
      if (isNaN(birthYears) || birthYears <= 0) {
        toast.error('Please enter a valid birth year');
        return;
      }

      console.log('Attempting to add inheritor with:', {
        name: newInheritor.name,
        inheritor: inheritorAddress,
        birthYears,
        percent
      });

      // Call your plan method to add the inheritor
      await plan?.handleAddInheritor(
        newInheritor.name,
        inheritorAddress, // Use the trimmed address
        birthYears,
        percent
      );

      // Reset the form and close the modal
      setNewInheritor({
        name: '',
        inheritor: '',
        birthYears: '',
        percent: ''
      });
      setIsAdding(false);

      toast.success('Inheritor added successfully!');
    } catch (error) {
      console.error('Error adding inheritor:', error);
      toast.error(`Failed to add inheritor: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

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
    if (!plan) return "from-gray-700 to-gray-800";
    const remaining = 100 - plan?.totalAssignedPercent;
    if (remaining === 100) return "from-red-700 to-red-800";
    if (remaining >= 50) return "from-orange-700 to-orange-800";
    return "from-yellow-700 to-yellow-800";
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

  if (!address) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-xl shadow-lg max-w-md w-full text-center border border-gray-700">
        <h1 className="text-2xl font-bold text-white mb-4">Welcome to ChainLegacy</h1>
        <p className="text-gray-400 mb-6">Please connect your wallet to view your legacy plan</p>
        <div className="animate-pulse">
          <div className="h-12 bg-gray-700 rounded-lg"></div>
        </div>
      </div>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-400">Loading your plan...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-xl shadow-lg max-w-md w-full text-center border border-gray-700">
        <div className="text-red-500 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Failed to load plan</h2>
        <p className="text-gray-400 mb-6">We couldn't load your legacy plan. Please try again later.</p>
        <button
          onClick={() => refetch()}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Retry
        </button>
      </div>
    </div>
  );

  if (!plan) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-xl shadow-lg max-w-md w-full text-center border border-gray-700">
        <div className="text-gray-500 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">No Plan Found</h2>
        <p className="text-gray-400">You don't have an active legacy plan yet.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">ChainLegacy Dashboard</h1>
            <p className="text-gray-400">Manage your digital inheritance plan</p>
          </div>
          <div className="bg-gray-800 rounded-lg shadow p-3 flex items-center border border-gray-700">
            <div className={`w-3 h-3 rounded-full mr-2 ${plan.active ? "bg-green-500" : "bg-red-500"}`}></div>
            <span className="text-sm font-medium text-white">
              {plan.active ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Plan Summary Card */}
          <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-700">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                Plan Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Inheritors</span>
                  <span className="font-medium text-white">{plan.inheritors.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Timeout</span>
                  <span className="font-medium text-white">{Number(plan.timeout) / 86400} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Last Ping</span>
                  <span className="font-medium text-white">
                    {plan.lastPing !== BigInt(0) ? new Date(Number(plan.lastPing) * 1000).toLocaleString() : "Never"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Assets Card */}
          <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-700">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4 gap-4">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                  </svg>
                  Deposited Assets
                </h3>
                <button
                  className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm transition"
                  onClick={() => setIsEditingAssets(!isEditingAssets)}
                >
                  {isEditingAssets ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Done Editing
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add Asset(s)
                    </>
                  )}
                </button>
              </div>

              {isEditingAssets ? (
                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-gray-400 text-sm">Native Token (ETH)</label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        value={Number(editableNativeBalance) / 1e18}
                        onChange={(e) => setEditableNativeBalance(BigInt(Number(e.target.value) * 1e18))}
                        className="bg-gray-700 text-white font-mono px-3 py-2 rounded-l-lg flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        step="0.0001"
                        min="0"
                      />
                      <span className="bg-blue-900 text-blue-400 text-xs px-3 py-2 rounded-r">ETH</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-gray-400 text-sm">$LEGACY Tokens</label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        value={Number(editableErc20Balance) / 1e18}
                        onChange={(e) => setEditableErc20Balance(BigInt(Number(e.target.value) * 1e18))}
                        className="bg-gray-700 text-white font-mono px-3 py-2 rounded-l-lg flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        step="0.0001"
                        min="0"
                      />
                      <span className="bg-purple-900 text-purple-400 text-xs px-3 py-2 rounded-r">LEGACY</span>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-4">
                    <button
                      onClick={() => {
                        setIsEditingAssets(false);
                        setEditableNativeBalance(nativeBalance);
                        setEditableErc20Balance(erc20Balance);
                      }}
                      className="px-4 py-2 text-sm rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          if (mode === "native") {
                            try {
                              const stx = await sendTransaction(
                                config,
                                {
                                  to: ChainLegacy_Address,
                                  value: parseEther(amount),
                                }
                              );
                              toast.success("Native token deposited!");
                              setNativeBalance(editableNativeBalance);
                            } catch (err: any) {
                              toast.error(err?.message || "Native deposit failed");
                            }
                          } else {
                            try {
                              const tx = await writeContract(
                                config,
                                {
                                  address: LegacyToken_Address,
                                  abi: LegacyToken_ABI,
                                  functionName: "transfer",
                                  args: [ChainLegacy_Address, parseEther(amount)],
                                }
                              );
                              toast.success("ERC20 token deposited!");
                              setErc20Balance(editableErc20Balance);
                            } catch (err: any) {
                              toast.error(err?.message || "Token deposit failed");
                            }
                          }
                        } catch (error) {
                          toast.error("Failed to update assets");
                          console.error(error);
                        } finally {
                          setIsEditingAssets(false);
                          toast.success("Assets updated successfully!");
                        }
                      }}
                      className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Native Token</span>
                    <div className="flex items-center">
                      <span className="font-mono font-medium text-white mr-2">{(Number(nativeBalance) / 1e18).toFixed(4)}</span>
                      <span className="bg-blue-900 text-blue-400 text-xs px-2 py-1 rounded">ETH</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">$LEGACY Tokens</span>
                    <div className="flex items-center">
                      <span className="font-mono font-medium text-white mr-2">{(Number(erc20Balance) / 1e18).toFixed(4)}</span>
                      <span className="bg-purple-900 text-purple-400 text-xs px-2 py-1 rounded">LEGACY</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Inheritors Section */}
        <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden mb-8 border border-gray-700 relative">
          {/* Floating Add Button */}
          {plan.inheritors.length > 0 && (
            <button
              className="absolute -top-3 -right-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 shadow-lg z-10 transition transform hover:scale-110"
              onClick={() => setIsAdding(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          )}

          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v1h-3zM4.75 12.094A5.973 5.973 0 004 15v1H1v-1a3 3 0 013.75-2.906z" />
                  </svg>
                  Inheritors
                </h3>
                <span className="text-sm font-medium text-gray-400 ml-2">
                  {allocatedPercent}% allocated ({unallocatedPercent}% remaining)
                </span>
              </div>
              {plan.inheritors.length === 0 && (
                <button
                  className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm transition"
                  onClick={() => setIsAdding(true)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Inheritor(s)
                </button>
              )}
            </div>

            {/* Inheritors List */}
            {plan.inheritors.length > 0 ? (
              <div className="space-y-3">
                {plan.inheritors.map((i: Inheritor, idx: number) => {
                  // Define your own logic for canRemove, e.g., only allow removal if plan is active
                  const canRemove = plan.active;
                  return (
                    <div key={idx} className="border border-gray-700 rounded-lg p-4 hover:bg-gray-700 transition">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-white">{i.name}</h4>
                          <p className="text-sm text-gray-400 break-all">{i.inheritor}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="bg-blue-900 text-blue-400 text-xs px-2 py-1 rounded-full">
                            {i.percent}%
                          </span>
                          <button
                            onClick={async () => {
                              setRemoving(i.inheritor);
                              try {
                                await plan?.handleRemoveInheritor(i.inheritor, i.name);
                              } finally {
                                setRemoving(null);
                              }
                            }}
                            className={`px-3 py-1 text-sm rounded transition ${canRemove ? "bg-red-900 text-red-400 hover:bg-red-800" : "bg-gray-700 text-gray-500 cursor-not-allowed"}`}
                            disabled={!canRemove || removing === i.inheritor}
                          >
                            {removing === i.inheritor ? 'Removing...' : 'Remove'}
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Unlocks on {new Date(Number(i.unlockTimestamp) * 1000).toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h4 className="mt-2 text-sm font-medium text-white">No inheritors added</h4>
                <p className="mt-1 text-sm text-gray-400">Add inheritors to start building your legacy plan.</p>
              </div>
            )}
          </div>

          {/* Add Inheritor Modal */}
          {isAdding && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Add New Inheritor</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                    <input
                      // type="text"
                      value={newInheritor.name}
                      onChange={(e) => setNewInheritor({ ...newInheritor, name: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Wallet Address</label>
                    <input
                      // type="text"
                      value={newInheritor.inheritor}
                      onChange={(e) => setNewInheritor({ ...newInheritor, inheritor: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="0x... "
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Birth Year</label>
                    <input
                      type="number"
                      value={newInheritor.birthYears}
                      onChange={(e) => setNewInheritor({ ...newInheritor, birthYears: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="10"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Percentage</label>
                    <input
                      type="number"
                      value={newInheritor.percent}
                      onChange={(e) => setNewInheritor({ ...newInheritor, percent: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center justify-center w-full py-2 px-4 bg-gray-800 hover:bg-gray-700 text-blue-400 rounded-lg border border-gray-700 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Add Another Inheritor
                  </button>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setIsAdding(false)}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddInheritor}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition flex items-center"
                  >
                    Add Inheritor
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Status Section */}
        {plan.inheritors.length > 0 && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-blue-800 to-blue-900 rounded-xl shadow-lg overflow-hidden border border-blue-700">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Plan Status
                  </h3>
                  <TimeoutCountdown
                    timeout={Number(plan.timeout)}
                    lastPing={Number(plan.lastPing)}
                  />
                </div>

                {canPing ? (
                  <div className="flex justify-between items-center">
                    <p className="text-gray-300">Your plan is active. Keep it alive by pinging regularly.</p>
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
                      className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition flex items-center"
                    >
                      {pinging ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          Ping KeepAlive
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="bg-red-900/30 border-l-4 border-red-500 p-4 rounded">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-300">
                          ⏱️ KeepAlive window has expired or is too close to timeout. Plan execution may occur anytime now.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Warning Section */}
        {plan?.inheritors?.length > 0 && unallocatedPercent > 0 && (
          <div className={`bg-gradient-to-r ${getWarningColor()} rounded-xl shadow-md overflow-hidden border border-gray-700`}>
            <div className="p-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-300">Allocation Warning</h3>
                  <div className="mt-2 text-sm text-yellow-400">
                    <p>
                      You've only assigned {plan?.totalAssignedPercent}% of your inheritance.
                      The remaining {100 - plan?.totalAssignedPercent}% will be refunded to you if your plan is executed.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>




    </div>
  );
}