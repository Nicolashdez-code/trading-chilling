import { NavLink } from 'react-router-dom'

const items = [
  { to: '/movimientos', label: 'Movimientos', icon: 'ti-notebook' },
  { to: '/', label: 'Análisis', icon: 'ti-chart-candle', end: true },
  { to: '/ajustes', label: 'Ajustes', icon: 'ti-settings' },
]

export default function BottomNav() {
  return (
    <nav
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        justifyContent: 'space-around',
        background: 'var(--bg-card)',
        borderTop: '0.5px solid var(--border)',
        padding: '10px 8px calc(10px + env(safe-area-inset-bottom))',
        maxWidth: 720,
        margin: '0 auto',
      }}
    >
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          style={({ isActive }) => ({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            textDecoration: 'none',
            color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
            fontSize: 10,
          })}
        >
          <i className={`ti ${item.icon}`} style={{ fontSize: 19 }} aria-hidden="true" />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
