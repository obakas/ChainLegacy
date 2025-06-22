"use client";
import { useEffect, useState } from "react";
import { useAccount, useBalance } from "wagmi";
import { LegacyToken_Address } from "@/constants";

const BIRTH_YEAR = 2015; // Replace with dynamic value if possible
const UNLOCK_AGE = 18;

export default function InheritorPage() {
    const { address } = useAccount();
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [age, setAge] = useState<number | null>(null);

    const { data, isLoading } = useBalance({
        address,
        token: LegacyToken_Address,
    });

    useEffect(() => {
        const now = new Date();
        const currentYear = now.getUTCFullYear();
        const calculatedAge = currentYear - BIRTH_YEAR;
        setAge(calculatedAge);
        setIsUnlocked(calculatedAge >= UNLOCK_AGE);
    }, []);

    return (
        <div className="max-w-md mx-auto p-6">
            <h2 className="text-xl font-semibold mb-4">Inheritor Dashboard</h2>

            {!address && <p>Connect your wallet to view your inheritance.</p>}
            {address && age !== null && (
                <p className="mb-4">Your age: <strong>{age}</strong></p>
            )}

            {address && age !== null && !isUnlocked && (
                <p className="text-yellow-600 font-semibold">You are not yet eligible to claim your inheritance. Come back when you turn 18.</p>
            )}

            {address && isUnlocked && (
                <>
                    {isLoading && <p>Loading balance...</p>}
                    {data && (
                        <div className="mt-4">
                            <p><strong>Your Wallet:</strong> {address}</p>
                            <p><strong>$LEGACY Balance:</strong> {data.formatted} {data.symbol}</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

