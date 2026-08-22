import { useEffect, useRef } from 'react'

export default function TradingViewChart({ symbol }) {
  const container = useRef(null)

  useEffect(() => {
    if (!container.current) return
    container.current.innerHTML = ''
    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
    script.async = true
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol,
      interval: '60',
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'es',
      backgroundColor: 'rgba(44, 44, 46, 1)',
      hide_top_toolbar: false,
      hide_legend: false,
      allow_symbol_change: false,
      support_host: 'https://www.tradingview.com',
    })
    container.current.appendChild(script)
  }, [symbol])

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div ref={container} style={{ height: 380, width: '100%' }} />
    </div>
  )
}
