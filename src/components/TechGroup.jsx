import { badgeClass, directionLabel, estado1Color, estado2DimColor, fmtNum, fmtPct, textColor } from '../utils'

const FACTORS = [
  { key: 'hull', label: 'Hull trend' },
  { key: 'squeeze', label: 'Squeeze mom.' },
  { key: 'ema', label: 'EMA 20/55' },
  { key: 'adx', label: 'ADX/DMI' },
]

export default function TechGroup({ cols, nivel1, nivel2, title, showGroupHeaders }) {
  const gridCols = `100px repeat(${cols.length}, 1fr)`

  let groupSpans = []
  if (showGroupHeaders) {
    let i = 0
    while (i < cols.length) {
      let j = i
      while (j < cols.length && cols[j].grupo === cols[i].grupo) j++
      groupSpans.push({ label: cols[i].grupo, start: i, count: j - i })
      i = j
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: '5px 8px' }}>
      {title && (
        <div
          style={{
            gridColumn: `1 / ${cols.length + 2}`,
            fontSize: 11,
            fontWeight: 500,
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '.03em',
            marginBottom: 2,
          }}
        >
          {title}
        </div>
      )}

      {showGroupHeaders && (
        <>
          <div />
          {groupSpans.map((g) => (
            <div
              key={g.label}
              style={{
                gridColumn: `${g.start + 2} / ${g.start + 2 + g.count}`,
                textAlign: 'center',
                color: 'var(--text-secondary)',
                fontSize: 10,
                textTransform: 'uppercase',
              }}
            >
              {g.label}
            </div>
          ))}
        </>
      )}

      <div />
      {cols.map((c) => (
        <div key={c.vista} style={{ textAlign: 'center', fontSize: 11 }}>
          {c.label}
          <br />
          <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>{c.peso}</span>
        </div>
      ))}

      {FACTORS.map((f) => (
        <>
          <div key={f.key} style={{ color: 'var(--text-secondary)', fontSize: 11, alignSelf: 'center' }}>
            {f.label}
          </div>
          {cols.map((c) => {
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

      <div style={{ color: 'var(--text-primary)', fontSize: 11, fontWeight: 500, alignSelf: 'center', paddingTop: 8, borderTop: '0.5px solid var(--border)' }}>
        Señal
      </div>
      {cols.map((c) => {
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

      <div style={{ color: 'var(--text-primary)', fontSize: 11, fontWeight: 500, alignSelf: 'start', paddingTop: 10, borderTop: '0.5px solid var(--border)' }}>
        Estado
      </div>
      {cols.map((c) => {
        const row = nivel2.find((r) => r.timeframe === c.tf2)
        return (
          <div key={c.vista + 'estado'} style={{ textAlign: 'center', paddingTop: 10, borderTop: '0.5px solid var(--border)', fontSize: 11, lineHeight: 1.4 }}>
            {row ? (
              <>
                <div style={{ color: estado1Color(row.estado1), fontWeight: 500 }}>{row.estado1}</div>
                {row.estado2 && <div style={{ color: estado2DimColor(row.estado2), marginTop: 3 }}>{row.estado2}</div>}
                {row.estado3 && <div style={{ color: 'var(--text-secondary)', marginTop: 3 }}>{row.estado3}</div>}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginTop: 8, paddingTop: 8, borderTop: '0.5px solid var(--border)' }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{fmtNum(row.horas_en_estado_actual, 0)}h</div>
                    <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase' }}>En curso</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)' }}>{fmtNum(row.promedio_historico_horas, 0)}h</div>
                    <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Promedio</div>
                  </div>
                </div>
              </>
            ) : (
              <span style={{ color: 'var(--text-muted)' }}>—</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
