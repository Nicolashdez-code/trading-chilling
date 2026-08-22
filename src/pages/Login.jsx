import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { signIn, signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!email || !password) {
      setError('Ingresa correo y contraseña.')
      return
    }
    setLoading(true)
    const action = mode === 'signin' ? signIn : signUp
    const { error: authError } = await action(email, password)
    setLoading(false)
    if (authError) setError(authError.message)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div className="card" style={{ width: '100%', maxWidth: 360 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              background: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 500,
              color: 'var(--accent-text)',
            }}
          >
            NC
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 500 }}>NC Trader</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Nickchilling Trader To The Moon</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="field">
            <label>Correo</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nombre@correo.com" />
          </div>
          <div className="field">
            <label>Contraseña</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          {error && <div style={{ fontSize: 12, color: 'var(--bajista)' }}>{error}</div>}
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Un momento...' : mode === 'signin' ? 'Entrar' : 'Crear cuenta'}
          </button>
        </form>

        <div
          style={{ marginTop: 14, fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center', cursor: 'pointer' }}
          onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
        >
          {mode === 'signin' ? '¿No tienes cuenta? Créala' : '¿Ya tienes cuenta? Entra'}
        </div>
      </div>
    </div>
  )
}
