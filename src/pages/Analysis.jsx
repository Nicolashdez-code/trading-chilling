import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAsset } from '../context/AssetContext'
import AssetSelector from '../components/AssetSelector'
import TradingViewChart from '../components/TradingViewChart'
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
  detalleResumen,
  vigenciaFed,
} from '../utils'

const TECH_COLUMNS = [
  { vista: '15m_puro', label: '15m', peso: '40%' },
  { vista: '4h_puro', label: '4H', peso: '60%' },
  { vista: '1d_puro', label: '1D', peso: '40%' },
  { vista: '1w_puro', label: 'S', peso: '60%' },
]

const NIVEL2_TF = ['15m', '4h', '1d', '1w']

// Color del Estado 1 según su contenido: subida = alcista, caída = bajista, transición = neutral
function estado1Color(texto) {
  if (!texto) return 'var(--text-secondary)'
  if (texto.toLowerCase().includes('subida')) return 'var(--alcista)'
  if (texto.toLowerCase().includes('caída') || texto.toLowerCase().includes('caida')) return 'var(--bajista)'
  return 'var(--neutral)'
}

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
        fetchLatestPerKey('nivel2_estados', asset, 'timeframe', NIVEL2_TF),
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
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '100px repeat(4,1fr)', gap: '5px 8px' }}>
                <div />
                <div style={{ gridColumn: '2 / 4', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 10, textTransform: 'uppercase' }}>Intraday</div>
                <div style={{ gridColumn: '4 / 6', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 10, textTransform: 'uppercase' }}>Inversión</div>
                <div />
                {TECH_COLUMNS.map((c) => (
                  <div key={c.vista} style={{ textAlign: 'center', fontSize: 11 }}>
                    {c.label}
                    <br />
                    <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>{c.peso}</span>
                  </div>
                ))}
                {[
                  { key: 'hull', label: 'Hull trend' },
                  { key: 'squeeze', label: 'Squeeze mom.' },
                  { key: 'ema', label: 'EMA 20/55' },
                  { key: 'adx', label: 'ADX/DMI' },
                ].map((f) => (
                  <>
                    <div key={f.key} style={{ color: 'var(--text-secondary)', fontSize: 11, alignSelf: 'center' }}>{f.label}</div>
                    {TECH_COLUMNS.map((c) => {
                      const row = nivel1.find((r) => r.vista === c.vista)
                      const dir = row?.[`${f.key}_direction`]
                      const fuerza = row?.[`${f.key}_fuerza`]
                      return (
                        <div key={c.vista + f.key} style={{ textAlign: 'center', fontSize: 11, color: dir ? textColor(dir) : 'var(--text-muted)' }}>
                          {dir ? (
                            <>
                              {directionLabel(dir).slice(0, 3)} <span style={{ color: 'var(--text-muted)' }}>{fmtPct(fuerza)}</span>
                            </>
                          ) : (
                            '—'
                          )}
                        </div>
                      )
                    })}
                  </>
                ))}
                <div style={{ color: 'var(--text-primary)', fontSize: 11, fontWeight: 500, alignSelf: 'center', paddingTop: 8, borderTop: '0.5px solid var(--border)' }}>Señal</div>
                {TECH_COLUMNS.map((c) => {
                  const row = nivel1.find((r) => r.vista === c.vista)
                  return (
                    <div key={c.vista + 'signal'} style={{ textAlign: 'center', paddingTop: 8, borderTop: '0.5px solid var(--border)' }}>
                      {row ? (
                        <span className={badgeClass(row.score_direction)} style={{ fontSize: 10, padding: '3px 8px' }}>
                          {directionLabel(row.score_direction)} {fmtPct(row.score_fuerza)}
                        </span>
                      ) : (
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>—</span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div className="card">
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 10 }}>Estructura de mercado</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {NIVEL2_TF.map((tf) => {
                  const row = nivel2.find((r) => r.timeframe === tf)
                  return (
                    <div key={tf} style={{ borderBottom: '0.5px solid var(--border)', paddingBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{TIMEFRAME_LABELS[tf]}</span>
                        {row && (
                          <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                            En curso <b style={{ color: 'var(--text-primary)' }}>{fmtNum(row.horas_en_estado_actual, 0)}h</b>
                            {' · '}Prom <b style={{ color: 'var(--text-primary)' }}>{fmtNum(row.promedio_historico_horas, 0)}h</b>
                          </span>
                        )}
                      </div>
                      {row ? (
                        <>
                          <div style={{ fontSize: 12, marginTop: 3, color: estado1Color(row.estado1), fontWeight: 500 }}>{row.estado1}</div>
                          {row.estado2 && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{row.estado2}</div>}
                          {row.estado3 && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{row.estado3}</div>}
                        </>
                      ) : (
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>Sin datos aún.</div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="card">
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 10 }}>Análisis fundamental</div>
              {nivel3.map((row) => {
                const vigencia = row.senal === 'tasas_fed' ? vigenciaFed(row.detalle?.fecha_ultimo_cambio) : null
                return (
                  <div key={row.senal} onClick={() => setModal(row)} style={{ cursor: 'pointer', borderBottom: '0.5px solid var(--border)', padding: '9px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontSize: 12 }}>
                        {SENAL_LABELS[row.senal]} <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{fmtPct(row.peso)}</span>
                      </span>
                      <Icon name="chevron-right" size={12} color="var(--text-muted)" />
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: textColor(row.direction), marginTop: 3 }}>
                      {detalleResumen(row.senal, row.detalle) || `${directionLabel(row.direction)} ${fmtPct(row.fuerza)}`}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                      <span className={badgeClass(row.direction)} style={{ fontSize: 10 }}>
                        {directionLabel(row.direction)} {fmtPct(row.fuerza)}
                      </span>
                      {vigencia !== null && (
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Vigencia {vigencia}%</span>
                      )}
                    </div>
                  </div>
                )
              })}
              {nivel3.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Sin datos aún.</div>}
            </div>
          </div>

          <div className="card">
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>Resultado final · Motor 3</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
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
                  .filter(([k]) => k !== 'nota')
                  .map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, gap: 10 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{DETALLE_LABELS[k] || k}</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 500, textAlign: 'right' }}>
                        {typeof v === 'number' ? fmtNum(v, 2) : String(v)}
                      </span>
                    </div>
                  ))}
                {modal.detalle.nota && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 6, lineHeight: 1.5 }}>{modal.detalle.nota}</div>
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
