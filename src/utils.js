export const SENAL_LABELS = {
  ciclo_halving: 'Ciclo halving',
  flujos_etf: 'Flujos ETF',
  tasas_fed: 'Tasas Fed',
  dxy: 'DXY',
  vix: 'VIX',
}

export const TIMEFRAME_LABELS = {
  '15m': '15min',
  '4h': '4H',
  '1d': '1D',
  '1w': 'Semanal',
}

export const VISTA_LABELS = {
  vista_inversion: 'Inversión (Semanal + 1D)',
  vista_intraday: 'Intraday (4H + 15min)',
  '1d_puro': '1D puro',
  '4h_puro': '4H puro',
}

export const TV_SYMBOLS = {
  BTC: 'COINBASE:BTCUSD',
  XAU: 'OANDA:XAUUSD',
  US100: 'OANDA:NAS100USD',
}

export function directionLabel(d) {
  if (d === 'alcista') return 'Alcista'
  if (d === 'bajista') return 'Bajista'
  return 'Neutral'
}

export function badgeClass(d) {
  if (d === 'alcista') return 'badge badge-alcista'
  if (d === 'bajista') return 'badge badge-bajista'
  return 'badge badge-neutral'
}

export function textColor(d) {
  if (d === 'alcista') return 'var(--alcista)'
  if (d === 'bajista') return 'var(--bajista)'
  return 'var(--neutral)'
}

// Color del Estado 1 (Nivel 2) según su contenido: subida = alcista, caída = bajista, transición = neutral
export function estado1Color(texto) {
  if (!texto) return 'var(--text-secondary)'
  if (texto.toLowerCase().includes('subida')) return 'var(--alcista)'
  if (texto.toLowerCase().includes('caída') || texto.toLowerCase().includes('caida')) return 'var(--bajista)'
  return 'var(--neutral)'
}

// Color tenue (65% opacidad) para las notas de Estado 2 de Nivel 2 — mismo semáforo
// que la dirección principal, pero sin la misma fuerza visual porque es solo informativo.
export function estado2DimColor(texto) {
  if (!texto) return 'var(--text-secondary)'
  const t = texto.toLowerCase()
  if (t.includes('alcista')) return 'var(--alcista-dim)'
  if (t.includes('bajista')) return 'var(--bajista-dim)'
  return 'var(--text-secondary)'
}

export function fmtPct(n) {
  if (n === null || n === undefined) return '—'
  return `${Number(n).toFixed(1)}%`
}

export function fmtNum(n, decimals = 2) {
  if (n === null || n === undefined) return '—'
  return Number(n).toLocaleString('es-CO', { maximumFractionDigits: decimals })
}

// Etiquetas legibles para las llaves del jsonb "detalle" de nivel3_senales.
// 'metodologia' y 'top10_referencia_musd' se excluyen a propósito de esta lista: se
// muestran aparte con su propio tratamiento visual en el modal de detalle.
export const DETALLE_LABELS = {
  fase_activa: 'Fase del ciclo',
  dias_transcurridos: 'Días transcurridos',
  dias_promedio_referencia: 'Días promedio de referencia',
  pct_recorrido: 'Recorrido de la fase',
  pct_recorrido_capado: 'Recorrido capado (100% máx.)',
  ancla_fecha: 'Fecha de referencia de la fase',
  ancla_precio: 'Precio de referencia de la fase',
  ultimo_ath_fecha: 'Fecha del último máximo (ATH)',
  ultimo_ath_precio: 'Precio del último máximo (ATH)',
  ultimo_minimo_ciclo_fecha: 'Fecha del último mínimo de ciclo',
  ultimo_minimo_ciclo_precio: 'Precio del último mínimo de ciclo',
  flujo_actual_musd: 'Flujo de hoy',
  fecha_flujo: 'Fecha del dato',
  tasa_actual: 'Tasa actual',
  ultimo_cambio_pct: 'Último cambio',
  fecha_ultimo_cambio: 'Fecha del último cambio',
  dxy_actual: 'DXY actual',
  pct_5d: 'Variación 5 días (lógica anterior)',
  ma55_15m: 'Media móvil 55 (15min)',
  velas_racha: 'Velas de 15m en racha',
  velas_para_piso: 'Velas para tocar el piso (10%)',
  vix_actual: 'VIX actual',
  vix_rampa_min: 'Rampa · sin volatilidad',
  vix_rampa_max: 'Rampa · volatilidad máxima',
  direccion_fuente: 'Dirección tomada de',
}

// Llaves del jsonb "detalle" que no se listan como fila genérica en el modal porque
// tienen su propio bloque visual (metodología al final, top-10 de flujos ETF, etc.)
export const DETALLE_HIDDEN_KEYS = ['metodologia', 'top10_referencia_musd', 'vix_rampa_min', 'vix_rampa_max', 'direccion_fuente', 'velas_racha', 'velas_para_piso']

// Línea corta con el dato real (no solo dirección/fuerza) para mostrar bajo cada señal
export function detalleResumen(senal, detalle) {
  if (!detalle) return null
  switch (senal) {
    case 'ciclo_halving':
      return `${fmtNum(detalle.dias_transcurridos, 0)}d transcurridos (prom. ${fmtNum(detalle.dias_promedio_referencia, 0)}d) · ${fmtNum(detalle.pct_recorrido_capado, 1)}% del recorrido`
    case 'flujos_etf':
      return `${detalle.flujo_actual_musd >= 0 ? '+' : ''}${fmtNum(detalle.flujo_actual_musd, 1)}M USD el ${detalle.fecha_flujo?.slice(0, 10)}`
    case 'tasas_fed':
      return `${fmtNum(detalle.tasa_actual, 2)}% (${detalle.ultimo_cambio_pct >= 0 ? '+' : ''}${fmtNum(detalle.ultimo_cambio_pct, 2)}% el ${detalle.fecha_ultimo_cambio?.slice(0, 10)})`
    case 'dxy':
      return detalle.velas_racha
        ? `DXY ${fmtNum(detalle.dxy_actual, 3)} vs MA55 ${fmtNum(detalle.ma55_15m, 3)} · ${detalle.velas_racha} velas de 15m en racha`
        : `DXY ${fmtNum(detalle.dxy_actual, 3)} · sin racha confirmada (esperando 8 velas)`
    case 'vix':
      return `VIX ${fmtNum(detalle.vix_actual, 2)} · rampa ${detalle.vix_rampa_min}→${detalle.vix_rampa_max} · dirección del técnico 4H`
    default:
      return null
  }
}

// El "número protagonista" de cada señal fundamental — se muestra grande, al frente,
// coloreado según la dirección. Devuelve { valor, secundario } o null si no aplica.
export function featuredResumen(senal, detalle) {
  if (!detalle) return null
  switch (senal) {
    case 'ciclo_halving':
      return {
        valor: fmtPct(detalle.pct_recorrido_capado),
        secundario: `${fmtNum(detalle.dias_transcurridos, 0)}d transcurridos · prom. ${fmtNum(detalle.dias_promedio_referencia, 0)}d`,
      }
    case 'flujos_etf':
      return {
        valor: `${detalle.flujo_actual_musd >= 0 ? '+' : ''}${fmtNum(detalle.flujo_actual_musd, 1)}M`,
        secundario: `prom. 30d: ${fmtNum(detalle.promedio_referencia_30d_musd, 1)}M USD`,
      }
    case 'tasas_fed':
      return {
        valor: `${detalle.ultimo_cambio_pct >= 0 ? '+' : ''}${fmtNum(detalle.ultimo_cambio_pct, 2)}%`,
        secundario: `tasa actual ${fmtNum(detalle.tasa_actual, 2)}% · ${detalle.fecha_ultimo_cambio?.slice(0, 10)}`,
      }
    case 'dxy':
      return {
        valor: detalle.velas_racha ? String(detalle.velas_racha) : '—',
        secundario: detalle.velas_racha ? `de 620 velas · MA55 ${fmtNum(detalle.ma55_15m, 3)}` : 'esperando 8 velas para confirmar',
      }
    case 'vix':
      return {
        valor: fmtNum(detalle.vix_actual, 2),
        secundario: 'dirección tomada del técnico 4H',
      }
    default:
      return null
  }
}
