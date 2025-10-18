/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BLOCKFROST_API_KEY: string
  readonly VITE_NETWORK: string
  readonly VITE_RPC_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Cardano wallet types
interface CardanoWalletApi {
  enable(): Promise<any>
  isEnabled(): Promise<boolean>
  apiVersion: string
  name: string
  icon: string
}

interface Window {
  cardano?: {
    nami?: CardanoWalletApi
    eternl?: CardanoWalletApi
    flint?: CardanoWalletApi
    yoroi?: CardanoWalletApi
    gerowallet?: CardanoWalletApi
    lace?: CardanoWalletApi
    [key: string]: CardanoWalletApi | undefined
  }
}
