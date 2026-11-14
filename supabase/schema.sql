-- ==============================================================================
-- GOLD BIRD CLUB - DATABASE SCHEMA & CORE ENGINE (Supabase / PostgreSQL)
-- Piloto: Cafetería Barranca
-- Plataforma de Fidelización por Sellos Dinámicos y Niveles PWA
-- ==============================================================================

-- 1. EXTENSIONES REQUERIDAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TIPOS ENUMERADOS
DO $$ BEGIN
    CREATE TYPE nivel_fidelidad_enum AS ENUM ('bronce', 'plata', 'oro');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. TABLA: comercios
CREATE TABLE IF NOT EXISTS public.comercios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    logo_url TEXT,
    pin_mostrador TEXT NOT NULL, -- Almacenado como hash bcrypt/crypt
    config_reglas JSONB NOT NULL DEFAULT '{
        "meta_sellos": 6,
        "cooldown_horas": 3,
        "vigencia_dias": 90,
        "premio_descripcion": "1 Café Americano o Capuccino gratis (o bebida de especialidad)",
        "niveles": {
            "bronce": {
                "nombre": "Bronce",
                "min_visitas": 0,
                "max_visitas": 6,
                "beneficio": "Bienvenida al club de sellos + 1 café gratis al completar tu 1ra tarjeta"
            },
            "plata": {
                "nombre": "Plata",
                "min_visitas": 7,
                "max_visitas": 30,
                "beneficio": "Saldo a favor para consumo + 3% dcto. permanente en el local"
            },
            "oro": {
                "nombre": "Oro",
                "min_visitas": 31,
                "max_visitas": 999999,
                "beneficio": "Saldo a favor para consumo + 5% dcto. permanente + catas y eventos exclusivos"
            }
        }
    }'::jsonb,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. TABLA: clientes (Vinculado a auth.users de Supabase)
CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    celular VARCHAR(20),
    email VARCHAR(255) UNIQUE NOT NULL,
    acepto_ley_29733 BOOLEAN NOT NULL DEFAULT false,
    fecha_consentimiento TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. TABLA: tarjetas (Tarjeta de fidelidad por cliente y comercio)
CREATE TABLE IF NOT EXISTS public.tarjetas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    comercio_id UUID NOT NULL REFERENCES public.comercios(id) ON DELETE CASCADE,
    sellos_actuales INT NOT NULL DEFAULT 0 CHECK (sellos_actuales >= 0),
    visitas_totales INT NOT NULL DEFAULT 0 CHECK (visitas_totales >= 0),
    nivel_actual nivel_fidelidad_enum NOT NULL DEFAULT 'bronce',
    premio_disponible BOOLEAN NOT NULL DEFAULT false,
    ultimo_sello_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_cliente_comercio UNIQUE (cliente_id, comercio_id)
);

-- 6. TABLA: registro_sellos (Historial inmutable de auditoría)
CREATE TABLE IF NOT EXISTS public.registro_sellos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tarjeta_id UUID NOT NULL REFERENCES public.tarjetas(id) ON DELETE CASCADE,
    comercio_id UUID NOT NULL REFERENCES public.comercios(id) ON DELETE CASCADE,
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. TABLA: premios (Catálogo de premios configurados)
CREATE TABLE IF NOT EXISTS public.premios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comercio_id UUID NOT NULL REFERENCES public.comercios(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    sellos_requeridos INT NOT NULL DEFAULT 6,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. TABLA: canjes (Historial de premios reclamados)
CREATE TABLE IF NOT EXISTS public.canjes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tarjeta_id UUID NOT NULL REFERENCES public.tarjetas(id) ON DELETE CASCADE,
    comercio_id UUID NOT NULL REFERENCES public.comercios(id) ON DELETE CASCADE,
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    premio_id UUID REFERENCES public.premios(id) ON DELETE SET NULL,
    staff_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. TABLA AUXILIAR: comercio_staff (Roles de mostrador)
CREATE TABLE IF NOT EXISTS public.comercio_staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comercio_id UUID NOT NULL REFERENCES public.comercios(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rol VARCHAR(50) NOT NULL DEFAULT 'cajero',
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_comercio_staff UNIQUE (comercio_id, user_id)
);

-- 10. ÍNDICES DE RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_tarjetas_cliente ON public.tarjetas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_tarjetas_comercio ON public.tarjetas(comercio_id);
CREATE INDEX IF NOT EXISTS idx_registro_sellos_tarjeta ON public.registro_sellos(tarjeta_id);
CREATE INDEX IF NOT EXISTS idx_registro_sellos_comercio_fecha ON public.registro_sellos(comercio_id, created_at);
CREATE INDEX IF NOT EXISTS idx_canjes_comercio_fecha ON public.canjes(comercio_id, created_at);

-- ==============================================================================
-- 11. POLÍTICAS ROW LEVEL SECURITY (RLS)
-- ==============================================================================

ALTER TABLE public.comercios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tarjetas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registro_sellos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canjes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comercio_staff ENABLE ROW LEVEL SECURITY;

-- Politicas para comercios
CREATE POLICY "comercios_lectura_publica" ON public.comercios
    FOR SELECT USING (activo = true);

-- Politicas para clientes
CREATE POLICY "clientes_lectura_propia" ON public.clientes
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "clientes_actualizacion_propia" ON public.clientes
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Politicas para tarjetas
-- Cliente solo lee su propia tarjeta
-- Staff del comercio puede leer tarjetas asociadas a su comercio
CREATE POLICY "tarjetas_lectura_cliente" ON public.tarjetas
    FOR SELECT USING (
        auth.uid() = cliente_id
        OR EXISTS (
            SELECT 1 FROM public.comercio_staff
            WHERE user_id = auth.uid() AND comercio_id = public.tarjetas.comercio_id AND activo = true
        )
    );

-- Ningún cliente puede hacer INSERT o UPDATE directo en tarjetas (solo RPC)

-- Politicas para registro_sellos
CREATE POLICY "registro_sellos_lectura_propia" ON public.registro_sellos
    FOR SELECT USING (
        auth.uid() = cliente_id
        OR EXISTS (
            SELECT 1 FROM public.comercio_staff
            WHERE user_id = auth.uid() AND comercio_id = public.registro_sellos.comercio_id AND activo = true
        )
    );

-- Politicas para premios
CREATE POLICY "premios_lectura_publica" ON public.premios
    FOR SELECT USING (activo = true);

-- Politicas para canjes
CREATE POLICY "canjes_lectura_propia" ON public.canjes
    FOR SELECT USING (
        auth.uid() = cliente_id
        OR EXISTS (
            SELECT 1 FROM public.comercio_staff
            WHERE user_id = auth.uid() AND comercio_id = public.canjes.comercio_id AND activo = true
        )
    );

-- Politicas para comercio_staff
CREATE POLICY "staff_lectura_propia" ON public.comercio_staff
    FOR SELECT USING (auth.uid() = user_id);

-- ==============================================================================
-- 12. CLAVE SECRETA HMAC PARA TOKENS QR
-- ==============================================================================
-- Se usa para firmar tokens efímeros de 3 minutos
CREATE OR REPLACE FUNCTION public._get_qr_secret()
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    -- Clave secreta interna para firmar el HMAC de 3 minutos
    RETURN 'goldbird_qr_signing_secret_prod_key_2025';
END;
$$;

-- ==============================================================================
-- 13. FUNCIONES DEL SERVIDOR (RPC con SECURITY DEFINER)
-- ==============================================================================

-- 13.1 Generar Token QR Dinámico firmado (Válido por 3 minutos)
CREATE OR REPLACE FUNCTION public.generar_token_qr(p_tarjeta_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_tarjeta RECORD;
    v_timestamp BIGINT;
    v_signature TEXT;
    v_token TEXT;
    v_secret TEXT;
BEGIN
    -- Verificar que la tarjeta existe y pertenezca al usuario solicitante (si está autenticado)
    SELECT * INTO v_tarjeta FROM public.tarjetas WHERE id = p_tarjeta_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Tarjeta no encontrada';
    END IF;

    IF auth.uid() IS NOT NULL AND auth.uid() <> v_tarjeta.cliente_id THEN
        RAISE EXCEPTION 'No autorizado para generar token para esta tarjeta';
    END IF;

    -- Timestamp actual en segundos UNIX
    v_timestamp := EXTRACT(EPOCH FROM now())::BIGINT;
    v_secret := public._get_qr_secret();

    -- Firma HMAC-SHA256 (tarjeta_id + ':' + timestamp)
    v_signature := encode(
        extensions.hmac((p_tarjeta_id::text || ':' || v_timestamp::text)::bytea, v_secret::bytea, 'sha256'),
        'hex'
    );

    -- Token payload
    v_token := p_tarjeta_id::text || '.' || v_timestamp::text || '.' || v_signature;

    RETURN jsonb_build_object(
        'token', v_token,
        'tarjeta_id', p_tarjeta_id,
        'timestamp', v_timestamp,
        'expires_in_seconds', 180
    );
END;
$$;

-- 13.2 Obtener o Crear Tarjeta al ingresar por primera vez a un comercio
CREATE OR REPLACE FUNCTION public.obtener_o_crear_tarjeta(
    p_cliente_id UUID,
    p_comercio_slug TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_comercio RECORD;
    v_tarjeta RECORD;
    v_cliente RECORD;
    v_dias_inactivo INT;
    v_vigencia_dias INT;
BEGIN
    -- Buscar el comercio
    SELECT * INTO v_comercio FROM public.comercios WHERE slug = p_comercio_slug AND activo = true;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Comercio con slug % no encontrado o inactivo', p_comercio_slug;
    END IF;

    -- Buscar cliente
    SELECT * INTO v_cliente FROM public.clientes WHERE id = p_cliente_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Cliente con id % no registrado', p_cliente_id;
    END IF;

    -- Buscar tarjeta existente
    SELECT * INTO v_tarjeta
    FROM public.tarjetas
    WHERE cliente_id = p_cliente_id AND comercio_id = v_comercio.id;

    -- Si no existe, crearla inicializada en 0 sellos y nivel Bronce
    IF NOT FOUND THEN
        INSERT INTO public.tarjetas (
            cliente_id,
            comercio_id,
            sellos_actuales,
            visitas_totales,
            nivel_actual,
            premio_disponible,
            ultimo_sello_at
        ) VALUES (
            p_cliente_id,
            v_comercio.id,
            0,
            0,
            'bronce',
            false,
            NULL
        )
        RETURNING * INTO v_tarjeta;
    ELSE
        -- Validar expiración de sellos por inactividad (90 días)
        v_vigencia_dias := COALESCE((v_comercio.config_reglas->>'vigencia_dias')::INT, 90);
        IF v_tarjeta.ultimo_sello_at IS NOT NULL AND v_tarjeta.sellos_actuales > 0 THEN
            v_dias_inactivo := EXTRACT(DAY FROM (now() - v_tarjeta.ultimo_sello_at))::INT;
            IF v_dias_inactivo >= v_vigencia_dias THEN
                -- Expiran los sellos activos pero conserva historial de visitas y nivel
                UPDATE public.tarjetas
                SET sellos_actuales = 0,
                    premio_disponible = false
                WHERE id = v_tarjeta.id
                RETURNING * INTO v_tarjeta;
            END IF;
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'tarjeta', row_to_json(v_tarjeta),
        'comercio', jsonb_build_object(
            'id', v_comercio.id,
            'nombre', v_comercio.nombre,
            'slug', v_comercio.slug,
            'logo_url', v_comercio.logo_url,
            'config_reglas', v_comercio.config_reglas
        ),
        'cliente', jsonb_build_object(
            'id', v_cliente.id,
            'nombre', v_cliente.nombre,
            'email', v_cliente.email,
            'celular', v_cliente.celular
        )
    );
END;
$$;

-- 13.3 Registrar Sello con Validación Antifraude Estricta
CREATE OR REPLACE FUNCTION public.registrar_sello(
    p_token_qr TEXT,
    p_comercio_id UUID,
    p_staff_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_parts TEXT[];
    v_tarjeta_id UUID;
    v_timestamp BIGINT;
    v_client_sig TEXT;
    v_expected_sig TEXT;
    v_current_ts BIGINT;
    v_secret TEXT;
    v_comercio RECORD;
    v_tarjeta RECORD;
    v_cliente RECORD;
    v_cooldown_horas NUMERIC;
    v_meta_sellos INT;
    v_vigencia_dias INT;
    v_horas_desde_ultimo NUMERIC;
    v_nuevo_sellos INT;
    v_nuevo_visitas INT;
    v_nuevo_nivel nivel_fidelidad_enum;
    v_premio_habilitado BOOLEAN;
BEGIN
    -- 1. Verificar comercio activo
    SELECT * INTO v_comercio FROM public.comercios WHERE id = p_comercio_id AND activo = true;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'COMERCIO_INACTIVO', 'mensaje', 'El comercio no está activo o no existe.');
    END IF;

    -- 2. Parsear token QR: "tarjeta_id.timestamp.signature"
    v_parts := string_to_array(p_token_qr, '.');
    IF array_length(v_parts, 1) <> 3 THEN
        RETURN jsonb_build_object('success', false, 'error', 'TOKEN_INVALIDO', 'mensaje', 'Formato de QR no válido.');
    END IF;

    BEGIN
        v_tarjeta_id := v_parts[1]::UUID;
        v_timestamp := v_parts[2]::BIGINT;
        v_client_sig := v_parts[3];
    EXCEPTION WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', 'TOKEN_MALFORMADO', 'mensaje', 'Datos del QR corruptos.');
    END;

    -- 3. Validar expiración (< 180 segundos = 3 minutos)
    v_current_ts := EXTRACT(EPOCH FROM now())::BIGINT;
    IF (v_current_ts - v_timestamp) > 180 THEN
        RETURN jsonb_build_object('success', false, 'error', 'QR_EXPIRADO', 'mensaje', 'El código QR ha expirado. El cliente debe mostrar su QR actualizado.');
    END IF;
    -- Prevenir tokens con fecha futura desproporcionada
    IF (v_timestamp - v_current_ts) > 60 THEN
        RETURN jsonb_build_object('success', false, 'error', 'QR_TIMESTAMP_INVALIDO', 'mensaje', 'Reloj del dispositivo desfasado.');
    END IF;

    -- 4. Validar firma criptográfica HMAC
    v_secret := public._get_qr_secret();
    v_expected_sig := encode(
        extensions.hmac((v_tarjeta_id::text || ':' || v_timestamp::text)::bytea, v_secret::bytea, 'sha256'),
        'hex'
    );

    IF v_client_sig <> v_expected_sig THEN
        RETURN jsonb_build_object('success', false, 'error', 'FIRMA_INVALIDA', 'mensaje', 'Código QR inválido o falsificado.');
    END IF;

    -- 5. Obtener tarjeta y verificar que pertenezca a este comercio
    SELECT * INTO v_tarjeta FROM public.tarjetas WHERE id = v_tarjeta_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'TARJETA_NO_EXISTE', 'mensaje', 'Tarjeta no encontrada.');
    END IF;

    IF v_tarjeta.comercio_id <> p_comercio_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'COMERCIO_NO_COINCIDE', 'mensaje', 'Esta tarjeta pertenece a otro comercio.');
    END IF;

    -- 6. Regla Antifraude: Cooldown de 3 horas entre sellos
    v_cooldown_horas := COALESCE((v_comercio.config_reglas->>'cooldown_horas')::NUMERIC, 3.0);
    IF v_tarjeta.ultimo_sello_at IS NOT NULL THEN
        v_horas_desde_ultimo := EXTRACT(EPOCH FROM (now() - v_tarjeta.ultimo_sello_at)) / 3600.0;
        IF v_horas_desde_ultimo < v_cooldown_horas THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'COOLDOWN_ACTIVO',
                'mensaje', format('Máximo 1 sello por visita. Deben pasar al menos %s horas desde el último sello (faltan %s min).',
                    v_cooldown_horas,
                    ROUND(((v_cooldown_horas - v_horas_desde_ultimo) * 60)::numeric, 0)
                ),
                'horas_restantes', ROUND((v_cooldown_horas - v_horas_desde_ultimo)::numeric, 2)
            );
        END IF;
    END IF;

    -- 7. Verificar si los sellos caducaron por inactividad (90 días)
    v_vigencia_dias := COALESCE((v_comercio.config_reglas->>'vigencia_dias')::INT, 90);
    IF v_tarjeta.ultimo_sello_at IS NOT NULL AND v_tarjeta.sellos_actuales > 0 THEN
        IF EXTRACT(DAY FROM (now() - v_tarjeta.ultimo_sello_at)) >= v_vigencia_dias THEN
            v_tarjeta.sellos_actuales := 0;
            v_tarjeta.premio_disponible := false;
        END IF;
    END IF;

    -- 8. Calcular nuevos valores
    v_meta_sellos := COALESCE((v_comercio.config_reglas->>'meta_sellos')::INT, 6);
    v_nuevo_sellos := v_tarjeta.sellos_actuales + 1;
    v_nuevo_visitas := v_tarjeta.visitas_totales + 1;

    -- Recalcular Nivel de Fidelidad según visitas acumuladas:
    -- Bronce: 0 a 6 visitas
    -- Plata: 7 a 30 visitas
    -- Oro: 31+ visitas
    IF v_nuevo_visitas >= 31 THEN
        v_nuevo_nivel := 'oro';
    ELSIF v_nuevo_visitas >= 7 THEN
        v_nuevo_nivel := 'plata';
    ELSE
        v_nuevo_nivel := 'bronce';
    END IF;

    -- Premio disponible si alcanza o supera meta de sellos
    v_premio_habilitado := (v_nuevo_sellos >= v_meta_sellos);

    -- 9. Actualizar Tarjeta
    UPDATE public.tarjetas
    SET sellos_actuales = v_nuevo_sellos,
        visitas_totales = v_nuevo_visitas,
        nivel_actual = v_nuevo_nivel,
        premio_disponible = v_premio_habilitado,
        ultimo_sello_at = now()
    WHERE id = v_tarjeta.id
    RETURNING * INTO v_tarjeta;

    -- 10. Insertar en registro_sellos
    INSERT INTO public.registro_sellos (
        tarjeta_id,
        comercio_id,
        cliente_id,
        staff_id
    ) VALUES (
        v_tarjeta.id,
        p_comercio_id,
        v_tarjeta.cliente_id,
        p_staff_id
    );

    -- 11. Obtener datos del cliente para respuesta inmediata
    SELECT * INTO v_cliente FROM public.clientes WHERE id = v_tarjeta.cliente_id;

    RETURN jsonb_build_object(
        'success', true,
        'mensaje', '¡Sello otorgado con éxito!',
        'tarjeta', row_to_json(v_tarjeta),
        'cliente', jsonb_build_object(
            'nombre', v_cliente.nombre,
            'email', v_cliente.email,
            'celular', v_cliente.celular
        ),
        'premio_alcanzado', v_premio_habilitado,
        'sellos_actuales', v_nuevo_sellos,
        'meta_sellos', v_meta_sellos,
        'nivel_actual', v_nuevo_nivel
    );
END;
$$;

-- 13.4 Canjear Premio y Reiniciar Contador de Sellos a 0
CREATE OR REPLACE FUNCTION public.canjear_premio(
    p_token_qr TEXT,
    p_comercio_id UUID,
    p_staff_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_parts TEXT[];
    v_tarjeta_id UUID;
    v_timestamp BIGINT;
    v_client_sig TEXT;
    v_expected_sig TEXT;
    v_secret TEXT;
    v_tarjeta RECORD;
    v_comercio RECORD;
    v_cliente RECORD;
    v_premio RECORD;
    v_meta_sellos INT;
BEGIN
    -- Validar formato del token
    v_parts := string_to_array(p_token_qr, '.');
    IF array_length(v_parts, 1) <> 3 THEN
        RETURN jsonb_build_object('success', false, 'error', 'TOKEN_INVALIDO', 'mensaje', 'QR inválido');
    END IF;

    v_tarjeta_id := v_parts[1]::UUID;
    v_timestamp := v_parts[2]::BIGINT;
    v_client_sig := v_parts[3];

    -- Validar expiración (< 180s)
    IF (EXTRACT(EPOCH FROM now())::BIGINT - v_timestamp) > 180 THEN
        RETURN jsonb_build_object('success', false, 'error', 'QR_EXPIRADO', 'mensaje', 'El código QR ha expirado.');
    END IF;

    -- Validar firma
    v_secret := public._get_qr_secret();
    v_expected_sig := encode(
        extensions.hmac((v_tarjeta_id::text || ':' || v_timestamp::text)::bytea, v_secret::bytea, 'sha256'),
        'hex'
    );
    IF v_client_sig <> v_expected_sig THEN
        RETURN jsonb_build_object('success', false, 'error', 'FIRMA_INVALIDA', 'mensaje', 'QR falsificado.');
    END IF;

    -- Obtener tarjeta y comercio
    SELECT * INTO v_tarjeta FROM public.tarjetas WHERE id = v_tarjeta_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'TARJETA_NO_EXISTE', 'mensaje', 'Tarjeta no encontrada.');
    END IF;

    IF v_tarjeta.comercio_id <> p_comercio_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'COMERCIO_NO_COINCIDE', 'mensaje', 'Esta tarjeta no pertenece a este comercio.');
    END IF;

    SELECT * INTO v_comercio FROM public.comercios WHERE id = p_comercio_id;
    v_meta_sellos := COALESCE((v_comercio.config_reglas->>'meta_sellos')::INT, 6);

    -- Verificar que tenga premio disponible o al menos meta_sellos
    IF NOT v_tarjeta.premio_disponible AND v_tarjeta.sellos_actuales < v_meta_sellos THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'PREMIO_NO_DISPONIBLE',
            'mensaje', format('El cliente solo tiene %s de %s sellos requeridos para el premio.', v_tarjeta.sellos_actuales, v_meta_sellos)
        );
    END IF;

    -- Obtener o crear premio predeterminado
    SELECT * INTO v_premio FROM public.premios WHERE comercio_id = p_comercio_id AND activo = true LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO public.premios (
            comercio_id,
            nombre,
            descripcion,
            sellos_requeridos,
            activo
        ) VALUES (
            p_comercio_id,
            'Café Americano o Capuccino Gratis',
            '1 Café de especialidad a elección',
            v_meta_sellos,
            true
        ) RETURNING * INTO v_premio;
    END IF;

    -- Registrar canje
    INSERT INTO public.canjes (
        tarjeta_id,
        comercio_id,
        cliente_id,
        premio_id,
        staff_id
    ) VALUES (
        v_tarjeta.id,
        p_comercio_id,
        v_tarjeta.cliente_id,
        v_premio.id,
        p_staff_id
    );

    -- Reiniciar contador de sellos a 0 y deshabilitar premio_disponible
    UPDATE public.tarjetas
    SET sellos_actuales = 0,
        premio_disponible = false
    WHERE id = v_tarjeta.id
    RETURNING * INTO v_tarjeta;

    SELECT * INTO v_cliente FROM public.clientes WHERE id = v_tarjeta.cliente_id;

    RETURN jsonb_build_object(
        'success', true,
        'mensaje', '¡Premio canjeado con éxito! Se reinició el contador de sellos a 0.',
        'premio', row_to_json(v_premio),
        'tarjeta', row_to_json(v_tarjeta),
        'cliente', jsonb_build_object(
            'nombre', v_cliente.nombre,
            'email', v_cliente.email
        )
    );
END;
$$;

-- 13.5 Validar PIN de mostrador para ingreso rápido
CREATE OR REPLACE FUNCTION public.validar_pin_comercio(
    p_slug TEXT,
    p_pin TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_comercio RECORD;
    v_pin_valido BOOLEAN;
BEGIN
    SELECT * INTO v_comercio FROM public.comercios WHERE slug = p_slug AND activo = true;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'mensaje', 'Comercio no encontrado.');
    END IF;

    -- Validar con crypt
    v_pin_valido := (v_comercio.pin_mostrador = extensions.crypt(p_pin, v_comercio.pin_mostrador));

    IF NOT v_pin_valido THEN
        -- Permitir fallback directo para entorno de prueba o texto plano si aún no está hasheado
        IF v_comercio.pin_mostrador = p_pin THEN
            v_pin_valido := true;
        END IF;
    END IF;

    IF v_pin_valido THEN
        RETURN jsonb_build_object(
            'success', true,
            'comercio', jsonb_build_object(
                'id', v_comercio.id,
                'nombre', v_comercio.nombre,
                'slug', v_comercio.slug,
                'logo_url', v_comercio.logo_url,
                'config_reglas', v_comercio.config_reglas
            )
        );
    ELSE
        RETURN jsonb_build_object('success', false, 'mensaje', 'PIN incorrecto. Intente nuevamente.');
    END IF;
END;
$$;

-- 13.6 KPIs del Comercio para Pestaña "Resumen del Día"
CREATE OR REPLACE FUNCTION public.obtener_kpis_comercio(p_comercio_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_visitas_hoy INT;
    v_clientes_nuevos_hoy INT;
    v_sellos_hoy INT;
    v_canjes_hoy INT;
    v_ultimos_movimientos JSONB;
BEGIN
    -- Visitas y sellos otorgados hoy
    SELECT COUNT(*) INTO v_sellos_hoy
    FROM public.registro_sellos
    WHERE comercio_id = p_comercio_id
      AND created_at >= date_trunc('day', now());

    v_visitas_hoy := v_sellos_hoy;

    -- Clientes nuevos hoy
    SELECT COUNT(*) INTO v_clientes_nuevos_hoy
    FROM public.tarjetas
    WHERE comercio_id = p_comercio_id
      AND created_at >= date_trunc('day', now());

    -- Canjes de hoy
    SELECT COUNT(*) INTO v_canjes_hoy
    FROM public.canjes
    WHERE comercio_id = p_comercio_id
      AND created_at >= date_trunc('day', now());

    -- Últimos 8 movimientos combinados
    SELECT jsonb_agg(mov) INTO v_ultimos_movimientos FROM (
        (
            SELECT
                'sello' AS tipo,
                rs.id,
                rs.created_at,
                c.nombre AS cliente_nombre,
                'Sello registrado (+1)' AS descripcion
            FROM public.registro_sellos rs
            JOIN public.clientes c ON c.id = rs.cliente_id
            WHERE rs.comercio_id = p_comercio_id
            ORDER BY rs.created_at DESC
            LIMIT 5
        )
        UNION ALL
        (
            SELECT
                'canje' AS tipo,
                cj.id,
                cj.created_at,
                c.nombre AS cliente_nombre,
                COALESCE(p.nombre, 'Premio canjeado') AS descripcion
            FROM public.canjes cj
            JOIN public.clientes c ON c.id = cj.cliente_id
            LEFT JOIN public.premios p ON p.id = cj.premio_id
            WHERE cj.comercio_id = p_comercio_id
            ORDER BY cj.created_at DESC
            LIMIT 5
        )
        ORDER BY created_at DESC
        LIMIT 8
    ) mov;

    RETURN jsonb_build_object(
        'visitas_hoy', COALESCE(v_visitas_hoy, 0),
        'clientes_nuevos_hoy', COALESCE(v_clientes_nuevos_hoy, 0),
        'sellos_otorgados_hoy', COALESCE(v_sellos_hoy, 0),
        'premios_canjeados_hoy', COALESCE(v_canjes_hoy, 0),
        'ultimos_movimientos', COALESCE(v_ultimos_movimientos, '[]'::jsonb)
    );
END;
$$;

-- 13.7 Trigger para crear cliente automáticamente al registrarse en auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.clientes (
        id,
        nombre,
        celular,
        email,
        acepto_ley_29733,
        fecha_consentimiento
    ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'celular',
        NEW.email,
        COALESCE((NEW.raw_user_meta_data->>'acepto_ley_29733')::BOOLEAN, false),
        CASE WHEN (NEW.raw_user_meta_data->>'acepto_ley_29733')::BOOLEAN = true THEN now() ELSE NULL END
    )
    ON CONFLICT (id) DO UPDATE
    SET
        nombre = EXCLUDED.nombre,
        celular = COALESCE(EXCLUDED.celular, public.clientes.celular),
        acepto_ley_29733 = EXCLUDED.acepto_ley_29733,
        fecha_consentimiento = COALESCE(public.clientes.fecha_consentimiento, EXCLUDED.fecha_consentimiento);

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 14. DATOS INICIALES (SEED): CAFETERÍA BARRANCA
-- ==============================================================================
-- PIN por defecto: "1234" (hasheado con bf / blowfish)
INSERT INTO public.comercios (
    id,
    nombre,
    slug,
    logo_url,
    pin_mostrador,
    config_reglas,
    activo
) VALUES (
    'a0000000-0000-0000-0000-000000000001'::uuid,
    'Cafetería Barranca',
    'cafeteria-barranca',
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=200&auto=format&fit=crop&q=80',
    extensions.crypt('1234', extensions.gen_salt('bf')),
    '{
        "meta_sellos": 6,
        "cooldown_horas": 3,
        "vigencia_dias": 90,
        "premio_descripcion": "1 Café Americano o Capuccino gratis (o bebida de especialidad a elección)",
        "niveles": {
            "bronce": {
                "nombre": "Bronce",
                "min_visitas": 0,
                "max_visitas": 6,
                "beneficio": "Bienvenida al club de sellos + 1 café de cortesía al completar tu 1ra tarjeta"
            },
            "plata": {
                "nombre": "Plata",
                "min_visitas": 7,
                "max_visitas": 30,
                "beneficio": "Saldo a favor para consumo + 3% dcto. permanente en el establecimiento"
            },
            "oro": {
                "nombre": "Oro",
                "min_visitas": 31,
                "max_visitas": 999999,
                "beneficio": "Saldo a favor para consumo + 5% dcto. permanente en el local + catas y lanzamientos exclusivos"
            }
        }
    }'::jsonb,
    true
)
ON CONFLICT (slug) DO UPDATE
SET
    nombre = EXCLUDED.nombre,
    config_reglas = EXCLUDED.config_reglas,
    pin_mostrador = EXCLUDED.pin_mostrador;

-- Premio configurado para Cafetería Barranca
INSERT INTO public.premios (
    id,
    comercio_id,
    nombre,
    descripcion,
    sellos_requeridos,
    activo
) VALUES (
    'b0000000-0000-0000-0000-000000000001'::uuid,
    'a0000000-0000-0000-0000-000000000001'::uuid,
    '1 Café Americano o Capuccino Gratis',
    'Bebida de especialidad caliente o fría preparada por el barista de Cafetería Barranca al completar 6 sellos.',
    6,
    true
)
ON CONFLICT (id) DO NOTHING;
