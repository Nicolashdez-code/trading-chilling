import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { ASSETS } from '../context/AssetContext'
import { TIMEFRAME_LABELS } from '../utils'

export default function Settings() {
  const { signOut, session } = useAuth()
  const [config, setConfig] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null)
  const [notifyPosicion, setNotifyPosicion] = useState(localStorage.getItem('nc_notify_posicion') !== 'false')
  const [notifyConflicto, setNotifyConflicto] = useState(localStorage.getItem('nc_notify_conflicto') !== 'false')

  useEffect(() => {
    supabase
      .from('config_gestion_riesgo')
      .select('*')
      .order('asset')
      .order('nivel')
      .then(({ data }) => {
        setConfig(data || [])
        setLoading(false)
      })
  }, [])

  function updateLocal(id, field, value) {
    setConfig((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)))
  }

  async function saveRow(row) {
    setSaving(row.id)
    const { error } = await supabase
      .from('config_gestion_riesgo')
      .update({ score_min: row.score_min, score_max: row.score_max, duracion_maxima_horas: row.duracion_maxima_horas })
      .eq('id', row.id)
    setSaving(null)
    if (error) alert(error.message)
  }

  function toggleNotify(key, value, setter) {
    setter(value)
    localStorage.setItem(key, String(value))
  }

  const byAsset = config.reduce((acc, c) => {
    acc[c.asset] = acc[c.asset] || []
    acc[c.asset].push(c)
    return acc
  }, {})

  return (
    <div className="app-shell">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 12,
            background: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 500,
            color: 'var(--accent-text)',
          }}
        >
          NC
        </div>
        <span style={{ fontSize: 16, fontWeight: 500 }}>Ajustes</span>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Notificaciones</div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 12 }}>Push cuando cambien estos eventos</div>

        <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '0.5px solid var(--border)' }}>
          <span style={{ fontSize: 13 }}>Cambio de tamaño de posición</span>
          <input type="checkbox" checked={notifyPosicion} onChange={(e) => toggleNotify('nc_notify_posicion', e.target.checked, setNotifyPosicion)} />
        </label>
        <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
          <span style={{ fontSize: 13 }}>Conflicto entre técnico y fundamental</span>
          <input type="checkbox" checked={notifyConflicto} onChange={(e) => toggleNotify('nc_notify_conflicto', e.target.checked, setNotifyConflicto)} />
        </label>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Umbrales de tamaño de posición</div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 12 }}>Score mínimo del Motor 3 para cada nivel, por activo</div>

        {loading && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Cargando...</div>}

        {!loading &&
          Object.entries(byAsset).map(([asset, rows]) => (
            <div key={asset} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: ASSETS[asset]?.color, marginBottom: 6 }}>
                {ASSETS[asset]?.symbol} {ASSETS[asset]?.label}
              </div>
              {rows.map((row) => (
                <div key={row.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', width: 70, textTransform: 'capitalize' }}>{row.nivel}</span>
                  <input
                    type="number"
                    value={row.score_min}
                    onChange={(e) => updateLocal(row.id, 'score_min', Number(e.target.value))}
                    style={{ width: 60, background: 'var(--bg-card-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 8px', fontSize: 12 }}
                  />
                  {row.timeframe_sugerido && (
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {TIMEFRAME_LABELS[row.timeframe_sugerido]} · máx
                      <input
                        type="number"
                        value={row.duracion_maxima_horas ?? ''}
                        onChange={(e) => updateLocal(row.id, 'duracion_maxima_horas', Number(e.target.value))}
                        style={{ width: 44, marginLeft: 4, background: 'var(--bg-card-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '4px 6px', fontSize: 11 }}
                      />
                      h
                    </span>
                  )}
                  <button
                    className="btn-secondary"
                    style={{ padding: '6px 10px', fontSize: 11, marginLeft: 'auto' }}
                    onClick={() => saveRow(row)}
                    disabled={saving === row.id}
                  >
                    {saving === row.id ? '...' : 'Guardar'}
                  </button>
                </div>
              ))}
            </div>
          ))}
      </div>

      <div className="card">
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>{session?.user?.email}</div>
        <button className="btn-secondary" style={{ width: '100%' }} onClick={signOut}>
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
