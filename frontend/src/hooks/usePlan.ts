import { useAccount, useChainId, useConfig } from 'wagmi';
import { ChainLegacy_ABI, ChainLegacy_Address } from '@/constants';
import { readContract } from '@wagmi/core';
import { useState, useEffect } from "react";


const useUnallocatedPercent = (inputAddress?: string) => {
    const [data, setData] = useState<number>();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error>();
    const { address } = useAccount();
    const chainId = useChainId();
    const config = useConfig();

    useEffect(() => {
        const targetAddress = inputAddress ?? address;
        if (!targetAddress) return;

        const fetchPercent = async () => {
            setLoading(true);
            try {
                const result = await readContract(config, {
                    address: ChainLegacy_Address,
                    abi: ChainLegacy_ABI,
                    functionName: 'getUnallocatedPercent',
                    args: [targetAddress],
                    chainId
                });
                setData(result as number);
                setError(undefined);
            } catch (err) {
                setError(err as Error);
                console.error("❌ Error fetching unallocated percent:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchPercent();
    }, [inputAddress, address, config, chainId]);

    return { data, loading, error };
};

export { useUnallocatedPercent };


const useAllocatedPercent = (inputAddress?: string) => {
    const [data, setData] = useState<number>();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error>();
    const { address } = useAccount();
    const chainId = useChainId();
    const config = useConfig();

    useEffect(() => {
        const targetAddress = inputAddress ?? address;
        if (!targetAddress) return;

        const fetchPercent = async () => {
            setLoading(true);
            try {
                const result = await readContract(config, {
                    address: ChainLegacy_Address,
                    abi: ChainLegacy_ABI,
                    functionName: 'getAllocatedPercent',
                    args: [targetAddress],
                    chainId
                });
                setData(result as number);
                setError(undefined);
            } catch (err) {
                setError(err as Error);
                console.error("❌ Error fetching allocated percent:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchPercent();
    }, [inputAddress, address, config, chainId]);

    return { data, loading, error };
};

export { useAllocatedPercent };


export interface InheritorInfo {
  inheritor: string;
  percent: number;
  unlockTimestamp: bigint;
}

export interface Plan {
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

        const [inheritorsRaw, tokens, timeout, lastPing, active, totalAssignedPercent] = raw as any[];

        const inheritors: InheritorInfo[] = inheritorsRaw.map((i: any) => ({
          inheritor: i.inheritor,
          percent: Number(i.percent),
          unlockTimestamp: BigInt(i.unlockTimestamp),
        }));

        setPlan({
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

export { usePlan };


