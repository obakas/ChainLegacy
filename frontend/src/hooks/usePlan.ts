import { useAccount, useChainId, useConfig } from 'wagmi';
import { ChainLegacy_ABI, ChainLegacy_Address } from '@/constants';
import { readContract } from '@wagmi/core';
import { useState, useEffect } from "react";



export interface InheritorInfo {
    name: string;
    inheritor: string;
    percent: number;
    unlockTimestamp: bigint;
}

export interface Plan {
    names: string[];
    inheritors: InheritorInfo[];
    tokens: string[];
    timeout: bigint;
    lastPing: bigint;
    active: boolean;
    totalAssignedPercent: number;
}

export const usePlan = () => {
    const { address } = useAccount();
    const chainId = useChainId();
    const config = useConfig();

    const [plan, setPlan] = useState<Plan | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchPlan = async () => {
            if (!address) return;
            setLoading(true);
            try {
                const raw = await readContract(config, {
                    address: ChainLegacy_Address,
                    abi: ChainLegacy_ABI,
                    functionName: 'getPlan',
                    args: [address],
                    chainId,
                });

                const [names, inheritorsRaw, tokens, timeout, lastPing, active, totalAssignedPercent] = raw as any[];

                const inheritors: InheritorInfo[] = inheritorsRaw.map((i: any) => ({
                    name: i.name,
                    inheritor: i.inheritor,
                    percent: Number(i.percent),
                    unlockTimestamp: BigInt(i.unlockTimestamp),
                }));

                setPlan({
                    names,
                    inheritors,
                    tokens,
                    timeout: BigInt(timeout),
                    lastPing: BigInt(lastPing),
                    active,
                    totalAssignedPercent: Number(totalAssignedPercent),
                });
            } catch (err) {
                setError(err as Error);
                console.error('❌ Failed to fetch plan:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchPlan();
    }, [address, config, chainId]);

    return { data: plan, loading, error };
};

