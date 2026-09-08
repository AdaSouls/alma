# Next Steps - Smart Contract Integration

## Immediate Actions Required

### 1. Build Smart Contracts ⚡ CRITICAL

```bash
cd /Users/matifalcone/Projects/Cardano-Soulbound
aiken build
```

This generates the `plutus.json` file with compiled validators.

### 2. Copy Compiled Scripts

```bash
cp /Users/matifalcone/Projects/Cardano-Soulbound/plutus.json \
   /Users/matifalcone/Projects/alma-adasouls/src/contracts/
```

### 3. Update Contract Integration

Edit `/Users/matifalcone/Projects/alma-adasouls/src/utils/contract.ts`:

**Replace this**:
```typescript
export function loadValidators() {
  throw new Error(
    'Validators not loaded. Please build the Aiken contracts and configure the validators.'
  )
}
```

**With this**:
```typescript
import plutusBlueprint from '../contracts/plutus.json'

export function loadValidators() {
  const redeemValidator = plutusBlueprint.validators.find(
    (v: any) => v.title === 'soulbound.redeem'
  )
  const mintValidator = plutusBlueprint.validators.find(
    (v: any) => v.title === 'soulbound.mint'
  )
  
  if (!redeemValidator || !mintValidator) {
    throw new Error('Validators not found in plutus.json')
  }
  
  return {
    redeem: { 
      type: 'PlutusV2' as const, 
      script: redeemValidator.compiledCode 
    },
    mint: { 
      type: 'PlutusV2' as const, 
      script: mintValidator.compiledCode 
    },
  }
}
```

### 4. Update MintSection Component

Edit `/Users/matifalcone/Projects/alma-adasouls/src/components/MintSection.tsx`:

**Replace the handleMint function** (around line 65):

```typescript
import { loadValidators, applyParams, mintSoulboundToken, Policy } from '../utils/contract'

const handleMint = async (level: Level) => {
  if (!connected || !lucid || !address) {
    toast.error('Please connect your wallet first')
    return
  }

  setMinting(true)
  try {
    const levelData = levels.find((l) => l.level === level)!
    
    toast.loading(`Minting $ALMA Level ${level}...`, { id: 'minting' })
    
    // Load validators
    const validators = loadValidators()
    
    // Configure policy (use wallet's key as authorized minter)
    const signerKey = lucid.utils.getAddressDetails(address).paymentCredential!.hash
    const policy: Policy = {
      type: 'All',
      scripts: [{
        type: 'Sig',
        keyHash: signerKey,
        slot: null,
        require: null
      }],
      keyHash: null,
      slot: null,
      require: null,
    }
    
    // Apply parameters
    const appliedValidators = applyParams(
      validators.mint.script,
      validators.redeem.script,
      lucid,
      policy
    )
    
    // Mint token
    const result = await mintSoulboundToken(
      lucid,
      appliedValidators,
      level,
      levelData.price,
      address
    )
    
    toast.success(
      `Successfully minted $ALMA Level ${level}! TX: ${result.txHash.slice(0, 10)}...`,
      { id: 'minting', duration: 5000 }
    )
    
    // Wait for confirmation
    await lucid.awaitTx(result.txHash)
    
    console.log('Minted token:', {
      txHash: result.txHash,
      tokenName: result.tokenName,
      assetName: result.assetName,
    })
    
  } catch (error: any) {
    console.error('Minting error:', error)
    toast.error(error.message || 'Failed to mint. Please try again.', { id: 'minting' })
  } finally {
    setMinting(false)
  }
}
```

### 5. Configure Environment

Create `.env` file in project root:

```bash
cd /Users/matifalcone/Projects/alma-adasouls
touch .env
```

Add configuration (get Blockfrost API key from https://blockfrost.io):
```
VITE_BLOCKFROST_API_KEY=preview_your_key_here
VITE_NETWORK=Preview
```

### 6. Test Locally

```bash
cd /Users/matifalcone/Projects/alma-adasouls
npm run dev
```

Open http://localhost:3000 and test:
1. ✅ Connect wallet (make sure it's on Preview testnet)
2. ✅ Select Level 1 (15 ADA)
3. ✅ Click "Mint Now"
4. ✅ Sign transaction in wallet
5. ✅ Wait for confirmation
6. ✅ Check transaction on CardanoScan Preview

### 7. Update Navigation Links

Edit `/Users/matifalcone/Projects/alma-adasouls/src/components/Header.tsx` (line 44-54):

```typescript
<a
  href="https://gitbook.io/aldea"  // Update with actual URL
  target="_blank"
  rel="noopener noreferrer"
  className="text-sm font-medium text-purple-300 hover:text-purple-100 transition-colors"
>
  Gitbook
</a>
<a
  href="https://autonomous.world"  // Update with actual URL
  target="_blank"
  rel="noopener noreferrer"
  className="text-sm font-medium text-purple-300 hover:text-purple-100 transition-colors"
>
  Autonomous World
</a>
```

Also update in `/Users/matifalcone/Projects/alma-adasouls/src/components/Footer.tsx`.

### 8. Test All Levels

Test minting for each level on Preview network:
- [ ] Level 1 - 15 ADA
- [ ] Level 2 - 25 ADA
- [ ] Level 3 - 50 ADA
- [ ] Level 4 - 100 ADA
- [ ] Level 5 - 250 ADA

Verify on CardanoScan that:
- Token is minted correctly
- Metadata includes level info
- Token is locked in contract
- Beneficiary is correct

### 9. Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

Add environment variables in Vercel dashboard:
- `VITE_BLOCKFROST_API_KEY`
- `VITE_NETWORK`

### 10. Switch to Mainnet (When Ready)

**Before switching:**
- [ ] All levels tested on Preview
- [ ] Smart contracts audited
- [ ] Metadata verified
- [ ] Claiming flow tested
- [ ] Error handling verified
- [ ] User documentation ready
- [ ] Support channels set up

**To switch:**
1. Get Mainnet Blockfrost API key
2. Update environment variables:
   ```
   VITE_BLOCKFROST_API_KEY=mainnet_your_key
   VITE_NETWORK=Mainnet
   ```
3. Redeploy to Vercel
4. Test with small amount first
5. Monitor transactions closely

## Optional Enhancements

### Add Analytics
```bash
npm install @vercel/analytics
```

In `src/main.tsx`:
```typescript
import { Analytics } from '@vercel/analytics/react'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Analytics />
  </React.StrictMode>,
)
```

### Add Claiming UI

Create `src/components/ClaimSection.tsx` to allow users to claim their tokens after minting.

### Add Token Gallery

Create `src/components/MyTokens.tsx` to display user's minted ALMA tokens with levels and reputation.

### Add Reputation Dashboard

Create `src/components/ReputationDashboard.tsx` to show user's reputation score, activities, and badges.

## Troubleshooting

### Error: "Validators not found"
- Make sure plutus.json is in `src/contracts/`
- Check file permissions
- Verify file is not empty

### Error: "Insufficient min ADA"
- Increase lovelace in `mintSoulboundToken` function
- Try 2.5 ADA instead of 2 ADA

### Error: "Wrong network"
- Ensure wallet is on correct network (Preview/Mainnet)
- Check `.env` has correct `VITE_NETWORK`
- Restart dev server after changing .env

### Error: "Transaction failed"
- Check wallet has enough ADA (price + fees + min ADA)
- Verify smart contracts are correctly compiled
- Check Blockfrost API key is valid
- Review transaction in wallet before signing

## Documentation Checklist

Before going live:
- [ ] Update README.md with live URL
- [ ] Add actual Gitbook link
- [ ] Add actual Autonomous World link
- [ ] Update Discord/Twitter links
- [ ] Add FAQ section
- [ ] Create user guide
- [ ] Add troubleshooting guide
- [ ] Document reputation system
- [ ] Add terms of service
- [ ] Add privacy policy

## Launch Checklist

- [ ] Smart contracts built and tested
- [ ] All levels tested on Preview
- [ ] Environment configured correctly
- [ ] Deployed to Vercel
- [ ] Custom domain configured (optional)
- [ ] Analytics enabled
- [ ] Error tracking set up
- [ ] Social media announcements ready
- [ ] Community support channels ready
- [ ] Documentation complete
- [ ] Team trained on support

## Success! 🎉

Once all steps are complete, your $ALMA minting website will be live and users can mint their soulbound tokens!

Monitor the first few days closely and be ready to assist users with any issues.
