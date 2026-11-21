import { Download, Printer } from 'lucide-react'
import { useStore } from '../store'
import { Btn, Logo, Modal } from './ui'
import { fmtFecha, nombreCompleto, soles } from '../lib/utils'
import type { Pago } from '../types'

export const numeroComprobante = (p: Pago) => `${p.serie}-${String(p.correlativo).padStart(6, '0')}`

export function ComprobanteModal({ pago, onCerrar }: { pago: Pago; onCerrar: () => void }) {
  const { pacientes, tratamientos, saldoTratamiento } = useStore()
  const pac = pacientes.find((p) => p.id === pago.pacienteId)
  const trat = tratamientos.find((t) => t.id === pago.tratamientoId)
  const saldo = saldoTratamiento(pago.tratamientoId)

  return (
    <Modal
      abierto onCerrar={onCerrar} titulo="Vista previa del comprobante" ancho="max-w-2xl"
      pie={<>
        <Btn variante="sec" onClick={onCerrar}>Cerrar</Btn>
        <Btn variante="sec" onClick={() => window.print()}><Printer size={15} /> Imprimir</Btn>
        <Btn onClick={() => window.print()}><Download size={15} /> Descargar PDF</Btn>
      </>}
    >
      <article className="mx-auto max-w-xl rounded-lg border border-slate-300 bg-white p-6 text-sm text-slate-800">
        <header className="flex items-start justify-between gap-4 border-b-2 border-teal-600 pb-4">
          <div>
            <Logo size={44} />
            <p className="mt-2 text-xs text-slate-500">Av. Arequipa 1234, Lince · Lima, Perú<br />Tel. (01) 445-2200 · contacto@saludbucal.pe</p>
          </div>
          <div className="rounded-lg border-2 border-teal-600 px-4 py-2 text-center">
            <div className="text-xs font-semibold text-slate-600">RUC 20601234567</div>
            <div className="text-xs font-bold uppercase text-teal-700">Boleta de venta electrónica</div>
            <div className="mt-0.5 font-mono text-base font-bold">{numeroComprobante(pago)}</div>
          </div>
        </header>

        <section className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
          <div><span className="text-slate-500">Paciente:</span> <b>{nombreCompleto(pac)}</b></div>
          <div><span className="text-slate-500">Fecha de emisión:</span> <b>{fmtFecha(pago.fecha)}</b></div>
          <div><span className="text-slate-500">{pac?.tipoDoc}:</span> <b>{pac?.doc}</b></div>
          <div><span className="text-slate-500">Método de pago:</span> <b>{pago.metodo}</b></div>
          <div className="col-span-2"><span className="text-slate-500">Dirección:</span> {pac?.direccion}</div>
        </section>

        <table className="mt-4 w-full text-xs">
          <thead>
            <tr className="bg-teal-50 text-left text-slate-600">
              <th className="px-2 py-1.5">Cant.</th><th className="px-2 py-1.5">Descripción del servicio</th><th className="px-2 py-1.5 text-right">Importe</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-200">
              <td className="px-2 py-2">1</td>
              <td className="px-2 py-2">{pago.concepto}{trat && trat.pieza !== '—' && !pago.concepto.toLowerCase().includes(`pieza ${trat.pieza}`) ? ` · Pieza ${trat.pieza}` : ''}</td>
              <td className="px-2 py-2 text-right">{soles(pago.monto)}</td>
            </tr>
          </tbody>
        </table>

        <section className="mt-3 ml-auto w-56 space-y-1 text-xs">
          <div className="flex justify-between"><span className="text-slate-500">Op. exonerada</span><span>{soles(pago.monto)}</span></div>
          <div className="flex justify-between border-t border-slate-300 pt-1 text-base font-bold text-slate-900"><span>TOTAL</span><span>{soles(pago.monto)}</span></div>
          <div className="flex justify-between text-slate-500"><span>Saldo pendiente del servicio</span><span>{soles(Math.max(0, saldo))}</span></div>
        </section>

        <footer className="mt-6 border-t border-dashed border-slate-300 pt-3 text-center text-[11px] text-slate-500">
          Servicios de salud exonerados de IGV. Representación impresa de la boleta de venta electrónica.<br />
          Documento generado por el sistema Salud Bucal — vista simulada de reporte JasperReports.
        </footer>
      </article>
    </Modal>
  )
}
