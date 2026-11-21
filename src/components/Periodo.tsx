import { fechaISO, addDias, fmtFecha, parseFecha } from '../lib/utils'
import { Campo, inputCls } from './ui'

export type Preset = 'hoy' | '7d' | 'mes' | 'trimestre' | 'custom'

export interface Periodo { preset: Preset; desde: string; hasta: string }

const PRESETS: { id: Preset; label: string }[] = [
  { id: 'hoy', label: 'Hoy' },
  { id: '7d', label: 'Últimos 7 días' },
  { id: 'mes', label: 'Este mes' },
  { id: 'trimestre', label: 'Este trimestre' },
  { id: 'custom', label: 'Personalizado' },
]

export function periodoDe(preset: Preset, previo?: Periodo): Periodo {
  const hoy = new Date()
  const h = fechaISO(hoy)
  switch (preset) {
    case 'hoy': return { preset, desde: h, hasta: h }
    case '7d': return { preset, desde: fechaISO(addDias(hoy, -6)), hasta: h }
    case 'mes': return { preset, desde: fechaISO(new Date(hoy.getFullYear(), hoy.getMonth(), 1)), hasta: h }
    case 'trimestre': return { preset, desde: fechaISO(new Date(hoy.getFullYear(), Math.floor(hoy.getMonth() / 3) * 3, 1)), hasta: h }
    default: return { preset, desde: previo?.desde ?? h, hasta: previo?.hasta ?? h }
  }
}

export const enPeriodo = (fecha: string, p: Periodo) => {
  const f = fecha.slice(0, 10)
  return f >= p.desde && f <= p.hasta
}

export const etiquetaPeriodo = (p: Periodo) =>
  p.desde === p.hasta ? fmtFecha(p.desde) : `${fmtFecha(p.desde)} — ${fmtFecha(p.hasta)}`

export interface Cubeta { clave: string; etiqueta: string; desde: string; hasta: string }

/** Divide el periodo en días (≤31 d), semanas (≤120 d) o meses, para los gráficos de tendencia */
export function cubetas(p: Periodo): Cubeta[] {
  const ini = parseFecha(p.desde)
  const fin = parseFecha(p.hasta)
  const dias = Math.round((fin.getTime() - ini.getTime()) / 864e5) + 1
  const res: Cubeta[] = []
  const fmt = (d: Date) => d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' })
  if (dias <= 31) {
    for (let d = ini; d <= fin; d = addDias(d, 1)) res.push({ clave: fechaISO(d), etiqueta: fmt(d), desde: fechaISO(d), hasta: fechaISO(d) })
  } else if (dias <= 120) {
    for (let d = ini; d <= fin; d = addDias(d, 7)) {
      const h = addDias(d, 6) > fin ? fin : addDias(d, 6)
      res.push({ clave: fechaISO(d), etiqueta: `${fmt(d)}`, desde: fechaISO(d), hasta: fechaISO(h) })
    }
  } else {
    for (let d = new Date(ini.getFullYear(), ini.getMonth(), 1); d <= fin; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
      const h = new Date(d.getFullYear(), d.getMonth() + 1, 0)
      const e = d.toLocaleDateString('es-PE', { month: 'short', year: '2-digit' }).replace('.', '')
      res.push({ clave: fechaISO(d), etiqueta: e, desde: fechaISO(d) < p.desde ? p.desde : fechaISO(d), hasta: fechaISO(h) > p.hasta ? p.hasta : fechaISO(h) })
    }
  }
  return res
}

export function FiltroPeriodo({ valor, onCambio }: { valor: Periodo; onCambio: (p: Periodo) => void }) {
  const invalido = valor.desde > valor.hasta
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="inline-flex flex-wrap rounded-lg border border-slate-300 bg-white p-0.5 text-sm" role="group" aria-label="Periodo del reporte">
        {PRESETS.map((o) => (
          <button key={o.id} type="button" aria-pressed={valor.preset === o.id} onClick={() => onCambio(periodoDe(o.id, valor))}
            className={`rounded-md px-3 py-1.5 font-medium transition ${valor.preset === o.id ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
            {o.label}
          </button>
        ))}
      </div>
      {valor.preset === 'custom' && (
        <>
          <Campo label="Desde"><input type="date" className={inputCls(invalido ? 'x' : undefined)} value={valor.desde} onChange={(e) => onCambio({ ...valor, desde: e.target.value })} /></Campo>
          <Campo label="Hasta"><input type="date" className={inputCls(invalido ? 'x' : undefined)} value={valor.hasta} onChange={(e) => onCambio({ ...valor, hasta: e.target.value })} /></Campo>
        </>
      )}
      <span className="pb-2 text-sm text-slate-500">{invalido ? <b className="text-red-600">La fecha inicial es posterior a la final.</b> : etiquetaPeriodo(valor)}</span>
    </div>
  )
}
