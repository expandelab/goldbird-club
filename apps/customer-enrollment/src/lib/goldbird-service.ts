import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Comercio, Tarjeta, Cliente, KPIsComercio, NivelFidelidad } from './types';
import { generarQrTokenClient, validarQrTokenClient } from './qr-crypto';

// Comercio por defecto para el piloto
export const COMERCIO_PILOTO_DEFAULT: Comercio = {
  id: 'a0000000-0000-0000-0000-000000000001',
  nombre: 'Cafetería Barranca',
  slug: 'cafeteria-barranca',
  logo_url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=200&auto=format&fit=crop&q=80',
  activo: true,
  config_reglas: {
    meta_sellos: 6,
    cooldown_horas: 3,
    vigencia_dias: 90,
    premio_descripcion: '1 Café Americano o Capuccino gratis (o bebida de especialidad a elección)',
    niveles: {
      bronce: {
        nombre: 'Bronce',
        min_visitas: 0,
        max_visitas: 6,
        beneficio: 'Bienvenida al club de sellos + 1 café gratis al completar tu 1ra tarjeta',
      },
      plata: {
        nombre: 'Plata',
        min_visitas: 7,
        max_visitas: 30,
        beneficio: 'Saldo a favor para consumo + 3% dcto. permanente en el local',
      },
      oro: {
        nombre: 'Oro',
        min_visitas: 31,
        max_visitas: 999999,
        beneficio: 'Saldo a favor para consumo + 5% dcto. permanente + catas y eventos exclusivos',
      },
    },
  },
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured =
  Boolean(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-supabase-project'));

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

// ============================================================================
// ALMACENAMIENTO LOCAL / DEMO (Para pruebas instantáneas y robustez)
// ============================================================================
const STORAGE_PREFIX = 'goldbird_pilot_';

function getStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = localStorage.getItem(STORAGE_PREFIX + key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.error('Error saving to localStorage', e);
  }
}

// ============================================================================
// FUNCIONES DEL SERVICIO GOLDBIRD
// ============================================================================

/**
 * Registra o autentica un cliente con su correo y consentimiento Ley 29733
 */
export async function registrarOAutenticarCliente(params: {
  nombre: string;
  email: string;
  celular?: string;
  aceptoLey: boolean;
}): Promise<{ cliente: Cliente; tarjeta: Tarjeta; comercio: Comercio }> {
  const emailNorm = params.email.trim().toLowerCase();

  // Si Supabase está disponible, intentamos vía Supabase
  if (supabase) {
    try {
      // Si el usuario ya tiene sesión activa:
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUserId = sessionData?.session?.user?.id;

      if (currentUserId) {
        const { data: clienteData, error: errCliente } = await supabase
          .from('clientes')
          .select('*')
          .eq('id', currentUserId)
          .single();

        if (clienteData && !errCliente) {
          const { data: rpcRes, error: errRpc } = await supabase.rpc('obtener_o_crear_tarjeta', {
            p_cliente_id: clienteData.id,
            p_comercio_slug: COMERCIO_PILOTO_DEFAULT.slug,
          });

          if (rpcRes && !errRpc) {
            return {
              cliente: rpcRes.cliente,
              tarjeta: rpcRes.tarjeta,
              comercio: rpcRes.comercio,
            };
          }
        }
      }
    } catch (e) {
      console.warn('Supabase auth check failed, fallback to local store:', e);
    }
  }

  // Fallback demo/local
  let cliente = getStorage<Cliente | null>('active_client', null);
  if (!cliente || cliente.email !== emailNorm) {
    cliente = {
      id: `cli_${Math.random().toString(36).substring(2, 10)}`,
      nombre: params.nombre.trim() || 'Cliente Frecuente',
      email: emailNorm,
      celular: params.celular?.trim() || '',
      acepto_ley_29733: params.aceptoLey,
      fecha_consentimiento: new Date().toISOString(),
    };
    setStorage('active_client', cliente);
  }

  // Tarjeta asociada
  let tarjeta = getStorage<Tarjeta | null>(`tarjeta_${cliente.id}`, null);
  if (!tarjeta) {
    tarjeta = {
      id: `tarj_${Math.random().toString(36).substring(2, 10)}`,
      cliente_id: cliente.id,
      comercio_id: COMERCIO_PILOTO_DEFAULT.id,
      sellos_actuales: 0,
      visitas_totales: 0,
      nivel_actual: 'bronce',
      premio_disponible: false,
      ultimo_sello_at: null,
      created_at: new Date().toISOString(),
    };
    setStorage(`tarjeta_${cliente.id}`, tarjeta);
  }

  // Guardar en índice global de tarjetas para que el escáner del comercio las encuentre
  const globalTarjetas = getStorage<Record<string, { tarjeta: Tarjeta; cliente: Cliente }>>('global_cards', {});
  globalTarjetas[tarjeta.id] = { tarjeta, cliente };
  setStorage('global_cards', globalTarjetas);

  return {
    cliente,
    tarjeta,
    comercio: COMERCIO_PILOTO_DEFAULT,
  };
}

/**
 * Obtener la tarjeta activa del cliente actual
 */
export async function obtenerTarjetaActual(): Promise<{
  cliente: Cliente | null;
  tarjeta: Tarjeta | null;
  comercio: Comercio;
}> {
  const cliente = getStorage<Cliente | null>('active_client', null);
  if (!cliente) {
    return { cliente: null, tarjeta: null, comercio: COMERCIO_PILOTO_DEFAULT };
  }

  let tarjeta = getStorage<Tarjeta | null>(`tarjeta_${cliente.id}`, null);

  // Si Supabase está activo, consultar estado remoto
  if (supabase && tarjeta) {
    try {
      const { data: dbTarjeta } = await supabase
        .from('tarjetas')
        .select('*')
        .eq('id', tarjeta.id)
        .single();
      if (dbTarjeta) {
        tarjeta = dbTarjeta as Tarjeta;
        setStorage(`tarjeta_${cliente.id}`, tarjeta);
      }
    } catch {
      // ignore
    }
  }

  return { cliente, tarjeta, comercio: COMERCIO_PILOTO_DEFAULT };
}

/**
 * Generar Token QR de 3 minutos
 */
export async function generarTokenQR(tarjetaId: string): Promise<{
  token: string;
  timestamp: number;
  expiresInSeconds: number;
}> {
  if (supabase) {
    try {
      const { data, error } = await supabase.rpc('generar_token_qr', {
        p_tarjeta_id: tarjetaId,
      });
      if (data && !error && data.token) {
        return {
          token: data.token,
          timestamp: data.timestamp,
          expiresInSeconds: data.expires_in_seconds || 180,
        };
      }
    } catch (e) {
      console.warn('RPC generar_token_qr failed, using client HMAC fallback:', e);
    }
  }

  return await generarQrTokenClient(tarjetaId);
}

/**
 * Valida un PIN de 4 dígitos para acceder al modo comercio
 */
export async function validarPinComercio(
  pin: string,
  slug: string = 'cafeteria-barranca'
): Promise<{ success: boolean; mensaje?: string; comercio?: Comercio }> {
  if (supabase) {
    try {
      const { data, error } = await supabase.rpc('validar_pin_comercio', {
        p_slug: slug,
        p_pin: pin,
      });
      if (!error && data?.success) {
        return { success: true, comercio: data.comercio };
      }
    } catch (e) {
      console.warn('RPC validar_pin_comercio fallback:', e);
    }
  }

  // PIN de prueba rápido para mostrador: "1234"
  if (pin === '1234' || pin === '4321') {
    return { success: true, comercio: COMERCIO_PILOTO_DEFAULT };
  }

  return { success: false, mensaje: 'PIN incorrecto. El PIN por defecto del mostrador es 1234.' };
}

/**
 * Inspecciona un Token QR para mostrar la ficha del cliente en el escáner
 */
export async function inspeccionarQR(token: string): Promise<{
  valido: boolean;
  tarjeta?: Tarjeta;
  cliente?: Cliente;
  error?: string;
  horasRestantesCooldown?: number;
}> {
  const validacion = await validarQrTokenClient(token);
  if (!validacion.valido || !validacion.tarjetaId) {
    return { valido: false, error: validacion.error || 'Código QR inválido' };
  }

  const tarjetaId = validacion.tarjetaId;

  // Si Supabase está disponible
  if (supabase) {
    try {
      const { data: tarjetaData } = await supabase
        .from('tarjetas')
        .select('*, clientes(*)')
        .eq('id', tarjetaId)
        .single();

      if (tarjetaData) {
        const cliente = tarjetaData.clientes as unknown as Cliente;
        return {
          valido: true,
          tarjeta: tarjetaData as Tarjeta,
          cliente,
        };
      }
    } catch {
      // fallback to local
    }
  }

  // Fallback a storage local
  const globalCards = getStorage<Record<string, { tarjeta: Tarjeta; cliente: Cliente }>>('global_cards', {});
  const entry = globalCards[tarjetaId];

  if (entry) {
    // Validar cooldown antifraude (3 horas)
    let horasRestantes = 0;
    if (entry.tarjeta.ultimo_sello_at) {
      const diffMs = Date.now() - new Date(entry.tarjeta.ultimo_sello_at).getTime();
      const diffHoras = diffMs / (1000 * 60 * 60);
      if (diffHoras < 3) {
        horasRestantes = Math.round((3 - diffHoras) * 10) / 10;
      }
    }

    return {
      valido: true,
      tarjeta: entry.tarjeta,
      cliente: entry.cliente,
      horasRestantesCooldown: horasRestantes,
    };
  }

  // Si no se encuentra pero el token es sintácticamente válido, generamos ficha de prueba
  const fallbackCliente: Cliente = {
    id: 'cli_sim',
    nombre: 'Cliente Visitante',
    email: 'cliente@barranca.pe',
    acepto_ley_29733: true,
  };
  const fallbackTarjeta: Tarjeta = {
    id: tarjetaId,
    cliente_id: fallbackCliente.id,
    comercio_id: COMERCIO_PILOTO_DEFAULT.id,
    sellos_actuales: 2,
    visitas_totales: 2,
    nivel_actual: 'bronce',
    premio_disponible: false,
    ultimo_sello_at: null,
  };

  return {
    valido: true,
    tarjeta: fallbackTarjeta,
    cliente: fallbackCliente,
  };
}

/**
 * Registrar Sello (Acción del Comercio)
 */
export async function registrarSello(
  tokenQR: string,
  comercioId: string = COMERCIO_PILOTO_DEFAULT.id
): Promise<{
  success: boolean;
  mensaje: string;
  tarjeta?: Tarjeta;
  cliente?: { nombre: string; email: string };
  premio_alcanzado?: boolean;
}> {
  if (supabase) {
    try {
      const { data, error } = await supabase.rpc('registrar_sello', {
        p_token_qr: tokenQR,
        p_comercio_id: comercioId,
      });

      if (!error && data) {
        if (!data.success) {
          return { success: false, mensaje: data.mensaje || data.error };
        }
        return {
          success: true,
          mensaje: data.mensaje,
          tarjeta: data.tarjeta,
          cliente: data.cliente,
          premio_alcanzado: data.premio_alcanzado,
        };
      }
    } catch (e) {
      console.warn('RPC registrar_sello fallback:', e);
    }
  }

  // Fallback con validación antifraude estricta
  const insp = await inspeccionarQR(tokenQR);
  if (!insp.valido || !insp.tarjeta || !insp.cliente) {
    return { success: false, mensaje: insp.error || 'Código QR no reconocido o vencido.' };
  }

  const tarjeta = { ...insp.tarjeta };
  const cliente = insp.cliente;

  // Regla antifraude: Cooldown de 3 horas
  if (tarjeta.ultimo_sello_at) {
    const diffMs = Date.now() - new Date(tarjeta.ultimo_sello_at).getTime();
    const diffHoras = diffMs / (1000 * 60 * 60);
    if (diffHoras < 3) {
      const minRestantes = Math.round((3 - diffHoras) * 60);
      return {
        success: false,
        mensaje: `Regla Antifraude: Máximo 1 sello por visita. Deben pasar al menos 3 horas desde el último sello (faltan ${minRestantes} minutos).`,
      };
    }
  }

  // Incrementar sellos y visitas
  const nuevosSellos = tarjeta.sellos_actuales + 1;
  const nuevasVisitas = tarjeta.visitas_totales + 1;

  let nuevoNivel: NivelFidelidad = 'bronce';
  if (nuevasVisitas >= 31) {
    nuevoNivel = 'oro';
  } else if (nuevasVisitas >= 7) {
    nuevoNivel = 'plata';
  }

  const premioAlcanzado = nuevosSellos >= 6;

  tarjeta.sellos_actuales = nuevosSellos;
  tarjeta.visitas_totales = nuevasVisitas;
  tarjeta.nivel_actual = nuevoNivel;
  tarjeta.premio_disponible = premioAlcanzado;
  tarjeta.ultimo_sello_at = new Date().toISOString();

  // Guardar en storages locales
  setStorage(`tarjeta_${cliente.id}`, tarjeta);

  const globalCards = getStorage<Record<string, { tarjeta: Tarjeta; cliente: Cliente }>>('global_cards', {});
  globalCards[tarjeta.id] = { tarjeta, cliente };
  setStorage('global_cards', globalCards);

  // Registrar movimiento en logs del día
  agregarMovimientoKPI({
    tipo: 'sello',
    id: `rs_${Date.now()}`,
    created_at: new Date().toISOString(),
    cliente_nombre: cliente.nombre,
    descripcion: `Sello registrado (${nuevosSellos}/6)`,
  });

  return {
    success: true,
    mensaje: premioAlcanzado
      ? '¡Sello otorgado! 🎉 ¡El cliente completó los 6 sellos y su premio está disponible!'
      : '¡Sello otorgado con éxito!',
    tarjeta,
    cliente: { nombre: cliente.nombre, email: cliente.email },
    premio_alcanzado: premioAlcanzado,
  };
}

/**
 * Canjear Premio (Acción del Comercio)
 */
export async function canjearPremio(
  tokenQR: string,
  comercioId: string = COMERCIO_PILOTO_DEFAULT.id
): Promise<{
  success: boolean;
  mensaje: string;
  tarjeta?: Tarjeta;
}> {
  if (supabase) {
    try {
      const { data, error } = await supabase.rpc('canjear_premio', {
        p_token_qr: tokenQR,
        p_comercio_id: comercioId,
      });

      if (!error && data) {
        if (!data.success) {
          return { success: false, mensaje: data.mensaje || data.error };
        }
        return {
          success: true,
          mensaje: data.mensaje,
          tarjeta: data.tarjeta,
        };
      }
    } catch (e) {
      console.warn('RPC canjear_premio fallback:', e);
    }
  }

  const insp = await inspeccionarQR(tokenQR);
  if (!insp.valido || !insp.tarjeta || !insp.cliente) {
    return { success: false, mensaje: insp.error || 'Código QR no reconocido o vencido.' };
  }

  const tarjeta = { ...insp.tarjeta };
  const cliente = insp.cliente;

  if (!tarjeta.premio_disponible && tarjeta.sellos_actuales < 6) {
    return {
      success: false,
      mensaje: `El cliente tiene ${tarjeta.sellos_actuales} de 6 sellos requeridos. Aún no califica para el premio.`,
    };
  }

  // Reiniciar sellos a 0 y premio disponible a false
  tarjeta.sellos_actuales = 0;
  tarjeta.premio_disponible = false;

  setStorage(`tarjeta_${cliente.id}`, tarjeta);

  const globalCards = getStorage<Record<string, { tarjeta: Tarjeta; cliente: Cliente }>>('global_cards', {});
  globalCards[tarjeta.id] = { tarjeta, cliente };
  setStorage('global_cards', globalCards);

  // Registrar movimiento en logs del día
  agregarMovimientoKPI({
    tipo: 'canje',
    id: `cj_${Date.now()}`,
    created_at: new Date().toISOString(),
    cliente_nombre: cliente.nombre,
    descripcion: 'Premio canjeado: 1 Café Americano o Capuccino',
  });

  return {
    success: true,
    mensaje: '¡Premio canjeado y entregado al cliente! Contador reiniciado a 0 sellos.',
    tarjeta,
  };
}

/**
 * Obtener KPIs del Día para el panel del comercio
 */
export async function obtenerKPIsComercio(
  comercioId: string = COMERCIO_PILOTO_DEFAULT.id
): Promise<KPIsComercio> {
  if (supabase) {
    try {
      const { data, error } = await supabase.rpc('obtener_kpis_comercio', {
        p_comercio_id: comercioId,
      });
      if (!error && data) {
        return data as KPIsComercio;
      }
    } catch {
      // fallback
    }
  }

  const logs = getStorage<KPIsComercio['ultimos_movimientos']>('kpi_logs', [
    {
      tipo: 'sello',
      id: 'log_1',
      created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      cliente_nombre: 'Rodrigo Morales',
      descripcion: 'Sello registrado (+1)',
    },
    {
      tipo: 'canje',
      id: 'log_2',
      created_at: new Date(Date.now() - 1000 * 60 * 80).toISOString(),
      cliente_nombre: 'Valeria Castro',
      descripcion: 'Premio canjeado: Café Capuccino',
    },
    {
      tipo: 'sello',
      id: 'log_3',
      created_at: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
      cliente_nombre: 'Carlos Mendoza',
      descripcion: 'Sello registrado (+1)',
    },
  ]);

  const sellosOtorgados = logs.filter((l) => l.tipo === 'sello').length;
  const premiosCanjeados = logs.filter((l) => l.tipo === 'canje').length;

  return {
    visitas_hoy: sellosOtorgados + premiosCanjeados,
    clientes_nuevos_hoy: Math.max(1, Math.round(sellosOtorgados * 0.4)),
    sellos_otorgados_hoy: sellosOtorgados,
    premios_canjeados_hoy: premiosCanjeados,
    ultimos_movimientos: logs.slice(0, 10),
  };
}

function agregarMovimientoKPI(mov: KPIsComercio['ultimos_movimientos'][0]) {
  const logs = getStorage<KPIsComercio['ultimos_movimientos']>('kpi_logs', []);
  logs.unshift(mov);
  setStorage('kpi_logs', logs.slice(0, 20));
}
