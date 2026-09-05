# NC Trader — Nickchilling Trader To The Moon

PWA de análisis y journal de trading para BTC, Oro (XAU) y US100, conectada a Supabase
(motor de señales ya corriendo solo en la base de datos).

## Stack
- Vite + React + react-router-dom
- @supabase/supabase-js (auth + datos)
- vite-plugin-pwa (manifest + service worker)
- TradingView widget embebido para el gráfico

## Desarrollo local
```
npm install
npm run dev
```

## Build de producción
```
npm run build
```
Genera la carpeta `dist/`, lista para desplegar en Netlify (ver `netlify.toml`).

## Estructura
- `src/pages/Analysis.jsx` — pantalla principal: precio, gráfica TradingView, Nivel 1
  (técnico), Nivel 2 (estructura de mercado), Nivel 3 (fundamental, con modal de detalle),
  Resultado final (Motor 3) para 4H y 1D.
- `src/pages/Movements.jsx` — journal de trades (FTMO/Binance) y fichas de inversión, con
  formulario de registro que captura el snapshot de Nivel 1 al guardar.
- `src/pages/Settings.jsx` — edición de umbrales de `config_gestion_riesgo` y preferencias
  de notificaciones (guardadas localmente por ahora).
- `src/context/` — sesión de Supabase Auth y activo seleccionado (persistido en
  `localStorage`).

## Historial de sesiones
- [2026-09-05](docs/actualizaciones_2026-09-05.md) — rediseño de VIX, DXY y Flujos ETF
  (Nivel 3), corrección de bugs de datos por temporalidad, ajustes de interfaz móvil y
  escritorio.

## Pendiente / próximos pasos
- Conectar Netlify a este repositorio para despliegue automático en cada push.
- Notificaciones push reales (por ahora las preferencias solo se guardan localmente, sin
  disparar notificaciones — falta el service worker de push + tabla de suscripciones).
- Nivel 1 muestra las 4 filas reales que guarda `nivel1_snapshots` (`vista_inversion`,
  `vista_intraday`, `1d_puro`, `4h_puro`). Para ver el desglose por cada una de las 4
  temporalidades crudas (15m, 4H, 1D, Semanal) por separado habría que ampliar esa tabla o
  calcularlo en el cliente — quedó pendiente de decidir.
- Símbolos de TradingView usados por defecto: BTC `COINBASE:BTCUSD`, Oro `OANDA:XAUUSD`,
  US100 `OANDA:NAS100USD` — se pueden ajustar en `src/utils.js` (`TV_SYMBOLS`).
- Íconos de PWA son un placeholder simple generado por código (`public/icon-192.png`,
  `public/icon-512.png`) — se pueden reemplazar por un diseño final más adelante.
