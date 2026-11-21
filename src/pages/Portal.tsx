import { useState } from 'react'
import { CalendarClock, CalendarPlus, FileText, XCircle } from 'lucide-react'
import { useStore } from '../store'
import { Alerta, Badge, Btn, Card, PageHeader, Tabla, Td, Th, Vacio } from '../components/ui'
import { CancelarModal, NuevaCitaModal, ReprogramarModal } from '../components/CitaModales'
import { ComprobanteModal, numeroComprobante } from '../components/Comprobante'
import { ItemRecordatorioView, useRecordatorios } from '../components/Recordatorios'
import { ESTADO_COLOR, fmtFecha, fmtFechaHora, soles } from '../lib/utils'
import type { Cita, Pago } from '../types'

export function Portal() {
  const { usuario, pacientes, citas, odontologos, tratamientos, pagos, saldoTratamiento } = useStore()
  const [nueva, setNueva] = useState(false)
  const [reprog, setReprog] = useState<Cita | null>(null)
  const [cancelar, setCancelar] = useState<Cita | null>(null)
  const [recibo, setRecibo] = useState<Pago | null>(null)

  const recs = useRecordatorios(24 * 14)
  const p = pacientes.find((x) => x.id === usuario?.pacienteId)
  if (!p) return <Alerta tipo="warn">Tu usuario no está vinculado a una ficha de paciente.</Alerta>

  const mias = citas.filter((c) => c.pacienteId === p.id).sort((a, b) => a.inicio.localeCompare(b.inicio))
  const proximas = mias.filter((c) => c.estado === 'Programada')
  const historial = mias.filter((c) => c.estado !== 'Programada').reverse()
  const misTrat = tratamientos.filter((t) => t.pacienteId === p.id)
  const misPagos = pagos.filter((x) => x.pacienteId === p.id)
  const deuda = misTrat.reduce((s, t) => s + saldoTratamiento(t.id), 0)
  const od = (id: string) => odontologos.find((o) => o.id === id)?.nombre

  return (
    <>
      <PageHeader titulo={`Hola, ${p.nombres.split(' ')[0]}`} sub="Reserva y gestiona tus citas desde aquí"
        acciones={<Btn onClick={() => setNueva(true)}><CalendarPlus size={16} /> Reservar cita</Btn>} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card titulo={`Próximas citas (${proximas.length})`}>
          {proximas.length === 0 ? <Vacio>No tienes citas programadas. ¡Reserva una!</Vacio> : (
            <ul className="space-y-3">
              {proximas.map((c) => (
                <li key={c.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-slate-900">{fmtFechaHora(c.inicio)}</div>
                      <div className="text-sm text-slate-500">{od(c.odontologoId)} · {c.motivo}</div>
                    </div>
                    <Badge className={ESTADO_COLOR[c.estado].badge}>{c.estado}</Badge>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Btn pequeño variante="sec" onClick={() => setReprog(c)}><CalendarClock size={13} /> Reprogramar</Btn>
                    <Btn pequeño variante="fantasma" className="!text-red-600" onClick={() => setCancelar(c)}><XCircle size={13} /> Cancelar</Btn>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card titulo="Mi estado de cuenta">
          <div className="mb-3 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
            <span className="text-slate-500">Saldo pendiente</span>
            <span className={`text-lg font-bold ${deuda > 0 ? 'text-red-600' : 'text-green-700'}`}>{soles(deuda)}</span>
          </div>
          {misPagos.length === 0 ? <p className="text-sm text-slate-500">Aún no registras pagos.</p> : (
            <ul className="divide-y divide-slate-100 text-sm">
              {misPagos.map((x) => (
                <li key={x.id} className="flex items-center justify-between gap-2 py-2">
                  <span>{x.concepto}<span className="block text-xs text-slate-500">{fmtFecha(x.fecha)} · {x.metodo} · {numeroComprobante(x)}</span></span>
                  <span className="flex items-center gap-2"><b>{soles(x.monto)}</b><Btn pequeño variante="sec" aria-label="Ver comprobante" onClick={() => setRecibo(x)}><FileText size={13} /></Btn></span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card titulo={`Recordatorios de citas (${recs.length})`} className="mt-4">
        {recs.length === 0 ? <Vacio>No tienes recordatorios: no hay citas programadas próximamente.</Vacio> : (
          <ul className="grid gap-3 md:grid-cols-2">{recs.map((r) => <ItemRecordatorioView key={r.cita.id} item={r} />)}</ul>
        )}
      </Card>

      <Card titulo="Historial de citas" className="mt-4">
        {historial.length === 0 ? <Vacio>Sin historial todavía.</Vacio> : (
          <Tabla>
            <thead><tr><Th>Fecha</Th><Th>Odontólogo</Th><Th>Motivo</Th><Th>Estado</Th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {historial.map((c) => (
                <tr key={c.id}><Td>{fmtFechaHora(c.inicio)}</Td><Td>{od(c.odontologoId)}</Td><Td>{c.motivo}</Td><Td><Badge className={ESTADO_COLOR[c.estado].badge}>{c.estado}</Badge></Td></tr>
              ))}
            </tbody>
          </Tabla>
        )}
      </Card>

      {nueva && <NuevaCitaModal pacienteFijo={p.id} onCerrar={() => setNueva(false)} />}
      {reprog && <ReprogramarModal cita={reprog} onCerrar={() => setReprog(null)} />}
      {cancelar && <CancelarModal cita={cancelar} onCerrar={() => setCancelar(null)} />}
      {recibo && <ComprobanteModal pago={recibo} onCerrar={() => setRecibo(null)} />}
    </>
  )
}
