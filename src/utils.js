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

export function fmtPct(n) {
  if (n === null || n === undefined) return '—'
  return `${Number(n).toFixed(1)}%`
}

export function fmtNum(n, decimals = 2) {
  if (n === null || n === undefined) return '—'
  return Number(n).toLocaleString('es-CO', { maximumFractionDigits: decimals })
}

// Etiquetas legibles para las llaves del jsonb "detalle" de nivel3_senales
export const DETALLE_LABELS = {
  dias_transcurridos: 'Días transcurridos',
  dias_promedio_historico: 'Promedio histórico (días)',
  pct_actual: 'Ganancia capturada',
  pct_promedio_historico: 'Promedio histórico de ganancia',
  fase_activa: 'Fase del ciclo',
  fuerza_posicion_temporal: 'Fuerza · posición temporal',
  fuerza_magnitud_capturada: 'Fuerza · magnitud capturada',
  muestra_ciclos_completos: 'Ciclos completos en la muestra',
  dias_restantes_estimados_fase: 'Días restantes estimados de fase',
  flujo_actual_musd: 'Flujo de hoy',
  promedio_referencia_30d_musd: 'Promedio de referencia (30d)',
  fecha_flujo: 'Fecha del dato',
  tasa_actual: 'Tasa actual',
  ultimo_cambio_pct: 'Último cambio',
  fecha_ultimo_cambio: 'Fecha del último cambio',
  dxy_actual: 'DXY actual',
  pct_5d: 'Variación 5 días',
  vix_actual: 'VIX actual',
  percentil_historico: 'Percentil histórico',
}

// Línea corta con el dato real (no solo dirección/fuerza) para mostrar bajo cada señal
export function detalleResumen(senal, detalle) {
  if (!detalle) return null
  switch (senal) {
    case 'ciclo_halving':
      return `${fmtNum(detalle.dias_transcurridos, 0)}d transcurridos (prom. ${fmtNum(detalle.dias_promedio_historico, 0)}d) · ${fmtNum(detalle.pct_actual, 1)}% capturado`
    case 'flujos_etf':
      return `${detalle.flujo_actual_musd >= 0 ? '+' : ''}${fmtNum(detalle.flujo_actual_musd, 1)}M USD (prom. 30d ${fmtNum(detalle.promedio_referencia_30d_musd, 1)}M)`
    case 'tasas_fed':
      return `${fmtNum(detalle.tasa_actual, 2)}% (${detalle.ultimo_cambio_pct >= 0 ? '+' : ''}${fmtNum(detalle.ultimo_cambio_pct, 2)}% el ${detalle.fecha_ultimo_cambio?.slice(0, 10)})`
    case 'dxy':
      return `${fmtNum(detalle.dxy_actual, 2)} (${detalle.pct_5d >= 0 ? '+' : ''}${fmtNum(detalle.pct_5d, 2)}% en 5d)`
    case 'vix':
      return `${fmtNum(detalle.vix_actual, 2)} (percentil ${fmtNum(detalle.percentil_historico, 0)})`
    default:
      return null
  }
}

// Vigencia de la señal de Tasas Fed: 100% el día del cambio, decae linealmente
// hasta 0% en 90 días (supuesto razonable, ~2 ciclos de reuniones FOMC — ajustable)
export function vigenciaFed(fechaCambio) {
  if (!fechaCambio) return null
  const dias = (Date.now() - new Date(fechaCambio).getTime()) / 86400000
  return Math.max(0, Math.round(100 - (dias * 100) / 90))
}
