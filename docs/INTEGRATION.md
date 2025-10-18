# Smart Contract Integration Guide

This guide explains how to integrate the AdaSouls Cardano Soulbound smart contracts with the ALMA minting website.

## Prerequisites

1. **Build the Smart Contracts**
   ```bash
   cd /Users/matifalcone/Projects/Cardano-Soulbound
   aiken build
   ```

2. **Copy the Compiled Scripts**
   After building, copy the `plutus.json` file:
   ```bash
   cp /Users/matifalcone/Projects/Cardano-Soulbound/plutus.json \
      /Users/matifalcone/Projects/alma-adasouls/src/contracts/plutus.json
   ```

## Configuration

### 1. Environment Variables

Create a `.env` file in the project root:

```bash
VITE_BLOCKFROST_API_KEY=your_blockfrost_api_key
VITE_NETWORK=Preview  # or Mainnet for production
```

Get your Blockfrost API key from: https://blockfrost.io

### 2. Policy Configuration

The soulbound tokens use a policy that restricts minting. Update the policy in `src/utils/contract.ts` based on your requirements:

```typescript
const policy: Policy = {
  type: 'All',
  scripts: [
    {
      type: 'Sig',
      keyHash: signerKey,  // Your authorized minter key
      slot: null,
      require: null
    }
  ],
  keyHash: null,
  slot: null,
  require: null,
}
```

## Soulbound Token Structure

Each ALMA token includes:

### Beneficiary
- The stake address payment credential hash
- Linked to the user's Cardano wallet
- Cannot be transferred (soulbound)

### Status
- `"Issued"` - Token minted but not claimed
- `"Claimed"` - Token claimed by beneficiary

### Metadata
The token metadata follows the CIP-0888 standard and includes:

```json
{
  "beneficiary": "stake_credential_hash",
  "status": "Issued",
  "metadata": {
    "data": {
      "policy_id": {
        "token_name": {
          "name": "ALMA#001",
          "level": 1,
          "price": 15,
          "mintedAt": "2024-10-18T10:00:00Z",
          "version": "1.0.0",
          "type": "soulbound",
          "reputation": {
            "initial": 100,
            "activities": []
          }
        }
      }
    },
    "version": 1,
    "extra": null
  }
}
```

## Reputation System

The metadata structure is designed for easy reputation tracking:

- **Initial reputation**: Based on token level (Level 1 = 100, Level 5 = 500)
- **Activities array**: Can be updated with on-chain actions
- **Readable from blockchain**: Query using Blockfrost or other indexers

Example reputation query:
```typescript
const tokenUtxo = await lucid.utxosByOutRef([{
  txHash: mintTxHash,
  outputIndex: 0
}])

const datum = Data.from(tokenUtxo[0].datum, DatumMetadata)
const reputation = datum.metadata.data[policyId][tokenName].reputation
```

## Minting Flow

1. **User connects wallet** → Lucid initializes with user's wallet API
2. **User selects level** → Frontend displays price and features
3. **User clicks "Mint"** → Transaction is built with:
   - Minting policy attached
   - Token minted with metadata
   - Token locked to smart contract with beneficiary datum
   - User pays minting fee + min ADA
4. **User signs transaction** → Wallet prompts for approval
5. **Transaction submitted** → Blockfrost broadcasts to network
6. **Confirmation** → Token appears in contract, ready to claim

## Claiming Flow

After minting, users can claim their token to their wallet:

1. **Find token UTxO** → Query contract address for user's token
2. **Build claim transaction** → Redeem from contract with `ClaimToken` redeemer
3. **Update status** → Datum status changes from "Issued" to "Claimed"
4. **Transfer to wallet** → Token moves from contract to user's address

## Contract Addresses

The smart contract addresses are deterministic based on the policy parameters. After applying parameters, you'll get:

- **Minting Policy ID**: Used to identify ALMA tokens
- **Lock Address**: Contract address where tokens are held before claiming
- **Validator Hash**: Script credential for the contract

## Testing

### Preview Network Testing

1. Get test ADA from the faucet: https://docs.cardano.org/cardano-testnet/tools/faucet
2. Connect with Preview network wallet
3. Test minting with small amounts
4. Verify on CardanoScan: https://preview.cardanoscan.io

### Mainnet Deployment

Before deploying to mainnet:

1. ✅ Test all minting levels on Preview
2. ✅ Verify token metadata is correct
3. ✅ Audit smart contracts
4. ✅ Test claiming flow
5. ✅ Update environment to Mainnet
6. ✅ Use mainnet Blockfrost API key

## Integration Checklist

- [ ] Build Aiken contracts
- [ ] Copy plutus.json to project
- [ ] Configure Blockfrost API key
- [ ] Set network (Preview/Mainnet)
- [ ] Update policy configuration
- [ ] Test wallet connection
- [ ] Test minting on Preview
- [ ] Verify metadata structure
- [ ] Test claiming flow
- [ ] Deploy to Vercel
- [ ] Update DNS/domain
- [ ] Monitor transactions

## Security Considerations

1. **Private Keys**: Never commit or expose private keys
2. **API Keys**: Use environment variables for Blockfrost keys
3. **Policy Rules**: Ensure only authorized addresses can mint
4. **Metadata Validation**: Validate all metadata before minting
5. **Transaction Limits**: Implement rate limiting for minting
6. **Error Handling**: Properly handle all transaction failures

## Support

- **Smart Contracts**: https://github.com/AdaSouls/Cardano-Soulbound
- **CIP-0888**: https://github.com/AdaSouls/CIPs/tree/master/CIP-0888
- **Lucid Documentation**: https://lucid.spacebudz.io
- **Blockfrost API**: https://docs.blockfrost.io
