export type NivelFidelidad = 'bronce' | 'plata' | 'oro';

export interface NivelConfig {
  nombre: string;
  min_visitas: number;
  max_visitas: number;
  beneficio: string;
}

export interface ConfigReglasComercio {
  meta_sellos: number;
  cooldown_horas: number;
  vigencia_dias: number;
  premio_descripcion: string;
  niveles: {
    bronce: NivelConfig;
    plata: NivelConfig;
    oro: NivelConfig;
  };
}

export interface Comercio {
  id: string;
  nombre: string;
  slug: string;
  logo_url?: string;
  config_reglas: ConfigReglasComercio;
  activo: boolean;
  created_at?: string;
}

export interface Cliente {
  id: string;
  nombre: string;
  celular?: string;
  email: string;
  acepto_ley_29733: boolean;
  fecha_consentimiento?: string;
}

export interface Tarjeta {
  id: string;
  cliente_id: string;
  comercio_id: string;
  sellos_actuales: number;
  visitas_totales: number;
  nivel_actual: NivelFidelidad;
  premio_disponible: boolean;
  ultimo_sello_at?: string | null;
  created_at?: string;
}

export interface RegistroSello {
  id: string;
  tarjeta_id: string;
  comercio_id: string;
  cliente_id: string;
  created_at: string;
}

export interface Premio {
  id: string;
  comercio_id: string;
  nombre: string;
  descripcion: string;
  sellos_requeridos: number;
  activo: boolean;
}

export interface Canje {
  id: string;
  tarjeta_id: string;
  comercio_id: string;
  cliente_id: string;
  premio_id?: string;
  created_at: string;
}

export interface MovimientoHistorial {
  tipo: 'sello' | 'canje';
  id: string;
  created_at: string;
  cliente_nombre: string;
  descripcion: string;
}

export interface KPIsComercio {
  visitas_hoy: number;
  clientes_nuevos_hoy: number;
  sellos_otorgados_hoy: number;
  premios_canjeados_hoy: number;
  ultimos_movimientos: MovimientoHistorial[];
}
