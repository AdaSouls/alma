# Smart Contract Integration - Technical Details

This document provides technical details for integrating the AdaSouls soulbound smart contracts with the ALMA minting interface.

## Contract Architecture

### 1. Minting Validator (`soulbound.mint`)

**Purpose**: Controls who can mint tokens and under what conditions.

**Parameters**:
- `policy`: Policy rules (signers, time constraints)
- `script`: The spending validator credential
- `nonce`: Random value for unique policy IDs

**Redeemer**:
```typescript
type MintRedeemer = 
  | { Mint: { msg: ByteArray } }  // For minting
  | "Burn"                         // For burning
```

**Validation**:
- Checks if policy conditions are met
- Verifies correct datum structure
- Ensures token goes to contract address

### 2. Spending Validator (`soulbound.redeem`)

**Purpose**: Controls claiming and burning of tokens.

**Parameters**:
- `policy`: Same policy rules as mint validator

**Datum**:
```typescript
type DatumData = {
  beneficiary: VerificationKeyHash,
  status: "Issued" | "Claimed",
  metadata: {
    data: any,
    version: number,
    extra?: any
  }
}
```

**Redeemer**:
```typescript
type ClaimRedeemer =
  | "ClaimToken"  // Beneficiary claims token
  | "BurnToken"   // Anyone can burn if policy allows
```

## Implementation Steps

### Step 1: Load and Configure Validators

```typescript
import { applyParams } from './utils/contract'
import plutusBlueprint from './contracts/plutus.json'

// Extract validators from blueprint
const validators = {
  mint: plutusBlueprint.validators.find(v => v.title === 'soulbound.mint'),
  redeem: plutusBlueprint.validators.find(v => v.title === 'soulbound.redeem')
}

// Configure policy
const signerKey = lucid.utils.getAddressDetails(userAddress).paymentCredential.hash
const policy = {
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
  validators.mint.compiledCode,
  validators.redeem.compiledCode,
  lucid,
  policy,
  randomNonce()
)
```

### Step 2: Build Mint Transaction

```typescript
async function mintALMA(level: number, priceAda: number) {
  const tokenName = `ALMA#${level.toString().padStart(3, '0')}-${Date.now()}`
  const assetName = `${appliedValidators.policyId}${fromText(tokenName)}`
  
  // Get beneficiary (user's stake address credential)
  const beneficiary = getAddressDetails(userAddress).paymentCredential.hash
  
  // Create mint redeemer
  const mintRedeemer = Data.to(
    { Mint: { msg: fromText('Issued') } },
    MintRedeemer
  )
  
  // Create datum with metadata
  const datum = Data.to({
    beneficiary,
    status: fromText('Issued'),
    metadata: {
      data: Data.fromJson({
        [appliedValidators.policyId]: {
          [tokenName]: {
            name: tokenName,
            level: level,
            price: priceAda,
            mintedAt: new Date().toISOString(),
            reputation: {
              score: level * 100,
              activities: []
            }
          }
        }
      }),
      version: 1n,
      extra: null
    }
  }, DatumMetadata)
  
  // Build transaction
  const tx = await lucid
    .newTx()
    .attachMintingPolicy(appliedValidators.mint)
    .mintAssets({ [assetName]: 1n }, mintRedeemer)
    .payToContract(
      appliedValidators.lockAddress,
      { inline: datum },
      { 
        lovelace: 2_000_000n,  // Min ADA
        [assetName]: 1n 
      }
    )
    .addSignerKey(signerKey)
    .complete()
  
  const signedTx = await tx.sign().complete()
  return await signedTx.submit()
}
```

### Step 3: Claim Token

```typescript
async function claimALMA(tokenUtxo: UTxO) {
  const claimRedeemer = Data.to("ClaimToken", ClaimRedeemer)
  
  // Update datum status
  const currentDatum = Data.from(tokenUtxo.datum, DatumMetadata)
  const updatedDatum = Data.to({
    ...currentDatum,
    status: fromText('Claimed')
  }, DatumMetadata)
  
  const tx = await lucid
    .newTx()
    .collectFrom([tokenUtxo], claimRedeemer)
    .attachSpendingValidator(appliedValidators.redeem)
    .payToAddress(userAddress, tokenUtxo.assets)
    .complete()
  
  const signedTx = await tx.sign().complete()
  return await signedTx.submit()
}
```

## Metadata Structure for Reputation

The metadata is designed to be easily queryable and updateable:

```typescript
{
  "policy_id": {
    "token_name": {
      // Basic info
      "name": "ALMA#001",
      "level": 1,
      "price": 15,
      "mintedAt": "2024-10-18T10:00:00Z",
      "type": "soulbound",
      
      // Reputation system
      "reputation": {
        "score": 100,
        "activities": [
          {
            "type": "governance_vote",
            "timestamp": "2024-10-20T14:30:00Z",
            "points": 10,
            "txHash": "abc123..."
          },
          {
            "type": "community_contribution",
            "timestamp": "2024-10-21T09:15:00Z",
            "points": 25,
            "txHash": "def456..."
          }
        ],
        "badges": ["early_adopter", "active_voter"],
        "tier": "silver"
      },
      
      // Extensible for future features
      "customData": {
        "preferences": {},
        "achievements": []
      }
    }
  }
}
```

## Reading Token Data from Blockchain

### Using Blockfrost

```typescript
async function getTokenData(policyId: string, tokenName: string) {
  const response = await fetch(
    `https://cardano-mainnet.blockfrost.io/api/v0/assets/${policyId}${toHex(tokenName)}`,
    {
      headers: { 'project_id': BLOCKFROST_API_KEY }
    }
  )
  
  const asset = await response.json()
  
  // Get UTxO with datum
  const utxos = await lucid.utxosAt(appliedValidators.lockAddress)
  const tokenUtxo = utxos.find(u => 
    u.assets[`${policyId}${toHex(tokenName)}`] === 1n
  )
  
  if (tokenUtxo && tokenUtxo.datum) {
    const datum = Data.from(tokenUtxo.datum, DatumMetadata)
    return {
      asset,
      datum,
      utxo: tokenUtxo
    }
  }
}
```

### Query User's ALMA Tokens

```typescript
async function getUserALMATokens(userAddress: string) {
  const utxos = await lucid.utxosAt(userAddress)
  
  // Filter for ALMA tokens
  const almaTokens = utxos.filter(utxo => {
    return Object.keys(utxo.assets).some(asset => 
      asset.startsWith(appliedValidators.policyId) &&
      asset.includes('ALMA')
    )
  })
  
  return almaTokens
}
```

## Updating Reputation On-Chain

To add reputation activities, you need to:

1. Read current token UTxO
2. Parse existing datum
3. Update metadata with new activity
4. Create transaction that:
   - Spends from contract (with appropriate redeemer)
   - Pays back to contract with updated datum
   - Requires authorization (policy check)

```typescript
async function addReputationActivity(
  tokenUtxo: UTxO,
  activity: ReputationActivity
) {
  // Parse current datum
  const currentDatum = Data.from(tokenUtxo.datum, DatumMetadata)
  const metadata = currentDatum.metadata.data
  
  // Update reputation
  const [policyId, tokenData] = Object.entries(metadata)[0]
  const [tokenName, data] = Object.entries(tokenData)[0]
  
  data.reputation.activities.push(activity)
  data.reputation.score += activity.points
  
  // Create updated datum
  const updatedDatum = Data.to({
    ...currentDatum,
    metadata: {
      data: Data.fromJson({ [policyId]: { [tokenName]: data } }),
      version: currentDatum.metadata.version + 1n,
      extra: null
    }
  }, DatumMetadata)
  
  // Build transaction (requires proper authorization)
  const tx = await lucid
    .newTx()
    .collectFrom([tokenUtxo], claimRedeemer)
    .attachSpendingValidator(appliedValidators.redeem)
    .payToContract(
      appliedValidators.lockAddress,
      { inline: updatedDatum },
      tokenUtxo.assets
    )
    .addSignerKey(authorizedKey)
    .complete()
  
  const signedTx = await tx.sign().complete()
  return await signedTx.submit()
}
```

## Gas Optimization

To minimize transaction fees:

1. **Batch operations**: Update multiple tokens in one transaction
2. **Efficient metadata**: Keep metadata concise
3. **Minimal UTxOs**: Consolidate when possible
4. **Reference scripts**: Consider using reference scripts for repeated operations

## Security Considerations

1. **Beneficiary Validation**: Always verify beneficiary matches user
2. **Status Checks**: Ensure token status is correct before operations
3. **Policy Enforcement**: Validate all policy conditions
4. **Metadata Validation**: Sanitize and validate metadata inputs
5. **Reentrancy**: Not applicable in Cardano's eUTxO model
6. **Front-running**: Less concern due to deterministic nature

## Testing Strategy

1. **Unit Tests**: Test data structure encoding/decoding
2. **Integration Tests**: Test full minting and claiming flow
3. **Property Tests**: Test contract invariants
4. **Preview Network**: Test with real network conditions
5. **Audit**: Get contracts audited before mainnet

## Common Issues and Solutions

### Issue: "Insufficient min ADA"
**Solution**: Increase lovelace amount sent to contract (minimum ~2 ADA)

### Issue: "Wrong network"
**Solution**: Ensure wallet and Lucid are on same network

### Issue: "Missing signature"
**Solution**: Add `addSignerKey()` with correct key hash

### Issue: "Datum decode failed"
**Solution**: Verify datum structure matches schema exactly

### Issue: "Policy not satisfied"
**Solution**: Check policy conditions (signers, time constraints)

## Resources

- **Lucid Documentation**: https://lucid.spacebudz.io
- **Aiken Documentation**: https://aiken-lang.org
- **CIP-0888 Standard**: https://github.com/AdaSouls/CIPs/tree/master/CIP-0888
- **Cardano Documentation**: https://docs.cardano.org
