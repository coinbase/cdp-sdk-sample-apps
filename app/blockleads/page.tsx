import Image from 'next/image';

export default function BlockLeads() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-teal-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white bg-opacity-80 backdrop-filter backdrop-blur-lg rounded-lg shadow-xl overflow-hidden">
          <div className="p-8">
            <div className="flex items-center justify-between mb-12">
              <h1 className="text-5xl font-bold text-gray-900 tracking-tight">BlockLeads</h1>
              <a 
                href="https://blockLeads.xyz" 
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
                target="_blank" 
                rel="noopener noreferrer"
              >
                Launch Demo App
              </a>
            </div>

            <p className="text-xl font-light text-gray-700 mb-12 leading-relaxed">
              BlockLeads is an app on Base Sepolia that automatically rewards users with free $USDC in return for providing their crypto  wallet address.
            </p>

            <div className="bg-white bg-opacity-50 rounded-lg p-8 mb-12 shadow-inner">
              <h2 className="text-3xl font-semibold text-gray-800 mb-6">How it works</h2>
              <ol className="list-decimal list-inside space-y-4 text-gray-700">
                <li className="text-lg">User enters name, email, and wallet address (currently configured to support Base).</li>
                <li className="text-lg">User clicks on `Claim USDC`.</li>
                <li className="text-lg">User instantly receives $0.25 reward of USDC on Base Sepolia (testnet) into the wallet address provided.</li>
              </ol>
              <p className="mt-6 text-sm font-light text-gray-600">
                Demo app limits one reward per email or wallet (each must be independently unique).
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">GitHub Repositories</h2>
                <ul className="space-y-4">
                  <li>
                    <a href="https://github.com/HeimLabs/coinbase-blockleads-frontend" className="text-indigo-600 hover:text-indigo-800 transition duration-150 ease-in-out" target="_blank" rel="noopener noreferrer">
                      Frontend Repository
                    </a>
                  </li>
                  <li>
                    <a href="https://github.com/HeimLabs/coinbase-blockleads-backend" className="text-indigo-600 hover:text-indigo-800 transition duration-150 ease-in-out" target="_blank" rel="noopener noreferrer">
                      Backend Repository
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">Tool Set</h2>
                <ul className="space-y-4">
                  <li>
                    <a href="https://docs.cdp.coinbase.com/mpc-wallet/docs/welcome" className="text-indigo-600 hover:text-indigo-800 transition duration-150 ease-in-out" target="_blank" rel="noopener noreferrer">
                      Coinbase Developer Platform SDK
                    </a>
                  </li>
                  <li>
                    <a href="https://docs.cdp.coinbase.com/mpc-wallet/docs/wallets/#developer-managed-wallets" className="text-indigo-600 hover:text-indigo-800 transition duration-150 ease-in-out" target="_blank" rel="noopener noreferrer">
                      Developer-Managed Wallets
                    </a>
                  </li>
                  <li>
                    <a href="https://www.base.org/getstarted" className="text-indigo-600 hover:text-indigo-800 transition duration-150 ease-in-out" target="_blank" rel="noopener noreferrer">
                      Base L2
                    </a>
                  </li>
                  <li>USDC on Base</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
