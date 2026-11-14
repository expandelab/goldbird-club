# Gold Bird Club 🦅
> Miniapp Web PWA de Fidelización por Sellos y Niveles para Cafetería Barranca
> URL en producción: [https://goldbird-club.vercel.app/](https://goldbird-club.vercel.app/) • Soporte: `hola@goldbird.club`

---

## 1. Resumen Ejecutivo del Piloto (Cafetería Barranca)

**Gold Bird** es una Progressive Web App (PWA) de fidelización de clientes basada en sellos dinámicos y niveles de retención, diseñada para operar directamente desde el navegador de los clientes y la tablet o celular del mostrador sin necesidad de instalar apps desde tiendas.

### Reglas de Negocio Core (Piloto Cafetería Barranca):
- **Meta de Sellos y Premio:** **6 sellos** completan la tarjeta. Premio: **1 Café Americano o Capuccino gratis (o bebida de especialidad)**.
- **Niveles de Fidelidad (Tiers):**
  - **Bronce:** 0 a 6 visitas acumuladas *(Bienvenida a su tarjeta de sellos + 1 café gratis al completar su 1ra tarjeta)*.
  - **Plata:** 7 a 30 visitas acumuladas *(Saldo a favor para consumo + 3% de descuento permanente en el establecimiento)*.
  - **Oro:** 31+ visitas acumuladas *(Saldo a favor para consumo + 5% de descuento permanente + catas y eventos exclusivos)*.
- **Reglas Antifraude (Backend estricto):**
  - **1 sello por visita** máximo.
  - **Cooldown de 3 horas:** Mínimo 3 horas entre sellos para un mismo cliente en el establecimiento.
  - **Vigencia de 90 días:** Si el cliente no registra una nueva visita en 90 días, los sellos activos caducan a 0, conservando su historial de nivel.
  - **QR Dinámico efímero:** Token firmado con HMAC-SHA256 y expiración estricta de **3 minutos** para evitar capturas de pantalla fijas.
- **Flujo de Canje:** Al llegar a 6 sellos, se habilita "Premio Disponible". En mostrador, el barista escanea el QR dinámico en vivo, confirma el canje y el sistema reinicia el contador a 0 sellos.

---

## 2. Arquitectura Técnica

```
├── apps/
│   └── customer-enrollment/             # App Router Next.js 14 + Tailwind CSS + PWA
│       ├── public/
│       │   ├── manifest.json            # Web App Manifest
│       │   ├── sw.js                    # Service Worker PWA
│       │   └── goldbird-icon.svg        # Ícono SVG oficial Gold Bird
│       └── src/
│           ├── app/
│           │   ├── page.tsx             # 1. Landing & Onboarding (Ley N° 29733)
│           │   ├── login/page.tsx       # 2. Acceso Dual (Cliente Email OTP / Comercio PIN 4 dígitos)
│           │   ├── mi-tarjeta/page.tsx  # 3. Tarjeta del Cliente (6 sellos, niveles, QR dinámico 3 min)
│           │   ├── comercio/page.tsx    # 4. Modo Comercio (Escáner de cámara, botones de acción, KPIs)
│           │   ├── privacidad/page.tsx  # Marco Legal Ley N° 29733 (Derechos ARCO)
│           │   ├── terminos/page.tsx    # Términos Oficiales del Piloto
│           │   └── layout.tsx           # PWA Shell & Theme
│           ├── components/
│           │   ├── Header.tsx           # Barra de navegación Gold Bird
│           │   ├── DynamicQrCode.tsx    # QR dinámico con cuenta regresiva de 3 minutos
│           │   ├── LoyaltyStampCard.tsx # Tarjeta de 6 sellos con animaciones
│           │   ├── TierProgress.tsx     # Barra de niveles Bronce -> Plata -> Oro
│           │   ├── PwaInstallBanner.tsx # Banner de instalación PWA (Android / iOS)
│           │   └── CameraQrScanner.tsx  # Escáner de cámara nativo (BarcodeDetector / getUserMedia)
│           └── lib/
│               ├── goldbird-service.ts  # Capa de servicio Supabase + Fallback inteligente
│               ├── qr-crypto.ts         # HMAC-SHA256 cliente/servidor para tokens efímeros
│               ├── audio.ts             # Web Audio API sintetizado para escáner
│               └── types.ts             # Tipos TypeScript
└── supabase/
    └── schema.sql                       # Tablas, RLS, Triggers y RPCs (PostgreSQL)
```

---

## 3. Despliegue en Supabase

1. Crea un proyecto en [Supabase](https://supabase.com).
2. Ve a **SQL Editor** y ejecuta el script completo:
   ```bash
   supabase/schema.sql
   ```
3. El script creará automáticamente:
   - Tablas: `comercios`, `clientes`, `tarjetas`, `registro_sellos`, `premios`, `canjes`, `comercio_staff`.
   - Políticas RLS para clientes y comercios.
   - Funciones RPC con `SECURITY DEFINER`:
     - `generar_token_qr(tarjeta_id)`
     - `obtener_o_crear_tarjeta(cliente_id, comercio_slug)`
     - `registrar_sello(token_qr, comercio_id)`
     - `canjear_premio(token_qr, comercio_id)`
     - `validar_pin_comercio(slug, pin)`
     - `obtener_kpis_comercio(comercio_id)`
   - Datos iniciales para **Cafetería Barranca** (slug: `cafeteria-barranca`, PIN por defecto: `1234`).

---

## 4. Despliegue en Vercel

1. Importa el repositorio en [Vercel](https://vercel.com).
2. Configura las variables de entorno en el panel de Vercel:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
   SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
   NEXT_PUBLIC_PILOT_COMMERCE_SLUG=cafeteria-barranca
   NEXT_PUBLIC_SUPPORT_EMAIL=hola@goldbird.club
   QR_HMAC_SECRET=goldbird_qr_signing_secret_prod_key_2025
   ```
3. Configuración de Build en Vercel:
   - **Root Directory**: `apps/customer-enrollment` (o en raíz seleccionando el workspace)
   - **Build Command**: `pnpm build` o `next build`
   - **Output Directory**: `.next`
4. ¡Listo para probar en producción con clientes y personal de Cafetería Barranca!

---

## 5. Credenciales y Flujo de Demostración Inmediata

- **Modo Mostrador (Caja/Barista):**
  - Ruta: `/comercio` o `/login` -> Modo Mostrador
  - PIN de acceso rápido: `1234`
- **Modo Cliente:**
  - Registro desde la Landing `/` aceptando la Ley 29733.
  - O ingreso directo con correo desde `/login`.
  - Visualización de la tarjeta en `/mi-tarjeta`.
- **Soporte Oficial:** `hola@goldbird.club`
