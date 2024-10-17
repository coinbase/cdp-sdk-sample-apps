'use client'

import { useState } from 'react'

const defaultAbi = [
  {
    "type": "function",
    "name": "pureUint16",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint16", "internalType": "uint16" }],
    "stateMutability": "pure"
  }
]

export default function Home() {
  const [contractAddress, setContractAddress] = useState('0x0B54409D1B1dd1438eDF7729CDAea3E331Ae12ED')
  const [abiInput, setAbiInput] = useState(JSON.stringify(defaultAbi, null, 2))
  const [method, setMethod] = useState('pureUint16')
  const [argsInput, setArgsInput] = useState('{}')
  const [output, setOutput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContractAddress(e.target.value)
  }

  const handleAbiChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAbiInput(e.target.value)
    setError('')
  }

  const handleMethodChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMethod(e.target.value)
  }

  const handleArgsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setArgsInput(e.target.value)
    setError('')
  }

  const callFunction = async () => {
    setIsLoading(true)
    setError('')
    try {
      let parsedAbi
      let parsedArgs

      try {
        parsedAbi = JSON.parse(abiInput)
      } catch (e) {
        throw new Error('Invalid ABI JSON')
      }

      try {
        parsedArgs = JSON.parse(argsInput)
      } catch (e) {
        throw new Error('Invalid Arguments JSON')
      }

      const response = await fetch('/api/contractreader', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractAddress,
          abi: parsedAbi,
          method,
          args: parsedArgs,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to call contract')
      }

      const data = await response.json()
      setOutput(JSON.stringify(data.result, null, 2))
    } catch (error) {
      console.error(error)
      setError((error as Error).message)
      setOutput('')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-4">Contract Reader</h1>
      <div className="mb-4">
        <label className="block mb-2">Contract Address:</label>
        <input
          type="text"
          value={contractAddress}
          onChange={handleAddressChange}
          className="w-full p-2 border rounded"
        />
      </div>
      <div className="mb-4">
        <label className="block mb-2">ABI (JSON format):</label>
        <textarea
          value={abiInput}
          onChange={handleAbiChange}
          className="w-full p-2 border rounded font-mono text-sm"
          rows={10}
          placeholder="Paste your ABI JSON here"
        />
      </div>
      <div className="mb-4">
        <label className="block mb-2">Method:</label>
        <input
          type="text"
          value={method}
          onChange={handleMethodChange}
          className="w-full p-2 border rounded"
        />
      </div>
      <div className="mb-4">
        <label className="block mb-2">Arguments (JSON format):</label>
        <textarea
          value={argsInput}
          onChange={handleArgsChange}
          className="w-full p-2 border rounded"
          rows={3}
          placeholder='{"arg1": "value1", "arg2": "value2"}'
        />
      </div>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      <button
        onClick={callFunction}
        disabled={isLoading}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
      >
        {isLoading ? 'Calling...' : 'Call Function'}
      </button>
      {output && (
        <div className="mt-4">
          <h2 className="text-xl font-bold mb-2">Output:</h2>
          <pre className="p-4 bg-gray-100 rounded overflow-x-auto">
            {output}
          </pre>
        </div>
      )}
    </main>
  )
}
