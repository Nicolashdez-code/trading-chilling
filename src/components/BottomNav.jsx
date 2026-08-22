import { NavLink } from 'react-router-dom'
import Icon from './Icon'

const items = [
  { to: '/movimientos', label: 'Movimientos', icon: 'notebook' },
  { to: '/', label: 'Análisis', icon: 'chart-candle', end: true },
  { to: '/ajustes', label: 'Ajustes', icon: 'settings' },
]

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
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
          <Icon name={item.icon} size={19} />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
