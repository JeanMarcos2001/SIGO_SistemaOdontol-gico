import { useMemo, useState, type ReactNode } from 'react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Activity, CalendarCheck, FileDown, HeartPulse, Printer, Stethoscope, Users, Wallet } from 'lucide-react'
import { useStore } from '../store'
import { Btn, Card, Logo, Modal, PageHeader, Tabla, Td, Th, Vacio } from '../components/ui'
import { FiltroPeriodo, cubetas, enPeriodo, etiquetaPeriodo, periodoDe, type Periodo } from '../components/Periodo'
import { fechaISO, fmtFecha, soles } from '../lib/utils'

function Kpi({ titulo, valor, icono, color, sub }: { titulo: string; valor: string; icono: ReactNode; color: string; sub?: ReactNode }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${color}`}>{icono}</div>
      <div className="min-w-0">
        <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{titulo}</div>
        <div className="text-2xl font-bold text-slate-900">{valor}</div>
        {sub && <div className="text-xs text-slate-500">{sub}</div>}
      </div>
    </div>
  )
}

export function Dashboard() {
  const { pacientes, citas, tratamientos, pagos, servicios } = useStore()
  const hoy = new Date()
  const hoyISO = fechaISO(hoy)
  const [periodo, setPeriodo] = useState<Periodo>(() => periodoDe('mes'))
  const [reporte, setReporte] = useState(false)
  const valido = periodo.desde !== '' && periodo.hasta !== '' && periodo.desde <= periodo.hasta

  // KPIs de hoy (reaccionan a HU27: Asistió / No asistió)
  const citasHoy = citas.filter((c) => c.inicio.slice(0, 10) === hoyISO && c.estado !== 'Cancelada' && c.estado !== 'Perdida')
  const hoyAsistio = citasHoy.filter((c) => c.estado === 'Asistió').length
  const hoyNoAsistio = citasHoy.filter((c) => c.estado === 'No asistió').length
  const enCurso = tratamientos.filter((t) => t.estado === 'En proceso').length

  // Datos del periodo seleccionado (HU21, HU22, HU23, HU24)
  const d = useMemo(() => {
    const citasP = valido ? citas.filter((c) => enPeriodo(c.inicio, periodo)) : []
    const asistidas = citasP.filter((c) => c.estado === 'Asistió')
    const pagosP = valido ? pagos.filter((p) => enPeriodo(p.fecha, periodo)) : []
    const tratP = valido ? tratamientos.filter((t) => enPeriodo(t.fecha, periodo)) : []

    const porServicio: Record<string, number> = {}
    tratP.forEach((t) => {
      const n = servicios.find((s) => s.id === t.servicioId)?.nombre ?? 'Otros'
      porServicio[n] = (porServicio[n] ?? 0) + 1
    })
    const ranking = Object.entries(porServicio).map(([nombre, total]) => ({ nombre, total })).sort((a, b) => b.total - a.total)

    const serie = valido ? cubetas(periodo).map((c) => {
      const asis = asistidas.filter((x) => x.inicio.slice(0, 10) >= c.desde && x.inicio.slice(0, 10) <= c.hasta)
      return {
        etiqueta: c.etiqueta,
        pacientes: new Set(asis.map((x) => x.pacienteId)).size,
        ingresos: pagosP.filter((p) => p.fecha >= c.desde && p.fecha <= c.hasta).reduce((s, p) => s + p.monto, 0),
      }
    }) : []

    const porMetodo: Record<string, number> = {}
    pagosP.forEach((p) => { porMetodo[p.metodo] = (porMetodo[p.metodo] ?? 0) + p.monto })
    const noAsistio = citasP.filter((c) => c.estado === 'No asistió').length

    return {
      pacientesAtendidos: new Set(asistidas.map((c) => c.pacienteId)).size,
      atenciones: asistidas.length,
      ingresos: pagosP.reduce((s, p) => s + p.monto, 0),
      nPagos: pagosP.length,
      tratamientos: tratP.length,
      ranking, serie, porMetodo,
      programadas: citasP.filter((c) => c.estado === 'Programada').length,
      noAsistio,
      canceladas: citasP.filter((c) => c.estado === 'Cancelada').length,
      perdidas: citasP.filter((c) => c.estado === 'Perdida').length,
      tasa: asistidas.length + noAsistio > 0 ? Math.round((asistidas.length / (asistidas.length + noAsistio)) * 100) : null,
    }
  }, [citas, pagos, tratamientos, servicios, periodo, valido])

  const sinDatos = (ok: boolean, h = 'h-64') => ok ? null : <Vacio><span className={`flex ${h} items-center justify-center`}>Sin datos en el periodo seleccionado.</span></Vacio>

  return (
    <>
      <PageHeader titulo="Dashboard gerencial" sub={`Resumen de la clínica · ${hoy.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`}
        acciones={<Btn onClick={() => setReporte(true)} disabled={!valido}><FileDown size={16} /> Exportar / imprimir reporte</Btn>} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Kpi titulo="Pacientes registrados" valor={String(pacientes.length)} icono={<Users className="text-sky-700" />} color="bg-sky-100" />
        <Kpi titulo="Citas de hoy" valor={String(citasHoy.length)} icono={<CalendarCheck className="text-teal-700" />} color="bg-teal-100"
          sub={<><b className="text-green-700">{hoyAsistio}</b> asistió · <b className="text-orange-600">{hoyNoAsistio}</b> no asistió · {citasHoy.length - hoyAsistio - hoyNoAsistio} pendientes</>} />
        <Kpi titulo="Tratamientos en curso" valor={String(enCurso)} icono={<Activity className="text-violet-700" />} color="bg-violet-100" />
      </div>

      <Card className="mt-4">
        <div className="mb-1 text-sm font-semibold text-slate-900">Periodo del reporte</div>
        <FiltroPeriodo valor={periodo} onCambio={setPeriodo} />
      </Card>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi titulo="Pacientes atendidos" valor={String(d.pacientesAtendidos)} icono={<HeartPulse className="text-sky-700" />} color="bg-sky-100" sub={`${d.atenciones} atenciones en el periodo`} />
        <Kpi titulo="Ingresos generales" valor={soles(d.ingresos)} icono={<Wallet className="text-emerald-700" />} color="bg-emerald-100" sub={`${d.nPagos} pagos registrados`} />
        <Kpi titulo="Tratamientos solicitados" valor={String(d.tratamientos)} icono={<Stethoscope className="text-violet-700" />} color="bg-violet-100" sub={d.ranking[0] ? `Top: ${d.ranking[0].nombre}` : 'Sin registros'} />
        <Kpi titulo="Tasa de asistencia" valor={d.tasa === null ? '—' : `${d.tasa}%`} icono={<CalendarCheck className="text-teal-700" />} color="bg-teal-100" sub={`${d.noAsistio} inasistencias`} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card titulo="Pacientes atendidos (HU21)">
          {sinDatos(d.pacientesAtendidos > 0) ?? (
            <div role="img" aria-label="Gráfico de barras de pacientes atendidos en el periodo" className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={d.serie} margin={{ left: -12, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="etiqueta" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => [String(v), 'Pacientes atendidos']} />
                  <Bar dataKey="pacientes" fill="#0284c7" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card titulo="Ingresos generales — tendencia (HU23)">
          {sinDatos(d.ingresos > 0) ?? (
            <div role="img" aria-label="Gráfico de líneas de ingresos del periodo" className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={d.serie} margin={{ left: 0, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="etiqueta" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `S/${v}`} width={60} />
                  <Tooltip formatter={(v) => [soles(Number(v)), 'Ingresos']} />
                  <Line type="monotone" dataKey="ingresos" stroke="#0d9488" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card titulo="Tratamientos más solicitados (HU22)" className="xl:col-span-2">
          {sinDatos(d.ranking.length > 0, 'h-56') ?? (
            <div role="img" aria-label="Gráfico de barras de tratamientos más solicitados" style={{ height: Math.max(180, d.ranking.length * 48) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={d.ranking} layout="vertical" margin={{ left: 8, right: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="nombre" width={170} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => [`${v} tratamientos`, 'Frecuencia']} />
                  <Bar dataKey="total" fill="#0d9488" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      {reporte && (
        <Modal abierto onCerrar={() => setReporte(false)} titulo="Vista previa del reporte consolidado" ancho="max-w-3xl"
          pie={<><Btn variante="sec" onClick={() => setReporte(false)}>Cerrar</Btn><Btn onClick={() => window.print()}><Printer size={15} /> Imprimir / Guardar PDF</Btn></>}>
          <article className="text-sm text-slate-800">
            <header className="flex items-center justify-between border-b-2 border-teal-600 pb-3">
              <Logo size={42} />
              <div className="text-right text-xs text-slate-500">
                <div className="text-sm font-bold text-slate-900">Reporte consolidado</div>
                {etiquetaPeriodo(periodo)}
              </div>
            </header>

            <h4 className="mt-5 mb-2 font-semibold text-teal-800">1. Pacientes atendidos (HU21)</h4>
            <Tabla>
              <thead><tr><Th>Pacientes atendidos</Th><Th>Atenciones (asistencias)</Th><Th>Inasistencias</Th><Th>Programadas</Th><Th>Canceladas / Perdidas</Th></tr></thead>
              <tbody><tr><Td className="font-bold">{d.pacientesAtendidos}</Td><Td>{d.atenciones}</Td><Td>{d.noAsistio}</Td><Td>{d.programadas}</Td><Td>{d.canceladas} / {d.perdidas}</Td></tr></tbody>
            </Tabla>

            <h4 className="mt-5 mb-2 font-semibold text-teal-800">2. Tratamientos más solicitados (HU22)</h4>
            <Tabla>
              <thead><tr><Th>Tratamiento</Th><Th className="text-right">Frecuencia</Th><Th className="w-1/3" /></tr></thead>
              <tbody>
                {d.ranking.length === 0 && <tr><Td>Sin tratamientos en el periodo</Td><Td /><Td /></tr>}
                {d.ranking.map((r) => (
                  <tr key={r.nombre}>
                    <Td>{r.nombre}</Td><Td className="text-right">{r.total}</Td>
                    <Td><div className="h-2.5 rounded bg-teal-600" style={{ width: `${(r.total / d.ranking[0].total) * 100}%` }} /></Td>
                  </tr>
                ))}
              </tbody>
            </Tabla>

            <h4 className="mt-5 mb-2 font-semibold text-teal-800">3. Ingresos generales (HU23)</h4>
            <p className="mb-2">Total recaudado: <b className="text-base">{soles(d.ingresos)}</b> en {d.nPagos} pagos.</p>
            <Tabla>
              <thead><tr><Th>Método de pago</Th><Th className="text-right">Monto</Th></tr></thead>
              <tbody>
                {Object.keys(d.porMetodo).length === 0 && <tr><Td>Sin pagos en el periodo</Td><Td /></tr>}
                {Object.entries(d.porMetodo).map(([m, v]) => <tr key={m}><Td>{m}</Td><Td className="text-right">{soles(v)}</Td></tr>)}
              </tbody>
            </Tabla>
            <Tabla>
              <thead><tr><Th>{d.serie.length > 31 ? 'Mes' : 'Fecha / semana'}</Th><Th className="text-right">Pacientes atendidos</Th><Th className="text-right">Ingresos</Th></tr></thead>
              <tbody>{d.serie.filter((s) => s.ingresos > 0 || s.pacientes > 0).map((s) => <tr key={s.etiqueta}><Td>{s.etiqueta}</Td><Td className="text-right">{s.pacientes}</Td><Td className="text-right">{soles(s.ingresos)}</Td></tr>)}</tbody>
            </Tabla>
            <p className="mt-6 text-center text-[11px] text-slate-400">Generado el {fmtFecha(hoyISO)} · Salud Bucal</p>
          </article>
        </Modal>
      )}
    </>
  )
}
