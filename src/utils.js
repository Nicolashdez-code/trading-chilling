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
