# Smart Contract Files

This directory should contain the compiled Plutus scripts from the Cardano-Soulbound repository.

## Setup Instructions

1. Build the Aiken contracts:
   ```bash
   cd /Users/matifalcone/Projects/Cardano-Soulbound
   aiken build
   ```

2. Copy the compiled scripts to this directory:
   ```bash
   cp /Users/matifalcone/Projects/Cardano-Soulbound/plutus.json \
      /Users/matifalcone/Projects/alma-adasouls/src/contracts/plutus.json
   ```

3. The `plutus.json` file contains the compiled validators:
   - `soulbound.mint` - Minting policy validator
   - `soulbound.redeem` - Spending validator for claiming/burning

## File Structure

```
contracts/
├── README.md (this file)
└── plutus.json (compiled contracts - to be added)
```

## Using the Contracts

Import in your TypeScript code:

```typescript
import plutusBlueprint from './contracts/plutus.json'

const validators = {
  mint: plutusBlueprint.validators.find(v => v.title === 'soulbound.mint'),
  redeem: plutusBlueprint.validators.find(v => v.title === 'soulbound.redeem')
}
```

⚠️ **Important**: Do not commit the `plutus.json` file if it contains mainnet scripts with real value. Keep it in `.gitignore` for production deployments.
