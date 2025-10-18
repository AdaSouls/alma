import { motion } from 'framer-motion'
import AlmaLogo from './AlmaLogo'

export default function Hero() {
  return (
    <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Left side - Content */}
          <motion.div
            className="flex-1 text-center lg:text-left"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="inline-block mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <span className="px-4 py-2 rounded-full bg-purple-900/30 border border-purple-500/30 text-purple-300 text-sm font-medium">
                Soulbound Token on Cardano
              </span>
            </motion.div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold mb-6">
              <span className="text-gradient from-purple-400 via-pink-400 to-purple-400">
                $ALMA
              </span>
            </h1>

            <p className="text-xl sm:text-2xl lg:text-3xl font-display mb-8 text-purple-200">
              Your ALDEA journey starts here
            </p>

            <p className="text-lg text-purple-300/80 mb-12 max-w-2xl mx-auto lg:mx-0">
              Mint your soulbound token and join the ALDEA ecosystem. Each ALMA is unique,
              non-transferable, and grows with your reputation on-chain.
            </p>

            <motion.a
              href="#mint"
              className="inline-block px-8 py-4 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 font-display font-semibold text-lg transition-all transform hover:scale-105"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Mint Your ALMA
            </motion.a>
          </motion.div>

          {/* Right side - Animated Logo */}
          <motion.div
            className="flex-1 flex justify-center lg:justify-end"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <motion.div
              className="relative"
              animate={{
                y: [0, -20, 0],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                repeatType: 'reverse',
              }}
            >
              <AlmaLogo level={5} size={400} animate={true} />
              
              {/* Glowing circle behind */}
              <div className="absolute inset-0 -z-10 bg-purple-600/20 rounded-full blur-3xl" />
            </motion.div>
          </motion.div>
        </div>

        {/* Stats */}
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-8 mt-20"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          {[
            { label: 'Soulbound', value: '100%' },
            { label: 'Reputation', value: 'On-Chain' },
            { label: 'Levels', value: '5' },
            { label: 'Network', value: 'Cardano' },
          ].map((stat, index) => (
            <div
              key={index}
              className="text-center p-6 rounded-lg bg-purple-900/20 border border-purple-500/20 backdrop-blur-sm"
            >
              <div className="text-3xl font-display font-bold text-gradient from-purple-400 to-pink-400 mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-purple-300/70">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
