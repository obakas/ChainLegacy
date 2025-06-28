import { useAccount, useChainId, useConfig } from 'wagmi';
import { ChainLegacy_ABI, ChainLegacy_Address } from '@/constants';
import { readContract } from '@wagmi/core';
import { useState, useEffect, useCallback } from "react";
import toast from 'react-hot-toast';

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
    totalAssignedPercent: number; // this is the ACTUAL assigned amount
    nativeBalance: bigint;
    erc20Balances: { [tokenAddress: string]: bigint };
}

export const usePlan = () => {
    const { address } = useAccount();
    const chainId = useChainId();
    const config = useConfig();

    const [plan, setPlan] = useState<Plan | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchPlan = useCallback(async () => {
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

            const [names, inheritorsRaw, tokens, timeout, lastPing, active, nativeBalance] = raw as any[];

            const inheritors: InheritorInfo[] = inheritorsRaw.map((i: any) => ({
                name: i.name,
                inheritor: i.inheritor,
                percent: Number(i.percent),
                unlockTimestamp: BigInt(i.unlockTimestamp),
            }));

            const unallocatedRaw = await readContract(config, {
                address: ChainLegacy_Address,
                abi: ChainLegacy_ABI,
                functionName: 'getUnallocatedPercent',
                args: [address],
                chainId,
            });

            const totalAssignedPercent = 100 - Number(unallocatedRaw); // 🧠 correct math

            const erc20Balances: { [address: string]: bigint } = {};
            for (const token of tokens) {
                const balance = await readContract(config, {
                    address: ChainLegacy_Address,
                    abi: ChainLegacy_ABI,
                    functionName: 'getERC20Balance',
                    args: [address, token],
                    chainId,
                });
                erc20Balances[token] = BigInt(balance as string | number | bigint);
            }

            setPlan({
                names,
                inheritors,
                tokens,
                timeout: BigInt(timeout),
                lastPing: BigInt(lastPing),
                active,
                totalAssignedPercent,
                nativeBalance: BigInt(nativeBalance),
                erc20Balances,
            });
        } catch (err) {
            setError(err as Error);
            console.error('❌ Failed to fetch plan:', err);
            toast.error("Failed to load plan.");
        } finally {
            setLoading(false);
        }
    }, [address, chainId, config]);

    useEffect(() => {
        fetchPlan();
    }, [fetchPlan]);

    return {
        data: plan,
        loading,
        error,
        refetch: fetchPlan, // ✅ call this after any mutation!
    };
};
