import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAsset } from '../context/AssetContext'
import { useIsMobile } from '../hooks'
import AssetSelector from '../components/AssetSelector'
import TradingViewChart from '../components/TradingViewChart'
import TechGroup from '../components/TechGroup'
import Icon from '../components/Icon'
import {
  SENAL_LABELS,
  TIMEFRAME_LABELS,
  TV_SYMBOLS,
  directionLabel,
  badgeClass,
  textColor,
  fmtPct,
  fmtNum,
  DETALLE_LABELS,
  DETALLE_HIDDEN_KEYS,
  detalleResumen,
  halvingResumenCorto,
} from '../utils'

// Cada columna técnica lleva su temporalidad de Nivel 2 hermana, para mostrar el Estado
// justo debajo de esa misma columna dentro del mismo recuadro.
const TECH_COLUMNS = [
  { vista: '15m_puro', tf2: '15m', label: '15m', peso: '40%', grupo: 'Intraday' },
  { vista: '4h_puro', tf2: '4h', label: '4H', peso: '60%', grupo: 'Intraday' },
  { vista: '1d_puro', tf2: '1d', label: '1D', peso: '40%', grupo: 'Inversión' },
  { vista: '1w_puro', tf2: '1w', label: 'S', peso: '60%', grupo: 'Inversión' },
]

async function fetchLatestPerKey(table, asset, keyCol, keyValues) {
  const results = await Promise.all(
    keyValues.map((k) =>
      supabase.from(table).select('*').eq('asset', asset).eq(keyCol, k).order('ts', { ascending: false }).limit(1)
    )
  )
  return results.flatMap((r) => r.data || [])
}

export default function Analysis() {
  const { asset } = useAsset()
  const isMobile = useIsMobile()
  const [price, setPrice] = useState(null)
  const [prevClose, setPrevClose] = useState(null)
  const [nivel1, setNivel1] = useState([])
  const [nivel2, setNivel2] = useState([])
  const [nivel3, setNivel3] = useState([])
  const [motor3, setMotor3] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)

      const senales = asset === 'BTC' ? ['ciclo_halving', 'flujos_etf', 'tasas_fed', 'dxy', 'vix'] : ['tasas_fed', 'dxy', 'vix']

      const [{ data: prices }, n1, n2, n3, m3] = await Promise.all([
        supabase.from('prices_ohlcv').select('close, ts').eq('asset', asset).eq('timeframe', '1d').order('ts', { ascending: false }).limit(2),
        fetchLatestPerKey('nivel1_snapshots', asset, 'vista', TECH_COLUMNS.map((c) => c.vista)),
        fetchLatestPerKey('nivel2_estados', asset, 'timeframe', TECH_COLUMNS.map((c) => c.tf2)),
        fetchLatestPerKey('nivel3_senales', asset, 'senal', senales),
        fetchLatestPerKey('motor3_resultados', asset, 'timeframe', ['4h', '1d']),
      ])

      if (cancelled) return

      if (prices && prices.length) {
        setPrice(prices[0].close)
        setPrevClose(prices[1]?.close ?? null)
      }

      setNivel1(n1)
      setNivel2(n2)
      setNivel3(n3)
      setMotor3(m3)
      setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [asset])

  const changePct = price && prevClose ? (((price - prevClose) / prevClose) * 100).toFixed(2) : null
  const motor4h = motor3.find((m) => m.timeframe === '4h')
  const motor1d = motor3.find((m) => m.timeframe === '1d')

  return (
    <div className="app-shell">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 12, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 500, color: 'var(--accent-text)' }}>
            NC
          </div>
          <span style={{ fontSize: 16, fontWeight: 500 }}>NC Trader</span>
        </div>
        <AssetSelector />
      </div>

      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>{asset}/USD</div>
          <div style={{ fontSize: 26, fontWeight: 500 }}>{price ? `$${fmtNum(price)}` : '—'}</div>
        </div>
        {changePct !== null && (
          <span className={changePct >= 0 ? 'badge badge-alcista' : 'badge badge-bajista'}>
            {changePct >= 0 ? '+' : ''}
            {changePct}% 24h
          </span>
        )}
      </div>

      <div style={{ marginBottom: 14 }}>
        <TradingViewChart symbol={TV_SYMBOLS[asset]} />
      </div>

      {loading && <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 20 }}>Cargando datos del motor...</div>}

      {!loading && (
        <>
          <div className="card" style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>Análisis técnico</div>
            {nivel1.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Aún sin snapshots para este activo.</div>
            ) : isMobile ? (
              <>
                <TechGroup title="Intraday" cols={TECH_COLUMNS.filter((c) => c.grupo === 'Intraday')} nivel1={nivel1} nivel2={nivel2} />
                <div style={{ height: 20 }} />
                <TechGroup title="Inversión" cols={TECH_COLUMNS.filter((c) => c.grupo === 'Inversión')} nivel1={nivel1} nivel2={nivel2} />
              </>
            ) : (
              <TechGroup cols={TECH_COLUMNS} nivel1={nivel1} nivel2={nivel2} showGroupHeaders />
            )}
          </div>

          <div className="card" style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 10 }}>Análisis fundamental</div>
            {[...nivel3]
              .sort((a, b) => (b.peso ?? 0) - (a.peso ?? 0) || (a.senal === 'tasas_fed' ? -1 : b.senal === 'tasas_fed' ? 1 : 0))
              .map((row) => {
                const halvingInfo = row.senal === 'ciclo_halving' ? halvingResumenCorto(row.detalle) : null
                return (
                  <div key={row.senal} onClick={() => setModal(row)} style={{ cursor: 'pointer', borderBottom: '0.5px solid var(--border)', padding: '10px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: halvingInfo ? 6 : 3 }}>
                      <span style={{ fontSize: 12 }}>
                        {SENAL_LABELS[row.senal]} <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{fmtPct(row.peso)}</span>
                      </span>
                      <Icon name="chevron-right" size={12} color="var(--text-muted)" />
                    </div>
                    {halvingInfo && (
                      <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>
                        <span>Días transcurridos <b style={{ color: 'var(--text-primary)' }}>{halvingInfo.dias}</b></span>
                        <span>Promedio <b style={{ color: 'var(--text-primary)' }}>{halvingInfo.diasPromedio}</b></span>
                        <span>Recorrido <b style={{ color: 'var(--text-primary)' }}>{halvingInfo.pctRecorrido}</b></span>
                      </div>
                    )}
                    {!halvingInfo && (
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                        {detalleResumen(row.senal, row.detalle)}
                      </div>
                    )}
                    <span className={badgeClass(row.direction)} style={{ fontSize: 11 }}>
                      {directionLabel(row.direction)} {fmtPct(row.fuerza)}
                    </span>
                  </div>
                )
              })}
            {nivel3.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Sin datos aún.</div>}
          </div>

          <div className="card">
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>Resultado final · Motor 3</div>
            <div className="motor3-grid">
              {[
                { tf: '4h', label: '4H · swing / intradía', row: motor4h },
                { tf: '1d', label: '1D · inversión', row: motor1d },
              ].map(({ tf, label, row }) => (
                <div key={tf} style={{ background: 'var(--bg-card-2)', borderRadius: 16, padding: 14 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>{label}</div>
                  {row ? (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Técnico (60%)</span>
                        <span style={{ color: textColor(row.nivel1_direction) }}>{directionLabel(row.nivel1_direction)} {fmtPct(row.nivel1_fuerza)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 10 }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Fundamental (40%)</span>
                        <span style={{ color: textColor(row.nivel3_direction) }}>{directionLabel(row.nivel3_direction)} {fmtPct(row.nivel3_fuerza)}</span>
                      </div>
                      {row.es_conflicto || row.score_final === null ? (
                        <div style={{ fontSize: 24, fontWeight: 500, color: 'var(--neutral)' }}>No operar (conflicto)</div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 24, fontWeight: 500, color: textColor(row.resultado_direction) }}>{fmtPct(row.score_final)}</span>
                          <span className={badgeClass(row.resultado_direction)}>{row.tamano_posicion}</span>
                        </div>
                      )}
                      {tf === '4h' && row.timeframe_operativo_sugerido && (
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.5 }}>
                          Sugerencia: entra en la temporalidad de {TIMEFRAME_LABELS[row.timeframe_operativo_sugerido]} y mantén la operación un máximo de {fmtNum(row.duracion_maxima_horas, 0)} horas.
                        </div>
                      )}
                      {tf === '1d' && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.5 }}>Horizonte de inversión: sin sugerencia de temporalidad ni duración.</div>
                      )}
                    </>
                  ) : (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Sin datos aún.</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {modal && (
        <div onClick={() => setModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 50 }}>
          <div onClick={(e) => e.stopPropagation()} className="card" style={{ maxWidth: 360, width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 500 }}>{SENAL_LABELS[modal.senal]} · {fmtPct(modal.peso)}</span>
              <span onClick={() => setModal(null)} style={{ cursor: 'pointer', display: 'flex' }}>
                <Icon name="x" size={16} color="var(--text-secondary)" />
              </span>
            </div>
            <div style={{ fontSize: 15, fontWeight: 500, color: textColor(modal.direction), marginBottom: 10, marginTop: 6 }}>
              {directionLabel(modal.direction)} · fuerza {fmtPct(modal.fuerza)}
            </div>
            {modal.detalle ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {Object.entries(modal.detalle)
                  .filter(([k]) => k !== 'nota' && !DETALLE_HIDDEN_KEYS.includes(k))
                  .map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, gap: 10 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{DETALLE_LABELS[k] || k}</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 500, textAlign: 'right' }}>
                        {typeof v === 'number' ? fmtNum(v, 2) : String(v)}
                      </span>
                    </div>
                  ))}

                {/* Flujos ETF: escala de los 10 valores extremos históricos, de mayor a menor,
                    del mismo lado (entrada o salida) que la dirección del día actual. */}
                {modal.senal === 'flujos_etf' && Array.isArray(modal.detalle.top10_referencia_musd) && (
                  <div style={{ marginTop: 4 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>
                      Top 10 histórico de {modal.direction === 'bajista' ? 'salidas' : 'entradas'} (M USD)
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {modal.detalle.top10_referencia_musd.map((v, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                          <span style={{ color: 'var(--text-muted)' }}>#{i + 1}</span>
                          <span style={{ color: 'var(--text-primary)' }}>{fmtNum(v, 1)}M</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {modal.detalle.nota && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 6, lineHeight: 1.5 }}>{modal.detalle.nota}</div>
                )}

                {/* Metodología: siempre al final, en su propio cuadro separado */}
                {modal.detalle.metodologia && (
                  <div style={{ marginTop: 8, padding: 10, borderRadius: 12, background: 'var(--bg-card-2)' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Metodología</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{modal.detalle.metodologia}</div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Sin detalle adicional guardado para esta señal.</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
