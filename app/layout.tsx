import { Inter } from 'next/font/google'
import Image from 'next/image'
import Link from 'next/link'
import { FaGithub, FaDiscord, FaLightbulb } from 'react-icons/fa'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'CDP SDK Demo Apps',
  description: 'Explore demo applications built with CDP (Coinbase Developer Platform) SDK.',
  openGraph: {
    title: 'CDP SDK Demo Apps',
    description: 'Explore demo applications built with CDP (Coinbase Developer Platform) SDK.',
    url: 'https://cdpsdk.xyz',
    siteName: 'CDP SDK Demos',
    images: [
      {
        url: '/cdp-sample-apps.png',
        width: 1200,
        height: 630,
        alt: 'CDP SDK Demo Apps',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CDP SDK Demo Apps',
    description: 'Explore demo applications built with CDP (Coinbase Developer Platform) SDK.',
    images: ['/cdp-sample-apps.png'],
  },
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
        <div className="min-h-screen bg-white text-gray-800">
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
                  <a href="https://github.com/coinbase/coinbase-sdk-nodejs" className="text-gray-700 hover:text-blue-600 transition-colors" target="_blank" rel="noopener noreferrer">
                    <FaGithub size={24} />
                  </a>
                </li>
                <li>
                  <a href="https://discord.gg/cdp" className="text-gray-700 hover:text-blue-600 transition-colors" target="_blank" rel="noopener noreferrer">
                    <FaDiscord size={24} />
                  </a>
                </li>
              </ul>
            </nav>
          </header>
          <main>
            {children}
          </main>
          <footer className="py-10 text-center text-gray-600 bg-white mt-20 border-t border-lavender-200">
            <p>&copy; 2024 CDP SDK. All rights reserved.</p>
            <p>
              By using this app, you agree to the{' '}
              <a
                href="https://www.coinbase.com/legal/cloud/terms-of-service"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Terms of Service
              </a>
            </p>
          </footer>
        </div>
      </body>
    </html>
  )
}
