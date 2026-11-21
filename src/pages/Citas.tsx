import { useMemo, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import esLocale from '@fullcalendar/core/locales/es'
import type { DateClickArg } from '@fullcalendar/interaction'
import type { EventClickArg, EventContentArg, EventInput } from '@fullcalendar/core'
import { CalendarClock, CheckCircle2, FileHeart, Plus, RotateCcw, UserCheck, UserX, X, XCircle } from 'lucide-react'
import { useStore } from '../store'
import { Badge, Btn, Card, Modal, PageHeader, inputCls } from '../components/ui'
import { CancelarModal, NuevaCitaModal, ReprogramarModal } from '../components/CitaModales'
import { BotonRecordatorio } from '../components/Recordatorios'
import { ESTADO_COLOR, addDias, aMin, deMin, fechaISO, fmtFechaHora, nombreCompleto } from '../lib/utils'
import type { Cita, Especialidad } from '../types'

const ESPECIALIDADES: Especialidad[] = ['Odontología General', 'Ortodoncia', 'Endodoncia', 'Odontopediatría']
const corto = (n: string) => n.replace(/^(Dra?\.)\s+\S+\s+(.*)$/, '$1 $2')

export function Citas() {
  const { citas, pacientes, odontologos, usuario, pacienteCtx, irA } = useStore()
  const esOdontologo = usuario?.rol === 'odontologo'
  const puedeAgendar = usuario?.rol === 'admin' || usuario?.rol === 'recepcion'

  const [fOd, setFOd] = useState(esOdontologo ? usuario!.odontologoId! : '')
  const [fEsp, setFEsp] = useState('')
  const [fPac, setFPac] = useState(pacienteCtx ?? '')
  const [nueva, setNueva] = useState<{ fecha?: string; hora?: string } | null>(null)
  const [detalleId, setDetalleId] = useState<string | null>(null)
  const [reprog, setReprog] = useState<Cita | null>(null)
  const [cancelar, setCancelar] = useState<Cita | null>(null)

  const pasa = (c: Cita) =>
    (!fOd || c.odontologoId === fOd) && (!fPac || c.pacienteId === fPac)
    && (!fEsp || odontologos.find((o) => o.id === c.odontologoId)?.especialidad === fEsp)

  const eventos: EventInput[] = useMemo(() => citas.filter(pasa).map((c) => {
    const p = pacientes.find((x) => x.id === c.pacienteId)
    const o = odontologos.find((x) => x.id === c.odontologoId)
    const col = ESTADO_COLOR[c.estado]
    return {
      id: c.id,
      title: nombreCompleto(p),
      start: c.inicio,
      end: `${c.inicio.slice(0, 10)}T${deMin(aMin(c.inicio.slice(11, 16)) + c.duracion)}`,
      backgroundColor: col.bg, borderColor: col.bg, textColor: col.text,
      extendedProps: { paciente: nombreCompleto(p), odontologo: corto(o?.nombre ?? ''), estado: c.estado },
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [citas, pacientes, odontologos, fOd, fEsp, fPac])

  const detalle = citas.find((c) => c.id === detalleId) ?? null
  const hoyISO = fechaISO(new Date())
  const maniana = fechaISO(addDias(new Date(), 1))
  const delDia = (f: string) => citas.filter((c) => c.inicio.slice(0, 10) === f && pasa(c)).sort((a, b) => a.inicio.localeCompare(b.inicio))
  const hoy = delDia(hoyISO)
  const man = delDia(maniana)

  const alClickFecha = (a: DateClickArg) => {
    if (!puedeAgendar) return
    setNueva({ fecha: a.dateStr.slice(0, 10), hora: a.dateStr.length > 10 ? a.dateStr.slice(11, 16) : undefined })
  }

  const contenido = (arg: EventContentArg) => {
    const { paciente, odontologo } = arg.event.extendedProps as { paciente: string; odontologo: string }
    if (arg.view.type === 'dayGridMonth') {
      return <div className="truncate px-1 text-[11px]"><b>{arg.timeText}</b> {paciente} · {odontologo}</div>
    }
    return (
      <div className="overflow-hidden px-1 leading-tight">
        <div className="text-[10px] opacity-90">{arg.timeText}</div>
        <div className="truncate text-[12px] font-semibold">{paciente}</div>
        <div className="truncate text-[11px] opacity-95">{odontologo}</div>
      </div>
    )
  }

  return (
    <>
      <PageHeader
        titulo={esOdontologo ? 'Mi agenda' : 'Agenda de citas'}
        sub={esOdontologo ? `Citas de ${usuario!.nombre}` : 'Calendario interactivo: cada bloque muestra paciente y odontólogo'}
        acciones={puedeAgendar && <Btn onClick={() => setNueva({})}><Plus size={16} /> Agendar cita</Btn>}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select className={`${inputCls()} !w-auto`} value={fOd} disabled={esOdontologo} onChange={(e) => setFOd(e.target.value)} aria-label="Filtrar por odontólogo">
          <option value="">Todos los odontólogos</option>
          {odontologos.map((o) => <option key={o.id} value={o.id}>{o.nombre}</option>)}
        </select>
        <select className={`${inputCls()} !w-auto`} value={fEsp} onChange={(e) => setFEsp(e.target.value)} aria-label="Filtrar por especialidad">
          <option value="">Todas las especialidades</option>
          {ESPECIALIDADES.map((s) => <option key={s}>{s}</option>)}
        </select>
        {fPac && (
          <button onClick={() => setFPac('')} className="flex items-center gap-1.5 rounded-full bg-teal-100 px-3 py-1 text-xs font-medium text-teal-800">
            Paciente: {nombreCompleto(pacientes.find((p) => p.id === fPac))} <X size={12} />
          </button>
        )}
        <div className="ml-auto flex flex-wrap gap-3 text-xs text-slate-600">
          {(Object.keys(ESTADO_COLOR) as Cita['estado'][]).map((e) => (
            <span key={e} className="flex items-center gap-1.5"><span className="h-3 w-3 rounded" style={{ background: ESTADO_COLOR[e].bg }} />{e}</span>
          ))}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_350px]">
        <Card className="min-w-0">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            locale={esLocale}
            initialView={esOdontologo ? 'timeGridDay' : 'timeGridWeek'}
            headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
            buttonText={{ today: 'Hoy', month: 'Mes', week: 'Semana', day: 'Día' }}
            events={eventos}
            eventContent={contenido}
            height="auto"
            slotMinTime="08:00:00"
            slotMaxTime="20:00:00"
            slotDuration="00:30:00"
            hiddenDays={[0]}
            nowIndicator
            allDaySlot={false}
            dayMaxEvents={4}
            eventClick={(a: EventClickArg) => setDetalleId(a.event.id)}
            dateClick={alClickFecha}
            eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
            slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
          />
          {puedeAgendar && <p className="mt-2 text-xs text-slate-500">Tip: haz clic en un bloque del calendario para agendar; si el horario está ocupado verás la alerta de conflicto.</p>}
        </Card>

        <div className="space-y-4">
          <ListaDia titulo="Hoy" citas={hoy} esHoy onAbrir={setDetalleId} />
          <ListaDia titulo="Mañana" citas={man} onAbrir={setDetalleId} />
        </div>
      </div>

      {nueva && <NuevaCitaModal fecha={nueva.fecha} hora={nueva.hora} odontologoId={fOd || undefined} especialidad={(fEsp as Especialidad) || undefined} onCerrar={() => setNueva(null)} />}
      {reprog && <ReprogramarModal cita={reprog} onCerrar={() => setReprog(null)} />}
      {cancelar && <CancelarModal cita={cancelar} onCerrar={() => setCancelar(null)} />}
      {detalle && !reprog && !cancelar && (
        <DetalleCita cita={detalle} onCerrar={() => setDetalleId(null)} onReprog={() => setReprog(detalle)} onCancelar={() => setCancelar(detalle)}
          onAtencion={() => { setDetalleId(null); irA('clinica', detalle.pacienteId) }} />
      )}
    </>
  )
}

/** HU27: acciones rápidas de asistencia (solo Recepción / Administración) */
function AsistenciaBotones({ cita }: { cita: Cita }) {
  const { registrarAsistencia, pacientes, aviso } = useStore()
  const p = pacientes.find((x) => x.id === cita.pacienteId)
  const puede = (cita.estado === 'Programada' || cita.estado === 'Asistió' || cita.estado === 'No asistió') && cita.inicio.slice(0, 10) <= fechaISO(new Date())
  if (!puede) return null
  const marcar = (e: 'Asistió' | 'No asistió') => {
    registrarAsistencia(cita.id, e)
    aviso(`${nombreCompleto(p)}: ${e === 'Asistió' ? 'asistió a su cita' : 'no asistió a su cita'}.`, e === 'Asistió' ? 'ok' : 'info')
  }
  return (
    <>
      <Btn pequeño variante={cita.estado === 'Asistió' ? 'primario' : 'sec'} onClick={() => marcar('Asistió')}><UserCheck size={13} /> Asistió</Btn>
      <Btn pequeño variante={cita.estado === 'No asistió' ? 'peligro' : 'sec'} onClick={() => marcar('No asistió')}><UserX size={13} /> No asistió</Btn>
    </>
  )
}

function ListaDia({ titulo, citas, esHoy, onAbrir }: { titulo: string; citas: Cita[]; esHoy?: boolean; onAbrir: (id: string) => void }) {
  const { pacientes, odontologos, usuario } = useStore()
  const gestiona = usuario?.rol === 'admin' || usuario?.rol === 'recepcion'
  const cuenta = (e: Cita['estado']) => citas.filter((c) => c.estado === e).length

  return (
    <Card titulo={`${titulo} (${citas.length})`} className="h-fit">
      {esHoy && citas.length > 0 && (
        <p className="mb-3 text-xs text-slate-500">
          <b className="text-green-700">{cuenta('Asistió')}</b> asistieron · <b className="text-orange-600">{cuenta('No asistió')}</b> no asistieron · <b className="text-blue-700">{cuenta('Programada')}</b> pendientes
        </p>
      )}
      {citas.length === 0 ? <p className="text-sm text-slate-500">No hay citas para {titulo.toLowerCase()}.</p> : (
        <ul className="space-y-2">
          {citas.map((c) => (
            <li key={c.id} className="rounded-lg border border-slate-200 p-2.5">
              <button onClick={() => onAbrir(c.id)} className="flex w-full items-start justify-between gap-2 text-left text-sm">
                <span>
                  <span className="font-semibold text-slate-900">{c.inicio.slice(11, 16)}</span> · {nombreCompleto(pacientes.find((p) => p.id === c.pacienteId))}
                  <span className="block text-xs text-slate-500">{odontologos.find((o) => o.id === c.odontologoId)?.nombre}</span>
                </span>
                <Badge className={ESTADO_COLOR[c.estado].badge}>{c.estado}</Badge>
              </button>
              {gestiona && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <AsistenciaBotones cita={c} />
                  <BotonRecordatorio citaId={c.id} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function DetalleCita({ cita, onCerrar, onReprog, onCancelar, onAtencion }: {
  cita: Cita; onCerrar: () => void; onReprog: () => void; onCancelar: () => void; onAtencion: () => void
}) {
  const { pacientes, odontologos, usuario, registrarAsistencia, aviso } = useStore()
  const p = pacientes.find((x) => x.id === cita.pacienteId)
  const o = odontologos.find((x) => x.id === cita.odontologoId)
  const gestiona = usuario?.rol === 'admin' || usuario?.rol === 'recepcion'
  const clinico = usuario?.rol === 'odontologo' || usuario?.rol === 'admin'
  const programada = cita.estado === 'Programada'
  const registrada = cita.estado === 'Asistió' || cita.estado === 'No asistió'

  return (
    <Modal abierto onCerrar={onCerrar} titulo="Detalle de la cita" ancho="max-w-lg"
      pie={<>
        {gestiona && <AsistenciaBotones cita={cita} />}
        {gestiona && registrada && <Btn pequeño variante="fantasma" onClick={() => { registrarAsistencia(cita.id, 'Programada'); aviso('Cita devuelta a «Programada».', 'info') }}><RotateCcw size={13} /> Revertir a programada</Btn>}
        {programada && gestiona && <BotonRecordatorio citaId={cita.id} pequeño={false} />}
        {programada && gestiona && <Btn variante="sec" onClick={onReprog}><CalendarClock size={15} /> Reprogramar</Btn>}
        {programada && gestiona && <Btn variante="peligro" onClick={onCancelar}><XCircle size={15} /> Cancelar cita</Btn>}
        {programada && !gestiona && clinico && <Btn variante="sec" onClick={() => { registrarAsistencia(cita.id, 'Asistió'); aviso('Cita marcada: el paciente asistió.') }}><CheckCircle2 size={15} /> Marcar asistió</Btn>}
        {cita.estado === 'Asistió' && clinico && <Btn onClick={onAtencion}><FileHeart size={15} /> Registrar atención clínica</Btn>}
      </>}>
      <dl className="space-y-2.5 text-sm">
        <Fila k="Paciente" v={`${nombreCompleto(p)} (${p?.tipoDoc} ${p?.doc})`} />
        <Fila k="Odontólogo" v={`${o?.nombre} — ${o?.especialidad}`} />
        <Fila k="Fecha y hora" v={`${fmtFechaHora(cita.inicio)} (${cita.duracion} min)`} />
        <Fila k="Motivo" v={cita.motivo} />
        <div className="flex justify-between"><dt className="text-slate-500">Estado</dt><dd><Badge className={ESTADO_COLOR[cita.estado].badge}>{cita.estado}</Badge></dd></div>
      </dl>
    </Modal>
  )
}

const Fila = ({ k, v }: { k: string; v: string }) => (
  <div className="flex justify-between gap-4"><dt className="text-slate-500">{k}</dt><dd className="text-right font-medium text-slate-900">{v}</dd></div>
)
