import { useState } from 'react'
import { ASSETS, useAsset } from '../context/AssetContext'
import Icon from './Icon'

export default function AssetSelector() {
  const { asset, setAsset } = useAsset()
  const [open, setOpen] = useState(false)
  const current = ASSETS[asset]

  return (
    <div style={{ position: 'relative' }}>
      <div
        onClick={() => setOpen((o) => !o)}
        style={{
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'var(--bg-card)',
          borderRadius: 14,
          padding: '8px 14px',
          fontSize: 12,
        }}
      >
        <span style={{ color: current.color, fontWeight: 500 }}>{current.symbol}</span>
        <span>{current.label}</span>
        <Icon name="chevron-down" size={13} color="var(--text-secondary)" />
      </div>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '110%',
            right: 0,
            background: 'var(--bg-card)',
            borderRadius: 14,
            padding: 6,
            zIndex: 20,
            minWidth: 140,
          }}
        >
          {Object.entries(ASSETS).map(([key, a]) => (
            <div
              key={key}
              onClick={() => {
                setAsset(key)
                setOpen(false)
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 10px',
                borderRadius: 10,
                cursor: 'pointer',
                background: key === asset ? 'var(--bg-card-2)' : 'transparent',
                fontSize: 13,
              }}
            >
              <span style={{ color: a.color, fontWeight: 500 }}>{a.symbol}</span>
              <span>{a.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
