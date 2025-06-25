'use client'
import { useState } from 'react'
import { useWriteContract, useAccount } from 'wagmi'
import { ChainLegacy_ABI, ChainLegacy_Address } from '@/constants'
import toast, { Renderable, Toast, ValueFunction } from 'react-hot-toast'

export default function RegisterPlanPage() {

    
    const { address } = useAccount()
    const [names, setNames] = useState([''])
    const [inheritors, setInheritors] = useState([''])
    const [birthYears, setBirthYears] = useState([''])
    const [percentages, setPercentages] = useState([''])
    const [timeout, setTimeout] = useState(30)

    const { writeContract } = useWriteContract()






    const handleSubmit = () => {
        const nameOfPersons = names.map((a) => a.trim())
        const inheritorAddresses = inheritors.map((a) => a.trim())
        const birthYearNums = birthYears.map(Number)
        const percentNums = percentages.map(Number)

        console.log("names:", names);
        console.log("inheritorAddresses:", inheritorAddresses);
        console.log("percentNums:", percentNums);
        console.log("birthYearNums:", birthYearNums);
        console.log("timeout:", timeout);

        writeContract(
            {
                address: ChainLegacy_Address,
                abi: ChainLegacy_ABI,
                functionName: "registerPlan",
                args: [
                    nameOfPersons,
                    inheritorAddresses,
                    percentNums,
                    birthYearNums,
                    BigInt(timeout * 86400),
                    [] // tokens
                ]
            },
            {
                onSuccess() {
                    toast.success('Plan registered successfully!')
                    console.log("Plan registered, now fetching for confirmation...")
                },
                onError(err: { message: Renderable | ValueFunction<Renderable, Toast> }) {
                    toast.error(err.message)
                }
            }
        )
    }

    const addInheritor = () => {
        setNames([...names, ''])
        setInheritors([...inheritors, ''])
        setBirthYears([...birthYears, ''])
        setPercentages([...percentages, ''])
    }

    if (!address) return <p className="text-center mt-12">Please connect your wallet.</p>;

    return (
        <div className="max-w-xl mx-auto p-6">
            <h2 className="text-2xl font-semibold mb-4">Register Inheritance Plan</h2>

            {inheritors.map((_, index) => (
                <div key={index} className="mb-4 space-y-2">
                    <input
                        className="w-full border p-2 rounded"
                        placeholder="name"
                        value={names[index]}
                        onChange={(e) => {
                            const updated = [...names]
                            updated[index] = e.target.value
                            setNames(updated)
                        }}
                    />
                    <input
                        className="w-full border p-2 rounded"
                        placeholder="Inheritor address"
                        value={inheritors[index]}
                        onChange={(e) => {
                            const updated = [...inheritors]
                            updated[index] = e.target.value
                            setInheritors(updated)
                        }}
                    />
                    <input
                        className="w-full border p-2 rounded"
                        placeholder="Birth year (e.g. 2015)"
                        type="number"
                        value={birthYears[index]}
                        onChange={(e) => {
                            const updated = [...birthYears]
                            updated[index] = e.target.value
                            setBirthYears(updated)
                        }}
                    />
                    <input
                        className="w-full border p-2 rounded"
                        placeholder="Percentage (e.g. 25)"
                        type="number"
                        value={percentages[index]}
                        onChange={(e) => {
                            const updated = [...percentages]
                            updated[index] = e.target.value
                            setPercentages(updated)
                        }}
                    />
                </div>
            ))}

            <button
                onClick={addInheritor}
                className="text-blue-600 underline text-sm mb-4"
            >
                + Add Another Inheritor
            </button>

            <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Inactivity Timeout (days)</label>
                <input
                    className="w-full border p-2 rounded"
                    type="number"
                    value={timeout}
                    onChange={(e) => setTimeout(Number(e.target.value))}
                />
            </div>

            <button
                onClick={handleSubmit}
                className="bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700"
            >
                Submit Plan
            </button>
        </div>
    )
}