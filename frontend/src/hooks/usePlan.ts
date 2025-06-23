import { useAccount, useReadContract } from 'wagmi';
import { ChainLegacy_ABI, ChainLegacy_Address } from '@/constants';

export function useUnallocatedPercent() {
    const { address } = useAccount();

    if (!address) {
        return { data: undefined, isLoading: false }; // Safe fallback
    }

    return useReadContract({
        address: ChainLegacy_Address,
        abi: ChainLegacy_ABI,
        functionName: 'getUnallocatedPercent',
        args: [address],
    });
}


// / import { ChainLegacy_ABI, ChainLegacy_Address } from '@/constants'
// import { useAccount, useChainId, useConfig } from 'wagmi'
// import { readContract } from '@wagmi/core';

// export const useUnallocatedPercent = () => {
//     const { address } = useAccount();
//     const chainId = useChainId();
//     const config = useConfig();

//     return readContract(config, {
//         address: ChainLegacy_Address,
//         abi: ChainLegacy_ABI,
//         functionName: 'getUnallocatedPercent',
//         args: [address],
//         chainId
//     })
// }
