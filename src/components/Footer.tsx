import AlmaLogo from './AlmaLogo'

export default function Footer() {
  return (
    <footer className="border-t border-purple-900/30 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <AlmaLogo level={3} size={50} animate={false} />
              <div>
                <h3 className="text-xl font-display font-bold text-gradient from-purple-400 to-pink-400">
                  $ALMA
                </h3>
                <p className="text-xs text-purple-300/70">Your ALDEA journey starts here</p>
              </div>
            </div>
            <p className="text-sm text-purple-300/80 max-w-md">
              Soulbound tokens on Cardano that represent your reputation and journey within
              the ALDEA ecosystem. Non-transferable, verifiable, and permanent.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-purple-200 mb-4">Resources</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://aldea-dao.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-purple-300/80 hover:text-purple-200 transition-colors"
                >
                  ALDEA DAO
                </a>
              </li>
              <li>
                <a
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-purple-300/80 hover:text-purple-200 transition-colors"
                >
                  Documentation
                </a>
              </li>
              <li>
                <a
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-purple-300/80 hover:text-purple-200 transition-colors"
                >
                  Autonomous World
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/AdaSouls/Cardano-Soulbound"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-purple-300/80 hover:text-purple-200 transition-colors"
                >
                  Smart Contract
                </a>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 className="font-semibold text-purple-200 mb-4">Community</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-purple-300/80 hover:text-purple-200 transition-colors"
                >
                  Discord
                </a>
              </li>
              <li>
                <a
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-purple-300/80 hover:text-purple-200 transition-colors"
                >
                  Twitter
                </a>
              </li>
              <li>
                <a
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-purple-300/80 hover:text-purple-200 transition-colors"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-purple-300/80 hover:text-purple-200 transition-colors"
                >
                  Forum
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-purple-900/30">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-purple-300/70">
              © 2024 ALMA. Built on Cardano with AdaSouls Soulbound Contracts.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="#"
                className="text-sm text-purple-300/70 hover:text-purple-200 transition-colors"
              >
                Terms
              </a>
              <a
                href="#"
                className="text-sm text-purple-300/70 hover:text-purple-200 transition-colors"
              >
                Privacy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
