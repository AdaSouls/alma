import {
  Lucid,
  MintingPolicy,
  SpendingValidator,
  Data,
  applyParamsToScript,
  applyDoubleCborEncoding,
  fromText,
  getAddressDetails,
} from 'lucid-cardano'

// Type definitions matching the Aiken smart contract
const ScriptType = Data.Enum([
  Data.Literal('Sig'),
  Data.Literal('All'),
  Data.Literal('Any'),
  Data.Literal('AtLeast'),
  Data.Literal('After'),
  Data.Literal('Before'),
])
type ScriptType = Data.Static<typeof ScriptType>

const NativeScript = Data.Object({
  type: ScriptType,
  keyHash: Data.Nullable(Data.Bytes({ minLength: 28, maxLength: 28 })),
  slot: Data.Nullable(Data.Integer()),
  require: Data.Nullable(Data.Integer()),
})
type NativeScript = Data.Static<typeof NativeScript>

const PolicySchema = Data.Object({
  type: ScriptType,
  keyHash: Data.Nullable(Data.Bytes({ minLength: 28, maxLength: 28 })),
  slot: Data.Nullable(Data.Integer()),
  require: Data.Nullable(Data.Integer()),
  scripts: Data.Nullable(Data.Array(NativeScript)),
})
export type Policy = Data.Static<typeof PolicySchema>
export const Policy = PolicySchema as unknown as Policy

const CredentialSchema = Data.Enum([
  Data.Object({
    VerificationKeyCredential: Data.Tuple([Data.Bytes({ minLength: 28, maxLength: 28 })]),
  }),
  Data.Object({ ScriptCredential: Data.Tuple([Data.Bytes({ minLength: 28, maxLength: 28 })]) }),
])
export type Credential = Data.Static<typeof CredentialSchema>
export const Credential = CredentialSchema as unknown as Credential

const MintSchema = Data.Object({
  policy: PolicySchema,
  script: CredentialSchema,
  nonce: Data.Bytes(),
})
type Mint = Data.Static<typeof MintSchema>
const Mint = MintSchema as unknown as Mint

const MintRedeemerSchema = Data.Enum([
  Data.Object({ Mint: Data.Object({ msg: Data.Bytes() }) }),
  Data.Literal('Burn'),
])
export type MintRedeemer = Data.Static<typeof MintRedeemerSchema>
export const MintRedeemer = MintRedeemerSchema as unknown as MintRedeemer

const DatumMetadataSchema = Data.Object({
  beneficiary: Data.Bytes(),
  status: Data.Bytes(),
  metadata: Data.Object({
    data: Data.Any(),
    version: Data.Integer(),
    extra: Data.Nullable(Data.Any()),
  }),
})
export type DatumMetadata = Data.Static<typeof DatumMetadataSchema>
export const DatumMetadata = DatumMetadataSchema as unknown as DatumMetadata

export interface AppliedValidators {
  mint: MintingPolicy
  redeem: SpendingValidator
  policyId: string
  lockAddress: string
}

// Generate random nonce for unique policy IDs
export function randomNonce(length = 32): string {
  if (length % 2 === 1) {
    throw new Error('Only even sizes are supported')
  }
  const buf = new Uint8Array(length / 2)
  crypto.getRandomValues(buf)
  let nonce = ''
  for (let i = 0; i < buf.length; ++i) {
    nonce += ('0' + buf[i].toString(16)).slice(-2)
  }
  return nonce
}

// Apply parameters to validators
export function applyParams(
  mintScript: string,
  redeemScript: string,
  lucid: Lucid,
  policy: Policy,
  nonce?: string
): AppliedValidators {
  const redeemParams = Data.from(Data.to(policy, Policy))
  const redeem: SpendingValidator = {
    type: 'PlutusV2',
    script: applyDoubleCborEncoding(applyParamsToScript(redeemScript, [redeemParams])),
  }

  const lockAddress = lucid.utils.validatorToAddress(redeem)
  const scriptHash = lucid.utils.validatorToScriptHash(redeem)
  const credential: Credential = { ScriptCredential: [scriptHash] }

  const mintParams = Data.from(
    Data.to(
      {
        policy: policy,
        script: credential,
        nonce: nonce || randomNonce(),
      },
      Mint
    )
  )

  const mint: MintingPolicy = {
    type: 'PlutusV2',
    script: applyDoubleCborEncoding(applyParamsToScript(mintScript, [mintParams])),
  }

  const policyId = lucid.utils.validatorToScriptHash(mint)

  return {
    mint,
    redeem,
    policyId,
    lockAddress,
  }
}

// Mint a soulbound token
export async function mintSoulboundToken(
  lucid: Lucid,
  validators: AppliedValidators,
  level: number,
  priceInAda: number,
  beneficiaryAddress: string
) {
  const tokenName = `ALMA#${level.toString().padStart(3, '0')}-${Date.now()}`
  const assetName = `${validators.policyId}${fromText(tokenName)}`

  const beneficiary = getAddressDetails(beneficiaryAddress).paymentCredential!.hash

  const msg = fromText('Issued')
  const minter: MintRedeemer = { Mint: { msg } }
  const mintRedeemer = Data.to(minter, MintRedeemer)

  // Create metadata with level information
  const metadata = Data.fromJson({
    [validators.policyId]: {
      [tokenName]: {
        name: tokenName,
        level: level,
        price: priceInAda,
        mintedAt: new Date().toISOString(),
        version: '1.0.0',
        type: 'soulbound',
        reputation: {
          initial: level * 100,
          activities: [],
        },
      },
    },
  })

  const datum: DatumMetadata = {
    beneficiary,
    status: msg,
    metadata: {
      data: metadata,
      version: 1n,
      extra: null,
    },
  }

  const datumEncoded = Data.to(datum, DatumMetadata)

  // Get signer key from address
  const signerKey = getAddressDetails(beneficiaryAddress).paymentCredential!.hash

  // Build and submit transaction
  const utxos = await lucid.wallet.getUtxos()
  const utxo = utxos[0]

  if (!utxo) {
    throw new Error('No UTXOs available')
  }

  const tx = await lucid
    .newTx()
    .collectFrom([utxo])
    .attachMintingPolicy(validators.mint)
    .mintAssets({ [assetName]: BigInt(1) }, mintRedeemer)
    .payToContract(
      validators.lockAddress,
      {
        inline: datumEncoded,
      },
      {
        lovelace: BigInt(2_000_000), // Min ADA for contract
        [assetName]: BigInt(1),
      }
    )
    .addSignerKey(signerKey)
    .complete()

  const txSigned = await tx.sign().complete()
  const txHash = await txSigned.submit()

  return {
    txHash,
    tokenName,
    assetName,
  }
}

// Load validators from compiled scripts
// NOTE: You'll need to build the Aiken contracts and copy the plutus.json file
export function loadValidators() {
  // This is a placeholder. In production, you would:
  // 1. Build the Aiken contracts with 'aiken build'
  // 2. Copy the plutus.json file to your project
  // 3. Import and parse it here
  // 4. Extract the compiled scripts

  throw new Error(
    'Validators not loaded. Please build the Aiken contracts and configure the validators.'
  )

  // Example structure:
  // import plutusBlueprint from './plutus.json'
  // const redeemValidator = plutusBlueprint.validators.find((v) => v.title === 'soulbound.redeem')
  // const mintValidator = plutusBlueprint.validators.find((v) => v.title === 'soulbound.mint')
  // return {
  //   redeem: { type: 'PlutusV2', script: redeemValidator.compiledCode },
  //   mint: { type: 'PlutusV2', script: mintValidator.compiledCode },
  // }
}
