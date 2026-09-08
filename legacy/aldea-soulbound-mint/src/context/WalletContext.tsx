import { createContext, useContext, useState, ReactNode } from 'react'
import toast from 'react-hot-toast'

interface WalletContextType {
  lucid: any | null
  address: string | null
  connected: boolean
  connecting: boolean
  walletName: string | null
  connect: () => Promise<void>
  disconnect: () => void
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: ReactNode }) {
  const [lucid] = useState<any | null>(null)
  const [address, setAddress] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [walletName, setWalletName] = useState<string | null>(null)

  const connect = async () => {
    setConnecting(true)

    try {
      // Check for available wallets
      const wallets = ['nami', 'eternl', 'flint', 'yoroi', 'gerowallet', 'lace']
      let selectedWallet: string | null = null

      for (const wallet of wallets) {
        if ((window as any).cardano?.[wallet]) {
          selectedWallet = wallet
          break
        }
      }

      if (!selectedWallet) {
        toast.error('No Cardano wallet found. Please install Nami, Eternl, or Flint.')
        setConnecting(false)
        return
      }

      // Connect to the wallet
      const api = await (window as any).cardano[selectedWallet].enable()
      
      // Get addresses using wallet API directly
      const changeAddr = await api.getChangeAddress()
      const addresses = await api.getUsedAddresses()
      const addr = addresses && addresses.length > 0 ? addresses[0] : changeAddr
      
      setAddress(addr)
      setConnected(true)
      setWalletName(selectedWallet)

      toast.success(`Connected to ${selectedWallet}`)

      // Save to localStorage
      localStorage.setItem('walletConnected', 'true')
      localStorage.setItem('walletName', selectedWallet)
    } catch (error) {
      console.error('Wallet connection error:', error)
      toast.error('Failed to connect wallet')
    } finally {
      setConnecting(false)
    }
  }

  const disconnect = () => {
    setAddress(null)
    setConnected(false)
    setWalletName(null)
    localStorage.removeItem('walletConnected')
    localStorage.removeItem('walletName')
    toast.success('Wallet disconnected')
  }

  return (
    <WalletContext.Provider
      value={{
        lucid,
        address,
        connected,
        connecting,
        walletName,
        connect,
        disconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}
