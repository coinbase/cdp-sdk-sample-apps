'use client'

import { useState } from 'react'

export default function Home() {
  const [contractAddress, setContractAddress] = useState('')
  const [abi, setAbi] = useState('')
  const [method, setMethod] = useState('')
  const [args, setArgs] = useState<{[key: string]: string}>({})
  const [newArgKey, setNewArgKey] = useState('')
  const [newArgValue, setNewArgValue] = useState('')
  const [output, setOutput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContractAddress(e.target.value)
  }

  const handleAbiChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAbi(e.target.value)
  }

  const handleMethodChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMethod(e.target.value)
  }

  const handleAddArg = () => {
    if (newArgKey && newArgValue) {
      setArgs(prev => ({ ...prev, [newArgKey]: newArgValue }))
      setNewArgKey('')
      setNewArgValue('')
    }
  }

  const handleRemoveArg = (key: string) => {
    setArgs(prev => {
      const newArgs = { ...prev }
      delete newArgs[key]
      return newArgs
    })
  }

  const callFunction = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/contractreader', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractAddress,
          abi,  
          method,
          args,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to call contract')
      }

      const data = await response.json()
      setOutput(JSON.stringify(data.result, null, 2))
    } catch (error) {
      console.error(error)
      setOutput('Error: ' + (error as Error).message)
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
          value={abi}
          onChange={handleAbiChange}
          className="w-full p-2 border rounded"
          rows={5}
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
        <label className="block mb-2">Arguments:</label>
        {Object.entries(args).map(([key, value]) => (
          <div key={key} className="flex mb-2">
            <input
              type="text"
              value={key}
              readOnly
              className="w-1/3 p-2 border rounded-l"
            />
            <input
              type="text"
              value={value}
              readOnly
              className="w-1/3 p-2 border-t border-b"
            />
            <button
              onClick={() => handleRemoveArg(key)}
              className="w-1/3 p-2 bg-red-500 text-white rounded-r"
            >
              Remove
            </button>
          </div>
        ))}
        <div className="flex mb-2">
          <input
            type="text"
            value={newArgKey}
            onChange={(e) => setNewArgKey(e.target.value)}
            placeholder="Key"
            className="w-1/3 p-2 border rounded-l"
          />
          <input
            type="text"
            value={newArgValue}
            onChange={(e) => setNewArgValue(e.target.value)}
            placeholder="Value"
            className="w-1/3 p-2 border-t border-b"
          />
          <button
            onClick={handleAddArg}
            className="w-1/3 p-2 bg-green-500 text-white rounded-r"
          >
            Add Argument
          </button>
        </div>
      </div>
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
