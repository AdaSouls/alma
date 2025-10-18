import { motion } from 'framer-motion'
import { useWallet } from '../context/WalletContext'
import AlmaLogo from './AlmaLogo'

export default function Header() {
  const { connected, connecting, connect, disconnect, walletName } = useWallet()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-purple-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <AlmaLogo level={5} size={50} animate={false} />
            <div>
              <h1 className="text-2xl font-display font-bold text-gradient from-purple-400 to-pink-400">
                $ALMA
              </h1>
              <p className="text-xs text-purple-300/70">Your ALDEA journey</p>
            </div>
          </motion.div>

          {/* Navigation Links */}
          <motion.nav
            className="hidden md:flex items-center gap-8"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <a
              href="https://aldea-dao.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-purple-300 hover:text-purple-100 transition-colors"
            >
              ALDEA DAO
            </a>
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-purple-300 hover:text-purple-100 transition-colors"
            >
              Gitbook
            </a>
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-purple-300 hover:text-purple-100 transition-colors"
            >
              Autonomous World
            </a>
          </motion.nav>

          {/* Wallet Connection */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {connected ? (
              <button
                onClick={disconnect}
                className="px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 font-medium transition-all transform hover:scale-105 text-sm"
              >
                {walletName ? `${walletName.slice(0, 8)}...` : 'Disconnect'}
              </button>
            ) : (
              <button
                onClick={connect}
                disabled={connecting}
                className="px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 font-medium transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {connecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            )}
          </motion.div>
        </div>
      </div>
    </header>
  )
}
