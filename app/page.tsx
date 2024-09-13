import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  return (
  <div className={`min-h-screen bg-white text-gray-800 ${inter.className}`}>

  <main className="container mx-auto px-4 py-20">
    <h1 className="text-5xl md:text-6xl font-semibold text-center mb-8">
      <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
        CDP SDK Sample Apps
      </span>
    </h1>

    <p className="text-xl text-center mb-16 max-w-3xl mx-auto text-gray-600">
      Explore our powerful sample applications and unlock the full potential of CDP SDK.
    </p>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 max-w-4xl mx-auto">
    {[
        { 
          name: 'Lending App', 
          route: '/aave',
          description: 'Explore Aave integration with CDP SDK for decentralized lending and borrowing.'
        },
        { 
          name: 'Onchain AI', 
          route: 'https://aiwalletdemo.com/',
          description: 'The Onchain AI template provides a simple app for Reinforcement Learning from Human Feedback using the CDP SDK.'
        },
        { 
          name: 'Trading Bot', 
          route: 'https://github.com/coinbase/tg-trading-bot',
          description: 'Discover automated trading strategies implemented with CDP SDK on Telegram.'
        },
        { 
          name: 'Automated Payouts', 
          route: 'https://masspayoutsdemo.com/',
          description: 'Automate mass payments for free on Base with Transfer APIs on CDP SDK'
        }
      ].map((app, index) => (
        <div key={index} className="bg-white rounded-xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-lavender-200">
          <h2 className="text-xl font-medium mb-4 text-blue-600">{app.name}</h2>
          <p className="mb-8 text-gray-600">{app.description}</p>
          <a 
            href={app.route} 
            className="inline-block bg-gradient-to-r from-lavender-400 to-blue-500 text-white px-6 py-3 rounded-full font-medium hover:from-lavender-500 hover:to-blue-600 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl"            {...(app.name !== 'Lending App' ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            View Demo
          </a>
        </div>
      ))}
    </div>
    
    <div className="mt-24 text-center">
      <a 
        href="https://docs.cdp.coinbase.com/mpc-wallet/docs/quickstart" 
        className="inline-block bg-gradient-to-r from-lavender-400 to-lavender-600 text-white px-10 py-5 rounded-full font-bold text-xl hover:from-lavender-500 hover:to-lavender-700 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl"
        target="_blank"
        rel="noopener noreferrer"
      >
        Get Started with CDP SDK
      </a>
    </div>
  </main>
      
  <footer className="py-10 text-center text-gray-600 bg-white mt-20 border-t border-lavender-200">
    <p>&copy; 2024 CDP SDK. All rights reserved.</p>
  </footer>
</div>
  );
}