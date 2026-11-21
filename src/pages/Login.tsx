import { useState, type FormEvent } from 'react'
import { ArrowRight, CalendarCheck, ShieldCheck } from 'lucide-react'
import { ROL_LABEL, useStore } from '../store'
import { Alerta, Btn, Campo, Logo, inputCls } from '../components/ui'
import type { Rol } from '../types'

const ACCESOS: { rol: Rol; id: string; desc: string }[] = [
  { rol: 'admin', id: 'u1', desc: 'Dashboard, usuarios, tarifas y reportes' },
  { rol: 'recepcion', id: 'u2', desc: 'Pacientes, agenda y horarios' },
  { rol: 'odontologo', id: 'u3', desc: 'Agenda, historial y odontograma' },
  { rol: 'finanzas', id: 'u5', desc: 'Pagos y comprobantes PDF' },
  { rol: 'paciente', id: 'u6', desc: 'Reservar y consultar mis citas' },
]

export function Login() {
  const { usuarios, login } = useStore()
  const [email, setEmail] = useState('admin@saludbucal.pe')
  const [pass, setPass] = useState('demo123')
  const [error, setError] = useState('')

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    const u = usuarios.find((x) => x.email.toLowerCase() === email.trim().toLowerCase())
    if (!u || pass !== 'demo123') return setError('Correo o contraseña incorrectos.')
    if (!u.activo) return setError('Tu usuario está inactivo. Contacta al administrador.')
    login(u)
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-gradient-to-br from-teal-700 via-teal-800 to-sky-900 p-12 text-white lg:flex">
        <Logo claro size={44} />
        <div>
          <h1 className="text-4xl font-bold leading-tight">Gestión integral de tu clínica dental</h1>
          <p className="mt-4 max-w-md text-teal-100">Pacientes, agenda, historial clínico, odontograma y facturación en un solo lugar.</p>
          <ul className="mt-8 space-y-3 text-sm text-teal-50">
            <li className="flex items-center gap-3"><CalendarCheck size={18} /> Agenda visual con disponibilidad en tiempo real</li>
            <li className="flex items-center gap-3"><ShieldCheck size={18} /> Permisos por rol para cada área de la clínica</li>
          </ul>
        </div>
        <p className="text-xs text-teal-200">Prototipo de demostración · datos ficticios</p>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden"><Logo /></div>
          <h2 className="text-2xl font-bold text-slate-900">Iniciar sesión</h2>
          <p className="mt-1 text-sm text-slate-500">Contraseña de demostración: <code className="rounded bg-slate-100 px-1.5 py-0.5">demo123</code></p>

          <form onSubmit={enviar} className="mt-6 space-y-4">
            {error && <Alerta>{error}</Alerta>}
            <Campo label="Correo electrónico">
              <input className={inputCls()} type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError('') }} autoComplete="username" />
            </Campo>
            <Campo label="Contraseña">
              <input className={inputCls()} type="password" value={pass} onChange={(e) => { setPass(e.target.value); setError('') }} autoComplete="current-password" />
            </Campo>
            <Btn type="submit" className="w-full">Ingresar</Btn>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wide text-slate-400">
            <span className="h-px flex-1 bg-slate-200" /> acceso rápido por rol <span className="h-px flex-1 bg-slate-200" />
          </div>
          <div className="grid gap-2">
            {ACCESOS.map((a) => (
              <button
                key={a.id}
                onClick={() => login(usuarios.find((u) => u.id === a.id)!)}
                className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-left transition hover:border-teal-400 hover:bg-teal-50"
              >
                <span>
                  <span className="block text-sm font-semibold text-slate-900">{ROL_LABEL[a.rol]}</span>
                  <span className="block text-xs text-slate-500">{a.desc}</span>
                </span>
                <ArrowRight size={16} className="text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-teal-600" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
