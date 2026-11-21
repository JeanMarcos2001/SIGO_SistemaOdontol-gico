import { useState } from 'react'
import { Plus } from 'lucide-react'
import { ROL_LABEL, useStore } from '../store'
import { Alerta, Badge, Btn, Campo, Card, PageHeader, Tabla, Tabs, Td, Th, inputCls } from '../components/ui'
import { soles } from '../lib/utils'
import type { Rol } from '../types'

export function Admin() {
  const [tab, setTab] = useState<'usuarios' | 'tarifas'>('usuarios')
  return (
    <>
      <PageHeader titulo="Usuarios y tarifas" sub="Gestión de accesos por rol y catálogo de tratamientos" />
      <Tabs valor={tab} onCambio={setTab} opciones={[{ id: 'usuarios', label: 'Usuarios y roles' }, { id: 'tarifas', label: 'Catálogo de tratamientos y tarifas' }]} />
      {tab === 'usuarios' ? <Usuarios /> : <Tarifas />}
    </>
  )
}

function Usuarios() {
  const { usuarios, actualizarUsuario, usuario, aviso } = useStore()
  return (
    <Card>
      <Tabla>
        <thead><tr><Th>Usuario</Th><Th>Correo</Th><Th>Rol</Th><Th>Estado</Th></tr></thead>
        <tbody className="divide-y divide-slate-100">
          {usuarios.map((u) => {
            const yo = u.id === usuario?.id
            return (
              <tr key={u.id}>
                <Td className="font-medium text-slate-900">{u.nombre} {yo && <Badge className="ml-1 bg-teal-100 text-teal-700">Tú</Badge>}</Td>
                <Td className="text-slate-500">{u.email}</Td>
                <Td>
                  <select className={`${inputCls()} !w-auto`} value={u.rol} disabled={yo} aria-label={`Rol de ${u.nombre}`}
                    onChange={(e) => { actualizarUsuario(u.id, { rol: e.target.value as Rol }); aviso(`Rol actualizado: ${ROL_LABEL[e.target.value as Rol]}.`) }}>
                    {(Object.keys(ROL_LABEL) as Rol[]).map((r) => <option key={r} value={r}>{ROL_LABEL[r]}</option>)}
                  </select>
                </Td>
                <Td>
                  <button disabled={yo} onClick={() => { actualizarUsuario(u.id, { activo: !u.activo }); aviso(u.activo ? 'Usuario desactivado.' : 'Usuario activado.', 'info') }}
                    className="disabled:opacity-50" aria-label={`Cambiar estado de ${u.nombre}`}>
                    <Badge className={u.activo ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}>{u.activo ? 'Activo' : 'Inactivo'}</Badge>
                  </button>
                </Td>
              </tr>
            )
          })}
        </tbody>
      </Tabla>
    </Card>
  )
}

function Tarifas() {
  const { servicios, guardarServicio, aviso } = useStore()
  const [nombre, setNombre] = useState('')
  const [tarifa, setTarifa] = useState('')
  const [error, setError] = useState('')

  const agregar = () => {
    if (!nombre.trim()) return setError('Ingresa el nombre del tratamiento.')
    if (!(Number(tarifa) > 0)) return setError('La tarifa debe ser mayor a 0.')
    if (servicios.some((s) => s.nombre.toLowerCase() === nombre.trim().toLowerCase())) return setError('Ese tratamiento ya existe en el catálogo.')
    guardarServicio({ nombre: nombre.trim(), tarifa: Number(tarifa) })
    setNombre(''); setTarifa(''); setError('')
    aviso('Tratamiento agregado al catálogo.')
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <Card titulo="Tarifario vigente">
        <Tabla>
          <thead><tr><Th>Tratamiento</Th><Th className="text-right">Tarifa (S/)</Th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {servicios.map((s) => (
              <tr key={s.id}>
                <Td className="font-medium text-slate-900">{s.nombre}</Td>
                <Td className="text-right">
                  <input type="number" min="1" step="0.5" aria-label={`Tarifa de ${s.nombre}`} className={`${inputCls()} !w-28 text-right`} defaultValue={s.tarifa}
                    onBlur={(e) => {
                      const v = Number(e.target.value)
                      if (v > 0 && v !== s.tarifa) { guardarServicio({ nombre: s.nombre, tarifa: v }, s.id); aviso(`Tarifa actualizada: ${soles(v)}.`) }
                      else if (!(v > 0)) e.target.value = String(s.tarifa)
                    }} />
                </Td>
              </tr>
            ))}
          </tbody>
        </Tabla>
      </Card>
      <Card titulo="Nuevo tratamiento" className="h-fit">
        <div className="space-y-3">
          {error && <Alerta>{error}</Alerta>}
          <Campo label="Nombre"><input className={inputCls()} value={nombre} onChange={(e) => setNombre(e.target.value)} /></Campo>
          <Campo label="Tarifa (S/)"><input type="number" min="0" step="0.5" className={inputCls()} value={tarifa} onChange={(e) => setTarifa(e.target.value)} /></Campo>
          <Btn className="w-full" onClick={agregar}><Plus size={16} /> Agregar al catálogo</Btn>
        </div>
      </Card>
    </div>
  )
}
