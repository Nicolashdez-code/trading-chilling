# Actualizaciones de sesión — 2026-09-05

Resumen de todo lo trabajado en esta sesión sobre NC Trader: rediseño completo de 3 señales
de Nivel 3 (VIX, DXY, Flujos ETF), corrección de bugs reales de datos, y ajustes de
frontend (móvil, escritorio, íconos). **Todos los indicadores están verificados y
funcionando correctamente con datos reales** al cierre de esta sesión.

## 1. VIX — rediseño completo (Nivel 3)

**Antes:** dirección propia por comparación de 5 días + fuerza por percentil histórico
simétrico (premiaba igual pánico extremo que complacencia extrema).

**Ahora:** el VIX dejó de opinar sobre dirección. Solo mide qué tan activa está la
volatilidad, y toma prestada la dirección del **técnico puro de 4H** (`nivel1_snapshots`,
vista `4h_puro`) del mismo activo — evita cualquier circularidad porque Motor 3 usa
`4h_puro` directamente, no el resultado ya combinado.

- **Fuerza:** rampa lineal de 0% (VIX=12) a 100% (VIX=19), capada en 100% de ahí para
  arriba. `fuerza = clamp((vix_actual − 12) / (19 − 12) × 100, 0, 100)`.
- **Dirección:** la del técnico 4H de ese mismo activo (BTC, Oro o US100 — cada uno el
  suyo).
- **Peso:** sin cambios — BTC 9%, Oro 10%, US100 35%.
- Verificado: VIX 14.53 → fuerza 36.14%, dirección coincidiendo exactamente con Nivel 1
  4H de cada activo.

Función: `fn_nivel3_dxy_vix()` (parte VIX). Sigue en el pipeline diario (00:30/00:35 UTC).

## 2. DXY — lógica personalizada de racha (Nivel 3)

**Antes:** dirección y fuerza por cambio de 5 días vs. el máximo histórico absoluto (un
solo evento fijo de julio 2025, sin adaptarse al régimen actual).

**Ahora:** racha de velas de 15min consecutivas por encima/debajo de la media móvil de 55
del propio DXY.

- **Activación:** la señal solo se muestra cuando hay **8 o más velas consecutivas** del
  mismo lado de la MA55. Un intento de cruce que no llega a 8 velas se ignora — la señal
  activa sigue siendo la del último tramo que sí calificó (se resuelve solo con los
  datos, sin guardar estado aparte — técnica de islas y huecos en SQL).
- **Dirección:** por encima de la MA55 (dólar subiendo) = Bajista para el activo · por
  debajo = Alcista. Misma relación inversa de siempre.
- **Fuerza:** empieza en **100% exacto en la vela 8**, decae linealmente hasta un piso de
  **10% en la vela 580** (ajustado desde 620 el 2026-09-05), y se queda plano en 10% de
  ahí en adelante. `fuerza = máx(10, 100 − (n−8) × (90/572))`.
- **Peso:** sin cambios — BTC 15%, Oro 35%, US100 20%.

**Infraestructura nueva construida para esto:**
- Nuevo activo interno `DXY` agregado al enum `asset_type` (solo para esta señal, no
  aparece en el selector de la app).
- Ingesta de DXY en velas de 15min vía Yahoo Finance (`DX-Y.NYB`), reutilizando el mismo
  mecanismo pg_net que ya usan BTC/Oro/US100 (`fn_disparar_intradia`/`fn_recolectar_intradia`,
  cada 5 minutos). Backfill inicial de 18 días (1,233 velas) para tener buffer de sobra.
- Función nueva `fn_calc_dxy_racha()`, cron `actualizar_dxy_racha` cada 5 minutos.

Verificado: racha de 34 velas → fuerza 95.91% (con el piso en 580), dirección Bajista
coincidiendo con DXY por encima de su MA55.

### DXY para US100 — correlación positiva (2026-09-05, ajuste posterior)

Investigado y confirmado: la relación DXY-Nasdaq no es estructuralmente confiable como
inversa simple — existe la **"teoría de la sonrisa del dólar"**, donde el dólar sube por
dos razones opuestas (pánico/refugio vs. fortaleza económica de EE.UU.), y solo la
primera coincide con Nasdaq cayendo. En la segunda (fortaleza económica), dólar y Nasdaq
suben juntos.

Decisión tomada:
- **Peso del DXY en US100 reducido de 20% a 10%** (los 10 puntos liberados se repartieron
  por igual: Tasas Fed 45%→50%, VIX 35%→40%).
- **Dirección invertida solo para US100:** DXY por encima de su MA55 (dólar subiendo) =
  **Alcista** para US100 (apostando al lado derecho de la sonrisa — fortaleza económica).
  BTC y Oro mantienen la relación inversa de siempre (dólar sube = bajista).
- Queda registrado en el propio dato (`detalle.correlacion`: `'positiva'` para US100,
  `'inversa'` para BTC/Oro) para que quede trazable en el modal de la app.

Pesos de Nivel 3 actualizados para US100: Tasas Fed 50%, VIX 40%, DXY 10% (suma 100%,
verificado).

### DXY — tolerancia de 8 velas para romper la racha (2026-09-05, ajuste posterior)

Se detectó (revisando un caso real) que una sola vela aislada de ruido — un roce mínimo
contra la MA55, de apenas centésimas de punto — reseteaba toda la racha acumulada, aunque
la tendencia de fondo seguía intacta antes y después de esa vela. Ejemplo real: una vela a
las 12:15 UTC cerró 0.012 puntos por debajo de la MA55, rodeada de decenas de velas por
encima — la racha reportada era de solo 34 velas cuando el recorrido real era mucho mayor.

**Ajuste:** ahora se necesitan **8 velas seguidas en contra** (el mismo umbral que arma la
racha) para voltearla — no 1 sola. Esto ya no se puede calcular con una consulta SQL de
islas y huecos (sin memoria); se reescribió como un recorrido secuencial de las velas en
orden cronológico, llevando el estado de la racha confirmada (`fn_calc_dxy_racha()`).

Verificado: con el mismo momento del ejemplo anterior, la racha pasó de 34 a **75 velas**
(fuerza 89.46% en vez de 95.91%) al tolerar esa vela de ruido y seguir contando hacia
atrás la tendencia real.

## 3. Flujos ETF — escala de sensibilidad ampliada + corrección de bug (Nivel 3)

**Antes (versión 1 de esta sesión):** comparación contra el top-10 absoluto histórico —
solo diferenciaba días verdaderamente récord, todo lo demás quedaba en el piso del 10%.

**Bug encontrado y corregido:** con la primera mejora (escala a puestos 1-90), el 100% se
alcanzaba con solo superar el puesto 10, no el récord real (puesto 1) — el chequeo contra
el récord quedaba matemáticamente inútil.

**Versión final (correcta):** posición **exacta** del flujo de hoy dentro del ranking
histórico completo de días de entrada (o de salida, según el signo), calculada por conteo
directo — no por umbrales aproximados.

- **Bandas de 10 en 10:** puestos 1–10 = 100% · 11–20 = 90% · 21–30 = 80% · ... bajando de
  10% en 10% hasta un piso de 10%.
- **Dirección:** flujo neto positivo = Alcista · negativo = Bajista · exactamente cero =
  Neutral (fuerza fija 10%).
- **Peso:** sin cambios — 20% (única señal exclusiva de BTC).
- **Frecuencia de actualización — ampliada de 1 a 3 veces al día**, dentro de la ventana
  real en que Farside publica (tarde/noche EE.UU.), no repartidas por todo el día:
  - 00:10/00:15 UTC (7:10pm Colombia) — primera lectura
  - 02:30/02:35 UTC (9:30pm Colombia) — refinamiento
  - 05:30/05:35 UTC (12:30am Colombia) — lectura final de la noche
  - Cada pasada también recalcula `fn_nivel3_etf_flows()` para esa señal específica; Motor
    3 recoge automáticamente el valor más fresco sin depender del resto del pipeline.
- **Fines de semana:** el cron corre igual, pero no hay flujo que reportar (mercado de EE.UU.
  cerrado) — la app sigue mostrando correctamente el dato del viernes hasta el domingo
  en la noche, cuando llega el de la sesión del lunes. Esto es comportamiento esperado,
  no un error.
- **Garantía de "nunca sin dato":** verificado en el código — el parser descarta celdas
  vacías/guión sin tocar la fila existente, la función siempre usa `order by fecha desc
  limit 1` (el último dato disponible, nunca fuerza un vacío), y si no hay ningún
  histórico la función se detiene sola sin sobrescribir nada.

Verificado con datos reales: día de 606.3M → puesto 48 histórico → banda 5 → fuerza 60%
(antes se quedaba en el piso del 10%). Día del 4 de septiembre con flujo exactamente $0 →
Neutral 10% (confirmado como dato real, no un vacío).

## 4. Frontend — ajustes de interfaz

- **Íconos:** reemplazado el webfont externo (CDN que no cargaba de forma confiable en
  producción) por un set de íconos SVG propios embebidos (`src/components/Icon.jsx`).
- **Móvil — Análisis técnico:** se apila en 2 bloques (Intraday arriba, Inversión abajo)
  en pantallas angostas, en vez de la tabla de 4 columnas comprimida. Escritorio sin
  cambios. Hook `useIsMobile()` en `src/hooks.js`.
- **Móvil — Motor 3:** las 2 tarjetas (4H/1D) se apilan verticalmente en pantallas
  angostas vía clase CSS `.motor3-grid` con media query, en vez de forzarse a 2 columnas
  y desbordarse.
- **Escritorio — ancho completo:** la interfaz usa hasta 1400px en pantallas ≥900px
  (antes limitada a 720px como en móvil).
- **Análisis fundamental — número protagonista:** cada señal muestra su dato más
  relevante en tamaño mediano, coloreado según dirección, al frente de la tarjeta:
  - Ciclo halving: "X% del recorrido"
  - Flujos ETF: "XM entrando a/saliendo de BTC"
  - DXY: "X velas consecutivas"
  - Tasas Fed: "X% en reducción/subida de tasas"
  - VIX: valor actual, con "Estado actual de volatilidad del mercado" como contexto
- **Modal de detalle:** formato legible con etiquetas en español (no JSON crudo), barra de
  progreso visual para DXY (racha vs. piso) y VIX (rampa), listado de metodología aparte.
- **Nivel 1 (técnico):** tabla completa de 4 temporalidades reales (15m, 4H, 1D, Semanal)
  usando las vistas `15m_puro`/`4h_puro`/`1d_puro`/`1w_puro` que ya calculaba el backend.
- **Bug de datos corregido:** las consultas de Nivel 1/Nivel 2 pedían "las últimas 20
  filas" sin diferenciar por temporalidad — como 15min genera muchas más filas que 1D o
  Semanal, estas últimas quedaban fuera de la ventana y aparecían vacías. Corregido
  pidiendo cada temporalidad por separado (`fetchLatestPerKey` en `Analysis.jsx`).

## 5. Estado del despliegue

- Repo: `github.com/Nicolashdez-code/trading-chilling`, rama `main`.
- Netlify: sitio `nc-trader` conectado al repo, despliega automático en cada push.
- Supabase: todas las funciones y crons mencionados arriba ya están corriendo solos en
  producción — no requieren ninguna acción manual del usuario.

## 7. Bug crítico corregido — velas de 15min "planas" contaminando Hull y Squeeze (2026-09-06)

**Síntoma reportado por el usuario:** viendo la gráfica de TradingView, el Squeeze
Momentum de BTC en 15min mostraba claramente el histograma descendiendo hacia territorio
negativo (señal Bajista visual), pero la app mostraba Alcista.

**Causa raíz encontrada:** `fn_upsert_ohlcv_raw()` usaba la marca de tiempo tal cual la
entrega Yahoo Finance, sin redondearla al inicio real de cada vela de 15 minutos. Para
activos que Yahoo reporta con el "último trade" en vez de una marca de tiempo fija
(BTC, Oro, US100 — no le pasaba al DXY), cada consulta del cron (cada 5 min) generaba una
**fila nueva "plana"** (open=high=low=close, sin rango real) en vez de actualizar la
misma vela en formación. Verificado: **~38-40% de todas las filas de 15min** de BTC, Oro
y US100 eran de este tipo (4,598 de 11,797 en BTC; similar en los otros dos). El 4H
prácticamente no tenía el problema.

**Corrección aplicada:**
- `fn_upsert_ohlcv_raw()` ahora redondea la marca de tiempo hacia abajo al inicio real del
  período (15min = múltiplos de 900 segundos) antes de guardar, y el `upsert` acumula
  correctamente `high`/`low` con `greatest`/`least` en vez de sobrescribir — así los polls
  repetidos de la misma vela en curso se combinan en una sola fila con rango real, en vez
  de crear filas nuevas.
- Se hizo limpieza retroactiva de las filas planas ya existentes en `prices_ohlcv` (15min,
  BTC/Oro/US100).
- Verificado: tras la limpieza, el recálculo de Squeeze Momentum en BTC 15m coincidió
  exactamente con lo que mostraba TradingView (Bajista) en el mismo momento.

Este bug llevaba afectando Hull Trend y Squeeze Momentum en 15min desde el inicio del
proyecto — quedó corregido de raíz, no solo parchado.

## 9. Ajuste de pesos en BTC (2026-09-06)

DXY 15%→10% y Flujos ETF 20%→25% (se compensan exactamente, resto de señales sin
cambios). Pesos actuales de BTC: Ciclo Halving 47%, Flujos ETF 25%, DXY 10%, Tasas Fed 9%,
VIX 9% — suma 100%, verificado.

## 10. Qué sigue pendiente (no bloqueante)

- Notificaciones push reales (el toggle en Ajustes hoy solo se guarda localmente).
- Journal (Movimientos) y Fichas de inversión: funcionales, sin más ajustes solicitados
  por ahora.
- Si con más historial acumulado la señal de Flujos ETF sigue sintiéndose poco sensible en
  el rango medio-bajo, se puede evaluar ampliar la ventana de puestos (hoy 1-90).
