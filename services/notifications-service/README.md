# Notifications Service (`/services/notifications-service`)

Microservicio backend independiente dentro del monorepo de **eXpandeMoney 🇵🇪**, responsable de evaluar, generar y despachar alertas de fidelización y notificaciones transaccionales automatizadas a comercios afiliados y clientes finales mediante **WhatsApp** y **Email**.

---

## 🏛️ Estructura del Servicio

Sigue rigurosamente la convención de arquitectura en capas utilizada en los demás microservicios (`rewards-service`, `loyalty-engine`, `auth-service`):

```
services/notifications-service/
├── package.json                         # Dependencias del workspace y scripts
├── tsconfig.json                        # Configuración TypeScript
├── README.md                            # Especificación técnica y catálogo de eventos
└── src/
    ├── index.ts                         # Entrada Express, middlewares y definición de rutas
    ├── controllers/
    │   └── notification.controller.ts   # Validación Zod, endpoints HTTP y formateo de respuesta
    ├── services/
    │   ├── notification.service.ts      # Orquestación de eventos, resolución de contexto y auditoría
    │   └── rules-engine.service.ts      # Motor de reglas de fidelización y generación de plantillas
    ├── channels/
    │   ├── whatsapp.provider.ts         # Adaptador WhatsApp Cloud API + Sandbox local
    │   └── email.provider.ts            # Adaptador Email transaccional (Resend/SMTP) + Sandbox
    ├── types/
    │   └── notification.types.ts        # Interfaces internas, contexto y contratos de providers
    └── middlewares/
        └── auth.middleware.ts           # Verificación de JWT y control de roles
```

---

## ⚡ Reglas de Negocio y Eventos Soportados

El motor `RulesEngineService` evalúa cada evento transaccional o de lealtad y determina qué mensaje generar, a quién dirigirlo y por qué canal (WhatsApp es el canal prioritario para clientes finales en Perú sin necesidad de apps):

| Evento | Descripción / Disparador | Canal Principal | Destinatario | Ejemplo de Mensaje |
| :--- | :--- | :---: | :---: | :--- |
| **`nuevo_consumo`** (Falta 1) | Cuando el cliente acumula 9 sellos (falta 1 para el premio de 10) | WhatsApp | Cliente | `🔥 ¡ESTÁS A UN PASO DE TU PREMIO EN CAFÉ BARRANQUEÑO! ⭐ ¡Te falta 1 consumo para liberar 1/4 Pollo a la Brasa (Valor S/ 25.00)!` |
| **`nuevo_consumo`** (Bloqueado) | Cliente en nivel Bronce con saldo bloqueado acumulado | WhatsApp | Cliente | `🎉 ¡Sumaste un nuevo sello! Tienes S/ 5.00 en Saldo Bloqueado. ¡Te faltan 3 consumos para liberar S/ 5.00!` |
| **`nuevo_consumo`** (Progreso) | Consumo calificado regular ($\ge$ S/ 30.00) | WhatsApp | Cliente | `☕ ¡Consumo registrado en Café Barranqueño! Llevas 4/10 sellos. Te faltan 6 visitas para tu premio.` |
| **`liberacion_premio`** | Cliente completa 10 consumos (10 sellos) | WhatsApp / Email | Cliente | `🏆 ¡FELICITACIONES JUAN! Has completado tus 10 sellos. Tu cupón de canje es PREMIO10-9842 por S/ 20.00.` |
| **`liberacion_premio`** (Alerta Comercio) | Notifica al personal del comercio sobre el cliente VIP | WhatsApp / Email | Comercio | `🌟 ¡ALERTA DE FIDELIZACIÓN! El cliente Juan Pérez (+51 987654321) liberó su premio: 1/4 Pollo a la Brasa.` |
| **`nuevo_cliente_qr`** | Cliente escanea el QR en mostrador y activa su tarjeta digital | WhatsApp | Cliente | `👋 ¡Bienvenido(a) a Café Barranqueño en eXpandeMoney! Tu tarjeta digital ya está activada en tu celular.` |
| **`nuevo_cliente_qr`** (Alerta Comercio) | Notifica al comercio de nuevo cliente fidelizado | WhatsApp / Email | Comercio | `📲 Nuevo cliente registrado vía QR: Carlos Mendoza (+51 987654321) se unió a tu programa de fidelización.` |
| **`cambio_nivel`** | Cliente asciende de nivel (Bronce $\rightarrow$ Plata $\rightarrow$ Oro) | WhatsApp | Cliente | `🚀 ¡SUBISTE DE NIVEL A ORO! Ahora disfrutas de 8% de cashback acreditado en cada consumo.` |
| **`recordatorio_saldo`** | Saldo disponible acumulado sin utilizar | WhatsApp | Cliente | `⏰ ¡Tienes S/ 15.50 esperándote en Café Barranqueño! Saldo listo para descontar de tu cuenta.` |

---

## 🚀 Endpoints de la API (Puerto `4006`)

### 1. Procesar Evento de Notificación (Endpoint Principal)
Recibe un evento y dispara automáticamente las notificaciones a cliente y/o comercio según las reglas de negocio.

- **Método**: `POST`
- **Ruta**: `/api/notifications/events`
- **Headers**: `Content-Type: application/json`
- **Body de Ejemplo (Nuevo Consumo)**:
```json
{
  "tipo_evento": "nuevo_consumo",
  "monto": 45.00,
  "merchant_id": "a1111111-1111-1111-1111-111111111111",
  "customer_id": "c1111111-1111-1111-1111-111111111111",
  "payment_method": "yape"
}
```

- **Respuesta de Ejemplo (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "should_notify": true,
    "reason": "Evento de nuevo consumo evaluado con éxito",
    "event_type": "nuevo_consumo",
    "customer_id": "c1111111-1111-1111-1111-111111111111",
    "merchant_id": "a1111111-1111-1111-1111-111111111111",
    "dispatches": [
      {
        "channel": "whatsapp",
        "recipient_type": "customer",
        "recipient_target": "+51987654321",
        "recipient_name": "Juan Pérez",
        "message": "🔥 *¡ESTÁS A UN PASO DE TU PREMIO EN CAFÉ BARRANQUEÑO!* 🎯\n\n¡Hola *Juan Pérez*! Registramos tu consumo calificado de *S/ 45.00*.\n\n⭐ *¡Te falta 1 consumo para liberar 1/4 Pollo a la Brasa (Valor S/ 25.00)!*\n🎁 En tu siguiente visita recibirás tu cupón de regalo para canje inmediato.\n\n👉 Revisa tu tarjeta de sellos aquí: http://localhost:3001/wallet/token-demo-wallet",
        "status": "simulated",
        "message_id": "wamid.HBgL8A9B2C==",
        "timestamp": "2026-11-11T13:00:00.000Z"
      }
    ]
  }
}
```

---

### 2. Evento de Liberación de Premio
- **Body de Ejemplo**:
```json
{
  "tipo_evento": "liberacion_premio",
  "monto": 35.00,
  "merchant_id": "a1111111-1111-1111-1111-111111111111",
  "customer_id": "c1111111-1111-1111-1111-111111111111",
  "metadata": {
    "coupon_code": "PREMIO10-9842",
    "reward_title": "1/4 Pollo a la Brasa",
    "reward_value": 25.00
  }
}
```

- **Disparos generados**:
  1. **WhatsApp a Cliente**: Notifica el cupón de canje, vigencia de 30 días y enlace directo a su billetera digital.
  2. **WhatsApp/Email al Comercio**: Alerta al dueño/personal para que felicite al cliente en su próxima visita.

---

### 3. Evento de Registro de Nuevo Cliente vía QR
- **Body de Ejemplo**:
```json
{
  "tipo_evento": "nuevo_cliente_qr",
  "merchant_id": "a1111111-1111-1111-1111-111111111111",
  "customer_id": "c1111111-1111-1111-1111-111111111111"
}
```

- **Disparos generados**:
  1. **WhatsApp de Bienvenida al Cliente**: Tarjeta digital activada, sin descarga de apps.
  2. **Alerta al Comercio**: `📲 Nuevo cliente registrado vía QR: Carlos Mendoza (+51 987654321)`.

---

### 4. Previsualizar Mensaje sin Enviar (`/api/notifications/preview`)
- **Método**: `POST`
- Permite a la interfaz del comerciante o al backend simular cómo se renderizará el mensaje antes de dispararlo.

---

### 5. Envío Manual o Directo (`/api/notifications/send`)
- **Método**: `POST`
- **Body**:
```json
{
  "merchant_id": "a1111111-1111-1111-1111-111111111111",
  "customer_id": "c1111111-1111-1111-1111-111111111111",
  "recipient_type": "customer",
  "channel": "whatsapp",
  "target": "+51987654321",
  "recipient_name": "Juan Pérez",
  "message": "Hola Juan, hoy tenemos 2x1 en postres artesanales para clientes VIP."
}
```

---

### 6. Historial de Notificaciones (`/api/notifications/history`)
- **Método**: `GET`
- **Query Params**: `merchant_id` (opcional), `limit` (opcional, default 50).

---

### 7. Catálogo de Plantillas (`/api/notifications/templates`)
- **Método**: `GET`
- Retorna las plantillas activas, triggers y ejemplos de copy.

---

### 8. Health Check (`/health`)
- **Método**: `GET`
- Devuelve estado de salud, timestamp y puerto del microservicio.

---

## 🛠️ Variables de Entorno

Configuradas en `.env` en la raíz del monorepo:

```env
NOTIFICATIONS_SERVICE_PORT=4006
NOTIFICATIONS_SERVICE_URL=http://localhost:4006

# Proveedores externos (Opcional - por defecto opera en modo Sandbox)
WHATSAPP_ENABLED=true
WHATSAPP_API_URL=https://graph.facebook.com/v19.0
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_API_TOKEN=
RESEND_API_KEY=
NOTIFICATION_FROM_EMAIL=notificaciones@expandemoney.pe
NOTIFICATION_FROM_NAME="eXpandeMoney Alertas"
```

---

## 🧪 Ejecución y Desarrollo

```bash
# Iniciar en modo desarrollo con recarga en caliente
pnpm --filter @expandemoney/notifications-service dev

# Compilar TypeScript
pnpm --filter @expandemoney/notifications-service build

# Iniciar compilado en producción
pnpm --filter @expandemoney/notifications-service start
```
