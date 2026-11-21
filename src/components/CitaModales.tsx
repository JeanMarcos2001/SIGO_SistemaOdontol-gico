import { useState } from 'react'
import { Clock, Info, Lock, TriangleAlert } from 'lucide-react'
import { useStore, type SlotAgenda } from '../store'
import { Alerta, Btn, Campo, Modal, PacienteSelect, inputCls } from './ui'
import { HORAS_ANTICIPACION, fechaISO, fmtFecha, fmtFechaHora, nombreCompleto } from '../lib/utils'
import type { Cita, Especialidad } from '../types'

const ESPECIALIDADES: Especialidad[] = ['Odontología General', 'Ortodoncia', 'Endodoncia', 'Odontopediatría']

/** Muestra TODOS los bloques del día: libres, ocupados (conflicto) y pasados */
function SlotPicker({ agenda, valor, onChange, vacioMsg }: { agenda: SlotAgenda[]; valor: string; onChange: (h: string) => void; vacioMsg: string }) {
  if (agenda.length === 0) return <Alerta tipo="warn">{vacioMsg}</Alerta>
  return (
    <div>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Bloques horarios">
        {agenda.map((s) => {
          const sel = valor === s.hora
          const base = 'inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-medium transition'
          const estilo =
            s.estado === 'pasado' ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
              : s.estado === 'ocupado'
                ? sel ? 'border-red-600 bg-red-600 text-white' : 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100'
                : sel ? 'border-teal-600 bg-teal-600 text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-teal-400 hover:bg-teal-50'
          return (
            <button key={s.hora} type="button" role="radio" aria-checked={sel} disabled={s.estado === 'pasado'}
              title={s.estado === 'ocupado' ? 'Horario ocupado' : s.estado === 'pasado' ? 'Horario pasado' : 'Disponible'}
              onClick={() => onChange(s.hora)} className={`${base} ${estilo}`}>
              {s.estado === 'ocupado' && <Lock size={12} />}{s.hora}
            </button>
          )
        })}
      </div>
      <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded border border-slate-300 bg-white" /> Disponible</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded border border-red-300 bg-red-100" /> Ocupado</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-slate-200" /> Pasado</span>
      </div>
    </div>
  )
}

function AlertaConflicto({ odontologo, fecha, hora, cita, ocultarPaciente }: { odontologo: string; fecha: string; hora: string; cita: Cita; ocultarPaciente: boolean }) {
  const { pacientes } = useStore()
  const p = pacientes.find((x) => x.id === cita.pacienteId)
  return (
    <Alerta tipo="error">
      <div className="flex gap-2">
        <TriangleAlert size={18} className="mt-0.5 shrink-0" />
        <div>
          <b>Conflicto de horario.</b> {odontologo} ya tiene una cita registrada el {fmtFecha(fecha)} a las {hora}
          {ocultarPaciente ? '' : ` con ${nombreCompleto(p)}`}. Elige otro bloque horario para poder guardar.
        </div>
      </div>
    </Alerta>
  )
}

export function NuevaCitaModal({ onCerrar, pacienteFijo, fecha, hora: horaInicial, odontologoId, especialidad }: {
  onCerrar: () => void; pacienteFijo?: string; fecha?: string; hora?: string; odontologoId?: string; especialidad?: Especialidad
}) {
  const { odontologos, agendaDia, conflictoCita, crearCita, aviso } = useStore()
  const [pacienteId, setPacienteId] = useState(pacienteFijo ?? '')
  const inicialOd = odontologos.find((o) => o.id === odontologoId)
  const [esp, setEsp] = useState<Especialidad | ''>(especialidad ?? inicialOd?.especialidad ?? '')
  const [odId, setOdId] = useState(odontologoId ?? '')
  const [dia, setDia] = useState(fecha && fecha >= fechaISO(new Date()) ? fecha : fechaISO(new Date()))
  const [hora, setHora] = useState(horaInicial && horaInicial !== '00:00' ? horaInicial : '')
  const [motivo, setMotivo] = useState('')
  const [intento, setIntento] = useState(false)
  const [error, setError] = useState('')

  const dentistas = odontologos.filter((o) => o.activo && (!esp || o.especialidad === esp))
  const agenda = odId ? agendaDia(odId, dia) : []
  const od = odontologos.find((o) => o.id === odId)
  const conflicto = odId && hora ? conflictoCita(odId, dia, hora) : undefined
  const fueraDeJornada = !!(odId && hora && !agenda.some((s) => s.hora === hora))

  const guardar = () => {
    setIntento(true)
    if (!pacienteId || !esp || !odId || !dia || !hora || !motivo.trim() || conflicto || fueraDeJornada) return
    const r = crearCita({ pacienteId, odontologoId: odId, inicio: `${dia}T${hora}`, motivo: motivo.trim() })
    if (r) { setError(r); setHora(''); return }
    aviso('Cita agendada correctamente.')
    onCerrar()
  }
  const falta = (c: boolean) => (intento && c ? 'Campo obligatorio.' : undefined)

  return (
    <Modal abierto onCerrar={onCerrar} titulo="Agendar cita" ancho="max-w-2xl"
      pie={<><Btn variante="sec" onClick={onCerrar}>Cancelar</Btn><Btn onClick={guardar} disabled={!!conflicto || fueraDeJornada}>Confirmar cita</Btn></>}>
      <div className="space-y-4">
        {error && <Alerta>{error}</Alerta>}
        <Campo label="Paciente *" error={falta(!pacienteId)}>
          <PacienteSelect value={pacienteId} onChange={setPacienteId} disabled={!!pacienteFijo} error={falta(!pacienteId)} />
        </Campo>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo label="Especialidad *" error={falta(!esp)}>
            <select className={inputCls(falta(!esp))} value={esp} onChange={(e) => { setEsp(e.target.value as Especialidad); setOdId(''); setHora('') }}>
              <option value="">Selecciona…</option>
              {ESPECIALIDADES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Campo>
          <Campo label="Odontólogo *" error={falta(!odId)}>
            <select className={inputCls(falta(!odId))} value={odId} onChange={(e) => { setOdId(e.target.value); setHora('') }}>
              <option value="">Selecciona…</option>
              {dentistas.map((o) => <option key={o.id} value={o.id}>{o.nombre} — {o.especialidad}</option>)}
            </select>
          </Campo>
        </div>
        <Campo label="Fecha *">
          <input type="date" className={inputCls()} min={fechaISO(new Date())} value={dia} onChange={(e) => { setDia(e.target.value); setHora('') }} />
        </Campo>
        <div>
          <div className="mb-1 flex items-center gap-1.5 text-sm font-medium text-slate-700"><Clock size={14} /> Bloque horario *</div>
          {!odId ? <p className="text-sm text-slate-500">Selecciona un odontólogo para ver su agenda.</p> : (
            <SlotPicker agenda={agenda} valor={hora} onChange={setHora} vacioMsg="El odontólogo no atiende ese día. Prueba con otra fecha." />
          )}
          {intento && odId && !hora && agenda.length > 0 && <p className="mt-1 text-xs font-medium text-red-600">Elige un horario.</p>}
        </div>
        {conflicto && od && <AlertaConflicto odontologo={od.nombre} fecha={dia} hora={hora} cita={conflicto} ocultarPaciente={!!pacienteFijo} />}
        {fueraDeJornada && <Alerta tipo="warn">El horario {hora} está fuera de la jornada de {od?.nombre} para ese día. Elige un bloque de la lista.</Alerta>}
        <Campo label="Motivo de la consulta *" error={falta(!motivo.trim())}>
          <input className={inputCls(falta(!motivo.trim()))} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ej. Dolor en muela, limpieza, control…" />
        </Campo>
      </div>
    </Modal>
  )
}

export function ReprogramarModal({ cita, onCerrar }: { cita: Cita; onCerrar: () => void }) {
  const { odontologos, agendaDia, conflictoCita, reprogramarCita, usuario, aviso } = useStore()
  const od = odontologos.find((o) => o.id === cita.odontologoId)!
  const [dia, setDia] = useState(cita.inicio.slice(0, 10) >= fechaISO(new Date()) ? cita.inicio.slice(0, 10) : fechaISO(new Date()))
  const [hora, setHora] = useState('')
  const [error, setError] = useState('')
  const agenda = agendaDia(od.id, dia, cita.id)
  const conflicto = hora ? conflictoCita(od.id, dia, hora, cita.id) : undefined

  const guardar = () => {
    if (!hora) return setError('Selecciona un nuevo bloque horario.')
    if (conflicto) return
    const r = reprogramarCita(cita.id, od.id, dia, hora)
    if (r) return setError(r)
    aviso('Cita reprogramada. El horario anterior quedó libre.')
    onCerrar()
  }

  return (
    <Modal abierto onCerrar={onCerrar} titulo="Reprogramar cita" ancho="max-w-xl"
      pie={<><Btn variante="sec" onClick={onCerrar}>Cancelar</Btn><Btn onClick={guardar} disabled={!!conflicto}>Guardar nueva fecha</Btn></>}>
      <div className="space-y-4">
        <Alerta tipo="info">Cita actual: <b>{fmtFechaHora(cita.inicio)}</b> con {od.nombre}</Alerta>
        {error && <Alerta>{error}</Alerta>}
        <Campo label="Nueva fecha">
          <input type="date" className={inputCls()} min={fechaISO(new Date())} value={dia} onChange={(e) => { setDia(e.target.value); setHora(''); setError('') }} />
        </Campo>
        <div>
          <div className="mb-1 text-sm font-medium text-slate-700">Agenda de {od.nombre}</div>
          <SlotPicker agenda={agenda} valor={hora} onChange={(h) => { setHora(h); setError('') }} vacioMsg="Sin atención en esa fecha. Elige otro día." />
        </div>
        {conflicto && <AlertaConflicto odontologo={od.nombre} fecha={dia} hora={hora} cita={conflicto} ocultarPaciente={usuario?.rol === 'paciente'} />}
      </div>
    </Modal>
  )
}

export function CancelarModal({ cita, onCerrar }: { cita: Cita; onCerrar: () => void }) {
  const { cancelarCita, aviso } = useStore()
  const horas = (new Date(cita.inicio).getTime() - Date.now()) / 36e5
  const aTiempo = horas >= HORAS_ANTICIPACION

  const confirmar = () => {
    const r = cancelarCita(cita.id)
    if (r === 'Cancelada') aviso('Cita cancelada. El horario fue liberado.')
    else aviso('Fuera del plazo: la cita se registró como Perdida y el horario no se libera.', 'info')
    onCerrar()
  }

  return (
    <Modal abierto onCerrar={onCerrar} titulo="Cancelar cita" ancho="max-w-lg"
      pie={<><Btn variante="sec" onClick={onCerrar}>Volver</Btn><Btn variante="peligro" onClick={confirmar}>{aTiempo ? 'Cancelar cita' : 'Marcar como perdida'}</Btn></>}>
      <div className="space-y-3">
        <p className="text-sm">Cita del <b>{fmtFechaHora(cita.inicio)}</b>.</p>
        <div className="flex gap-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
          <Info size={16} className="mt-0.5 shrink-0 text-sky-600" />
          <span><b>Regla de negocio:</b> solo se puede cancelar con al menos {HORAS_ANTICIPACION} horas de anticipación. Si se cancela después, la cita pasa a estado «Perdida» y el horario no se libera.</span>
        </div>
        {aTiempo
          ? <Alerta tipo="ok">Faltan {horas.toFixed(1)} h: la cancelación es válida y se liberará el horario.</Alerta>
          : <Alerta tipo="warn">{horas > 0 ? `Faltan ${horas.toFixed(1)} h` : 'La hora de la cita ya pasó'}: no cumple el plazo. La cita quedará como <b>Perdida</b>.</Alerta>}
      </div>
    </Modal>
  )
}
