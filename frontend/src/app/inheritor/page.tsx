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

    return (
        <div className="max-w-2xl mx-auto p-6">
            <h2 className="text-2xl font-bold mb-6">Inheritor Dashboard</h2>

            {!address && <p>Please connect your wallet to view your dashboard.</p>}

            {address && (
                <>
                    <p className="mb-4">Your age: <strong>{age ?? "..."}</strong></p>

                    {age !== null && !isUnlocked && (
                        <p className="text-yellow-500 font-semibold">
                            🔒 You’re too young to claim inheritance. Come back when you're 18.
                        </p>
                    )}

                    {age !== null && isUnlocked && (
                        <div className="bg-gray-900 text-white p-4 rounded-lg shadow mb-6">
                            {loadingNative ? (
                                <p>Loading native balance...</p>
                            ) : (
                                <p><strong>Native Balance:</strong> {nativeBalance?.formatted} {nativeBalance?.symbol}</p>
                            )}
                            {loadingLegacy ? (
                                <p>Loading $LEGACY balance...</p>
                            ) : (
                                <p><strong>$LEGACY Balance:</strong> {legacyBalance?.formatted} {legacyBalance?.symbol}</p>
                            )}
                        </div>
                    )}

                    {/* 🔐 Inheritance from others */}
                    <div className="mb-6">
                        <h3 className="text-xl font-semibold mb-2">💰 Inheritance From Others</h3>
                        {inheritanceFromOthers.length === 0 ? (
                            <p className="text-gray-400">You are not listed as an inheritor in any plans.</p>
                        ) : (
                            inheritanceFromOthers.map((plan, idx) => (
                                <div key={idx} className="bg-gray-800 text-white p-3 rounded mb-2">
                                    <p><strong>From:</strong> {plan.owner}</p>
                                    <p><strong>Percent:</strong> {
                                        plan.inheritors.find((i: { address: string; }) => i.address.toLowerCase() === address?.toLowerCase())?.percent
                                    }%</p>
                                </div>
                            ))
                        )}
                    </div>

                    {/* 📜 Your Inheritors */}
                    <h3 className="text-xl font-semibold mb-2">🧑‍🤝‍🧑 Your Inheritors</h3>
                    {(plan?.inheritors?.length ?? 0) > 0 ? (
                        <ul className="list-disc list-inside space-y-2">
                            {plan?.inheritors.map((i: Inheritor, idx: number) => {
                                const nowInSeconds = Math.floor(Date.now() / 1000);
                                const unlockTimeWithBuffer = Number(i.unlockTimestamp) - 10;
                                const canRemove = nowInSeconds < unlockTimeWithBuffer;

                                return (
                                    <li key={idx} className="flex justify-between items-center bg-gray-800 rounded p-2">
                                        <div>
                                            <strong>{i.name}</strong> ({i.inheritor}) — {i.percent}% — Unlocks on{" "}
                                            {new Date(Number(i.unlockTimestamp) * 1000).toLocaleString()}
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={async () => {
                                                    setRemoving(i.inheritor);
                                                    await plan?.handleRemoveInheritor(i.inheritor, i.name);
                                                    await refetch(); // 💡 refresh the plan data
                                                    setRemoving(null);
                                                }}
                                                disabled={!canRemove || removing === i.inheritor}
                                                className={`px-3 py-1 text-sm text-white rounded transition
                          ${canRemove ? "bg-red-600 hover:bg-red-700" : "bg-gray-500 cursor-not-allowed"}
                          ${removing === i.inheritor ? "opacity-50 cursor-wait" : ""}`}
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
                </>
            )}
        </div>
    );
}
