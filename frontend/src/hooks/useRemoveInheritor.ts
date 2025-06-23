
import { useAccount, useChainId, useConfig } from 'wagmi'
import { ChainLegacy_ABI, ChainLegacy_Address } from '@/constants'
import { useState, useEffect } from 'react'
import { writeContract, waitForTransactionReceipt } from '@wagmi/core';

export const useRemoveInheritor = (p0: { args: string[]; }) => {
    // const [txHash, setTxHash] = useState<string | null>(null)
    const { address } = useAccount();
    const chainId = useChainId();
    const config = useConfig();
    const [data, setData] = useState<string | undefined>();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | string | undefined>(undefined);

    useEffect(() => {
        const removeInheritor = async () => {
            try {
                const remove = await writeContract(config, {
                    address: ChainLegacy_Address,
                    abi: ChainLegacy_ABI,
                    functionName: 'removeInheritor',
                    args: [address],
                    chainId,
                });
                await waitForTransactionReceipt(config, { hash: remove });
                setData(remove);
            } catch (error) {
                if (error instanceof Error) {
                    setError(error);
                } else {
                    setError(String(error));
                }
            } finally {
                setLoading(false);
            }
        };

        removeInheritor();
    }, [address, chainId, config]);


    return { data, error, loading };

}
