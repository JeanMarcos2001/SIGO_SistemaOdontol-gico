import { useEffect, useMemo, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Search, X } from 'lucide-react'
import { useStore } from '../store'
import { nombreCompleto } from '../lib/utils'

export function Logo({ size = 36, claro = false }: { size?: number; claro?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
        <rect width="64" height="64" rx="14" fill={claro ? '#fff' : '#0d9488'} />
        <path
          d="M32 14c-6-4-16-1-16 9 0 6 3 8 4 15 1 6 3 12 6 12s3-8 6-8 3 8 6 8 5-6 6-12c1-7 4-9 4-15 0-10-10-13-16-9z"
          fill={claro ? '#0d9488' : '#fff'}
        />
      </svg>
      <div className="leading-tight">
        <div className={`font-bold tracking-tight ${claro ? 'text-white' : 'text-slate-900'}`}>Salud Bucal</div>
        <div className={`text-[11px] ${claro ? 'text-teal-100' : 'text-slate-500'}`}>Clínica odontológica</div>
      </div>
    </div>
  )
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variante?: 'primario' | 'sec' | 'peligro' | 'fantasma'; pequeño?: boolean }

export function Btn({ variante = 'primario', pequeño, className = '', ...p }: BtnProps) {
  const base = 'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/60'
  const size = pequeño ? 'px-2.5 py-1.5 text-xs' : 'px-3.5 py-2 text-sm'
  const v = {
    primario: 'bg-teal-600 text-white hover:bg-teal-700 shadow-sm',
    sec: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50',
    peligro: 'bg-red-600 text-white hover:bg-red-700',
    fantasma: 'text-slate-600 hover:bg-slate-100',
  }[variante]
  return <button type="button" className={`${base} ${size} ${v} ${className}`} {...p} />
}

export function Card({ children, className = '', titulo, acciones }: { children: ReactNode; className?: string; titulo?: ReactNode; acciones?: ReactNode }) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {(titulo || acciones) && (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
          <h3 className="font-semibold text-slate-900">{titulo}</h3>
          <div className="flex flex-wrap items-center gap-2">{acciones}</div>
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  )
}

export function PageHeader({ titulo, sub, acciones }: { titulo: string; sub?: string; acciones?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{titulo}</h1>
        {sub && <p className="mt-0.5 text-sm text-slate-500">{sub}</p>}
      </div>
      <div className="flex flex-wrap gap-2">{acciones}</div>
    </div>
  )
}

export function Badge({ children, className = 'bg-slate-100 text-slate-700' }: { children: ReactNode; className?: string }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>{children}</span>
}

export function Alerta({ tipo = 'error', children }: { tipo?: 'error' | 'ok' | 'info' | 'warn'; children: ReactNode }) {
  const c = {
    error: 'bg-red-50 border-red-200 text-red-800',
    ok: 'bg-green-50 border-green-200 text-green-800',
    info: 'bg-sky-50 border-sky-200 text-sky-800',
    warn: 'bg-amber-50 border-amber-200 text-amber-900',
  }[tipo]
  return <div role={tipo === 'error' ? 'alert' : 'status'} className={`rounded-lg border px-3 py-2 text-sm ${c}`}>{children}</div>
}

export function Modal({ abierto, onCerrar, titulo, children, ancho = 'max-w-2xl', pie }: {
  abierto: boolean; onCerrar: () => void; titulo: string; children: ReactNode; ancho?: string; pie?: ReactNode
}) {
  useEffect(() => {
    if (!abierto) return
    const f = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar()
    window.addEventListener('keydown', f)
    return () => window.removeEventListener('keydown', f)
  }, [abierto, onCerrar])
  if (!abierto) return null
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 sm:p-8" onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}>
      <div role="dialog" aria-modal="true" aria-label={titulo} className={`print-area w-full ${ancho} rounded-2xl bg-white shadow-2xl`}>
        <header className="no-print flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <h2 className="text-lg font-semibold text-slate-900">{titulo}</h2>
          <button aria-label="Cerrar" onClick={onCerrar} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"><X size={18} /></button>
        </header>
        <div className="p-5">{children}</div>
        {pie && <footer className="no-print flex flex-wrap justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3 rounded-b-2xl">{pie}</footer>}
      </div>
    </div>
  )
}

export function Campo({ label, error, children, ayuda, className = '' }: { label: string; error?: string; children: ReactNode; ayuda?: string; className?: string }) {
  return (
    <label className={`block text-sm ${className}`}>
      <span className="mb-1 block font-medium text-slate-700">{label}</span>
      {children}
      {ayuda && !error && <span className="mt-1 block text-xs text-slate-500">{ayuda}</span>}
      {error && <span className="mt-1 block text-xs font-medium text-red-600">{error}</span>}
    </label>
  )
}

export const inputCls = (error?: string) =>
  `w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
    error ? 'border-red-400 focus:ring-red-200' : 'border-slate-300 focus:border-teal-500 focus:ring-teal-100'
  }`

export function Tabs<T extends string>({ valor, onCambio, opciones }: { valor: T; onCambio: (v: T) => void; opciones: { id: T; label: string }[] }) {
  return (
    <div className="mb-4 flex gap-1 overflow-x-auto border-b border-slate-200" role="tablist">
      {opciones.map((o) => (
        <button
          key={o.id}
          role="tab"
          aria-selected={valor === o.id}
          onClick={() => onCambio(o.id)}
          className={`whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition ${
            valor === o.id ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Vacio({ children }: { children: ReactNode }) {
  return <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">{children}</p>
}

/** Buscador de pacientes por DNI / nombres / apellidos */
export function PacienteSelect({ value, onChange, disabled, error }: { value: string; onChange: (id: string) => void; disabled?: boolean; error?: string }) {
  const { pacientes } = useStore()
  const [q, setQ] = useState('')
  const [abierto, setAbierto] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const sel = pacientes.find((p) => p.id === value)

  useEffect(() => {
    const f = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setAbierto(false)
    document.addEventListener('mousedown', f)
    return () => document.removeEventListener('mousedown', f)
  }, [])

  const lista = useMemo(() => {
    const t = q.trim().toLowerCase()
    return pacientes.filter((p) => !t || `${p.doc} ${p.nombres} ${p.apellidos}`.toLowerCase().includes(t)).slice(0, 8)
  }, [q, pacientes])

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search size={15} className="pointer-events-none absolute left-3 top-2.5 text-slate-400" />
        <input
          disabled={disabled}
          className={`${inputCls(error)} pl-9`}
          placeholder="Buscar por DNI, nombre o apellido…"
          value={abierto ? q : sel ? `${sel.doc} · ${nombreCompleto(sel)}` : q}
          onFocus={() => { setAbierto(true); setQ('') }}
          onChange={(e) => { setQ(e.target.value); setAbierto(true) }}
        />
      </div>
      {abierto && !disabled && (
        <ul className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {lista.length === 0 && <li className="px-3 py-2 text-sm text-slate-500">Sin resultados</li>}
          {lista.map((p) => (
            <li key={p.id}>
              <button type="button" className="flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-teal-50" onClick={() => { onChange(p.id); setAbierto(false); setQ('') }}>
                <span className="font-medium text-slate-900">{nombreCompleto(p)}</span>
                <span className="text-xs text-slate-500">{p.tipoDoc} {p.doc}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function Toasts() {
  const { toasts } = useStore()
  const color = { ok: 'bg-teal-700', error: 'bg-red-600', info: 'bg-slate-800' }
  return (
    <div className="no-print pointer-events-none fixed bottom-4 right-4 z-[60] flex flex-col gap-2" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`pointer-events-auto max-w-sm rounded-lg px-4 py-2.5 text-sm text-white shadow-lg ${color[t.tipo]}`}>{t.msg}</div>
      ))}
    </div>
  )
}

export function Th({ children, className = '' }: { children?: ReactNode; className?: string }) {
  return <th className={`whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 ${className}`}>{children}</th>
}
export function Td({ children, className = '' }: { children?: ReactNode; className?: string }) {
  return <td className={`px-3 py-2.5 align-middle text-sm ${className}`}>{children}</td>
}
export const Tabla = ({ children }: { children: ReactNode }) => (
  <div className="overflow-x-auto"><table className="w-full divide-y divide-slate-100">{children}</table></div>
)
