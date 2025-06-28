'use client'
import { useState } from 'react'
import { useWriteContract, useAccount } from 'wagmi'
import { ChainLegacy_ABI, ChainLegacy_Address } from '@/constants'
import toast from 'react-hot-toast'

export default function RegisterPlanPage() {
    const { address } = useAccount()
    const [names, setNames] = useState([''])
    const [inheritors, setInheritors] = useState([''])
    const [birthYears, setBirthYears] = useState([''])
    const [percentages, setPercentages] = useState([''])

    const { writeContract, isPending } = useWriteContract()

    const handleSubmit = () => {
        const nameOfPersons = names.map((a) => a.trim())
        const inheritorAddresses = inheritors.map((a) => a.trim())
        const birthYearNums = birthYears.map(Number)
        const percentNums = percentages.map(Number)

        writeContract(
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
            },
            {
                onSuccess() {
                    toast.success('Plan registered successfully!')
                },
                onError(err) {
                    toast.error(err?.message || 'Something went wrong.')
                },
            }
        )
    }

    const addInheritor = () => {
        setNames([...names, ''])
        setInheritors([...inheritors, ''])
        setBirthYears([...birthYears, ''])
        setPercentages([...percentages, ''])
    }

    if (!address) return <p className="text-center mt-12">Please connect your wallet.</p>

    return (
        <div className="max-w-xl mx-auto p-6">
            <h2 className="text-2xl font-semibold mb-4">Register Inheritance Plan</h2>

            {inheritors.map((_, index) => (
                <div key={index} className="mb-4 space-y-2">
                    <input
                        className="w-full border p-2 rounded"
                        placeholder="Name"
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

            <div>
                <button
                    onClick={handleSubmit}
                    disabled={isPending}
                    className="bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    {isPending ? 'Submitting...' : 'Submit Plan'}
                </button>
            </div>
        </div>
    )
}
