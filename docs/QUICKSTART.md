# Quick Start Guide

Get the $ALMA minting website running in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- Cardano wallet (Nami, Eternl, or Flint)
- Preview testnet ADA (get from [faucet](https://docs.cardano.org/cardano-testnet/tools/faucet))

## Step 1: Install Dependencies

```bash
cd /Users/matifalcone/Projects/alma-adasouls
npm install
```

## Step 2: Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add your Blockfrost API key:
```
VITE_BLOCKFROST_API_KEY=preview_your_key_here
VITE_NETWORK=Preview
```

Get a free API key at: https://blockfrost.io

## Step 3: Prepare Smart Contracts (Important!)

### Build the Aiken Contracts

```bash
cd /Users/matifalcone/Projects/Cardano-Soulbound
aiken build
```

### Copy Compiled Scripts

```bash
cp plutus.json /Users/matifalcone/Projects/alma-adasouls/src/contracts/
```

### Update Contract Integration

Edit `src/utils/contract.ts` and replace the `loadValidators()` function:

```typescript
import plutusBlueprint from '../contracts/plutus.json'

export function loadValidators() {
  const redeemValidator = plutusBlueprint.validators.find((v) => v.title === 'soulbound.redeem')
  const mintValidator = plutusBlueprint.validators.find((v) => v.title === 'soulbound.mint')
  
  if (!redeemValidator || !mintValidator) {
    throw new Error('Validators not found in plutus.json')
  }
  
  return {
    redeem: { type: 'PlutusV2', script: redeemValidator.compiledCode },
    mint: { type: 'PlutusV2', script: mintValidator.compiledCode },
  }
}
```

## Step 4: Start Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## Step 5: Test Minting

1. Click **"Connect Wallet"** in the header
2. Select your Cardano wallet and approve connection
3. Make sure you're on Preview testnet
4. Scroll to the minting section
5. Choose a level (start with Level 1 - 15 ADA)
6. Click **"Mint Now"**
7. Sign the transaction in your wallet
8. Wait for confirmation (~20 seconds)

## Troubleshooting

### "No Cardano wallet found"
Install [Nami](https://namiwallet.io), [Eternl](https://eternl.io), or [Flint](https://flint-wallet.com)

### "Insufficient funds"
Get testnet ADA from the [Cardano faucet](https://docs.cardano.org/cardano-testnet/tools/faucet)

### "Validators not loaded"
Make sure you completed Step 3 - building and copying the smart contracts

### "Network mismatch"
Ensure your wallet is set to Preview testnet and `.env` has `VITE_NETWORK=Preview`

## Next Steps

- Read [INTEGRATION.md](./INTEGRATION.md) for smart contract details
- Read [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment
- Update Gitbook and Autonomous World links in `src/components/Header.tsx` and `src/components/Footer.tsx`
- Test all 5 levels on Preview network
- Switch to Mainnet when ready

## Quick Commands

```bash
# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Deploy to Vercel
vercel --prod
```

## Project Structure

```
alma-adasouls/
├── src/
│   ├── components/        # React components
│   │   ├── AlmaLogo.tsx   # Animated logo with level variations
│   │   ├── Header.tsx     # Navigation and wallet connection
│   │   ├── Hero.tsx       # Landing section
│   │   ├── MintSection.tsx # Minting interface
│   │   └── Footer.tsx     # Footer with links
│   ├── context/
│   │   └── WalletContext.tsx # Wallet state management
│   ├── utils/
│   │   └── contract.ts    # Smart contract integration
│   ├── contracts/         # Compiled Plutus scripts
│   ├── App.tsx           # Main app component
│   ├── main.tsx          # Entry point
│   └── index.css         # Global styles
├── public/               # Static assets
├── package.json          # Dependencies
├── vite.config.ts        # Vite configuration
├── tailwind.config.js    # Tailwind CSS config
└── vercel.json          # Vercel deployment config
```

## Support

For issues or questions:
- Check [INTEGRATION.md](./INTEGRATION.md)
- Review [SMART_CONTRACT_INTEGRATION.md](./SMART_CONTRACT_INTEGRATION.md)
- Visit [AdaSouls GitHub](https://github.com/AdaSouls/Cardano-Soulbound)
