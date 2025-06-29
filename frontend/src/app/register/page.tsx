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

    const removeInheritor = (index: number) => {
        if (names.length <= 1) return
        setNames(names.filter((_, i) => i !== index))
        setInheritors(inheritors.filter((_, i) => i !== index))
        setBirthYears(birthYears.filter((_, i) => i !== index))
        setPercentages(percentages.filter((_, i) => i !== index))
    }

    if (!address) return (
        <div className="max-w-xl mx-auto p-6 bg-gray-900 rounded-xl shadow-lg border border-gray-800 text-center mt-12">
            <p className="text-white">Please connect your wallet to register a plan.</p>
        </div>
    )

    return (
        <div className="max-w-xl mx-auto p-6 bg-gray-900 rounded-xl shadow-lg border border-gray-800 mt-10">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Register Inheritance Plan</h2>

            <div className="space-y-6">
                {inheritors.map((_, index) => (
                    <div key={index} className="bg-gray-800 p-4 rounded-lg border border-gray-700 relative">
                        {index > 0 && (
                            <button
                                onClick={() => removeInheritor(index)}
                                className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                                title="Remove inheritor"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </button>
                        )}
                        <div className="space-y-3">
                            <div>
                                <label className="block text-gray-400 text-sm mb-1">Name</label>
                                <input
                                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="John Doe"
                                    value={names[index]}
                                    onChange={(e) => {
                                        const updated = [...names]
                                        updated[index] = e.target.value
                                        setNames(updated)
                                    }}
                                />
                            </div>
                            <div>
                                <label className="block text-gray-400 text-sm mb-1">Wallet Address</label>
                                <input
                                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="0x..."
                                    value={inheritors[index]}
                                    onChange={(e) => {
                                        const updated = [...inheritors]
                                        updated[index] = e.target.value
                                        setInheritors(updated)
                                    }}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-400 text-sm mb-1">Birth Year</label>
                                    <input
                                        className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="1990"
                                        type="number"
                                        value={birthYears[index]}
                                        onChange={(e) => {
                                            const updated = [...birthYears]
                                            updated[index] = e.target.value
                                            setBirthYears(updated)
                                        }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm mb-1">Percentage</label>
                                    <div className="relative">
                                        <input
                                            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="25"
                                            type="number"
                                            value={percentages[index]}
                                            onChange={(e) => {
                                                const updated = [...percentages]
                                                updated[index] = e.target.value
                                                setPercentages(updated)
                                            }}
                                        />
                                        <span className="absolute right-3 top-3 text-gray-400">%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                <button
                    onClick={addInheritor}
                    className="flex items-center justify-center w-full py-2 px-4 bg-gray-800 hover:bg-gray-700 text-blue-400 rounded-lg border border-gray-700 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Add Another Inheritor
                </button>

                <button
                    onClick={handleSubmit}
                    disabled={isPending}
                    className={`w-full py-3 px-4 rounded-lg font-bold text-white transition-colors ${isPending
                            ? "bg-blue-700 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700"
                        }`}
                >
                    {isPending ? (
                        <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Registering Plan...
                        </span>
                    ) : (
                        'Register Inheritance Plan'
                    )}
                </button>
            </div>
        </div>
    )
}