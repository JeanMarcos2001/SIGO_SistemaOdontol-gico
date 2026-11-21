import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type {
  Antecedentes, Atencion, Cita, EstadoDiente, EstadoTratamiento, Horario, Odontograma, Odontologo, Pagina,
  Pago, Paciente, RecordatorioEnviado, Rol, Servicio, Tratamiento, Usuario,
} from './types'
import {
  ATENCIONES, HORARIOS, ODONTOGRAMAS, ODONTOLOGOS, PACIENTES, PAGOS, SERVICIOS, TRATAMIENTOS, USUARIOS, crearCitas,
} from './data/mock'
import { HORAS_ANTICIPACION, aMin, dateTimeISO, deMin, ocupaHorario, parseFecha } from './lib/utils'

export const PERMISOS: Record<Rol, Pagina[]> = {
  admin: ['dashboard', 'pacientes', 'personal', 'citas', 'clinica', 'finanzas', 'admin'],
  recepcion: ['pacientes', 'personal', 'citas'],
  odontologo: ['citas', 'clinica'],
  finanzas: ['finanzas'],
  paciente: ['portal'],
}

export const ROL_LABEL: Record<Rol, string> = {
  admin: 'Administrador',
  recepcion: 'Recepcionista',
  odontologo: 'Odontólogo',
  finanzas: 'Finanzas / Caja',
  paciente: 'Paciente',
}

export interface SlotAgenda { hora: string; estado: 'libre' | 'ocupado' | 'pasado'; cita?: Cita }

interface Toast { id: number; msg: string; tipo: 'ok' | 'error' | 'info' }

export type NuevoPaciente = Omit<Paciente, 'id'>

interface Store {
  // sesión y navegación
  usuario: Usuario | null
  login: (u: Usuario) => void
  logout: () => void
  cambiarUsuario: (id: string) => void
  pagina: Pagina
  irA: (p: Pagina, pacienteId?: string | null) => void
  pacienteCtx: string | null
  // datos
  usuarios: Usuario[]
  pacientes: Paciente[]
  odontologos: Odontologo[]
  horarios: Horario[]
  citas: Cita[]
  atenciones: Atencion[]
  tratamientos: Tratamiento[]
  pagos: Pago[]
  servicios: Servicio[]
  odontogramas: Record<string, Odontograma>
  // acciones
  docExiste: (tipo: string, doc: string, ignorarId?: string) => boolean
  guardarPaciente: (p: NuevoPaciente, id?: string) => Paciente
  guardarAntecedentes: (pacienteId: string, a: Antecedentes) => void
  guardarOdontologo: (o: Omit<Odontologo, 'id'>, id?: string) => void
  agregarHorario: (h: Omit<Horario, 'id'>) => string | null
  quitarHorario: (id: string) => void
  slotsDisponibles: (odontologoId: string, fecha: string, ignorarCitaId?: string) => string[]
  crearCita: (c: Omit<Cita, 'id' | 'estado' | 'duracion'>) => string | null
  reprogramarCita: (id: string, odontologoId: string, fecha: string, hora: string) => string | null
  cancelarCita: (id: string) => 'Cancelada' | 'Perdida'
  registrarAsistencia: (id: string, estado: 'Asistió' | 'No asistió' | 'Programada') => void
  agendaDia: (odontologoId: string, fecha: string, ignorarCitaId?: string) => SlotAgenda[]
  conflictoCita: (odontologoId: string, fecha: string, hora: string, ignorarCitaId?: string) => Cita | undefined
  recordatorios: RecordatorioEnviado[]
  enviarRecordatorio: (citaId: string, canal?: 'WhatsApp' | 'Correo') => void
  guardarAtencion: (a: Omit<Atencion, 'id'>) => void
  agregarTratamiento: (t: Omit<Tratamiento, 'id'>) => void
  cambiarEstadoTratamiento: (id: string, e: EstadoTratamiento) => void
  marcarDiente: (pacienteId: string, pieza: string, estado: EstadoDiente) => void
  saldoTratamiento: (id: string) => number
  registrarPago: (p: Omit<Pago, 'id' | 'serie' | 'correlativo'>) => Pago
  actualizarUsuario: (id: string, cambios: Partial<Usuario>) => void
  guardarServicio: (s: Omit<Servicio, 'id'>, id?: string) => void
  // avisos
  toasts: Toast[]
  aviso: (msg: string, tipo?: Toast['tipo']) => void
}

const Ctx = createContext<Store | null>(null)

export const useStore = () => {
  const s = useContext(Ctx)
  if (!s) throw new Error('useStore fuera de StoreProvider')
  return s
}

let seq = 1000
const nuevoId = (p: string) => `${p}${++seq}`

export const paginaInicial = (rol: Rol): Pagina => PERMISOS[rol][0]

export function StoreProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [pagina, setPagina] = useState<Pagina>('dashboard')
  const [pacienteCtx, setPacienteCtx] = useState<string | null>(null)
  const [usuarios, setUsuarios] = useState(USUARIOS)
  const [pacientes, setPacientes] = useState(PACIENTES)
  const [odontologos, setOdontologos] = useState(ODONTOLOGOS)
  const [horarios, setHorarios] = useState(HORARIOS)
  const [citas, setCitas] = useState(crearCitas)
  const [atenciones, setAtenciones] = useState(ATENCIONES)
  const [tratamientos, setTratamientos] = useState(TRATAMIENTOS)
  const [pagos, setPagos] = useState(PAGOS)
  const [servicios, setServicios] = useState(SERVICIOS)
  const [odontogramas, setOdontogramas] = useState(ODONTOGRAMAS)
  const [recordatorios, setRecordatorios] = useState<RecordatorioEnviado[]>([])
  const [toasts, setToasts] = useState<Toast[]>([])

  const aviso = useCallback((msg: string, tipo: Toast['tipo'] = 'ok') => {
    const id = ++seq
    setToasts((t) => [...t, { id, msg, tipo }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200)
  }, [])

  const login = useCallback((u: Usuario) => {
    setUsuario(u)
    setPagina(paginaInicial(u.rol))
    setPacienteCtx(null)
  }, [])

  const logout = useCallback(() => setUsuario(null), [])

  const cambiarUsuario = useCallback((id: string) => {
    const u = usuarios.find((x) => x.id === id)
    if (u) login(u)
  }, [usuarios, login])

  const irA = useCallback((p: Pagina, pacienteId: string | null = null) => {
    setPagina(p)
    setPacienteCtx(pacienteId)
  }, [])

  const docExiste = useCallback(
    (tipo: string, doc: string, ignorarId?: string) =>
      pacientes.some((p) => p.id !== ignorarId && p.tipoDoc === tipo && p.doc.toLowerCase() === doc.trim().toLowerCase()),
    [pacientes],
  )

  const guardarPaciente = useCallback((data: NuevoPaciente, id?: string) => {
    if (id) {
      const actual = pacientes.find((p) => p.id === id)!
      const upd = { ...actual, ...data, id }
      setPacientes((ps) => ps.map((p) => (p.id === id ? upd : p)))
      return upd
    }
    const nuevo = { ...data, id: nuevoId('p') }
    setPacientes((ps) => [...ps, nuevo])
    return nuevo
  }, [pacientes])

  const guardarAntecedentes = useCallback((pacienteId: string, a: Antecedentes) => {
    setPacientes((ps) => ps.map((p) => (p.id === pacienteId ? { ...p, antecedentes: a } : p)))
  }, [])

  const guardarOdontologo = useCallback((o: Omit<Odontologo, 'id'>, id?: string) => {
    if (id) setOdontologos((os) => os.map((x) => (x.id === id ? { ...x, ...o } : x)))
    else setOdontologos((os) => [...os, { ...o, id: nuevoId('o') }])
  }, [])

  const agregarHorario = useCallback((h: Omit<Horario, 'id'>) => {
    const ini = aMin(h.inicio)
    const fin = aMin(h.fin)
    if (Number.isNaN(ini) || Number.isNaN(fin)) return 'Ingresa una hora de inicio y fin válidas.'
    if (ini >= fin) return 'La hora de inicio debe ser menor a la hora de fin.'
    const choque = horarios.find(
      (x) => x.odontologoId === h.odontologoId && x.dia === h.dia && ini < aMin(x.fin) && aMin(x.inicio) < fin,
    )
    if (choque) return `Conflicto: se cruza con el turno ${choque.inicio}–${choque.fin} ya asignado ese día.`
    setHorarios((hs) => [...hs, { ...h, id: nuevoId('h') }])
    return null
  }, [horarios])

  const quitarHorario = useCallback((id: string) => setHorarios((hs) => hs.filter((h) => h.id !== id)), [])

  const slotsDisponibles = useCallback((odontologoId: string, fecha: string, ignorarCitaId?: string) => {
    const o = odontologos.find((x) => x.id === odontologoId)
    if (!o || !o.activo || !fecha) return []
    const dia = parseFecha(fecha).getDay()
    const ahora = dateTimeISO(new Date())
    const res: string[] = []
    horarios
      .filter((h) => h.odontologoId === odontologoId && h.dia === dia)
      .sort((a, b) => aMin(a.inicio) - aMin(b.inicio))
      .forEach((h) => {
        for (let t = aMin(h.inicio); t + 30 <= aMin(h.fin); t += 30) {
          const hm = deMin(t)
          const inicio = `${fecha}T${hm}`
          const ocupado = citas.some(
            (c) => c.id !== ignorarCitaId && c.odontologoId === odontologoId && c.inicio === inicio && ocupaHorario(c),
          )
          if (!ocupado && inicio > ahora) res.push(hm)
        }
      })
    return res
  }, [odontologos, horarios, citas])

  /** HU26: cita que bloquea ese odontólogo / fecha / bloque horario */
  const conflictoCita = useCallback((odontologoId: string, fecha: string, hora: string, ignorarCitaId?: string) =>
    citas.find((c) => c.id !== ignorarCitaId && c.odontologoId === odontologoId && c.inicio === `${fecha}T${hora}` && ocupaHorario(c)),
  [citas])

  /** Todos los bloques del día del odontólogo, marcando libres / ocupados / pasados */
  const agendaDia = useCallback((odontologoId: string, fecha: string, ignorarCitaId?: string): SlotAgenda[] => {
    const o = odontologos.find((x) => x.id === odontologoId)
    if (!o || !o.activo || !fecha) return []
    const dia = parseFecha(fecha).getDay()
    const ahora = dateTimeISO(new Date())
    const res: SlotAgenda[] = []
    horarios
      .filter((h) => h.odontologoId === odontologoId && h.dia === dia)
      .sort((a, b) => aMin(a.inicio) - aMin(b.inicio))
      .forEach((h) => {
        for (let t = aMin(h.inicio); t + 30 <= aMin(h.fin); t += 30) {
          const hora = deMin(t)
          const cita = conflictoCita(odontologoId, fecha, hora, ignorarCitaId)
          res.push({ hora, cita, estado: cita ? 'ocupado' : `${fecha}T${hora}` <= ahora ? 'pasado' : 'libre' })
        }
      })
    return res
  }, [odontologos, horarios, conflictoCita])

  const crearCita = useCallback((c: Omit<Cita, 'id' | 'estado' | 'duracion'>) => {
    const fecha = c.inicio.slice(0, 10)
    const hm = c.inicio.slice(11, 16)
    if (conflictoCita(c.odontologoId, fecha, hm)) return 'Conflicto de horario: el odontólogo ya tiene una cita en ese bloque.'
    if (!slotsDisponibles(c.odontologoId, fecha).includes(hm)) return 'Ese horario no está disponible. Elige otro bloque.'
    setCitas((cs) => [...cs, { ...c, id: nuevoId('c'), estado: 'Programada', duracion: 30 }])
    return null
  }, [slotsDisponibles, conflictoCita])

  const reprogramarCita = useCallback((id: string, odontologoId: string, fecha: string, hora: string) => {
    if (conflictoCita(odontologoId, fecha, hora, id)) return 'Conflicto de horario: el odontólogo ya tiene una cita en ese bloque.'
    if (!slotsDisponibles(odontologoId, fecha, id).includes(hora)) return 'El odontólogo no tiene disponibilidad en ese horario.'
    setCitas((cs) => cs.map((c) => (c.id === id ? { ...c, odontologoId, inicio: `${fecha}T${hora}`, estado: 'Programada' } : c)))
    return null
  }, [slotsDisponibles, conflictoCita])

  const cancelarCita = useCallback((id: string) => {
    const c = citas.find((x) => x.id === id)!
    const horas = (new Date(c.inicio).getTime() - Date.now()) / 36e5
    const estado = horas >= HORAS_ANTICIPACION ? 'Cancelada' : 'Perdida'
    setCitas((cs) => cs.map((x) => (x.id === id ? { ...x, estado } : x)))
    return estado
  }, [citas])

  /** HU27: asistencia (también permite revertir a Programada) */
  const registrarAsistencia = useCallback((id: string, estado: 'Asistió' | 'No asistió' | 'Programada') => {
    setCitas((cs) => cs.map((c) => (c.id === id ? { ...c, estado } : c)))
  }, [])

  /** HU28: envío manual de recordatorio desde Recepción */
  const enviarRecordatorio = useCallback((citaId: string, canal: 'WhatsApp' | 'Correo' = 'WhatsApp') => {
    setRecordatorios((rs) => [...rs, { id: nuevoId('r'), citaId, enviado: dateTimeISO(new Date()), canal }])
  }, [])

  const guardarAtencion = useCallback((a: Omit<Atencion, 'id'>) => {
    setAtenciones((as) => [...as, { ...a, id: nuevoId('a') }])
  }, [])

  const agregarTratamiento = useCallback((t: Omit<Tratamiento, 'id'>) => {
    setTratamientos((ts) => [...ts, { ...t, id: nuevoId('t') }])
  }, [])

  const cambiarEstadoTratamiento = useCallback((id: string, estado: EstadoTratamiento) => {
    setTratamientos((ts) => ts.map((t) => (t.id === id ? { ...t, estado } : t)))
  }, [])

  const marcarDiente = useCallback((pacienteId: string, pieza: string, estado: EstadoDiente) => {
    setOdontogramas((o) => ({ ...o, [pacienteId]: { ...(o[pacienteId] ?? {}), [pieza]: estado } }))
  }, [])

  const saldoTratamiento = useCallback((id: string) => {
    const t = tratamientos.find((x) => x.id === id)
    if (!t) return 0
    const pagado = pagos.filter((p) => p.tratamientoId === id).reduce((s, p) => s + p.monto, 0)
    return Math.round((t.costo - pagado) * 100) / 100
  }, [tratamientos, pagos])

  const registrarPago = useCallback((p: Omit<Pago, 'id' | 'serie' | 'correlativo'>) => {
    const correlativo = Math.max(0, ...pagos.map((x) => x.correlativo)) + 1
    const nuevo: Pago = { ...p, id: nuevoId('pg'), serie: 'B001', correlativo }
    setPagos((ps) => [...ps, nuevo])
    return nuevo
  }, [pagos])

  const actualizarUsuario = useCallback((id: string, cambios: Partial<Usuario>) => {
    setUsuarios((us) => us.map((u) => (u.id === id ? { ...u, ...cambios } : u)))
  }, [])

  const guardarServicio = useCallback((s: Omit<Servicio, 'id'>, id?: string) => {
    if (id) setServicios((ss) => ss.map((x) => (x.id === id ? { ...x, ...s } : x)))
    else setServicios((ss) => [...ss, { ...s, id: nuevoId('s') }])
  }, [])

  const value: Store = useMemo(() => ({
    usuario, login, logout, cambiarUsuario, pagina, irA, pacienteCtx,
    usuarios, pacientes, odontologos, horarios, citas, atenciones, tratamientos, pagos, servicios, odontogramas,
    docExiste, guardarPaciente, guardarAntecedentes, guardarOdontologo, agregarHorario, quitarHorario,
    slotsDisponibles, crearCita, reprogramarCita, cancelarCita, registrarAsistencia, agendaDia, conflictoCita, recordatorios, enviarRecordatorio, guardarAtencion,
    agregarTratamiento, cambiarEstadoTratamiento, marcarDiente, saldoTratamiento, registrarPago,
    actualizarUsuario, guardarServicio, toasts, aviso,
  }), [
    usuario, login, logout, cambiarUsuario, pagina, irA, pacienteCtx,
    usuarios, pacientes, odontologos, horarios, citas, atenciones, tratamientos, pagos, servicios, odontogramas,
    docExiste, guardarPaciente, guardarAntecedentes, guardarOdontologo, agregarHorario, quitarHorario,
    slotsDisponibles, crearCita, reprogramarCita, cancelarCita, registrarAsistencia, agendaDia, conflictoCita, recordatorios, enviarRecordatorio, guardarAtencion,
    agregarTratamiento, cambiarEstadoTratamiento, marcarDiente, saldoTratamiento, registrarPago,
    actualizarUsuario, guardarServicio, toasts, aviso,
  ])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
