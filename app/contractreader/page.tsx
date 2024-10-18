'use client'

import { useState, useEffect } from 'react'

const defaultAbi = [
  {
    "type": "function",
    "name": "pureUint16",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint16", "internalType": "uint16" }],
    "stateMutability": "pure"
  }
]


interface AbiItem {
  type: string;
  name: string;
  inputs: { name: string; type: string }[];
  stateMutability: string;
}

export default function Home() {
  const [contractAddress, setContractAddress] = useState('0x0B54409D1B1dd1438eDF7729CDAea3E331Ae12ED')
  const [abiInput, setAbiInput] = useState(JSON.stringify(defaultAbi, null, 2))
  const [parsedAbi, setParsedAbi] = useState<AbiItem[]>(defaultAbi as AbiItem[])
  const [methods, setMethods] = useState<string[]>([])
  const [selectedMethod, setSelectedMethod] = useState('')
  const [argsInput, setArgsInput] = useState('{}')
  const [output, setOutput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [network, setNetwork] = useState('base-sepolia')

  useEffect(() => {
    try {
      const parsed = JSON.parse(abiInput) as AbiItem[]
      setParsedAbi(parsed)
      const viewFunctions = parsed.filter(item => 
        item.type === 'function' && 
        (item.stateMutability === 'view' || item.stateMutability === 'pure')
      )
      const methodNames = viewFunctions.map(item => item.name)
      setMethods(methodNames)
      setSelectedMethod(methodNames[0] || '')
    } catch (e) {
      setError('Invalid ABI JSON')
    }
  }, [abiInput])

  useEffect(() => {
    if (selectedMethod) {
      const selectedFunction = parsedAbi.find(item => item.name === selectedMethod)
      if (selectedFunction) {
        const defaultArgs = selectedFunction.inputs.reduce((acc, input) => {
          acc[input.name || `arg${Object.keys(acc).length}`] = ''
          return acc
        }, {} as Record<string, string>)
        setArgsInput(JSON.stringify(defaultArgs, null, 2))
      }
    }
  }, [selectedMethod, parsedAbi])

  const resetFields = () => {
    setContractAddress('')
    setAbiInput(JSON.stringify({}, null, 2))
    setParsedAbi(defaultAbi as AbiItem[])
    setMethods([])
    setSelectedMethod('')
    setArgsInput('{}')
    setOutput('')
    setError('')
  }

  const handleNetworkChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setNetwork(e.target.value)
    resetFields()
  }

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContractAddress(e.target.value)
  }

  const handleAbiChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAbiInput(e.target.value)
    setError('')
  }

  const handleMethodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMethod(e.target.value)
  }

  const handleArgsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setArgsInput(e.target.value)
    setError('')
  }

  const callFunction = async () => {
    setIsLoading(true)
    setError('')
    try {
      let parsedArgs

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
          method: selectedMethod,
          args: parsedArgs,
          network,
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
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Contract Reader
          </h1>
          <p className="mt-3 text-xl text-gray-500 sm:mt-4">
            Supports Base Sepolia and Base Mainnet
          </p>
        </div>
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="space-y-6">
              <div>
                <label htmlFor="network" className="block text-sm font-medium text-gray-700">
                  Network
                </label>
                <select
                  id="network"
                  value={network}
                  onChange={handleNetworkChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-gray-100"
                >
                  <option value="base-sepolia">Base Sepolia</option>
                  <option value="base-mainnet">Base Mainnet</option>
                </select>
              </div>
              <div>
                <label htmlFor="contract-address" className="block text-sm font-medium text-gray-700">
                  Contract Address
                </label>
                <input
                  type="text"
                  id="contract-address"
                  value={contractAddress}
                  onChange={handleAddressChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-100"
                />
              </div>
              <div>
                <label htmlFor="abi" className="block text-sm font-medium text-gray-700">
                  ABI (JSON format)
                </label>
                <textarea
                  id="abi"
                  rows={5}
                  value={abiInput}
                  onChange={handleAbiChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono"
                  placeholder="Paste your ABI JSON here"
                />
              </div>
              <div>
                <label htmlFor="method" className="block text-sm font-medium text-gray-700">
                  Method
                </label>
                <select
                  id="method"
                  value={selectedMethod}
                  onChange={handleMethodChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-gray-100"
                >
                  {methods.length === 0 ? (
                    <option value="">No methods available</option>
                  ) : (
                    <>
                      <option value="">Select a method</option>
                      {methods.map(method => (
                        <option key={method} value={method}>{method}</option>
                      ))}
                    </>
                  )}
                </select>
              </div>
              <div>
                <label htmlFor="arguments" className="block text-sm font-medium text-gray-700">
                  Arguments (JSON format)
                </label>
                <textarea
                  id="arguments"
                  rows={3}
                  value={argsInput}
                  onChange={handleArgsChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono"
                  placeholder='{"arg1": "value1", "arg2": "value2"}'
                />
              </div>
            </div>
            {error && (
              <div className="mt-4 text-sm text-red-600">
                {error}
              </div>
            )}
            <div className="mt-6">
              <button
                onClick={callFunction}
                disabled={isLoading}
                className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
              >
                {isLoading ? 'Calling...' : 'Call Function'}
              </button>
            </div>
          </div>
        </div>
        {output && (
          <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">Output</h2>
              <pre className="mt-2 p-4 bg-gray-50 rounded-md overflow-x-auto text-sm">
                {output}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
