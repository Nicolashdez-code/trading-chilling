import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { ASSETS } from '../context/AssetContext'
import { fmtNum } from '../utils'

const emptyForm = {
  broker: 'ftmo',
  cuenta: '',
  activo: 'BTC',
  direccion: 'compra',
  precio_entrada: '',
  lote: '',
  notas: '',
}

function InvestmentCard({ c }) {
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 500 }}>
          {ASSETS[c.activo]?.symbol} {c.activo}
        </span>
        <span
          className={c.estado === 'activa' ? 'badge badge-alcista' : 'badge'}
          style={c.estado !== 'activa' ? { background: 'var(--bg-card-2)', color: 'var(--text-secondary)' } : {}}
        >
          {c.estado === 'activa' ? 'Activa' : 'Cerrada'}
        </span>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8 }}>
        Compra ${fmtNum(c.precio_compra)} · {fmtNum(c.cantidad, 4)} {c.activo}
      </div>
      {c.pct_ganancia != null && (
        <div style={{ fontSize: 16, fontWeight: 500, color: c.pct_ganancia >= 0 ? 'var(--alcista)' : 'var(--bajista)' }}>
          {c.pct_ganancia >= 0 ? '+' : ''}
          {fmtNum(c.pct_ganancia)}%
        </div>
      )}
    </div>
  )
}

export default function Movements() {
  const { session } = useAuth()
  const [tab, setTab] = useState('trades')
  const [trades, setTrades] = useState([])
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  async function loadTrades() {
    setLoading(true)
    const [{ data: ftmo }, { data: binance }, { data: inv }] = await Promise.all([
      supabase.from('trades_ftmo').select('*').order('fecha_entrada', { ascending: false }),
      supabase.from('trades_binance').select('*').order('fecha_entrada', { ascending: false }),
      supabase.from('investment_cards').select('*').order('fecha_compra', { ascending: false }),
    ])
    const merged = [
      ...(ftmo || []).map((t) => ({ ...t, broker: 'FTMO', cuentaLabel: t.cuenta })),
      ...(binance || []).map((t) => ({ ...t, broker: 'Binance', cuentaLabel: 'Binance' })),
    ].sort((a, b) => new Date(b.fecha_entrada) - new Date(a.fecha_entrada))
    setTrades(merged)
    setCards(inv || [])
    setLoading(false)
  }

  useEffect(() => {
    loadTrades()
  }, [])

  async function handleSave() {
    if (!form.precio_entrada || !form.lote) {
      alert('Completa precio de entrada y lote.')
      return
    }
    setSaving(true)

    // Captura el snapshot de Motor 1 (las 4 vistas) para el activo elegido
    const { data: snapshotRows } = await supabase
      .from('nivel1_snapshots')
      .select('*')
      .eq('asset', form.activo)
      .order('ts', { ascending: false })
      .limit(10)

    const table = form.broker === 'ftmo' ? 'trades_ftmo' : 'trades_binance'
    const payload = {
      user_id: session.user.id,
      activo: form.activo,
      direccion: form.direccion,
      fecha_entrada: new Date().toISOString(),
      precio_entrada: Number(form.precio_entrada),
      lote: Number(form.lote),
      notas: form.notas || null,
      estado_motor1_snapshot: snapshotRows || null,
      ...(form.broker === 'ftmo' ? { cuenta: form.cuenta || 'Cuenta 1' } : {}),
    }

    const { error } = await supabase.from(table).insert(payload)
    setSaving(false)
    if (error) {
      alert(error.message)
      return
    }
    setShowForm(false)
    setForm(emptyForm)
    loadTrades()
  }

  return (
    <div className="app-shell">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
          <span style={{ fontSize: 16, fontWeight: 500 }}>Movimientos</span>
        </div>
        <div
          onClick={() => setShowForm(true)}
          style={{
            width: 40,
            height: 40,
            borderRadius: 14,
            background: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <i className="ti ti-plus" style={{ fontSize: 20, color: 'var(--accent-text)' }} aria-hidden="true" />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <div
          onClick={() => setTab('trades')}
          className="pill"
          style={{ cursor: 'pointer', background: tab === 'trades' ? 'var(--accent)' : 'var(--bg-card)', color: tab === 'trades' ? 'var(--accent-text)' : 'var(--text-secondary)' }}
        >
          Trades
        </div>
        <div
          onClick={() => setTab('fichas')}
          className="pill"
          style={{ cursor: 'pointer', background: tab === 'fichas' ? 'var(--accent)' : 'var(--bg-card)', color: tab === 'fichas' ? 'var(--accent-text)' : 'var(--text-secondary)' }}
        >
          Fichas de inversión
        </div>
      </div>

      {loading && <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 20 }}>Cargando...</div>}

      {!loading && tab === 'trades' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {trades.length === 0 && (
            <div className="card" style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
              Aún no has registrado ninguna operación. Toca + para agregar la primera.
            </div>
          )}
          {trades.map((t) => (
            <div key={`${t.broker}-${t.id}`} className="card" style={{ padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: ASSETS[t.activo]?.color, fontWeight: 500 }}>{ASSETS[t.activo]?.symbol}</span>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{t.activo}</span>
                  <span className={t.direccion === 'compra' ? 'badge badge-alcista' : 'badge badge-bajista'}>
                    {t.direccion === 'compra' ? 'Compra' : 'Venta'}
                  </span>
                </div>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                  {t.broker}
                  {t.cuentaLabel && t.broker === 'FTMO' ? ` · ${t.cuentaLabel}` : ''}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>
                <span>
                  Entrada ${fmtNum(t.precio_entrada)} · Lote {fmtNum(t.lote)}
                </span>
                <span>{new Date(t.fecha_entrada).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: t.resultado == null ? 'var(--neutral)' : t.resultado >= 0 ? 'var(--alcista)' : 'var(--bajista)' }}>
                  {t.resultado == null ? 'En curso' : `${t.resultado >= 0 ? '+' : ''}$${fmtNum(t.resultado)}`}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {t.estado_motor1_snapshot ? 'Snapshot guardado' : 'Sin snapshot'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && tab === 'fichas' && (
        <>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8 }}>Activas</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
            {cards.filter((c) => c.estado === 'activa').length === 0 && (
              <div className="card" style={{ gridColumn: '1 / 3', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
                Sin fichas activas.
              </div>
            )}
            {cards
              .filter((c) => c.estado === 'activa')
              .map((c) => (
                <InvestmentCard key={c.id} c={c} />
              ))}
          </div>

          {Object.entries(
            cards
              .filter((c) => c.estado !== 'activa')
              .reduce((acc, c) => {
                const d = new Date(c.fecha_venta || c.fecha_compra)
                const key = d.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
                acc[key] = acc[key] || []
                acc[key].push(c)
                return acc
              }, {})
          ).map(([month, list]) => (
            <div key={month} style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'capitalize' }}>{month}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {list.map((c) => (
                  <InvestmentCard key={c.id} c={c} />
                ))}
              </div>
            </div>
          ))}

          {cards.length === 0 && (
            <div className="card" style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
              Aún no hay fichas de inversión registradas.
            </div>
          )}
        </>
      )}

      {showForm && (
        <div
          onClick={() => setShowForm(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 50 }}
        >
          <div onClick={(e) => e.stopPropagation()} className="card" style={{ maxWidth: 360, width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 500 }}>Nuevo movimiento</span>
              <i className="ti ti-x" onClick={() => setShowForm(false)} style={{ cursor: 'pointer', color: 'var(--text-secondary)' }} aria-hidden="true" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <div className="field" style={{ flex: 1 }}>
                  <label>Bróker</label>
                  <select value={form.broker} onChange={(e) => setForm({ ...form, broker: e.target.value })}>
                    <option value="ftmo">FTMO</option>
                    <option value="binance">Binance</option>
                  </select>
                </div>
                {form.broker === 'ftmo' && (
                  <div className="field" style={{ flex: 1 }}>
                    <label>Cuenta</label>
                    <input value={form.cuenta} onChange={(e) => setForm({ ...form, cuenta: e.target.value })} placeholder="Cuenta 1" />
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div className="field" style={{ flex: 1 }}>
                  <label>Activo</label>
                  <select value={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.value })}>
                    <option value="BTC">BTC</option>
                    <option value="XAU">Oro (XAU)</option>
                    <option value="US100">US100</option>
                  </select>
                </div>
                <div className="field" style={{ flex: 1 }}>
                  <label>Dirección</label>
                  <select value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })}>
                    <option value="compra">Compra</option>
                    <option value="venta">Venta</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div className="field" style={{ flex: 1 }}>
                  <label>Precio de entrada</label>
                  <input type="number" step="any" value={form.precio_entrada} onChange={(e) => setForm({ ...form, precio_entrada: e.target.value })} placeholder="109432" />
                </div>
                <div className="field" style={{ flex: 1 }}>
                  <label>Lote</label>
                  <input type="number" step="any" value={form.lote} onChange={(e) => setForm({ ...form, lote: e.target.value })} placeholder="0.5" />
                </div>
              </div>
              <div className="field">
                <label>Notas</label>
                <input value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} placeholder="Opcional" />
              </div>
              <div style={{ background: 'var(--accent-soft-bg)', borderRadius: 10, padding: '9px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--accent)' }}>El snapshot de Motor 1 se guarda automáticamente al enviar</span>
                <i className="ti ti-camera" style={{ fontSize: 14, color: 'var(--accent)' }} aria-hidden="true" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowForm(false)}>
                Cancelar
              </button>
              <button className="btn-primary" style={{ flex: 1 }} onClick={handleSave} disabled={saving}>
                {saving ? 'Guardando...' : 'He entrado'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
