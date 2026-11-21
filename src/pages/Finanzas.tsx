import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Banknote, FileText, Receipt, Wallet } from 'lucide-react'
import { useStore } from '../store'
import { Alerta, Badge, Btn, Campo, Card, PacienteSelect, PageHeader, Tabla, Tabs, Td, Th, Vacio, inputCls } from '../components/ui'
import { ComprobanteModal, numeroComprobante } from '../components/Comprobante'
import { FiltroPeriodo, enPeriodo, etiquetaPeriodo, periodoDe, type Periodo } from '../components/Periodo'
import { fechaISO, fmtFecha, nombreCompleto, soles } from '../lib/utils'
import type { MetodoPago, Pago } from '../types'

const METODOS: MetodoPago[] = ['Efectivo', 'Tarjeta', 'Transferencia']

type Tab = 'pago' | 'pendientes' | 'servicios' | 'historial'
interface Precarga { pacienteId: string; tratId: string; clave: number }

export function Finanzas() {
  const [tab, setTab] = useState<Tab>('pago')
  const [ver, setVer] = useState<Pago | null>(null)
  const [pre, setPre] = useState<Precarga | null>(null)

  const cobrar = (pacienteId: string, tratId: string) => {
    setPre({ pacienteId, tratId, clave: Date.now() })
    setTab('pago')
  }

  return (
    <>
      <PageHeader titulo="Pagos y comprobantes" sub="Cobros, cuentas por cobrar, ingresos por servicio e historial de transacciones" />
      <Tabs valor={tab} onCambio={setTab} opciones={[
        { id: 'pago', label: 'Registrar pago' },
        { id: 'pendientes', label: 'Pagos pendientes (cuentas por cobrar)' },
        { id: 'servicios', label: 'Ingresos por servicio' },
        { id: 'historial', label: 'Historial de transacciones' },
      ]} />
      {tab === 'pago' && <RegistrarPago key={pre?.clave ?? 0} inicial={pre} onVer={setVer} />}
      {tab === 'pendientes' && <Pendientes onCobrar={cobrar} />}
      {tab === 'servicios' && <IngresosServicio />}
      {tab === 'historial' && <Historial onVer={setVer} />}
      {ver && <ComprobanteModal pago={ver} onCerrar={() => setVer(null)} />}
    </>
  )
}

function RegistrarPago({ inicial, onVer }: { inicial: Precarga | null; onVer: (p: Pago) => void }) {
  const { pacientes, tratamientos, pagos, pacienteCtx, saldoTratamiento, registrarPago, aviso } = useStore()
  const [pacienteId, setPacienteId] = useState(inicial?.pacienteId ?? pacienteCtx ?? '')
  const [tratId, setTratId] = useState(inicial?.tratId ?? '')
  const [monto, setMonto] = useState(() => (inicial ? String(saldoTratamiento(inicial.tratId)) : ''))
  const [metodo, setMetodo] = useState<MetodoPago | ''>('')
  const [intento, setIntento] = useState(false)
  const [ultimo, setUltimo] = useState<Pago | null>(null)

  const cuenta = tratamientos.filter((t) => t.pacienteId === pacienteId)
  const pendientes = cuenta.filter((t) => saldoTratamiento(t.id) > 0)
  const trat = pendientes.find((t) => t.id === tratId)
  const saldo = trat ? saldoTratamiento(trat.id) : 0
  const montoN = Number(monto)

  let errMonto: string | undefined
  if (!(montoN > 0)) errMonto = 'El monto debe ser mayor a S/ 0.00.'
  else if (trat && montoN > saldo + 1e-9) errMonto = `El monto excede el saldo pendiente (${soles(saldo)}).`
  const errMetodo = !metodo ? 'Selecciona el método de pago.' : undefined

  const registrar = () => {
    setIntento(true)
    if (!pacienteId || !trat || errMonto || !metodo) return
    const p = registrarPago({
      pacienteId, tratamientoId: trat.id,
      concepto: `${trat.descripcion}${trat.pieza !== '—' ? ` (pieza ${trat.pieza})` : ''}${montoN < saldo - 1e-9 ? ' — a cuenta' : ' — cancelación'}`,
      monto: Math.round(montoN * 100) / 100, metodo, fecha: fechaISO(new Date()),
    })
    setUltimo(p)
    setMonto(''); setTratId(''); setMetodo(''); setIntento(false)
    aviso(`Pago de ${soles(p.monto)} registrado (${p.metodo}).`)
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <Card titulo={<span className="flex items-center gap-2"><Wallet size={17} /> Nuevo pago</span>}>
        <div className="space-y-4">
          {inicial && !ultimo && <Alerta tipo="info">Datos precargados desde <b>Pagos pendientes</b>. Elige el método de pago y registra el cobro.</Alerta>}
          {ultimo && (
            <Alerta tipo="ok">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span>Pago registrado ({ultimo.metodo}) · comprobante <b>{numeroComprobante(ultimo)}</b></span>
                <Btn pequeño onClick={() => onVer(ultimo)}><Receipt size={14} /> Emitir / Descargar comprobante PDF</Btn>
              </div>
            </Alerta>
          )}
          <Campo label="Paciente *" error={intento && !pacienteId ? 'Selecciona un paciente.' : undefined}>
            <PacienteSelect value={pacienteId} onChange={(id) => { setPacienteId(id); setTratId(''); setMonto(''); setUltimo(null) }} />
          </Campo>

          <div>
            <div className="mb-1.5 text-sm font-medium text-slate-700">Tratamientos / consultas pendientes de pago *</div>
            {!pacienteId ? <p className="text-sm text-slate-500">Selecciona un paciente para ver sus deudas.</p>
              : pendientes.length === 0 ? <Alerta tipo="info">Este paciente no tiene saldos pendientes.</Alerta> : (
                <div className="space-y-2" role="radiogroup">
                  {pendientes.map((t) => (
                    <label key={t.id} className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm ${tratId === t.id ? 'border-teal-500 bg-teal-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                      <input type="radio" name="trat" checked={tratId === t.id} onChange={() => { setTratId(t.id); setMonto(String(saldoTratamiento(t.id))) }} className="accent-teal-600" />
                      <span className="flex-1"><span className="font-medium text-slate-900">{t.descripcion}</span><span className="block text-xs text-slate-500">Pieza {t.pieza} · Costo {soles(t.costo)}</span></span>
                      <span className="font-semibold text-red-600">{soles(saldoTratamiento(t.id))}</span>
                    </label>
                  ))}
                </div>
              )}
            {intento && pacienteId && pendientes.length > 0 && !trat && <p className="mt-1 text-xs font-medium text-red-600">Selecciona qué se va a pagar.</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo label="Monto a pagar (S/) *" error={intento || monto ? errMonto : undefined}
              ayuda={trat ? `Saldo: ${soles(saldo)} · puede pagar total o a cuenta` : undefined}>
              <div className="flex gap-2">
                <input type="number" min="0" step="0.01" className={inputCls(intento || monto ? errMonto : undefined)} value={monto} onChange={(e) => setMonto(e.target.value)} />
                {trat && <Btn variante="sec" pequeño onClick={() => setMonto(String(saldo))}>Total</Btn>}
              </div>
            </Campo>
            <Campo label="Método de pago *" error={intento ? errMetodo : undefined}>
              <select className={inputCls(intento ? errMetodo : undefined)} value={metodo} onChange={(e) => setMetodo(e.target.value as MetodoPago)} aria-required>
                <option value="">Selecciona…</option>
                {METODOS.map((m) => <option key={m}>{m}</option>)}
              </select>
            </Campo>
          </div>
          <Btn className="w-full" onClick={registrar}>Registrar pago</Btn>
        </div>
      </Card>

      <Card titulo="Estado de cuenta del paciente">
        {!pacienteId ? <Vacio>Selecciona un paciente.</Vacio> : cuenta.length === 0 ? <Vacio>Sin tratamientos registrados.</Vacio> : (
          <>
            <p className="mb-3 text-sm font-medium text-slate-900">{nombreCompleto(pacientes.find((p) => p.id === pacienteId))}</p>
            <Tabla>
              <thead><tr><Th>Concepto</Th><Th className="text-right">Costo</Th><Th className="text-right">Pagado</Th><Th className="text-right">Saldo</Th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {cuenta.map((t) => {
                  const s = saldoTratamiento(t.id)
                  return (
                    <tr key={t.id}><Td>{t.descripcion}</Td><Td className="text-right">{soles(t.costo)}</Td>
                      <Td className="text-right text-green-700">{soles(pagos.filter((p) => p.tratamientoId === t.id).reduce((a, p) => a + p.monto, 0))}</Td>
                      <Td className="text-right">{s > 0 ? <span className="font-semibold text-red-600">{soles(s)}</span> : <Badge className="bg-green-100 text-green-700">Pagado</Badge>}</Td></tr>
                  )
                })}
              </tbody>
            </Tabla>
          </>
        )}
      </Card>
    </div>
  )
}

/** HU29 — Cuentas por cobrar */
function Pendientes({ onCobrar }: { onCobrar: (pacienteId: string, tratId: string) => void }) {
  const { tratamientos, pacientes, pagos, saldoTratamiento } = useStore()
  const [q, setQ] = useState('')

  const filas = useMemo(() => tratamientos
    .map((t) => ({ t, saldo: saldoTratamiento(t.id), p: pacientes.find((x) => x.id === t.pacienteId)! }))
    .filter((f) => f.saldo > 0 && f.p)
    .filter((f) => !q.trim() || `${f.p.doc} ${f.p.nombres} ${f.p.apellidos}`.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => nombreCompleto(a.p).localeCompare(nombreCompleto(b.p)) || b.saldo - a.saldo),
  [tratamientos, pacientes, saldoTratamiento, q])

  const total = filas.reduce((s, f) => s + f.saldo, 0)
  const deudores = new Set(filas.map((f) => f.p.id)).size

  return (
    <Card titulo={<span className="flex items-center gap-2"><Banknote size={17} /> Cuentas por cobrar</span>}
      acciones={<input className={`${inputCls()} !w-64`} placeholder="Buscar paciente (DNI o nombre)…" value={q} onChange={(e) => setQ(e.target.value)} />}>
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Resumen k="Total por cobrar" v={soles(total)} rojo />
        <Resumen k="Conceptos pendientes" v={String(filas.length)} />
        <Resumen k="Pacientes con deuda" v={String(deudores)} />
      </div>
      {filas.length === 0 ? <Vacio>No hay pagos pendientes. ¡Todo está al día!</Vacio> : (
        <Tabla>
          <thead><tr><Th>Paciente</Th><Th>Concepto / servicio</Th><Th className="text-right">Costo</Th><Th className="text-right">Pagado</Th><Th className="text-right">Monto adeudado</Th><Th /></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {filas.map(({ t, saldo, p }) => (
              <tr key={t.id} className="hover:bg-slate-50">
                <Td><span className="font-medium text-slate-900">{nombreCompleto(p)}</span><span className="block text-xs text-slate-500">{p.tipoDoc} {p.doc}</span></Td>
                <Td>{t.descripcion}{t.pieza !== '—' && <span className="text-xs text-slate-500"> · pieza {t.pieza}</span>}</Td>
                <Td className="text-right">{soles(t.costo)}</Td>
                <Td className="text-right text-green-700">{soles(pagos.filter((x) => x.tratamientoId === t.id).reduce((a, x) => a + x.monto, 0))}</Td>
                <Td className="text-right font-semibold text-red-600">{soles(saldo)}</Td>
                <Td className="text-right"><Btn pequeño onClick={() => onCobrar(p.id, t.id)}>Cobrar ahora</Btn></Td>
              </tr>
            ))}
          </tbody>
        </Tabla>
      )}
    </Card>
  )
}

const Resumen = ({ k, v, rojo }: { k: string; v: string; rojo?: boolean }) => (
  <div className="rounded-lg bg-slate-50 px-3 py-2.5"><div className="text-xs text-slate-500">{k}</div><div className={`text-lg font-bold ${rojo ? 'text-red-600' : 'text-slate-900'}`}>{v}</div></div>
)

/** HU20 — Ingresos por servicio */
function IngresosServicio() {
  const { pagos, tratamientos, servicios } = useStore()
  const [periodo, setPeriodo] = useState<Periodo>(() => periodoDe('trimestre'))

  const { filas, total, nPagos } = useMemo(() => {
    const acc: Record<string, { servicio: string; atenciones: number; monto: number }> = {}
    pagos.filter((p) => enPeriodo(p.fecha, periodo)).forEach((p) => {
      const t = tratamientos.find((x) => x.id === p.tratamientoId)
      const nombre = servicios.find((s) => s.id === t?.servicioId)?.nombre ?? 'Otros servicios'
      acc[nombre] ??= { servicio: nombre, atenciones: 0, monto: 0 }
      acc[nombre].atenciones += 1
      acc[nombre].monto += p.monto
    })
    const filas = Object.values(acc).sort((a, b) => b.monto - a.monto)
    return { filas, total: filas.reduce((s, f) => s + f.monto, 0), nPagos: filas.reduce((s, f) => s + f.atenciones, 0) }
  }, [pagos, tratamientos, servicios, periodo])

  return (
    <div className="space-y-4">
      <Card><FiltroPeriodo valor={periodo} onCambio={setPeriodo} /></Card>
      {filas.length === 0 ? <Vacio>No hay pagos registrados en {etiquetaPeriodo(periodo)}.</Vacio> : (
        <div className="grid gap-4 xl:grid-cols-2">
          <Card titulo="Monto recaudado por servicio">
            <div role="img" aria-label="Gráfico de barras de ingresos por servicio" className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filas} margin={{ left: 0, right: 8, bottom: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="servicio" tick={{ fontSize: 11 }} interval={0} angle={-18} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `S/${v}`} width={64} />
                  <Tooltip formatter={(v, _n, i) => [soles(Number(v)), `${(i.payload as { atenciones: number }).atenciones} atenciones`]} />
                  <Bar dataKey="monto" fill="#0d9488" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card titulo="Resumen por servicio">
            <Tabla>
              <thead><tr><Th>Servicio</Th><Th className="text-right">Atenciones</Th><Th className="text-right">Monto total</Th><Th className="text-right">%</Th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {filas.map((f) => (
                  <tr key={f.servicio}><Td className="font-medium text-slate-900">{f.servicio}</Td><Td className="text-right">{f.atenciones}</Td>
                    <Td className="text-right font-semibold">{soles(f.monto)}</Td><Td className="text-right text-slate-500">{Math.round((f.monto / total) * 100)}%</Td></tr>
                ))}
              </tbody>
              <tfoot><tr className="bg-slate-50"><Td className="font-bold">Total</Td><Td className="text-right font-bold">{nPagos}</Td><Td className="text-right font-bold text-teal-700">{soles(total)}</Td><Td /></tr></tfoot>
            </Tabla>
          </Card>
        </div>
      )}
    </div>
  )
}

function Historial({ onVer }: { onVer: (p: Pago) => void }) {
  const { pagos, pacientes } = useStore()
  const [pac, setPac] = useState('')
  const [metodo, setMetodo] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')

  const lista = useMemo(() => pagos
    .filter((p) => (!pac || p.pacienteId === pac) && (!metodo || p.metodo === metodo) && (!desde || p.fecha >= desde) && (!hasta || p.fecha <= hasta))
    .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.correlativo - a.correlativo), [pagos, pac, metodo, desde, hasta])
  const total = lista.reduce((s, p) => s + p.monto, 0)

  return (
    <Card>
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Campo label="Paciente">
          <select className={inputCls()} value={pac} onChange={(e) => setPac(e.target.value)}>
            <option value="">Todos</option>
            {pacientes.map((p) => <option key={p.id} value={p.id}>{nombreCompleto(p)}</option>)}
          </select>
        </Campo>
        <Campo label="Método de pago">
          <select className={inputCls()} value={metodo} onChange={(e) => setMetodo(e.target.value)}>
            <option value="">Todos</option>{METODOS.map((m) => <option key={m}>{m}</option>)}
          </select>
        </Campo>
        <Campo label="Desde"><input type="date" className={inputCls()} value={desde} onChange={(e) => setDesde(e.target.value)} /></Campo>
        <Campo label="Hasta"><input type="date" className={inputCls()} value={hasta} onChange={(e) => setHasta(e.target.value)} /></Campo>
      </div>
      {lista.length === 0 ? <Vacio>No hay transacciones con esos filtros.</Vacio> : (
        <Tabla>
          <thead><tr><Th>Comprobante</Th><Th>Fecha</Th><Th>Paciente</Th><Th>Concepto</Th><Th>Método de pago</Th><Th className="text-right">Monto</Th><Th /></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {lista.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <Td className="font-mono text-xs">{numeroComprobante(p)}</Td>
                <Td>{fmtFecha(p.fecha)}</Td>
                <Td className="font-medium text-slate-900">{nombreCompleto(pacientes.find((x) => x.id === p.pacienteId))}</Td>
                <Td className="max-w-[260px] truncate text-slate-500">{p.concepto}</Td>
                <Td><Badge>{p.metodo}</Badge></Td>
                <Td className="text-right font-semibold">{soles(p.monto)}</Td>
                <Td className="text-right"><Btn pequeño variante="sec" onClick={() => onVer(p)}><FileText size={14} /> Comprobante</Btn></Td>
              </tr>
            ))}
          </tbody>
          <tfoot><tr className="bg-slate-50"><Td className="font-semibold">{lista.length} transacciones</Td><Td /><Td /><Td /><Td /><Td className="text-right font-bold text-teal-700">{soles(total)}</Td><Td /></tr></tfoot>
        </Tabla>
      )}
    </Card>
  )
}
