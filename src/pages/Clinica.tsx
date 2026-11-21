import { useState } from 'react'
import { Pencil, Pill, Plus, Stethoscope } from 'lucide-react'
import { useStore } from '../store'
import { Alerta, Badge, Btn, Campo, Card, Modal, PacienteSelect, PageHeader, Tabla, Tabs, Td, Th, Vacio, inputCls } from '../components/ui'
import { OdontogramaView } from '../components/Odontograma'
import { CIE10 } from '../data/mock'
import { edad, fechaISO, fmtFecha, fmtFechaHora, nombreCompleto, soles } from '../lib/utils'
import type { Antecedentes, EstadoTratamiento } from '../types'

type Tab = 'historial' | 'atencion' | 'odontograma' | 'tratamientos'

export function Clinica() {
  const { pacientes, pacienteCtx } = useStore()
  const [pacienteId, setPacienteId] = useState(pacienteCtx ?? pacientes[0]?.id ?? '')
  const [tab, setTab] = useState<Tab>('historial')
  const p = pacientes.find((x) => x.id === pacienteId)

  return (
    <>
      <PageHeader titulo="Gestión clínica" sub="Historial, atenciones, odontograma y plan de tratamientos" />
      <Card className="mb-4">
        <div className="flex flex-wrap items-end gap-4">
          <Campo label="Paciente" className="w-full max-w-md"><PacienteSelect value={pacienteId} onChange={setPacienteId} /></Campo>
          {p && (
            <div className="text-sm text-slate-600">
              <div className="font-semibold text-slate-900">{nombreCompleto(p)}</div>
              {p.tipoDoc} {p.doc} · {edad(p.nacimiento)} años
            </div>
          )}
        </div>
        {p && p.antecedentes.alergias.toLowerCase().startsWith('ning') === false && (
          <div className="mt-3"><Alerta tipo="warn"><b>Alergias:</b> {p.antecedentes.alergias}</Alerta></div>
        )}
      </Card>

      {!p ? <Vacio>Selecciona un paciente para ver su información clínica.</Vacio> : (
        <>
          <Tabs valor={tab} onCambio={setTab} opciones={[
            { id: 'historial', label: 'Historial clínico' }, { id: 'atencion', label: 'Registrar atención' },
            { id: 'odontograma', label: 'Odontograma' }, { id: 'tratamientos', label: 'Plan de tratamientos' },
          ]} />
          {tab === 'historial' && <Historial pacienteId={p.id} />}
          {tab === 'atencion' && <RegistroAtencion pacienteId={p.id} alGuardar={() => setTab('historial')} />}
          {tab === 'odontograma' && <OdontogramaTab pacienteId={p.id} />}
          {tab === 'tratamientos' && <Tratamientos pacienteId={p.id} />}
        </>
      )}
    </>
  )
}

function Historial({ pacienteId }: { pacienteId: string }) {
  const { pacientes, atenciones, odontologos, guardarAntecedentes, aviso } = useStore()
  const p = pacientes.find((x) => x.id === pacienteId)!
  const [edit, setEdit] = useState(false)
  const [a, setA] = useState<Antecedentes>(p.antecedentes)
  const lista = atenciones.filter((x) => x.pacienteId === pacienteId).sort((x, y) => y.fecha.localeCompare(x.fecha))

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <Card titulo="Antecedentes médicos" acciones={!edit && <Btn pequeño variante="sec" onClick={() => { setA(p.antecedentes); setEdit(true) }}><Pencil size={13} /> Editar</Btn>} className="h-fit">
        {edit ? (
          <div className="space-y-3">
            <Campo label="Alergias"><input className={inputCls()} value={a.alergias} onChange={(e) => setA({ ...a, alergias: e.target.value })} /></Campo>
            <Campo label="Enfermedades previas"><input className={inputCls()} value={a.enfermedades} onChange={(e) => setA({ ...a, enfermedades: e.target.value })} /></Campo>
            <Campo label="Medicación actual"><input className={inputCls()} value={a.medicacion} onChange={(e) => setA({ ...a, medicacion: e.target.value })} /></Campo>
            <div className="flex justify-end gap-2">
              <Btn pequeño variante="sec" onClick={() => setEdit(false)}>Cancelar</Btn>
              <Btn pequeño onClick={() => { guardarAntecedentes(pacienteId, a); setEdit(false); aviso('Antecedentes actualizados.') }}>Guardar</Btn>
            </div>
          </div>
        ) : (
          <dl className="space-y-3 text-sm">
            <div><dt className="text-xs font-semibold uppercase text-slate-400">Alergias</dt><dd className="text-slate-800">{p.antecedentes.alergias}</dd></div>
            <div><dt className="text-xs font-semibold uppercase text-slate-400">Enfermedades previas</dt><dd className="text-slate-800">{p.antecedentes.enfermedades}</dd></div>
            <div><dt className="text-xs font-semibold uppercase text-slate-400">Medicación</dt><dd className="text-slate-800">{p.antecedentes.medicacion}</dd></div>
          </dl>
        )}
      </Card>

      <Card titulo={`Línea de tiempo (${lista.length} atenciones)`}>
        {lista.length === 0 ? <Vacio>Este paciente aún no tiene atenciones registradas.</Vacio> : (
          <ol className="relative ml-2 border-l-2 border-teal-100">
            {lista.map((x) => (
              <li key={x.id} className="mb-6 ml-5 last:mb-0">
                <span className="absolute -left-[9px] mt-1 h-4 w-4 rounded-full border-2 border-white bg-teal-500 ring-2 ring-teal-100" />
                <div className="flex flex-wrap items-center gap-2">
                  <time className="text-sm font-semibold text-slate-900">{fmtFecha(x.fecha)}</time>
                  <Badge className="bg-sky-100 text-sky-800">{x.cie10}</Badge>
                  <span className="text-xs text-slate-500">{odontologos.find((o) => o.id === x.odontologoId)?.nombre}</span>
                </div>
                <p className="mt-1 text-sm text-slate-600"><b>Motivo:</b> {x.motivo}</p>
                <p className="text-sm text-slate-800"><b>Diagnóstico:</b> {x.diagnostico}</p>
                {x.observaciones && <p className="text-sm text-slate-600"><b>Observaciones:</b> {x.observaciones}</p>}
                {x.receta && <p className="mt-1 flex gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-sm text-slate-700"><Pill size={14} className="mt-0.5 shrink-0 text-teal-600" />{x.receta}</p>}
              </li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  )
}

function RegistroAtencion({ pacienteId, alGuardar }: { pacienteId: string; alGuardar: () => void }) {
  const { citas, atenciones, usuario, odontologos, guardarAtencion, aviso } = useStore()
  const disponibles = citas.filter((c) =>
    c.pacienteId === pacienteId && c.estado === 'Asistió'
    && !atenciones.some((a) => a.citaId === c.id)
    && (usuario?.rol !== 'odontologo' || c.odontologoId === usuario.odontologoId))
  const [citaId, setCitaId] = useState(disponibles[0]?.id ?? '')
  const cita = disponibles.find((c) => c.id === citaId) ?? disponibles[0]
  const [motivo, setMotivo] = useState('')
  const [cie, setCie] = useState('K02.1')
  const [diag, setDiag] = useState('')
  const [obs, setObs] = useState('')
  const [receta, setReceta] = useState('')
  const [intento, setIntento] = useState(false)

  if (disponibles.length === 0) {
    return <Vacio>No hay citas con <b>asistencia</b> pendientes de registro para este paciente. Registra la asistencia (Asistió) desde la agenda y vuelve aquí.</Vacio>
  }

  const guardar = () => {
    setIntento(true)
    if (!cita || !motivo.trim() || !diag.trim()) return
    guardarAtencion({
      citaId: cita.id, pacienteId, odontologoId: cita.odontologoId, fecha: cita.inicio.slice(0, 10),
      motivo: motivo.trim(), cie10: cie, diagnostico: diag.trim(), observaciones: obs.trim(), receta: receta.trim(),
    })
    aviso('Atención clínica registrada en el historial.')
    alGuardar()
  }
  const cieSel = CIE10.find((c) => c.codigo === cie)

  return (
    <Card titulo={<span className="flex items-center gap-2"><Stethoscope size={17} /> Nueva atención clínica</span>}>
      <div className="grid gap-4 md:grid-cols-2">
        <Campo label="Cita atendida vinculada *" className="md:col-span-2">
          <select className={inputCls()} value={cita?.id} onChange={(e) => setCitaId(e.target.value)}>
            {disponibles.map((c) => <option key={c.id} value={c.id}>{fmtFechaHora(c.inicio)} — {odontologos.find((o) => o.id === c.odontologoId)?.nombre} — {c.motivo}</option>)}
          </select>
        </Campo>
        <Campo label="Motivo de consulta *" error={intento && !motivo.trim() ? 'Obligatorio.' : undefined} className="md:col-span-2">
          <input className={inputCls(intento && !motivo.trim() ? 'x' : undefined)} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
        </Campo>
        <Campo label="Diagnóstico CIE-10 *">
          <select className={inputCls()} value={cie} onChange={(e) => { setCie(e.target.value); setDiag(CIE10.find((c) => c.codigo === e.target.value)?.nombre ?? '') }}>
            {CIE10.map((c) => <option key={c.codigo} value={c.codigo}>{c.codigo} — {c.nombre}</option>)}
          </select>
        </Campo>
        <Campo label="Descripción del diagnóstico *" error={intento && !diag.trim() ? 'Obligatorio.' : undefined} ayuda={cieSel ? `Sugerido: ${cieSel.nombre}` : undefined}>
          <input className={inputCls(intento && !diag.trim() ? 'x' : undefined)} value={diag} onChange={(e) => setDiag(e.target.value)} placeholder="Ej. Caries de la dentina en pieza 16" />
        </Campo>
        <Campo label="Observaciones clínicas" className="md:col-span-2"><textarea rows={3} className={inputCls()} value={obs} onChange={(e) => setObs(e.target.value)} /></Campo>
        <Campo label="Receta / indicaciones" className="md:col-span-2"><textarea rows={3} className={inputCls()} value={receta} onChange={(e) => setReceta(e.target.value)} placeholder="Medicamento, dosis y duración" /></Campo>
      </div>
      <div className="mt-4 flex justify-end"><Btn onClick={guardar}>Guardar atención</Btn></div>
    </Card>
  )
}

function OdontogramaTab({ pacienteId }: { pacienteId: string }) {
  const { odontogramas, marcarDiente, usuario } = useStore()
  const puede = usuario?.rol === 'odontologo' || usuario?.rol === 'admin'
  return (
    <Card titulo="Odontograma interactivo">
      <OdontogramaView valor={odontogramas[pacienteId] ?? {}} soloLectura={!puede} onMarcar={(pz, e) => marcarDiente(pacienteId, pz, e)} />
    </Card>
  )
}

const ESTADO_TRAT: Record<EstadoTratamiento, string> = {
  Pendiente: 'bg-amber-100 text-amber-800', 'En proceso': 'bg-sky-100 text-sky-800', Finalizado: 'bg-green-100 text-green-800',
}

function Tratamientos({ pacienteId }: { pacienteId: string }) {
  const { tratamientos, odontologos, cambiarEstadoTratamiento, saldoTratamiento, aviso } = useStore()
  const [nuevo, setNuevo] = useState(false)
  const lista = tratamientos.filter((t) => t.pacienteId === pacienteId)
  const total = lista.reduce((s, t) => s + t.costo, 0)

  return (
    <Card titulo="Plan y seguimiento de tratamientos" acciones={<Btn onClick={() => setNuevo(true)}><Plus size={16} /> Indicar tratamiento</Btn>}>
      {lista.length === 0 ? <Vacio>Sin tratamientos indicados.</Vacio> : (
        <Tabla>
          <thead><tr><Th>Descripción</Th><Th>Pieza</Th><Th>Fecha</Th><Th>Odontólogo</Th><Th className="text-right">Costo</Th><Th className="text-right">Saldo</Th><Th>Estado</Th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {lista.map((t) => (
              <tr key={t.id}>
                <Td className="font-medium text-slate-900">{t.descripcion}</Td>
                <Td>{t.pieza}</Td><Td>{fmtFecha(t.fecha)}</Td>
                <Td className="text-slate-500">{odontologos.find((o) => o.id === t.odontologoId)?.nombre}</Td>
                <Td className="text-right">{soles(t.costo)}</Td>
                <Td className={`text-right font-medium ${saldoTratamiento(t.id) > 0 ? 'text-red-600' : 'text-green-700'}`}>{soles(saldoTratamiento(t.id))}</Td>
                <Td>
                  <select
                    aria-label="Estado del tratamiento"
                    className={`rounded-full border-0 px-2.5 py-1 text-xs font-medium focus:ring-2 focus:ring-teal-300 ${ESTADO_TRAT[t.estado]}`}
                    value={t.estado}
                    onChange={(e) => { cambiarEstadoTratamiento(t.id, e.target.value as EstadoTratamiento); aviso(`Tratamiento: ${e.target.value}.`, 'info') }}
                  >
                    <option>Pendiente</option><option>En proceso</option><option>Finalizado</option>
                  </select>
                </Td>
              </tr>
            ))}
          </tbody>
          <tfoot><tr><Td className="font-semibold" >Total del plan</Td><Td /><Td /><Td /><Td className="text-right font-semibold">{soles(total)}</Td><Td /><Td /></tr></tfoot>
        </Tabla>
      )}
      {nuevo && <NuevoTratamiento pacienteId={pacienteId} onCerrar={() => setNuevo(false)} />}
    </Card>
  )
}

function NuevoTratamiento({ pacienteId, onCerrar }: { pacienteId: string; onCerrar: () => void }) {
  const { servicios, odontologos, usuario, agregarTratamiento, aviso } = useStore()
  const [sId, setSId] = useState(servicios[0].id)
  const [desc, setDesc] = useState(servicios[0].nombre)
  const [pieza, setPieza] = useState('')
  const [costo, setCosto] = useState(String(servicios[0].tarifa))
  const [odId, setOdId] = useState(usuario?.odontologoId ?? odontologos.find((o) => o.activo)?.id ?? '')
  const [intento, setIntento] = useState(false)
  const costoN = Number(costo)
  const errCosto = !(costoN > 0) ? 'Ingresa un costo mayor a 0.' : undefined

  const guardar = () => {
    setIntento(true)
    if (errCosto || !desc.trim()) return
    agregarTratamiento({ pacienteId, odontologoId: odId, servicioId: sId, descripcion: desc.trim(), pieza: pieza.trim() || '—', fecha: fechaISO(new Date()), costo: costoN, estado: 'Pendiente' })
    aviso('Tratamiento agregado al plan.')
    onCerrar()
  }

  return (
    <Modal abierto onCerrar={onCerrar} titulo="Indicar tratamiento" ancho="max-w-xl" pie={<><Btn variante="sec" onClick={onCerrar}>Cancelar</Btn><Btn onClick={guardar}>Agregar al plan</Btn></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo label="Servicio (catálogo)" className="sm:col-span-2">
          <select className={inputCls()} value={sId} onChange={(e) => { const s = servicios.find((x) => x.id === e.target.value)!; setSId(s.id); setDesc(s.nombre); setCosto(String(s.tarifa)) }}>
            {servicios.map((s) => <option key={s.id} value={s.id}>{s.nombre} — {soles(s.tarifa)}</option>)}
          </select>
        </Campo>
        <Campo label="Descripción *" error={intento && !desc.trim() ? 'Obligatorio.' : undefined} className="sm:col-span-2"><input className={inputCls()} value={desc} onChange={(e) => setDesc(e.target.value)} /></Campo>
        <Campo label="Pieza dental"><input className={inputCls()} value={pieza} onChange={(e) => setPieza(e.target.value)} placeholder="Ej. 36" /></Campo>
        <Campo label="Costo unitario (S/) *" error={intento ? errCosto : undefined}><input type="number" min="0" step="0.01" className={inputCls(intento ? errCosto : undefined)} value={costo} onChange={(e) => setCosto(e.target.value)} /></Campo>
        <Campo label="Odontólogo" className="sm:col-span-2">
          <select className={inputCls()} value={odId} onChange={(e) => setOdId(e.target.value)} disabled={usuario?.rol === 'odontologo'}>
            {odontologos.filter((o) => o.activo).map((o) => <option key={o.id} value={o.id}>{o.nombre}</option>)}
          </select>
        </Campo>
      </div>
    </Modal>
  )
}
