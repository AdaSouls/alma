import { Toaster } from 'react-hot-toast'
import Header from './components/Header'
import Hero from './components/Hero'
import MintSection from './components/MintSection'
import Footer from './components/Footer'
import { WalletProvider } from './context/WalletContext'

function App() {
  return (
    <WalletProvider>
      <div className="min-h-screen">
        <Toaster
          position="top-right"
          toastOptions={{
            className: '',
            style: {
              background: '#1e1b4b',
              color: '#fff',
              border: '1px solid #7c3aed',
            },
          }}
        />
        <Header />
        <main>
          <Hero />
          <MintSection />
        </main>
        <Footer />
      </div>
    </WalletProvider>
  )
}

export default App
