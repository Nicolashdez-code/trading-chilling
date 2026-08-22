import { createContext, useContext, useState } from 'react'

export const ASSETS = {
  BTC: { label: 'BTC', symbol: '₿', color: '#f7931a' },
  XAU: { label: 'Oro', symbol: '◆', color: '#e0b23a' },
  US100: { label: 'US100', symbol: '◧', color: '#8b92a0' },
}

const AssetContext = createContext(null)

export function AssetProvider({ children }) {
  const [asset, setAsset] = useState(() => localStorage.getItem('nc_asset') || 'BTC')

  const changeAsset = (a) => {
    setAsset(a)
    localStorage.setItem('nc_asset', a)
  }

  return (
    <AssetContext.Provider value={{ asset, setAsset: changeAsset }}>
      {children}
    </AssetContext.Provider>
  )
}

export function useAsset() {
  return useContext(AssetContext)
}
