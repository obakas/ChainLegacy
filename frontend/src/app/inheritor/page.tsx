"use client";
import { useEffect, useState } from "react";
import { useAccount, useBalance } from "wagmi";
import { LegacyToken_Address } from "@/constants";
import { usePlan } from "@/hooks/usePlan";

const BIRTH_YEAR = 1989;
const UNLOCK_AGE = 18;

interface Inheritor {
    name: string;
    inheritor: string;
    percent: number;
    unlockTimestamp: bigint | number | string;
}

export default function InheritorPage() {
    const { address } = useAccount();
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [age, setAge] = useState<number | null>(null);

    const { data: legacyBalance, isLoading: loadingLegacy } = useBalance({
        address,
        token: LegacyToken_Address,
    });

    const { data: nativeBalance, isLoading: loadingNative } = useBalance({
        address,
    });

    const { data: plan, loading, error, refetch } = usePlan();

    const [inheritanceFromOthers, setInheritanceFromOthers] = useState<any[]>([]);
    const [removing, setRemoving] = useState<string | null>(null);

    useEffect(() => {
        const now = new Date();
        const currentYear = now.getUTCFullYear();
        const calculatedAge = currentYear - BIRTH_YEAR;
        setAge(calculatedAge);
        setIsUnlocked(calculatedAge >= UNLOCK_AGE);
    }, []);

    useEffect(() => {
        if (!address) return;

        const dummyOtherPlans = [
            {
                owner: "0xABC...123",
                inheritors: [{ address: address, percent: 25, unlockTimestamp: 1725000000 }],
            },
            {
                owner: "0xDEF...456",
                inheritors: [],
            },
        ];

        const filtered = dummyOtherPlans.filter(plan =>
            plan.inheritors.some((i: any) => i.address.toLowerCase() === address?.toLowerCase())
        );

        setInheritanceFromOthers(filtered);
    }, [address]);

    if (!address) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <div className="bg-gray-800 p-8 rounded-xl shadow-lg max-w-md w-full text-center border border-gray-700">
                <h1 className="text-2xl font-bold text-white mb-4">Inheritor Dashboard</h1>
                <p className="text-gray-400 mb-6">Please connect your wallet to view your inheritor dashboard</p>
                <div className="animate-pulse">
                    <div className="h-12 bg-gray-700 rounded-lg"></div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header Section */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Inheritor Dashboard</h1>
                        <p className="text-gray-400">View and manage your inherited assets</p>
                    </div>
                    <div className="bg-gray-800 rounded-lg shadow p-3 flex items-center border border-gray-700">
                        <div className={`w-3 h-3 rounded-full mr-2 ${isUnlocked ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                        <span className="text-sm font-medium text-white">
                            {isUnlocked ? "Unlocked" : "Locked"}
                        </span>
                    </div>
                </div>

                {/* Age Status Card */}
                <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden mb-8 border border-gray-700">
                    <div className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-1">Age Verification</h3>
                                <p className="text-gray-400">Your current age determines access to inherited assets</p>
                            </div>
                            <div className="bg-blue-600 text-white px-4 py-2 rounded-full font-medium">
                                {age ?? "..."} years old
                            </div>
                        </div>

                        {age !== null && !isUnlocked && (
                            <div className="mt-4 bg-yellow-900/20 border-l-4 border-yellow-500 p-4 rounded">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-yellow-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-yellow-400">
                                            🔒 You're too young to claim inheritance. Come back when you're 18.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Balances Section - Only shown when unlocked */}
                {isUnlocked && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-700">
                            <div className="p-6">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                                    </svg>
                                    Native Balance
                                </h3>
                                {loadingNative ? (
                                    <div className="animate-pulse">
                                        <div className="h-6 bg-gray-700 rounded w-3/4"></div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <span className="text-2xl font-bold text-white">
                                            {nativeBalance?.formatted}
                                        </span>
                                        <span className="bg-blue-900 text-blue-400 text-sm px-3 py-1 rounded-full">
                                            {nativeBalance?.symbol}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-700">
                            <div className="p-6">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                    </svg>
                                    $LEGACY Balance
                                </h3>
                                {loadingLegacy ? (
                                    <div className="animate-pulse">
                                        <div className="h-6 bg-gray-700 rounded w-3/4"></div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <span className="text-2xl font-bold text-white">
                                            {legacyBalance?.formatted}
                                        </span>
                                        <span className="bg-purple-900 text-purple-400 text-sm px-3 py-1 rounded-full">
                                            {legacyBalance?.symbol}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Inheritance From Others Section */}
                <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden mb-8 border border-gray-700">
                    <div className="p-6">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v1h-3zM4.75 12.094A5.973 5.973 0 004 15v1H1v-1a3 3 0 013.75-2.906z" />
                            </svg>
                            Inheritance From Others
                        </h3>

                        {inheritanceFromOthers.length === 0 ? (
                            <div className="text-center py-8">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <h4 className="mt-2 text-sm font-medium text-gray-300">No inheritance plans</h4>
                                <p className="mt-1 text-sm text-gray-500">You are not listed as an inheritor in any plans.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {inheritanceFromOthers.map((plan, idx) => (
                                    <div key={idx} className="border border-gray-700 rounded-lg p-4 hover:bg-gray-700 transition">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-medium text-white">Plan from {plan.owner}</h4>
                                                <p className="text-sm text-gray-400">You're listed as an inheritor</p>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <span className="bg-blue-900 text-blue-400 text-xs px-2 py-1 rounded-full">
                                                    {plan.inheritors.find((i: { address: string; }) => i.address.toLowerCase() === address?.toLowerCase())?.percent}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Your Inheritors Section */}
                <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden mb-8 border border-gray-700">
                    <div className="p-6">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                            Your Inheritors
                        </h3>

                        {(plan?.inheritors?.length ?? 0) > 0 ? (
                            <div className="space-y-3">
                                {plan?.inheritors.map((i: Inheritor, idx: number) => {
                                    const nowInSeconds = Math.floor(Date.now() / 1000);
                                    const unlockTimeWithBuffer = Number(i.unlockTimestamp) - 10;
                                    const canRemove = nowInSeconds < unlockTimeWithBuffer;

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
                                                            await plan?.handleRemoveInheritor(i.inheritor, i.name);
                                                            await refetch();
                                                            setRemoving(null);
                                                        }}
                                                        className={`px-3 py-1 text-sm rounded transition ${canRemove ? "bg-red-900 text-red-400 hover:bg-red-800" : "bg-gray-700 text-gray-500 cursor-not-allowed"}`}
                                                        disabled={!canRemove || removing === i.inheritor}
                                                    >
                                                        {removing === i.inheritor ? (
                                                            <span className="flex items-center">
                                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                </svg>
                                                                Removing
                                                            </span>
                                                        ) : "Remove"}
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="mt-2 flex items-center text-sm text-gray-400">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                Unlocks on {new Date(Number(i.unlockTimestamp) * 1000).toLocaleString()}
                                                {!canRemove && (
                                                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
                                                        Locked
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <h4 className="mt-2 text-sm font-medium text-gray-300">No inheritors added</h4>
                                <p className="mt-1 text-sm text-gray-500">Add inheritors to start building your legacy plan.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}