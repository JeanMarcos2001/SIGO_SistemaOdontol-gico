import { useEffect, useRef, useState } from 'react'
import { Bell, BellRing, Check, Send } from 'lucide-react'
import { useStore } from '../store'
import { Badge, Btn } from './ui'
import { dateTimeISO, fmtFechaHora, mensajeRecordatorio, nombreCompleto } from '../lib/utils'
import type { Cita, Odontologo, Paciente, RecordatorioEnviado } from '../types'

export interface ItemRecordatorio {
  cita: Cita
  paciente: Paciente
  odontologo: Odontologo
  mensaje: string
  enviados: RecordatorioEnviado[]
}

/** HU28: recordatorios automáticos de citas programadas en las próximas `horas` */
export function useRecordatorios(horas: number): ItemRecordatorio[] {
  const { usuario, citas, pacientes, odontologos, recordatorios } = useStore()
  const ahora = dateTimeISO(new Date())
  const limite = dateTimeISO(new Date(Date.now() + horas * 36e5))
  return citas
    .filter((c) => c.estado === 'Programada' && c.inicio > ahora && c.inicio <= limite)
    .filter((c) => {
      if (usuario?.rol === 'paciente') return c.pacienteId === usuario.pacienteId
      if (usuario?.rol === 'odontologo') return c.odontologoId === usuario.odontologoId
      return true
    })
    .sort((a, b) => a.inicio.localeCompare(b.inicio))
    .flatMap((cita) => {
      const paciente = pacientes.find((p) => p.id === cita.pacienteId)
      const odontologo = odontologos.find((o) => o.id === cita.odontologoId)
      if (!paciente || !odontologo) return []
      return [{
        cita, paciente, odontologo,
        mensaje: mensajeRecordatorio(paciente.nombres.split(' ')[0], cita, odontologo.nombre, odontologo.especialidad),
        enviados: recordatorios.filter((r) => r.citaId === cita.id),
      }]
    })
}

export function BotonRecordatorio({ citaId, pequeño = true }: { citaId: string; pequeño?: boolean }) {
  const { pacientes, citas, enviarRecordatorio, recordatorios, aviso } = useStore()
  const cita = citas.find((c) => c.id === citaId)
  const pac = pacientes.find((p) => p.id === cita?.pacienteId)
  const previos = recordatorios.filter((r) => r.citaId === citaId).length
  if (!cita || !pac || cita.estado !== 'Programada') return null
  return (
    <Btn pequeño={pequeño} variante="sec" onClick={() => {
      enviarRecordatorio(citaId)
      aviso(`Recordatorio enviado a ${nombreCompleto(pac)} por WhatsApp (${pac.telefono}).`)
    }}>
      <Send size={13} /> {previos > 0 ? 'Reenviar recordatorio' : 'Enviar recordatorio'}
    </Btn>
  )
}

export function ItemRecordatorioView({ item, acciones }: { item: ItemRecordatorio; acciones?: boolean }) {
  const ultimo = item.enviados[item.enviados.length - 1]
  return (
    <li className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-semibold text-slate-900">{fmtFechaHora(item.cita.inicio)}</span>
        <Badge className="bg-sky-100 text-sky-800">Automático</Badge>
      </div>
      <p className="mt-1 text-xs text-slate-500">{nombreCompleto(item.paciente)} · {item.odontologo.nombre}</p>
      <p className="mt-1.5 rounded-md bg-slate-50 px-2.5 py-1.5 text-slate-700">{item.mensaje}</p>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        {ultimo
          ? <span className="flex items-center gap-1 text-xs text-green-700"><Check size={13} /> Enviado {fmtFechaHora(ultimo.enviado)} · {ultimo.canal}</span>
          : <span className="text-xs text-slate-400">Aún no enviado manualmente</span>}
        {acciones && <BotonRecordatorio citaId={item.cita.id} />}
      </div>
    </li>
  )
}

/** Campana de la barra superior */
export function Campana() {
  const { usuario } = useStore()
  const [abierto, setAbierto] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const items = useRecordatorios(usuario?.rol === 'paciente' ? 24 * 7 : 48)
  const gestiona = usuario?.rol === 'admin' || usuario?.rol === 'recepcion'

  useEffect(() => {
    const f = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setAbierto(false)
    document.addEventListener('mousedown', f)
    return () => document.removeEventListener('mousedown', f)
  }, [])

  const Icono = items.length > 0 ? BellRing : Bell
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setAbierto(!abierto)} className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label={`Recordatorios de citas (${items.length})`} aria-expanded={abierto}>
        <Icono size={19} />
        {items.length > 0 && <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{items.length}</span>}
      </button>
      {abierto && (
        <div className="absolute right-0 z-40 mt-2 w-[min(92vw,380px)] rounded-xl border border-slate-200 bg-slate-50 shadow-xl">
          <div className="border-b border-slate-200 bg-white px-4 py-3 rounded-t-xl">
            <div className="font-semibold text-slate-900">Recordatorios de citas</div>
            <div className="text-xs text-slate-500">Próximas {usuario?.rol === 'paciente' ? '7 días' : '48 horas'}</div>
          </div>
          <ul className="max-h-[60vh] space-y-2 overflow-y-auto p-3">
            {items.length === 0 && <li className="px-2 py-6 text-center text-sm text-slate-500">No hay recordatorios pendientes.</li>}
            {items.map((i) => <ItemRecordatorioView key={i.cita.id} item={i} acciones={gestiona} />)}
          </ul>
        </div>
      )}
    </div>
  )
}
