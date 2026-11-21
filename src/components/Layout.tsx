import { useState, type ReactNode } from 'react'
import {
  CalendarDays, ChevronsLeft, ChevronsRight, CreditCard, LayoutDashboard, LogOut, Menu, Settings2,
  Stethoscope, UserCog, Users, UserRound,
} from 'lucide-react'
import { PERMISOS, ROL_LABEL, useStore } from '../store'
import type { Pagina } from '../types'
import { Logo } from './ui'
import { Campana } from './Recordatorios'

const NAV: Record<Pagina, { label: string; icon: typeof Users }> = {
  dashboard: { label: 'Dashboard', icon: LayoutDashboard },
  pacientes: { label: 'Pacientes', icon: Users },
  personal: { label: 'Personal y horarios', icon: UserCog },
  citas: { label: 'Agenda de citas', icon: CalendarDays },
  clinica: { label: 'Gestión clínica', icon: Stethoscope },
  finanzas: { label: 'Pagos y comprobantes', icon: CreditCard },
  admin: { label: 'Usuarios y tarifas', icon: Settings2 },
  portal: { label: 'Mi portal', icon: UserRound },
}

export function Layout({ children }: { children: ReactNode }) {
  const { usuario, usuarios, pagina, irA, cambiarUsuario, logout } = useStore()
  const [colapsado, setColapsado] = useState(false)
  const [movil, setMovil] = useState(false)
  if (!usuario) return null
  const items = PERMISOS[usuario.rol]

  const menu = (
    <nav className="flex flex-1 flex-col gap-1 px-3 py-4" aria-label="Navegación principal">
      {items.map((p) => {
        const { label, icon: Icon } = NAV[p]
        const activo = pagina === p
        return (
          <button
            key={p}
            onClick={() => { irA(p); setMovil(false) }}
            title={label}
            aria-current={activo ? 'page' : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              activo ? 'bg-white text-teal-800 shadow-sm' : 'text-teal-50 hover:bg-white/10'
            } ${colapsado ? 'md:justify-center md:px-0' : ''}`}
          >
            <Icon size={18} className="shrink-0" />
            <span className={colapsado ? 'md:hidden' : ''}>{label}</span>
          </button>
        )
      })}
    </nav>
  )

  return (
    <div className="flex min-h-screen">
      {/* Menú lateral escritorio */}
      <aside className={`no-print sticky top-0 hidden h-screen shrink-0 flex-col bg-gradient-to-b from-teal-700 to-teal-900 transition-all md:flex ${colapsado ? 'w-[72px]' : 'w-64'}`}>
        <div className={`flex h-16 items-center border-b border-white/10 px-4 ${colapsado ? 'justify-center' : ''}`}>
          {colapsado ? <Logo size={34} claro /> : <Logo claro />}
        </div>
        {menu}
        <button onClick={() => setColapsado(!colapsado)} className="m-3 flex items-center justify-center gap-2 rounded-lg py-2 text-xs text-teal-100 hover:bg-white/10" aria-label="Colapsar menú">
          {colapsado ? <ChevronsRight size={16} /> : <><ChevronsLeft size={16} /> Colapsar</>}
        </button>
      </aside>

      {/* Menú lateral móvil */}
      {movil && (
        <div className="no-print fixed inset-0 z-40 md:hidden" onClick={() => setMovil(false)}>
          <div className="absolute inset-0 bg-slate-900/50" />
          <aside className="relative flex h-full w-64 flex-col bg-gradient-to-b from-teal-700 to-teal-900" onClick={(e) => e.stopPropagation()}>
            <div className="flex h-16 items-center border-b border-white/10 px-4"><Logo claro /></div>
            {menu}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur">
          <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden" onClick={() => setMovil(true)} aria-label="Abrir menú"><Menu size={20} /></button>
          <div className="hidden text-sm text-slate-500 sm:block">{NAV[pagina].label}</div>
          <div className="ml-auto flex items-center gap-3">
            <Campana />
            <label className="flex items-center gap-2 text-xs text-slate-500">
              <span className="hidden sm:inline">Rol (demo):</span>
              <select
                value={usuario.id}
                onChange={(e) => cambiarUsuario(e.target.value)}
                className="max-w-[190px] rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
                aria-label="Cambiar rol de demostración"
              >
                {usuarios.filter((u) => u.activo).map((u) => (
                  <option key={u.id} value={u.id}>{ROL_LABEL[u.rol]} — {u.nombre.replace(/ \(.*\)/, '')}</option>
                ))}
              </select>
            </label>
            <div className="hidden items-center gap-2.5 border-l border-slate-200 pl-3 sm:flex">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-800">
                {usuario.nombre.replace(/^(Dr\.|Dra\.)\s*/, '').charAt(0)}
              </div>
              <div className="leading-tight">
                <div className="text-sm font-medium text-slate-900">{usuario.nombre.replace(/ \(.*\)/, '')}</div>
                <div className="text-xs text-slate-500">{ROL_LABEL[usuario.rol]}</div>
              </div>
            </div>
            <button onClick={logout} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-red-600" aria-label="Cerrar sesión" title="Cerrar sesión"><LogOut size={18} /></button>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  )
}
