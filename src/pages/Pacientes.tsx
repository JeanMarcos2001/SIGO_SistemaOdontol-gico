import { useMemo, useState } from 'react'
import { CalendarDays, CreditCard, FileHeart, Pencil, Plus, Search, TriangleAlert } from 'lucide-react'
import { PERMISOS, useStore, type NuevoPaciente } from '../store'
import { Alerta, Badge, Btn, Campo, Card, Modal, PageHeader, Tabla, Td, Th, Vacio, inputCls } from '../components/ui'
import { ESTADO_COLOR, edad, fmtFechaHora, fechaISO, nombreCompleto, soles } from '../lib/utils'
import type { Paciente, TipoDoc } from '../types'

const vacio: NuevoPaciente = {
  tipoDoc: 'DNI', doc: '', nombres: '', apellidos: '', nacimiento: '', telefono: '', email: '', direccion: '',
  emergenciaNombre: '', emergenciaTel: '',
  antecedentes: { alergias: 'Ninguna conocida', enfermedades: 'Ninguna', medicacion: 'Ninguna' },
}

export function Pacientes() {
  const { pacientes, usuario } = useStore()
  const [q, setQ] = useState('')
  const [editando, setEditando] = useState<Paciente | 'nuevo' | null>(null)
  const [ficha, setFicha] = useState<Paciente | null>(null)

  const lista = useMemo(() => {
    const t = q.trim().toLowerCase()
    return pacientes.filter((p) => !t || `${p.doc} ${p.nombres} ${p.apellidos}`.toLowerCase().includes(t))
  }, [q, pacientes])

  const puedeEditar = usuario && ['admin', 'recepcion'].includes(usuario.rol)

  return (
    <>
      <PageHeader
        titulo="Pacientes"
        sub={`${pacientes.length} pacientes registrados`}
        acciones={puedeEditar && <Btn onClick={() => setEditando('nuevo')}><Plus size={16} /> Nuevo paciente</Btn>}
      />
      <Card>
        <div className="relative mb-4 max-w-md">
          <Search size={16} className="pointer-events-none absolute left-3 top-2.5 text-slate-400" />
          <input className={`${inputCls()} pl-9`} placeholder="Buscar por DNI, nombres o apellidos…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {lista.length === 0 ? <Vacio>No se encontraron pacientes para “{q}”.</Vacio> : (
          <Tabla>
            <thead><tr><Th>Documento</Th><Th>Paciente</Th><Th>Edad</Th><Th>Teléfono</Th><Th>Correo</Th><Th className="text-right">Acciones</Th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {lista.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <Td><span className="font-mono text-xs text-slate-500">{p.tipoDoc}</span> {p.doc}</Td>
                  <Td><button className="font-medium text-teal-700 hover:underline" onClick={() => setFicha(p)}>{nombreCompleto(p)}</button></Td>
                  <Td>{edad(p.nacimiento)} años</Td>
                  <Td>{p.telefono}</Td>
                  <Td className="text-slate-500">{p.email}</Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-1.5">
                      <Btn pequeño variante="sec" onClick={() => setFicha(p)}>Ficha</Btn>
                      {puedeEditar && <Btn pequeño variante="fantasma" aria-label="Editar paciente" onClick={() => setEditando(p)}><Pencil size={14} /></Btn>}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Tabla>
        )}
      </Card>

      {editando && <PacienteForm paciente={editando === 'nuevo' ? null : editando} onCerrar={() => setEditando(null)} />}
      {ficha && <FichaPaciente paciente={pacientes.find((p) => p.id === ficha.id)!} onCerrar={() => setFicha(null)} />}
    </>
  )
}

function PacienteForm({ paciente, onCerrar }: { paciente: Paciente | null; onCerrar: () => void }) {
  const { docExiste, guardarPaciente, aviso } = useStore()
  const [f, setF] = useState<NuevoPaciente>(paciente ? { ...paciente } : vacio)
  const [intento, setIntento] = useState(false)
  const set = <K extends keyof NuevoPaciente>(k: K, v: NuevoPaciente[K]) => setF((x) => ({ ...x, [k]: v }))

  const duplicado = f.doc.trim().length > 0 && docExiste(f.tipoDoc, f.doc, paciente?.id)
  const errores: Partial<Record<keyof NuevoPaciente, string>> = {}
  if (!f.doc.trim()) errores.doc = 'El número de documento es obligatorio.'
  else if (f.tipoDoc === 'DNI' && !/^\d{8}$/.test(f.doc.trim())) errores.doc = 'El DNI debe tener exactamente 8 dígitos.'
  else if (f.tipoDoc !== 'DNI' && !/^[A-Za-z0-9]{6,12}$/.test(f.doc.trim())) errores.doc = 'Documento de 6 a 12 caracteres alfanuméricos.'
  else if (duplicado) errores.doc = 'Este documento ya está registrado.'
  if (!f.nombres.trim()) errores.nombres = 'Obligatorio.'
  if (!f.apellidos.trim()) errores.apellidos = 'Obligatorio.'
  if (!f.nacimiento) errores.nacimiento = 'Obligatorio.'
  else if (f.nacimiento > fechaISO(new Date())) errores.nacimiento = 'La fecha no puede ser futura.'
  if (!/^\+?\d{9,12}$/.test(f.telefono.replace(/\s/g, ''))) errores.telefono = 'Teléfono/WhatsApp de 9 dígitos.'
  if (!/^\S+@\S+\.\S+$/.test(f.email)) errores.email = 'Correo electrónico no válido.'
  if (!f.direccion.trim()) errores.direccion = 'Obligatorio.'
  if (!f.emergenciaNombre.trim()) errores.emergenciaNombre = 'Obligatorio.'
  if (!/^\+?\d{9,12}$/.test(f.emergenciaTel.replace(/\s/g, ''))) errores.emergenciaTel = 'Teléfono de 9 dígitos.'
  const e = (k: keyof NuevoPaciente) => (intento || k === 'doc' ? errores[k] : undefined)

  const guardar = () => {
    setIntento(true)
    if (Object.keys(errores).length) return aviso('Revisa los campos marcados en rojo.', 'error')
    guardarPaciente({ ...f, doc: f.doc.trim() }, paciente?.id)
    aviso(paciente ? 'Paciente actualizado.' : 'Paciente registrado correctamente.')
    onCerrar()
  }

  return (
    <Modal
      abierto onCerrar={onCerrar} ancho="max-w-3xl"
      titulo={paciente ? 'Editar paciente' : 'Registrar paciente'}
      pie={<><Btn variante="sec" onClick={onCerrar}>Cancelar</Btn><Btn onClick={guardar}>{paciente ? 'Guardar cambios' : 'Registrar paciente'}</Btn></>}
    >
      {duplicado && (
        <div className="mb-4">
          <Alerta><span className="flex items-center gap-2 font-medium"><TriangleAlert size={16} /> Ya existe un paciente con {f.tipoDoc} {f.doc}. No se permite duplicar documentos.</span></Alerta>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        <Campo label="Tipo de documento *">
          <select className={inputCls()} value={f.tipoDoc} onChange={(x) => set('tipoDoc', x.target.value as TipoDoc)}>
            <option>DNI</option><option value="CE">Carné de extranjería</option><option>Pasaporte</option>
          </select>
        </Campo>
        <Campo label="Número de documento *" error={e('doc')} className="sm:col-span-2">
          <input className={inputCls(e('doc'))} value={f.doc} maxLength={12} inputMode={f.tipoDoc === 'DNI' ? 'numeric' : 'text'} onChange={(x) => set('doc', x.target.value)} placeholder="Ej. 45872136" />
        </Campo>
        <Campo label="Nombres *" error={e('nombres')}><input className={inputCls(e('nombres'))} value={f.nombres} onChange={(x) => set('nombres', x.target.value)} /></Campo>
        <Campo label="Apellidos *" error={e('apellidos')}><input className={inputCls(e('apellidos'))} value={f.apellidos} onChange={(x) => set('apellidos', x.target.value)} /></Campo>
        <Campo label="Fecha de nacimiento *" error={e('nacimiento')}><input type="date" className={inputCls(e('nacimiento'))} value={f.nacimiento} max={fechaISO(new Date())} onChange={(x) => set('nacimiento', x.target.value)} /></Campo>
        <Campo label="Teléfono / WhatsApp *" error={e('telefono')}><input className={inputCls(e('telefono'))} value={f.telefono} inputMode="tel" onChange={(x) => set('telefono', x.target.value)} placeholder="987654321" /></Campo>
        <Campo label="Correo electrónico *" error={e('email')} className="sm:col-span-2"><input type="email" className={inputCls(e('email'))} value={f.email} onChange={(x) => set('email', x.target.value)} /></Campo>
        <Campo label="Dirección *" error={e('direccion')} className="sm:col-span-3"><input className={inputCls(e('direccion'))} value={f.direccion} onChange={(x) => set('direccion', x.target.value)} /></Campo>
        <Campo label="Contacto de emergencia *" error={e('emergenciaNombre')} className="sm:col-span-2"><input className={inputCls(e('emergenciaNombre'))} value={f.emergenciaNombre} onChange={(x) => set('emergenciaNombre', x.target.value)} placeholder="Nombre y parentesco" /></Campo>
        <Campo label="Teléfono de emergencia *" error={e('emergenciaTel')}><input className={inputCls(e('emergenciaTel'))} value={f.emergenciaTel} inputMode="tel" onChange={(x) => set('emergenciaTel', x.target.value)} /></Campo>
      </div>
    </Modal>
  )
}

function FichaPaciente({ paciente: p, onCerrar }: { paciente: Paciente; onCerrar: () => void }) {
  const { citas, tratamientos, pagos, odontologos, saldoTratamiento, irA, usuario } = useStore()
  const permisos = usuario ? PERMISOS[usuario.rol] : []
  const misCitas = citas.filter((c) => c.pacienteId === p.id).sort((a, b) => b.inicio.localeCompare(a.inicio))
  const misTrat = tratamientos.filter((t) => t.pacienteId === p.id)
  const deuda = misTrat.reduce((s, t) => s + saldoTratamiento(t.id), 0)
  const pagado = pagos.filter((x) => x.pacienteId === p.id).reduce((s, x) => s + x.monto, 0)

  const ir = (pg: 'clinica' | 'citas' | 'finanzas') => { onCerrar(); irA(pg, p.id) }

  return (
    <Modal abierto onCerrar={onCerrar} titulo="Ficha del paciente" ancho="max-w-3xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-slate-900">{nombreCompleto(p)}</h3>
          <p className="text-sm text-slate-500">{p.tipoDoc} {p.doc} · {edad(p.nacimiento)} años · {p.telefono}</p>
          <p className="text-sm text-slate-500">{p.email} · {p.direccion}</p>
          <p className="mt-1 text-xs text-slate-500">Emergencia: {p.emergenciaNombre} · {p.emergenciaTel}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {permisos.includes('clinica') && <Btn variante="sec" onClick={() => ir('clinica')}><FileHeart size={15} /> Historial clínico</Btn>}
          {permisos.includes('citas') && <Btn variante="sec" onClick={() => ir('citas')}><CalendarDays size={15} /> Citas</Btn>}
          {permisos.includes('finanzas') && <Btn variante="sec" onClick={() => ir('finanzas')}><CreditCard size={15} /> Estado de cuenta</Btn>}
        </div>
      </div>

      {(p.antecedentes.alergias.toLowerCase() !== 'ninguna conocida' && p.antecedentes.alergias.toLowerCase() !== 'ninguna') && (
        <div className="mt-4"><Alerta tipo="warn"><b>Alergias:</b> {p.antecedentes.alergias}</Alerta></div>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Card titulo="Últimas citas">
          {misCitas.length === 0 ? <p className="text-sm text-slate-500">Sin citas.</p> : (
            <ul className="space-y-2 text-sm">
              {misCitas.slice(0, 4).map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-2">
                  <span>{fmtFechaHora(c.inicio)}<span className="block text-xs text-slate-500">{odontologos.find((o) => o.id === c.odontologoId)?.nombre}</span></span>
                  <Badge className={ESTADO_COLOR[c.estado].badge}>{c.estado}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card titulo="Estado de cuenta">
          <dl className="space-y-1.5 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Tratamientos activos</dt><dd>{misTrat.filter((t) => t.estado !== 'Finalizado').length}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Total pagado</dt><dd className="font-medium text-green-700">{soles(pagado)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Saldo pendiente</dt><dd className={`font-semibold ${deuda > 0 ? 'text-red-600' : 'text-slate-700'}`}>{soles(deuda)}</dd></div>
          </dl>
        </Card>
      </div>
    </Modal>
  )
}
