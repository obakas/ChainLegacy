import { readContract, writeContract, waitForTransactionReceipt } from "@wagmi/core";
import toast from "react-hot-toast";
import { ChainLegacy_ABI, ChainLegacy_Address } from "@/constants";
import { useAccount, useChainId, useConfig } from "wagmi";
import { encodeAbiParameters, parseAbiParameters } from 'viem';


export function TriggerUpkeepButton() {
    const { address } = useAccount();
    const chainId = useChainId();
    const config = useConfig();



    const encodedCheckData = encodeAbiParameters(parseAbiParameters('address'), [ChainLegacy_Address] );


    const handleUpkeep = async () => {
        if (!address) {
            toast.error("Wallet not connected");
            return;
        }

        toast.loading("🔍 Checking if upkeep is needed...");

        try {
            const [upkeepNeeded, performData] = await readContract(config, {
                address: ChainLegacy_Address,
                abi: ChainLegacy_ABI,
                functionName: "checkUpkeep",
                args: [encodedCheckData],
                chainId,
            }) as [boolean, any];

            toast.dismiss();

            if (!upkeepNeeded) {
                toast("⏱️ No upkeep needed yet.");
                return;
            }

            toast.loading("🚀 Triggering upkeep...");

            const txHash = await writeContract(config, {
                address: ChainLegacy_Address,
                abi: ChainLegacy_ABI,
                functionName: "performUpkeep",
                args: [performData],
                chainId,
            });

            await waitForTransactionReceipt(config, { hash: txHash });
            toast.success("✅ Upkeep performed successfully!");
        } catch (err: any) {
            toast.dismiss();
            toast.error(err?.message || "❌ Failed to perform upkeep.");
            console.error("performUpkeep error:", err);
        }
    };

    return (
        <button
            onClick={handleUpkeep}
            className="bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 mt-4"
        >
            🛠️ Trigger Upkeep (Dev Only)
        </button>
    );
}
