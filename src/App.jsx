import { HashRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AssetProvider } from './context/AssetContext'
import BottomNav from './components/BottomNav'
import Login from './pages/Login'
import Analysis from './pages/Analysis'
import Movements from './pages/Movements'
import Settings from './pages/Settings'

function Gate() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
        Cargando...
      </div>
    )
  }

  if (!session) return <Login />

  return (
    <AssetProvider>
      <Routes>
        <Route path="/" element={<Analysis />} />
        <Route path="/movimientos" element={<Movements />} />
        <Route path="/ajustes" element={<Settings />} />
      </Routes>
      <BottomNav />
    </AssetProvider>
  )
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </HashRouter>
  )
}
