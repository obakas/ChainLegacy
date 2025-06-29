import { useAccount, useChainId, useConfig } from 'wagmi';
import { ChainLegacy_ABI, ChainLegacy_Address } from '@/constants';
import { readContract, writeContract, waitForTransactionReceipt } from '@wagmi/core';
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
    totalAssignedPercent: number;
    nativeBalance: bigint;
    erc20Balances: { [tokenAddress: string]: bigint };
    handleRemoveInheritor: (inheritor: string, name: string) => void;
    handleAddInheritor: (inheritor: string, name: string, percent: number, unlockTimestamp: string | number | bigint) => void;
}

export const usePlan = () => {
    const { address } = useAccount();
    const chainId = useChainId();
    const config = useConfig();

    const [plan, setPlan] = useState<Plan | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const [names, setNames] = useState([''])
    const [inheritors, setInheritors] = useState([''])
    const [birthYears, setBirthYears] = useState([''])
    const [percentages, setPercentages] = useState([''])

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

            const totalAssignedPercent = 100 - Number(unallocatedRaw);

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

            // 👇 Save into state
            setPlan(() => ({
                names: [...names],
                inheritors,
                tokens,
                timeout: BigInt(timeout),
                lastPing: BigInt(lastPing),
                active,
                totalAssignedPercent,
                nativeBalance: BigInt(nativeBalance),
                erc20Balances,
                handleRemoveInheritor, // hook-scoped function
                handleAddInheritor,
            }));
        } catch (err) {
            setError(err as Error);
            console.error('❌ Failed to fetch plan:', err);
            toast.error("Failed to load plan.");
        } finally {
            setLoading(false);
        }
    }, [address, chainId, config]);

    const handleRemoveInheritor = useCallback(
        async (inheritor: string, name: string) => {
            try {
                const tx = await writeContract(config, {
                    address: ChainLegacy_Address,
                    abi: ChainLegacy_ABI,
                    functionName: "removeInheritor",
                    args: [inheritor, name],
                });

                await waitForTransactionReceipt(config, { hash: tx });
                toast.success("Inheritor removed successfully!");
                setTimeout(() => {
                    fetchPlan(); // small delay for chain sync
                }, 500);
            } catch (err: any) {
                console.error("Error removing inheritor:", err);
                toast.error(err?.message || "Failed to remove inheritor.");
            }
        },
        [config, fetchPlan]
    );

    // Add the handleAddInheritor function
    const handleAddInheritor = () => {
        const nameOfPersons = names.map((a) => a.trim())
        const inheritorAddresses = inheritors.map((a) => a.trim())
        const birthYearNums = birthYears.map(Number)
        const percentNums = percentages.map(Number)

        writeContract(
            config,
            {
                address: ChainLegacy_Address,
                abi: ChainLegacy_ABI,
                functionName: 'registerPlan',
                args: [
                    nameOfPersons,
                    inheritorAddresses,
                    percentNums,
                    birthYearNums,
                    BigInt(120), // 2 mins for demo
                    [], // token addresses
                ],
            }
        ).then(() => {
            toast.success('Inheritors Added successfully!');
        }).catch((err) => {
            toast.error(err?.message || 'Something went wrong.');
        });
    }


    useEffect(() => {
        fetchPlan();
    }, [fetchPlan]);

    return {
        data: plan,
        loading,
        error,
        refetch: fetchPlan,
    };
};
