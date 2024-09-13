import { Inter } from 'next/font/google'
import Image from 'next/image'
import Link from 'next/link'
import { FaGithub, FaDiscord, FaLightbulb } from 'react-icons/fa'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'CDP SDK Sample Apps',
  description: 'Explore powerful sample applications built with CDP SDK',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-white to-lavender-100 text-gray-800">
          <header className="py-6 px-4 bg-white shadow-md">
            <nav className="container mx-auto flex justify-between items-center">
              <Link href="/">
                <Image src="/logo.png" alt="CDP SDK Logo" width={120} height={40} />
              </Link>
              <ul className="flex space-x-6 items-center">
                <li>
                  <a href="https://docs.cdp.coinbase.com/cdp-sdk/docs/welcome" className="text-gray-700 hover:text-blue-600 transition-colors" target="_blank" rel="noopener noreferrer">
                    <FaLightbulb size={24} />
                  </a>
                </li>
                <li>
                  <a href="https://github.com/coinbase/cdp-sdk-aave-sample" className="text-gray-700 hover:text-blue-600 transition-colors" target="_blank" rel="noopener noreferrer">
                    <FaGithub size={24} />
                  </a>
                </li>
                <li>
                  <a href="https://discord.gg/coinbasedevelopers" className="text-gray-700 hover:text-blue-600 transition-colors" target="_blank" rel="noopener noreferrer">
                    <FaDiscord size={24} />
                  </a>
                </li>
              </ul>
            </nav>
          </header>
          <main>
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
