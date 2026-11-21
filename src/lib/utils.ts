import type { Cita, Paciente } from '../types'

const pad = (n: number) => String(n).padStart(2, '0')

export const fechaISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const horaHM = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`
export const dateTimeISO = (d: Date) => `${fechaISO(d)}T${horaHM(d)}`

export const parseFecha = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const addDias = (d: Date, n: number) => {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

export const lunesDeSemana = (d: Date) => {
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const dow = r.getDay() === 0 ? 7 : r.getDay()
  return addDias(r, 1 - dow)
}

/** Si cae en domingo, avanza al lunes */
export const diaHabil = (d: Date) => (d.getDay() === 0 ? addDias(d, 1) : d)

export const aMin = (hm: string) => {
  const [h, m] = hm.split(':').map(Number)
  return h * 60 + m
}
export const deMin = (n: number) => `${pad(Math.floor(n / 60))}:${pad(n % 60)}`

export const soles = (n: number) =>
  'S/ ' + n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const fmtFecha = (s: string) =>
  parseFecha(s.slice(0, 10)).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })

export const fmtFechaHora = (s: string) => `${fmtFecha(s)} · ${s.slice(11, 16)}`

export const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export const nombreCompleto = (p?: Paciente) => (p ? `${p.nombres} ${p.apellidos}` : '—')

export const edad = (nac: string) => {
  const n = parseFecha(nac)
  const h = new Date()
  let e = h.getFullYear() - n.getFullYear()
  if (h < new Date(h.getFullYear(), n.getMonth(), n.getDate())) e--
  return e
}

export const ESTADO_COLOR: Record<Cita['estado'], { bg: string; text: string; badge: string }> = {
  Programada: { bg: '#2563eb', text: '#fff', badge: 'bg-blue-100 text-blue-700' },
  'Asistió': { bg: '#16a34a', text: '#fff', badge: 'bg-green-100 text-green-700' },
  'No asistió': { bg: '#ea580c', text: '#fff', badge: 'bg-orange-100 text-orange-700' },
  Cancelada: { bg: '#dc2626', text: '#fff', badge: 'bg-red-100 text-red-700' },
  Perdida: { bg: '#6b7280', text: '#fff', badge: 'bg-slate-200 text-slate-700' },
}

/** Una cita bloquea el horario salvo que esté Cancelada con anticipación */
export const ocupaHorario = (c: Cita) => c.estado !== 'Cancelada'

export const HORAS_ANTICIPACION = 3

export const asistio = (c: Cita) => c.estado === 'Asistió'

export const fmtDiaCorto = (s: string) =>
  parseFecha(s.slice(0, 10)).toLocaleDateString('es-PE', { weekday: 'short', day: '2-digit', month: 'short' })

export const mensajeRecordatorio = (nombre: string, c: Cita, odontologo: string, especialidad: string) =>
  `Hola ${nombre}, te recordamos tu cita el ${fmtDiaCorto(c.inicio)} a las ${c.inicio.slice(11, 16)} con ${odontologo} (${especialidad}). Salud Bucal.`
