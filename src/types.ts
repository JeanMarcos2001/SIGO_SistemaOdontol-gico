export type Rol = 'admin' | 'recepcion' | 'odontologo' | 'finanzas' | 'paciente'

export type Pagina =
  | 'dashboard' | 'pacientes' | 'personal' | 'citas' | 'clinica' | 'finanzas' | 'admin' | 'portal'

export interface Usuario {
  id: string
  nombre: string
  email: string
  rol: Rol
  activo: boolean
  /** Vínculo con odontólogo o paciente cuando aplica */
  odontologoId?: string
  pacienteId?: string
}

export type TipoDoc = 'DNI' | 'CE' | 'Pasaporte'

export interface Antecedentes {
  alergias: string
  enfermedades: string
  medicacion: string
}

export interface Paciente {
  id: string
  tipoDoc: TipoDoc
  doc: string
  nombres: string
  apellidos: string
  nacimiento: string
  telefono: string
  email: string
  direccion: string
  emergenciaNombre: string
  emergenciaTel: string
  antecedentes: Antecedentes
}

export type Especialidad = 'Odontología General' | 'Ortodoncia' | 'Endodoncia' | 'Odontopediatría'

export interface Odontologo {
  id: string
  nombre: string
  cmp: string
  especialidad: Especialidad
  telefono: string
  activo: boolean
}

/** dia: 1 = lunes … 6 = sábado, 0 = domingo */
export interface Horario {
  id: string
  odontologoId: string
  dia: number
  inicio: string
  fin: string
}

export type EstadoCita = 'Programada' | 'Asistió' | 'No asistió' | 'Cancelada' | 'Perdida'

export interface Cita {
  id: string
  pacienteId: string
  odontologoId: string
  /** 'YYYY-MM-DDTHH:mm' en hora local */
  inicio: string
  duracion: number
  estado: EstadoCita
  motivo: string
}

export interface Atencion {
  id: string
  citaId?: string
  pacienteId: string
  odontologoId: string
  fecha: string
  motivo: string
  cie10: string
  diagnostico: string
  observaciones: string
  receta: string
}

export type EstadoTratamiento = 'Pendiente' | 'En proceso' | 'Finalizado'

export interface Tratamiento {
  id: string
  pacienteId: string
  odontologoId: string
  servicioId: string
  descripcion: string
  pieza: string
  fecha: string
  costo: number
  estado: EstadoTratamiento
}

export type EstadoDiente = 'Sano' | 'Caries' | 'Restauración' | 'Endodoncia' | 'Corona' | 'Extracción'
export type Odontograma = Record<string, EstadoDiente>

export type MetodoPago = 'Efectivo' | 'Tarjeta' | 'Transferencia'

export interface Pago {
  id: string
  pacienteId: string
  tratamientoId: string
  concepto: string
  monto: number
  metodo: MetodoPago
  fecha: string
  serie: string
  correlativo: number
}

export interface Servicio {
  id: string
  nombre: string
  tarifa: number
}

export interface RecordatorioEnviado {
  id: string
  citaId: string
  enviado: string
  canal: 'WhatsApp' | 'Correo'
}
