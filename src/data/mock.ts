import type {
  Atencion, Cita, Horario, MetodoPago, Odontograma, Odontologo, Pago, Paciente, Servicio, Tratamiento, Usuario,
} from '../types'
import { addDias, dateTimeISO, diaHabil, fechaISO, lunesDeSemana } from '../lib/utils'

export const SERVICIOS: Servicio[] = [
  { id: 's1', nombre: 'Consulta general', tarifa: 50 },
  { id: 's2', nombre: 'Curación dental (caries)', tarifa: 120 },
  { id: 's3', nombre: 'Profilaxis', tarifa: 80 },
  { id: 's4', nombre: 'Endodoncia', tarifa: 450 },
  { id: 's5', nombre: 'Ortodoncia', tarifa: 1800 },
  { id: 's6', nombre: 'Extracción simple', tarifa: 100 },
  { id: 's7', nombre: 'Corona dental', tarifa: 600 },
]

export const CIE10 = [
  { codigo: 'K02.0', nombre: 'Caries limitada al esmalte' },
  { codigo: 'K02.1', nombre: 'Caries de la dentina' },
  { codigo: 'K03.6', nombre: 'Depósitos (acreciones) en los dientes' },
  { codigo: 'K04.0', nombre: 'Pulpitis' },
  { codigo: 'K04.1', nombre: 'Necrosis de la pulpa' },
  { codigo: 'K05.1', nombre: 'Gingivitis crónica' },
  { codigo: 'K05.3', nombre: 'Periodontitis crónica' },
  { codigo: 'K07.2', nombre: 'Anomalías de la relación entre los arcos dentarios' },
  { codigo: 'K08.1', nombre: 'Pérdida de dientes por extracción o enfermedad periodontal' },
  { codigo: 'K01.1', nombre: 'Diente impactado' },
]

export const USUARIOS: Usuario[] = [
  { id: 'u1', nombre: 'Marcela Vidal (Administración)', email: 'admin@saludbucal.pe', rol: 'admin', activo: true },
  { id: 'u2', nombre: 'Karen Salas (Recepción)', email: 'recepcion@saludbucal.pe', rol: 'recepcion', activo: true },
  { id: 'u3', nombre: 'Dr. Carlos Mendoza', email: 'cmendoza@saludbucal.pe', rol: 'odontologo', activo: true, odontologoId: 'o1' },
  { id: 'u4', nombre: 'Dra. Valeria Rojas', email: 'vrojas@saludbucal.pe', rol: 'odontologo', activo: true, odontologoId: 'o2' },
  { id: 'u5', nombre: 'Pedro Aguilar (Caja)', email: 'caja@saludbucal.pe', rol: 'finanzas', activo: true },
  { id: 'u6', nombre: 'Rosa Quispe (Paciente)', email: 'rquispe@correo.pe', rol: 'paciente', activo: true, pacienteId: 'p1' },
]

export const ODONTOLOGOS: Odontologo[] = [
  { id: 'o1', nombre: 'Dr. Carlos Mendoza', cmp: '28451', especialidad: 'Odontología General', telefono: '987 654 321', activo: true },
  { id: 'o2', nombre: 'Dra. Valeria Rojas', cmp: '31207', especialidad: 'Ortodoncia', telefono: '986 112 233', activo: true },
  { id: 'o3', nombre: 'Dr. Luis Paredes', cmp: '25890', especialidad: 'Endodoncia', telefono: '985 778 899', activo: true },
]

export const PACIENTES: Paciente[] = [
  {
    id: 'p1', tipoDoc: 'DNI', doc: '45872136', nombres: 'Rosa Elena', apellidos: 'Quispe Huamán', nacimiento: '1988-03-14',
    telefono: '987123456', email: 'rquispe@correo.pe', direccion: 'Av. Los Olivos 345, Los Olivos, Lima',
    emergenciaNombre: 'Julio Quispe (esposo)', emergenciaTel: '987123400',
    antecedentes: { alergias: 'Penicilina', enfermedades: 'Hipertensión controlada', medicacion: 'Losartán 50 mg' },
  },
  {
    id: 'p2', tipoDoc: 'DNI', doc: '70234518', nombres: 'Jorge Luis', apellidos: 'Flores Salazar', nacimiento: '2001-09-02',
    telefono: '945871236', email: 'jflores@correo.pe', direccion: 'Jr. Huancavelica 120, Cercado de Lima',
    emergenciaNombre: 'Carmen Salazar (madre)', emergenciaTel: '945000111',
    antecedentes: { alergias: 'Ninguna conocida', enfermedades: 'Ninguna', medicacion: 'Ninguna' },
  },
  {
    id: 'p3', tipoDoc: 'DNI', doc: '72918453', nombres: 'María Fernanda', apellidos: 'Castillo Vega', nacimiento: '1995-12-21',
    telefono: '956321478', email: 'mcastillo@correo.pe', direccion: 'Calle Las Magnolias 88, San Miguel, Lima',
    emergenciaNombre: 'Héctor Castillo (padre)', emergenciaTel: '956000222',
    antecedentes: { alergias: 'Látex', enfermedades: 'Asma leve', medicacion: 'Salbutamol (inhalador) según necesidad' },
  },
  {
    id: 'p4', tipoDoc: 'DNI', doc: '41085296', nombres: 'Andrés Felipe', apellidos: 'Gutiérrez Mamani', nacimiento: '1979-06-30',
    telefono: '931456789', email: 'agutierrez@correo.pe', direccion: 'Av. Brasil 1560, Jesús María, Lima',
    emergenciaNombre: 'Silvia Mamani (esposa)', emergenciaTel: '931000333',
    antecedentes: { alergias: 'Ninguna conocida', enfermedades: 'Diabetes tipo 2', medicacion: 'Metformina 850 mg' },
  },
  {
    id: 'p5', tipoDoc: 'DNI', doc: '76345120', nombres: 'Lucía Alejandra', apellidos: 'Torres Condori', nacimiento: '2010-01-18',
    telefono: '914785236', email: 'ltorres.apoderado@correo.pe', direccion: 'Psje. Santa Rosa 45, Surco, Lima',
    emergenciaNombre: 'Elena Condori (madre)', emergenciaTel: '914000444',
    antecedentes: { alergias: 'Ninguna conocida', enfermedades: 'Ninguna', medicacion: 'Ninguna' },
  },
]

const bloques = (odontologoId: string, dias: number[], tarde: number[]): Horario[] => [
  ...dias.map((dia) => ({ id: `h-${odontologoId}-${dia}-m`, odontologoId, dia, inicio: '09:00', fin: '13:00' })),
  ...tarde.map((dia) => ({ id: `h-${odontologoId}-${dia}-t`, odontologoId, dia, inicio: '15:00', fin: '19:00' })),
]

export const HORARIOS: Horario[] = [
  ...bloques('o1', [1, 2, 3, 4, 5, 6], [1, 2, 3, 4, 5, 6]),
  ...bloques('o2', [1, 2, 3, 4, 5, 6], [1, 2, 3, 4, 5]),
  ...bloques('o3', [1, 2, 3, 4, 5, 6], [1, 2, 3, 4, 5]),
]

const hoy = () => new Date()
const lunes = () => lunesDeSemana(hoy())
const en = (fecha: Date, hhmm: string) => `${fechaISO(fecha)}T${hhmm}`
const hace = (dias: number) => fechaISO(addDias(hoy(), -dias))

/** Retrocede al día hábil anterior si cae domingo */
const habilAtras = (dias: number) => {
  const d = addDias(hoy(), -dias)
  return d.getDay() === 0 ? addDias(d, -1) : d
}

/**
 * Historial de atenciones cobradas de los últimos ~3 meses:
 * [díasAtrás, paciente, servicio, pieza, método, costo (opcional)]
 * Cada fila genera: una cita (Asistió), un tratamiento Finalizado y un pago completo.
 */
const HISTORIAL: [number, string, string, string, MetodoPago, number?][] = [
  [8, 'p4', 's3', '—', 'Efectivo'],
  [9, 'p5', 's2', '36', 'Efectivo', 110],
  [11, 'p1', 's3', '—', 'Tarjeta'],
  [12, 'p3', 's5', 'Arcadas', 'Transferencia', 150],
  [14, 'p2', 's5', 'Arcadas', 'Transferencia', 150],
  [15, 'p4', 's2', '17', 'Tarjeta'],
  [17, 'p1', 's1', '—', 'Efectivo'],
  [19, 'p5', 's3', '—', 'Efectivo'],
  [22, 'p3', 's4', '36', 'Tarjeta'],
  [25, 'p2', 's2', '25', 'Efectivo'],
  [28, 'p4', 's1', '—', 'Efectivo'],
  [31, 'p1', 's2', '26', 'Tarjeta'],
  [34, 'p5', 's6', '85', 'Efectivo'],
  [37, 'p2', 's5', 'Arcadas', 'Transferencia', 150],
  [40, 'p3', 's3', '—', 'Efectivo'],
  [43, 'p4', 's2', '37', 'Tarjeta'],
  [46, 'p1', 's3', '—', 'Efectivo'],
  [49, 'p5', 's2', '24', 'Efectivo', 110],
  [53, 'p3', 's1', '—', 'Efectivo'],
  [56, 'p2', 's5', 'Arcadas', 'Transferencia', 150],
  [60, 'p4', 's4', '47', 'Tarjeta'],
  [63, 'p1', 's2', '36', 'Efectivo'],
  [67, 'p5', 's3', '—', 'Efectivo'],
  [70, 'p3', 's2', '16', 'Tarjeta'],
  [74, 'p2', 's6', '18', 'Efectivo'],
  [78, 'p4', 's7', '47', 'Transferencia'],
  [82, 'p1', 's1', '—', 'Efectivo'],
  [86, 'p5', 's2', '55', 'Efectivo', 110],
  [90, 'p3', 's3', '—', 'Tarjeta'],
  [94, 'p2', 's2', '14', 'Efectivo'],
]

/** Citas históricas sin cobro: [díasAtrás, paciente, odontólogo, estado] */
const HIST_EXTRAS: [number, string, string, Cita['estado']][] = [
  [10, 'p2', 'o2', 'No asistió'],
  [20, 'p5', 'o1', 'Cancelada'],
  [33, 'p4', 'o1', 'No asistió'],
  [52, 'p1', 'o1', 'Perdida'],
  [75, 'p3', 'o3', 'No asistió'],
]

const HORAS = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00']
const odDe = (servicioId: string) => (servicioId === 's4' ? 'o3' : servicioId === 's5' ? 'o2' : 'o1')

function generarHistorial() {
  const citas: Cita[] = []
  const tratamientos: Tratamiento[] = []
  const pagos: Omit<Pago, 'correlativo'>[] = []
  const ocupado = new Set<string>()
  const libre = (od: string, fecha: string, hora0: number) => {
    for (let k = 0; k < HORAS.length; k++) {
      const h = HORAS[(hora0 + k) % HORAS.length]
      if (!ocupado.has(`${od}|${fecha}|${h}`)) { ocupado.add(`${od}|${fecha}|${h}`); return h }
    }
    return HORAS[0]
  }
  const nombreServ = (id: string) => SERVICIOS.find((s) => s.id === id)!

  HISTORIAL.forEach(([dias, pacienteId, servicioId, pieza, metodo, costoFijo], i) => {
    const fecha = fechaISO(habilAtras(dias))
    const od = odDe(servicioId)
    const hora = libre(od, fecha, (i * 3) % HORAS.length)
    const s = nombreServ(servicioId)
    const costo = costoFijo ?? s.tarifa
    const desc = servicioId === 's5' ? 'Ortodoncia: control mensual' : s.nombre
    const piezaTxt = pieza === '—' || pieza === 'Arcadas' ? '' : ` (pieza ${pieza})`
    citas.push({ id: `ch${i}`, pacienteId, odontologoId: od, inicio: `${fecha}T${hora}`, duracion: 30, estado: 'Asistió', motivo: desc })
    tratamientos.push({ id: `th${i}`, pacienteId, odontologoId: od, servicioId, descripcion: desc, pieza, fecha, costo, estado: 'Finalizado' })
    pagos.push({ id: `pgh${i}`, pacienteId, tratamientoId: `th${i}`, concepto: `${desc}${piezaTxt} — cancelación`, monto: costo, metodo, fecha, serie: 'B001' })
  })

  HIST_EXTRAS.forEach(([dias, pacienteId, od, estado], i) => {
    const fecha = fechaISO(habilAtras(dias))
    const hora = libre(od, fecha, (i * 5 + 2) % HORAS.length)
    citas.push({ id: `cx${i}`, pacienteId, odontologoId: od, inicio: `${fecha}T${hora}`, duracion: 30, estado, motivo: 'Consulta de control' })
  })

  return { citas, tratamientos, pagos }
}

export function crearCitas(): Cita[] {
  const ahora = dateTimeISO(hoy())
  const L = lunes()
  const h = diaHabil(hoy())
  const m = diaHabil(addDias(h, 1))
  const defs: [string, string, string, string, Cita['estado'], string][] = [
    ['c1', 'p1', 'o1', en(L, '09:00'), 'Asistió', 'Dolor en molar superior'],
    ['c2', 'p2', 'o2', en(addDias(L, 1), '10:00'), 'Perdida', 'Control de ortodoncia'],
    ['c3', 'p3', 'o3', en(addDias(L, 2), '16:00'), 'Asistió', 'Endodoncia pieza 46'],
    ['c4', 'p4', 'o1', en(addDias(L, 3), '11:00'), 'Cancelada', 'Evaluación general'],
    ['c5', 'p5', 'o1', en(h, '09:30'), 'Asistió', 'Curación pieza 24'],
    ['c6', 'p1', 'o2', en(h, '17:00'), 'Asistió', 'Consulta de ortodoncia'],
    ['c9', 'p4', 'o1', en(h, '18:00'), 'Asistió', 'Control de gingivitis'],
    ['c10', 'p5', 'o3', en(h, '18:30'), 'Asistió', 'Consulta de endodoncia'],
    ['c7', 'p3', 'o3', en(m, '10:00'), 'Asistió', 'Segunda sesión de endodoncia'],
    ['c8', 'p2', 'o1', en(m, '15:30'), 'Asistió', 'Profilaxis y control'],
    ['c11', 'p1', 'o1', en(m, '09:00'), 'Asistió', 'Profilaxis'],
    ['c12', 'p4', 'o2', en(m, '11:30'), 'Asistió', 'Evaluación de ortodoncia'],
  ]
  const base = defs.map(([id, pacienteId, odontologoId, inicio, seed, motivo]) => {
    let estado: Cita['estado']
    if (seed === 'Cancelada' || seed === 'Perdida') estado = seed
    else estado = inicio < ahora ? 'Asistió' : 'Programada'
    return { id, pacienteId, odontologoId, inicio, duracion: 30, estado, motivo }
  })
  return [...generarHistorial().citas, ...base]
}

export const ATENCIONES = (): Atencion[] => [
  {
    id: 'a1', citaId: 'c1', pacienteId: 'p1', odontologoId: 'o1', fecha: fechaISO(lunes()),
    motivo: 'Dolor en molar superior derecho al masticar', cie10: 'K02.1',
    diagnostico: 'Caries de la dentina en pieza 16', observaciones: 'Se realiza restauración con resina. Sin complicaciones.',
    receta: 'Ibuprofeno 400 mg cada 8 horas por 2 días si hay dolor.',
  },
  {
    id: 'a2', citaId: 'c3', pacienteId: 'p3', odontologoId: 'o3', fecha: fechaISO(addDias(lunes(), 2)),
    motivo: 'Dolor pulsátil nocturno en pieza 46', cie10: 'K04.0',
    diagnostico: 'Pulpitis irreversible en pieza 46', observaciones: 'Primera sesión de endodoncia: apertura cameral y pulpectomía. Medicación intraconducto.',
    receta: 'Amoxicilina + ác. clavulánico 875/125 mg cada 12 h por 5 días. Paracetamol 500 mg c/8 h.',
  },
  {
    id: 'a3', pacienteId: 'p2', odontologoId: 'o2', fecha: hace(90),
    motivo: 'Evaluación para ortodoncia', cie10: 'K07.2',
    diagnostico: 'Maloclusión clase II con apiñamiento anteroinferior', observaciones: 'Se indica tratamiento con brackets metálicos. Se toman radiografías y modelos.',
    receta: '',
  },
  {
    id: 'a4', pacienteId: 'p4', odontologoId: 'o1', fecha: hace(45),
    motivo: 'Sangrado de encías al cepillarse', cie10: 'K05.1',
    diagnostico: 'Gingivitis crónica', observaciones: 'Control glicémico recomendado. Se instruye técnica de cepillado.',
    receta: 'Clorhexidina 0.12% enjuague cada 12 h por 7 días.',
  },
  {
    id: 'a5', pacienteId: 'p5', odontologoId: 'o1', fecha: hace(30),
    motivo: 'Manchas oscuras en molar', cie10: 'K02.0',
    diagnostico: 'Caries limitada al esmalte en pieza 24', observaciones: 'Se programa curación. Aplicación de flúor.',
    receta: '',
  },
]

export const TRATAMIENTOS = (): Tratamiento[] => [
  ...generarHistorial().tratamientos,
  { id: 't1', pacienteId: 'p1', odontologoId: 'o1', servicioId: 's2', descripcion: 'Curación dental con resina', pieza: '16', fecha: fechaISO(lunes()), costo: 120, estado: 'Finalizado' },
  { id: 't2', pacienteId: 'p1', odontologoId: 'o1', servicioId: 's3', descripcion: 'Profilaxis y destartraje', pieza: '—', fecha: hace(0), costo: 80, estado: 'Pendiente' },
  { id: 't7', pacienteId: 'p1', odontologoId: 'o1', servicioId: 's1', descripcion: 'Consulta general', pieza: '—', fecha: hace(0), costo: 50, estado: 'Finalizado' },
  { id: 't3', pacienteId: 'p2', odontologoId: 'o2', servicioId: 's5', descripcion: 'Ortodoncia: brackets metálicos (plan completo)', pieza: 'Arcadas', fecha: hace(90), costo: 1800, estado: 'En proceso' },
  { id: 't4', pacienteId: 'p3', odontologoId: 'o3', servicioId: 's4', descripcion: 'Endodoncia unirradicular', pieza: '46', fecha: fechaISO(addDias(lunes(), 2)), costo: 450, estado: 'En proceso' },
  { id: 't5', pacienteId: 'p4', odontologoId: 'o1', servicioId: 's6', descripcion: 'Extracción simple de tercer molar', pieza: '38', fecha: hace(10), costo: 100, estado: 'Pendiente' },
  { id: 't8', pacienteId: 'p4', odontologoId: 'o1', servicioId: 's7', descripcion: 'Corona dental', pieza: '47', fecha: hace(2), costo: 600, estado: 'En proceso' },
  { id: 't6', pacienteId: 'p5', odontologoId: 'o1', servicioId: 's2', descripcion: 'Curación dental con resina', pieza: '24', fecha: hace(0), costo: 110, estado: 'En proceso' },
]

export const PAGOS = (): Pago[] => {
  const hist = generarHistorial().pagos.sort((a, b) => a.fecha.localeCompare(b.fecha))
  const recientes: Omit<Pago, 'correlativo'>[] = [
    { id: 'pg1', pacienteId: 'p1', tratamientoId: 't1', concepto: 'Curación dental con resina (pieza 16)', monto: 120, metodo: 'Efectivo', fecha: hace(4), serie: 'B001' },
    { id: 'pg2', pacienteId: 'p2', tratamientoId: 't3', concepto: 'Ortodoncia: brackets metálicos — cuota 1', monto: 600, metodo: 'Transferencia', fecha: hace(3), serie: 'B001' },
    { id: 'pg3', pacienteId: 'p3', tratamientoId: 't4', concepto: 'Endodoncia unirradicular (pieza 46) — a cuenta', monto: 200, metodo: 'Tarjeta', fecha: hace(2), serie: 'B001' },
    { id: 'pg4', pacienteId: 'p5', tratamientoId: 't6', concepto: 'Curación dental con resina (pieza 24) — a cuenta', monto: 50, metodo: 'Efectivo', fecha: hace(1), serie: 'B001' },
    { id: 'pg5', pacienteId: 'p2', tratamientoId: 't3', concepto: 'Ortodoncia: brackets metálicos — cuota 2', monto: 300, metodo: 'Tarjeta', fecha: hace(0), serie: 'B001' },
    { id: 'pg6', pacienteId: 'p1', tratamientoId: 't7', concepto: 'Consulta general — cancelación', monto: 50, metodo: 'Efectivo', fecha: hace(0), serie: 'B001' },
  ]
  return [...hist, ...recientes].map((p, i) => ({ ...p, correlativo: i + 1 }))
}

export const ODONTOGRAMAS = (): Record<string, Odontograma> => ({
  p1: { '16': 'Restauración', '26': 'Caries', '36': 'Restauración', '48': 'Extracción' },
  p2: { '14': 'Restauración', '25': 'Caries' },
  p3: { '46': 'Endodoncia', '36': 'Corona', '18': 'Extracción', '28': 'Extracción' },
  p4: { '38': 'Caries', '47': 'Corona', '17': 'Restauración', '37': 'Caries', '24': 'Restauración' },
  p5: { '24': 'Caries', '85': 'Restauración' },
})
