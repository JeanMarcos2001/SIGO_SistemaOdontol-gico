import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useStore } from '../store'
import { Alerta, Badge, Btn, Campo, Card, Modal, PageHeader, Tabla, Tabs, Td, Th, inputCls } from '../components/ui'
import { DIAS, aMin } from '../lib/utils'
import type { Especialidad, Odontologo } from '../types'

export const ESPECIALIDADES: Especialidad[] = ['Odontología General', 'Ortodoncia', 'Endodoncia', 'Odontopediatría']

export function Personal() {
  const [tab, setTab] = useState<'dir' | 'hor'>('dir')
  return (
    <>
      <PageHeader titulo="Personal y horarios" sub="Directorio de cirujanos dentistas y asignación de turnos de atención" />
      <Tabs valor={tab} onCambio={setTab} opciones={[{ id: 'dir', label: 'Directorio de odontólogos' }, { id: 'hor', label: 'Horarios de atención' }]} />
      {tab === 'dir' ? <Directorio /> : <Horarios />}
    </>
  )
}

function Directorio() {
  const { odontologos } = useStore()
  const [edit, setEdit] = useState<Odontologo | 'nuevo' | null>(null)
  return (
    <Card titulo="Cirujanos dentistas" acciones={<Btn onClick={() => setEdit('nuevo')}><Plus size={16} /> Nuevo odontólogo</Btn>}>
      <Tabla>
        <thead><tr><Th>Nombre</Th><Th>CMP</Th><Th>Especialidad</Th><Th>Teléfono</Th><Th>Estado</Th><Th /></tr></thead>
        <tbody className="divide-y divide-slate-100">
          {odontologos.map((o) => (
            <tr key={o.id} className="hover:bg-slate-50">
              <Td className="font-medium text-slate-900">{o.nombre}</Td>
              <Td>{o.cmp}</Td><Td>{o.especialidad}</Td><Td>{o.telefono}</Td>
              <Td><Badge className={o.activo ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}>{o.activo ? 'Activo' : 'Inactivo'}</Badge></Td>
              <Td className="text-right"><Btn pequeño variante="fantasma" aria-label="Editar" onClick={() => setEdit(o)}><Pencil size={14} /></Btn></Td>
            </tr>
          ))}
        </tbody>
      </Tabla>
      {edit && <OdontologoForm o={edit === 'nuevo' ? null : edit} onCerrar={() => setEdit(null)} />}
    </Card>
  )
}

function OdontologoForm({ o, onCerrar }: { o: Odontologo | null; onCerrar: () => void }) {
  const { odontologos, guardarOdontologo, aviso } = useStore()
  const [f, setF] = useState<Omit<Odontologo, 'id'>>(o ? { ...o } : { nombre: '', cmp: '', especialidad: 'Odontología General', telefono: '', activo: true })
  const [intento, setIntento] = useState(false)
  const err: Record<string, string> = {}
  if (f.nombre.trim().length < 5) err.nombre = 'Ingresa el nombre completo (ej. Dr. Juan Pérez).'
  if (!/^\d{4,6}$/.test(f.cmp)) err.cmp = 'El CMP debe tener de 4 a 6 dígitos.'
  else if (odontologos.some((x) => x.id !== o?.id && x.cmp === f.cmp)) err.cmp = 'Este CMP ya está registrado.'
  if (!/^\+?[\d\s]{9,14}$/.test(f.telefono)) err.telefono = 'Teléfono no válido.'
  const e = (k: string) => (intento ? err[k] : undefined)

  const guardar = () => {
    setIntento(true)
    if (Object.keys(err).length) return
    guardarOdontologo(f, o?.id)
    aviso(o ? 'Odontólogo actualizado.' : 'Odontólogo registrado.')
    onCerrar()
  }

  return (
    <Modal abierto onCerrar={onCerrar} titulo={o ? 'Editar odontólogo' : 'Registrar odontólogo'} ancho="max-w-xl"
      pie={<><Btn variante="sec" onClick={onCerrar}>Cancelar</Btn><Btn onClick={guardar}>Guardar</Btn></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo label="Nombre completo *" error={e('nombre')} className="sm:col-span-2"><input className={inputCls(e('nombre'))} value={f.nombre} onChange={(x) => setF({ ...f, nombre: x.target.value })} /></Campo>
        <Campo label="CMP (Colegio Odontológico) *" error={e('cmp')}><input className={inputCls(e('cmp'))} value={f.cmp} inputMode="numeric" maxLength={6} onChange={(x) => setF({ ...f, cmp: x.target.value })} /></Campo>
        <Campo label="Teléfono *" error={e('telefono')}><input className={inputCls(e('telefono'))} value={f.telefono} onChange={(x) => setF({ ...f, telefono: x.target.value })} /></Campo>
        <Campo label="Especialidad *">
          <select className={inputCls()} value={f.especialidad} onChange={(x) => setF({ ...f, especialidad: x.target.value as Especialidad })}>
            {ESPECIALIDADES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Campo>
        <Campo label="Estado">
          <select className={inputCls()} value={f.activo ? '1' : '0'} onChange={(x) => setF({ ...f, activo: x.target.value === '1' })}>
            <option value="1">Activo</option><option value="0">Inactivo</option>
          </select>
        </Campo>
      </div>
    </Modal>
  )
}

function Horarios() {
  const { odontologos, horarios, agregarHorario, quitarHorario, aviso } = useStore()
  const [odId, setOdId] = useState(odontologos[0]?.id ?? '')
  const [dia, setDia] = useState(1)
  const [inicio, setInicio] = useState('09:00')
  const [fin, setFin] = useState('13:00')
  const [error, setError] = useState('')
  const mios = horarios.filter((h) => h.odontologoId === odId)

  const agregar = () => {
    const r = agregarHorario({ odontologoId: odId, dia, inicio, fin })
    setError(r ?? '')
    if (!r) aviso(`Turno ${inicio}–${fin} asignado el ${DIAS[dia].toLowerCase()}.`)
  }

  const totalHoras = mios.reduce((s, h) => s + (aMin(h.fin) - aMin(h.inicio)) / 60, 0)

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
      <Card
        titulo="Grilla semanal"
        acciones={
          <select className={`${inputCls()} !w-auto`} value={odId} onChange={(e) => { setOdId(e.target.value); setError('') }} aria-label="Odontólogo">
            {odontologos.map((o) => <option key={o.id} value={o.id}>{o.nombre}{o.activo ? '' : ' (inactivo)'}</option>)}
          </select>
        }
      >
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6, 0].map((d) => {
            const bl = mios.filter((h) => h.dia === d).sort((a, b) => aMin(a.inicio) - aMin(b.inicio))
            return (
              <div key={d} className={`rounded-lg border p-3 ${bl.length ? 'border-teal-200 bg-teal-50/50' : 'border-slate-200 bg-slate-50'}`}>
                <div className="mb-2 text-sm font-semibold text-slate-800">{DIAS[d]}</div>
                {bl.length === 0 && <div className="text-xs text-slate-400">Sin atención</div>}
                <div className="space-y-1.5">
                  {bl.map((h) => (
                    <div key={h.id} className="flex items-center justify-between rounded-md bg-white px-2.5 py-1.5 text-sm shadow-sm ring-1 ring-teal-200">
                      <span className="font-medium text-teal-800">{h.inicio} – {h.fin}</span>
                      <button aria-label="Quitar turno" className="text-slate-400 hover:text-red-600" onClick={() => quitarHorario(h.id)}><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
        <p className="mt-3 text-xs text-slate-500">Carga semanal: <b>{totalHoras} h</b></p>
      </Card>

      <Card titulo="Asignar turno">
        <div className="space-y-3">
          {error && <Alerta>{error}</Alerta>}
          <Campo label="Día de la semana">
            <select className={inputCls()} value={dia} onChange={(e) => setDia(Number(e.target.value))}>
              {[1, 2, 3, 4, 5, 6, 0].map((d) => <option key={d} value={d}>{DIAS[d]}</option>)}
            </select>
          </Campo>
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Desde"><input type="time" className={inputCls()} value={inicio} onChange={(e) => setInicio(e.target.value)} /></Campo>
            <Campo label="Hasta"><input type="time" className={inputCls()} value={fin} onChange={(e) => setFin(e.target.value)} /></Campo>
          </div>
          <Btn className="w-full" onClick={agregar}><Plus size={16} /> Agregar turno</Btn>
          <p className="text-xs text-slate-500">El sistema impide turnos que se crucen con otro ya asignado al mismo odontólogo en el mismo día. Las citas se generan en bloques de 30 minutos.</p>
        </div>
      </Card>
    </div>
  )
}
