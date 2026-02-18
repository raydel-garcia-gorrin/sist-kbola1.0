// types/supabase.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      perfiles: {
        Row: {
          id: string
          nombre: string
          apellido: string | null
          rol: 'admin' | 'supervisor' | 'conductor' | 'asistente' | null
          telefono: string | null
          created_at: string | null
        }
        Insert: {
          id: string
          nombre: string
          apellido?: string | null
          rol?: 'admin' | 'supervisor' | 'conductor' | 'asistente' | null
          telefono?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          nombre?: string
          apellido?: string | null
          rol?: 'admin' | 'supervisor' | 'conductor' | 'asistente' | null
          telefono?: string | null
          created_at?: string | null
        }
      }
      camiones: {
        Row: {
          id: string
          numero_camion: string | null  // NUEVO
          placa: string
          vin_number: string | null
          marca: string
          modelo: string
          year: number | null
          capacidad_kg: number | null
          estado: 'disponible' | 'en_viaje' | 'mantenimiento' | 'inactivo' | null
          conductor_id: string | null
          ultimo_mantenimiento: string | null
          fecha_inspeccion: string | null
          fecha_registracion: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          numero_camion?: string | null  // NUEVO
          placa: string
          vin_number?: string | null
          marca: string
          modelo: string
          year?: number | null
          capacidad_kg?: number | null
          estado?: 'disponible' | 'en_viaje' | 'mantenimiento' | 'inactivo' | null
          conductor_id?: string | null
          ultimo_mantenimiento?: string | null
          fecha_inspeccion?: string | null
          fecha_registracion?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          numero_camion?: string | null  // NUEVO
          placa?: string
          vin_number?: string | null
          marca?: string
          modelo?: string
          year?: number | null
          capacidad_kg?: number | null
          estado?: 'disponible' | 'en_viaje' | 'mantenimiento' | 'inactivo' | null
          conductor_id?: string | null
          ultimo_mantenimiento?: string | null
          fecha_inspeccion?: string | null
          fecha_registracion?: string | null
          created_at?: string | null
        }
      }
      trailers: {
        Row: {
          id: string
          numero_trailer: string | null  // NUEVO
          placa: string
          vin_number: string | null
          tipo: 'seco' | 'refrigerado' | 'plataforma' | 'cisterna' | null
          capacidad_kg: number | null
          dimensiones: string | null
          estado: 'disponible' | 'en_uso' | 'mantenimiento' | null
          camion_actual_id: string | null
          fecha_inspeccion: string | null
          fecha_registracion: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          numero_trailer?: string | null  // NUEVO
          placa: string
          vin_number?: string | null
          tipo?: 'seco' | 'refrigerado' | 'plataforma' | 'cisterna' | null
          capacidad_kg?: number | null
          dimensiones?: string | null
          estado?: 'disponible' | 'en_uso' | 'mantenimiento' | null
          camion_actual_id?: string | null
          fecha_inspeccion?: string | null
          fecha_registracion?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          numero_trailer?: string | null  // NUEVO
          placa?: string
          vin_number?: string | null
          tipo?: 'seco' | 'refrigerado' | 'plataforma' | 'cisterna' | null
          capacidad_kg?: number | null
          dimensiones?: string | null
          estado?: 'disponible' | 'en_uso' | 'mantenimiento' | null
          camion_actual_id?: string | null
          fecha_inspeccion?: string | null
          fecha_registracion?: string | null
          created_at?: string | null
        }
      }
      empleados: {
        Row: {
          id: string
          user_id: string | null
          tipo_empleado: 'conductor' | 'mecanico' | 'administrativo' | 'cargador' | null
          fecha_contratacion: string | null
          salario: number | null
          licencia_conducir: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          tipo_empleado?: 'conductor' | 'mecanico' | 'administrativo' | 'cargador' | null
          fecha_contratacion?: string | null
          salario?: number | null
          licencia_conducir?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          tipo_empleado?: 'conductor' | 'mecanico' | 'administrativo' | 'cargador' | null
          fecha_contratacion?: string | null
          salario?: number | null
          licencia_conducir?: string | null
          created_at?: string | null
        }
      }
      productos: {
        Row: {
          id: string
          codigo: string
          nombre: string
          descripcion: string | null
          categoria: string | null
          peso_unitario: number | null
          precio_unitario: number | null
          stock_actual: number | null
          stock_minimo: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          codigo: string
          nombre: string
          descripcion?: string | null
          categoria?: string | null
          peso_unitario?: number | null
          precio_unitario?: number | null
          stock_actual?: number | null
          stock_minimo?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          codigo?: string
          nombre?: string
          descripcion?: string | null
          categoria?: string | null
          peso_unitario?: number | null
          precio_unitario?: number | null
          stock_actual?: number | null
          stock_minimo?: number | null
          created_at?: string | null
        }
      }
      viajes: {
        Row: {
          id: string
          codigo_viaje: string
          camion_id: string | null
          trailer_id: string | null
          conductor_id: string | null
          origen: string
          destino: string
          fecha_salida: string | null
          fecha_llegada: string | null
          estado: 'planificado' | 'en_curso' | 'completado' | 'cancelado' | null
          distancia_km: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          codigo_viaje: string
          camion_id?: string | null
          trailer_id?: string | null
          conductor_id?: string | null
          origen: string
          destino: string
          fecha_salida?: string | null
          fecha_llegada?: string | null
          estado?: 'planificado' | 'en_curso' | 'completado' | 'cancelado' | null
          distancia_km?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          codigo_viaje?: string
          camion_id?: string | null
          trailer_id?: string | null
          conductor_id?: string | null
          origen?: string
          destino?: string
          fecha_salida?: string | null
          fecha_llegada?: string | null
          estado?: 'planificado' | 'en_curso' | 'completado' | 'cancelado' | null
          distancia_km?: number | null
          created_at?: string | null
        }
      }
      cargas: {
        Row: {
          id: string
          viaje_id: string | null
          producto_id: string | null
          cantidad: number
          peso_total: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          viaje_id?: string | null
          producto_id?: string | null
          cantidad: number
          peso_total?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          viaje_id?: string | null
          producto_id?: string | null
          cantidad?: number
          peso_total?: number | null
          created_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}