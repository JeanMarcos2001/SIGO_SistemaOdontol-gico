import { useState } from 'react'
import type { EstadoDiente, Odontograma as OdontogramaT } from '../types'

export const ESTADOS: EstadoDiente[] = ['Sano', 'Caries', 'Restauración', 'Endodoncia', 'Corona', 'Extracción']

const COLOR: Record<EstadoDiente, { fill: string; stroke: string; chip: string }> = {
  Sano: { fill: '#ffffff', stroke: '#94a3b8', chip: 'bg-white border-slate-300 text-slate-700' },
  Caries: { fill: '#fca5a5', stroke: '#dc2626', chip: 'bg-red-100 border-red-300 text-red-800' },
  Restauración: { fill: '#93c5fd', stroke: '#2563eb', chip: 'bg-blue-100 border-blue-300 text-blue-800' },
  Endodoncia: { fill: '#f0abfc', stroke: '#a21caf', chip: 'bg-fuchsia-100 border-fuchsia-300 text-fuchsia-800' },
  Corona: { fill: '#fcd34d', stroke: '#d97706', chip: 'bg-amber-100 border-amber-300 text-amber-800' },
  Extracción: { fill: '#e2e8f0', stroke: '#64748b', chip: 'bg-slate-200 border-slate-400 text-slate-700' },
}

const rango = (a: number, b: number) => {
  const r: number[] = []
  const paso = a <= b ? 1 : -1
  for (let i = a; i !== b + paso; i += paso) r.push(i)
  return r
}

// Numeración FDI
const ADULTO = {
  sup: [...rango(18, 11), ...rango(21, 28)],
  inf: [...rango(48, 41), ...rango(31, 38)],
}
const NINO = {
  sup: [...rango(55, 51), ...rango(61, 65)],
  inf: [...rango(85, 81), ...rango(71, 75)],
}

function Diente({ pieza, estado, superior, activo, onClick }: {
  pieza: number; estado: EstadoDiente; superior: boolean; activo: boolean; onClick: () => void
}) {
  const c = COLOR[estado]
  const extraido = estado === 'Extracción'
  return (
    <button
      onClick={onClick}
      aria-label={`Pieza ${pieza}: ${estado}`}
      aria-pressed={activo}
      className={`group flex flex-col items-center rounded-lg p-0.5 transition ${activo ? 'bg-teal-100 ring-2 ring-teal-500' : 'hover:bg-slate-100'}`}
    >
      {superior && <span className="text-[11px] font-semibold text-slate-500">{pieza}</span>}
      <svg width="34" height="46" viewBox="0 0 34 46" className={extraido ? 'opacity-60' : ''}>
        {/* raíz */}
        <path d={superior ? 'M9 2 L17 20 L25 2 Z' : 'M9 44 L17 26 L25 44 Z'} fill="#e7e5e4" stroke="#a8a29e" strokeWidth="1" />
        {/* corona */}
        <rect x="4" y="15" width="26" height="16" rx="6" fill={c.fill} stroke={c.stroke} strokeWidth={estado === 'Corona' ? 3 : 1.6} />
        {estado === 'Endodoncia' && <path d={superior ? 'M17 4 V28' : 'M17 42 V18'} stroke={c.stroke} strokeWidth="3" strokeLinecap="round" />}
        {estado === 'Restauración' && <rect x="11" y="19" width="12" height="8" rx="3" fill="#2563eb" />}
        {estado === 'Caries' && <circle cx="17" cy="23" r="4" fill="#991b1b" />}
        {extraido && <path d="M6 12 L28 34 M28 12 L6 34" stroke="#dc2626" strokeWidth="3" strokeLinecap="round" />}
      </svg>
      {!superior && <span className="text-[11px] font-semibold text-slate-500">{pieza}</span>}
    </button>
  )
}

export function OdontogramaView({ valor, onMarcar, soloLectura }: {
  valor: OdontogramaT; onMarcar?: (pieza: string, estado: EstadoDiente) => void; soloLectura?: boolean
}) {
  const [tipo, setTipo] = useState<'adulto' | 'niño'>('adulto')
  const [sel, setSel] = useState<number | null>(null)
  const dientes = tipo === 'adulto' ? ADULTO : NINO
  const estadoDe = (p: number): EstadoDiente => valor[String(p)] ?? 'Sano'

  const fila = (lista: number[], superior: boolean) => {
    const mitad = lista.length / 2
    return (
      <div className="flex items-center justify-center gap-0.5">
        {lista.map((p, i) => (
          <div key={p} className={`flex ${i === mitad ? 'ml-3 border-l-2 border-dashed border-slate-300 pl-3' : ''}`}>
            <Diente pieza={p} estado={estadoDe(p)} superior={superior} activo={sel === p} onClick={() => setSel(p)} />
          </div>
        ))}
      </div>
    )
  }

  const resumen = ESTADOS.filter((e) => e !== 'Sano').map((e) => ({ e, n: Object.values(valor).filter((v) => v === e).length })).filter((x) => x.n > 0)

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5 text-sm" role="group" aria-label="Tipo de dentición">
          {(['adulto', 'niño'] as const).map((t) => (
            <button key={t} onClick={() => { setTipo(t); setSel(null) }} className={`rounded-md px-3 py-1 font-medium capitalize ${tipo === t ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
              {t === 'adulto' ? 'Adulto (32)' : 'Niño (20)'}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5 text-xs">
          {ESTADOS.map((e) => <span key={e} className={`rounded-full border px-2 py-0.5 ${COLOR[e].chip}`}>{e}</span>)}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/60 p-4">
        <div className="mx-auto w-fit space-y-3">
          <p className="text-center text-[11px] uppercase tracking-widest text-slate-400">Maxilar superior</p>
          {fila(dientes.sup, true)}
          <div className="border-t border-dashed border-slate-300" />
          {fila(dientes.inf, false)}
          <p className="text-center text-[11px] uppercase tracking-widest text-slate-400">Mandíbula inferior</p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
        {sel === null ? (
          <p className="text-sm text-slate-500">{soloLectura ? 'Selecciona una pieza para ver su estado.' : 'Haz clic en una pieza dental para marcar su estado.'}</p>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-sm"><span className="font-semibold text-slate-900">Pieza {sel}</span> · estado actual: <b>{estadoDe(sel)}</b></div>
            {!soloLectura && (
              <div className="flex flex-wrap gap-1.5">
                {ESTADOS.map((e) => (
                  <button key={e} onClick={() => onMarcar?.(String(sel), e)}
                    className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition hover:shadow ${COLOR[e].chip} ${estadoDe(sel) === e ? 'ring-2 ring-teal-500' : ''}`}>
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {resumen.length > 0 && (
          <p className="mt-3 text-xs text-slate-500">Resumen: {resumen.map((r) => `${r.n} ${r.e.toLowerCase()}`).join(' · ')}</p>
        )}
      </div>
    </div>
  )
}
