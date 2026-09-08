import { useState } from 'react'
import { motion } from 'framer-motion'
import { useWallet } from '../context/WalletContext'
import AlmaLogo from './AlmaLogo'
import toast from 'react-hot-toast'

type Level = 1 | 2 | 3 | 4 | 5

interface LevelData {
  level: Level
  price: number
  name: string
  description: string
  features: string[]
}

const levels: LevelData[] = [
  {
    level: 1,
    price: 15,
    name: 'Initiate',
    description: 'Begin your ALDEA journey',
    features: ['Basic reputation tracking', 'Community access', 'Level 1 benefits'],
  },
  {
    level: 2,
    price: 25,
    name: 'Explorer',
    description: 'Deepen your connection',
    features: ['Enhanced reputation', 'Priority support', 'Level 2 benefits'],
  },
  {
    level: 3,
    price: 50,
    name: 'Pathfinder',
    description: 'Advanced ALDEA member',
    features: ['Advanced reputation', 'Governance participation', 'Level 3 benefits'],
  },
  {
    level: 4,
    price: 100,
    name: 'Guardian',
    description: 'Trusted community leader',
    features: ['Expert reputation', 'Leadership roles', 'Level 4 benefits'],
  },
  {
    level: 5,
    price: 250,
    name: 'Sage',
    description: 'Master of the ALDEA',
    features: ['Maximum reputation', 'Council membership', 'All benefits unlocked'],
  },
]

export default function MintSection() {
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null)
  const [minting, setMinting] = useState(false)
  const { connected, lucid, address } = useWallet()

  const handleMint = async (level: Level) => {
    if (!connected || !lucid || !address) {
      toast.error('Please connect your wallet first')
      return
    }

    setMinting(true)
    try {
      toast.loading(`Minting $ALMA Level ${level}...`, { id: 'minting' })
      
      // TODO: Implement actual minting logic with soulbound contract
      // This is a placeholder for the actual implementation
      
      // Simulate minting delay
      await new Promise((resolve) => setTimeout(resolve, 2000))
      
      toast.success(`Successfully minted $ALMA Level ${level}!`, { id: 'minting' })
      
      // In a real implementation, you would:
      // 1. Load the smart contract validators
      // 2. Apply parameters with the policy
      // 3. Build transaction with mint assets
      // 4. Sign and submit transaction
      // 5. Wait for confirmation
      
    } catch (error) {
      console.error('Minting error:', error)
      toast.error('Failed to mint. Please try again.', { id: 'minting' })
    } finally {
      setMinting(false)
    }
  }

  return (
    <section id="mint" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-950/50">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl sm:text-5xl font-display font-bold mb-4">
            <span className="text-gradient from-purple-400 to-pink-400">
              Choose Your Level
            </span>
          </h2>
          <p className="text-lg text-purple-300/80 max-w-2xl mx-auto">
            Select the level that matches your commitment to the ALDEA ecosystem.
            Higher levels unlock more benefits and reputation.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {levels.map((levelData, index) => (
            <motion.div
              key={levelData.level}
              className={`relative rounded-xl overflow-hidden transition-all cursor-pointer ${
                selectedLevel === levelData.level
                  ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-slate-950'
                  : ''
              }`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -8 }}
              onClick={() => setSelectedLevel(levelData.level)}
            >
              <div className="bg-gradient-to-b from-purple-900/40 to-slate-900/40 backdrop-blur-sm border border-purple-500/30 p-6 h-full flex flex-col">
                {/* Logo */}
                <div className="flex justify-center mb-4">
                  <AlmaLogo level={levelData.level} size={120} animate={false} />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="text-center mb-4">
                    <h3 className="text-2xl font-display font-bold text-purple-200 mb-1">
                      Level {levelData.level}
                    </h3>
                    <p className="text-lg font-medium text-purple-300">{levelData.name}</p>
                  </div>

                  <div className="text-center mb-4">
                    <div className="text-4xl font-display font-bold text-gradient from-purple-400 to-pink-400 mb-1">
                      {levelData.price} ₳
                    </div>
                    <p className="text-sm text-purple-300/70">{levelData.description}</p>
                  </div>

                  <ul className="space-y-2 mb-6">
                    {levelData.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-purple-300/80">
                        <svg
                          className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Mint Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleMint(levelData.level)
                  }}
                  disabled={!connected || minting}
                  className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 font-medium transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {minting ? 'Minting...' : connected ? 'Mint Now' : 'Connect Wallet'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Info Box */}
        <motion.div
          className="mt-16 p-8 rounded-xl bg-purple-900/20 border border-purple-500/30 backdrop-blur-sm"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <h3 className="text-2xl font-display font-bold text-purple-200 mb-4">
            About $ALMA Soulbound Tokens
          </h3>
          <div className="grid md:grid-cols-2 gap-6 text-purple-300/80">
            <div>
              <h4 className="font-semibold text-purple-200 mb-2">What is a Soulbound Token?</h4>
              <p className="text-sm">
                $ALMA tokens are non-transferable NFTs linked to your Cardano stake address.
                They represent your reputation and journey within the ALDEA ecosystem and cannot
                be sold or transferred.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-purple-200 mb-2">On-Chain Reputation</h4>
              <p className="text-sm">
                Your $ALMA stores metadata about your activities and contributions. This reputation
                data is permanent, verifiable, and grows with your participation in the community.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-purple-200 mb-2">Upgrade Anytime</h4>
              <p className="text-sm">
                Start with any level and upgrade later. Higher levels unlock more features,
                governance rights, and recognition within the ALDEA autonomous world.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-purple-200 mb-2">Secure & Verified</h4>
              <p className="text-sm">
                Built on Cardano's secure blockchain using AdaSouls soulbound smart contracts.
                Your token is cryptographically linked to your stake address and fully auditable.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
