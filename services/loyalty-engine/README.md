# Loyalty Engine (`/services/loyalty-engine`)

Microservicio backend independiente dentro del monorepo de **expandeMoney 🇵🇪** para procesar las reglas de negocio EM.R (expandeMoney Rules): acumulación de sellos (≥ S/ 30.00), cálculo de cashback escalonado, abono de saldos (bloqueado vs. disponible), transiciones de niveles (Bronce / Plata / Oro) y gestión de la tarjeta digital de 10 consumos.

---

## Estructura del Servicio

Sigue la misma convención de arquitectura por capas utilizada en `auth-service`:

```
services/loyalty-engine/
├── package.json                          # Dependencias y scripts de ejecución
├── tsconfig.json                         # Configuración TypeScript
├── README.md                             # Documentación técnica y especificación
└── src/
    ├── index.ts                          # Entrada Express, configuración CORS y ruteo
    ├── controllers/
    │   └── loyalty.controller.ts         # Validación Zod, manejo de peticiones HTTP
    ├── services/
    │   ├── loyalty.service.ts            # Orquestación con Supabase y persistencia
    │   ├── engine.service.ts             # Motor de cálculo puro de sellos, niveles y cashback
    │   └── milestone.service.ts          # Gestión de cupones de premio por 10 sellos
    └── middlewares/
        └── auth.middleware.ts            # Verificación de JWT y roles (Staff / Admin)
```

---

## Reglas de Negocio EM.R

### 1. Calificación de Sello
- **Consumo Mínimo por Sello**: Cada consumo calificado debe ser mayor o igual a **S/ 30.00 en local** (`min_spend_for_stamp`).
- Montos menores a S/ 30.00 se registran pero no suman sellos ni avanzan la tarjeta.

### 2. Niveles de Fidelización y Cashback Escalonado

| Nivel | Rango de Visitas Calificadas | Cashback Base | Tipo de Saldo Abonado | Beneficios y Dinámica |
| :--- | :---: | :---: | :---: | :--- |
| **🥉 Bronce** | **1 a 9 consumos** | **3.0%** | **Saldo Bloqueado** (`locked_balance`) | Nivel inicial / Onboarding. El cashback ingresa como saldo bloqueado para motivar la recurrencia; se desbloquea en la siguiente visita calificada (≥ S/ 30.00). |
| **🥈 Plata** | **10 a 30 consumos** | **5.0%** | **Saldo Disponible** (`available_balance`) | Nivel intermedio / recurrente. Desbloqueado al completar la primera tarjeta de 10 sellos. Saldo abonado de libre disponibilidad inmediata para descontar en caja. |
| **👑 Oro** | **Más de 30 consumos (> 30)** | **8.0%** | **Saldo Disponible** (`available_balance`) | Nivel Top Tier / VIP. Máxima tasa de cashback de libre disponibilidad inmediata y beneficios preferenciales. |

### 3. Mecánica de Saldos: Bloqueado vs. Disponible
- **Abono en Nivel Bronce**: Ingresa a `locked_balance`.
- **Abono en Nivel Plata y Oro**: Ingresa directamente a `available_balance`.
- **Desbloqueo en Visita Calificada**: Cuando un cliente con saldo bloqueado realiza un consumo calificado (≥ S/ 30), el saldo bloqueado previo se **libera y transfiere automáticamente** a `available_balance`, garantizando el retorno del consumidor.

### 4. Tarjeta Digital de 10 Consumos (Punch Card EM.R)
- Cada ciclo consta de **10 sellos**.
- Al completar el **sello 10**:
  - Se emite un cupón digital único (`PREMIO10-XXXX`) con vigencia de 30 días.
  - Beneficio según configuración del comercio:
    - **Opción A (`free_product`)**: Cupón de producto gratis (ej. *"1/4 de Pollo a la Brasa Gratis"*).
    - **Opción B (`balance_credit`)**: Abono de saldo monetario directo a la Web Wallet (ej. *S/ 20.00 de saldo disponible*).

---

## Endpoints del Servicio (Puerto `4002`)

### 1. Registrar Consumo en Local
Registra el consumo de un cliente en un comercio, evalúa las reglas EM.R, calcula y abona el saldo correspondiente (bloqueado o disponible según el nivel), actualiza sellos y evalúa cambio de nivel.

- **Método**: `POST`
- **Ruta**: `/api/loyalty/record-consumption` (o alias `/api/loyalty/consumption`)
- **Headers**: `Content-Type: application/json`

#### Request Body
```json
{
  "monto": 45.50,
  "merchant_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "customer_id": "11111111-1111-1111-1111-111111111111",
  "payment_method": "yape",
  "redeem_cashback": false,
  "coupon_code": null
}
```

#### Response Exitosa (`201 Created`)
```json
{
  "success": true,
  "data": {
    "transaction": {
      "id": "e2a3b4c5-...",
      "referenceCode": "EXP-LOY-261111-A1B2C",
      "grossAmount": 45.50,
      "couponDiscount": 0,
      "cashbackRedeemed": 0,
      "netToPay": 45.50,
      "paymentMethod": "yape",
      "status": "completed",
      "createdAt": "2026-11-11T12:00:00.000Z"
    },
    "stamps": {
      "qualifiesForStamp": true,
      "stampsAwarded": 1,
      "minSpendRequired": 30.00,
      "currentCycleVisits": 3,
      "cycleTarget": 10,
      "totalAccumulatedVisits": 3
    },
    "tier": {
      "previousTier": "bronce",
      "currentTier": "bronce",
      "tierUpgraded": false,
      "perks": {
        "title": "Nivel Bronce (Inicial / Onboarding)",
        "range": "1 a 9 consumos en local",
        "cashbackPct": 3.0,
        "balanceMode": "locked",
        "perks": "3% en saldo bloqueado (se desbloquea en tu siguiente consumo). Acumula 1 sello por cada consumo desde S/ 30."
      }
    },
    "cashback": {
      "ratePct": 3.0,
      "amountEarned": 1.37,
      "balanceCreditedType": "locked",
      "explanation": "Abono de S/ 1.37 (3%) en Saldo Bloqueado (se desbloqueará en tu próximo consumo calificado ≥ S/ 30.00)."
    },
    "balances": {
      "previousAvailableBalance": 0.00,
      "previousLockedBalance": 5.00,
      "unlockedAmount": 5.00,
      "cashbackRedeemed": 0.00,
      "newAvailableBalance": 5.00,
      "newLockedBalance": 1.37,
      "totalActiveBalance": 6.37
    },
    "reward": {
      "milestoneReached": false
    }
  }
}
```

---

### 2. Consultar Estado Actual del Cliente
Consulta el estado integral de fidelización del cliente: visitas acumuladas, saldo abonado (disponible vs bloqueado), tarjeta de 10 consumos con porcentaje de avance, y beneficios del nivel.

- **Método**: `GET`
- **Ruta**: `/api/loyalty/customers/:customerId/status`
- **Query Params Opcionales**: `?merchant_id=UUID` (para validar pertinencia al comercio)
- **Headers**: `Content-Type: application/json`

#### Response Exitosa (`200 OK`)
```json
{
  "success": true,
  "data": {
    "customer": {
      "id": "11111111-1111-1111-1111-111111111111",
      "full_name": "María Delgado",
      "phone": "+51987654321",
      "wallet_token": "token_maria_oro_barranco"
    },
    "merchant": {
      "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "commercial_name": "Café Barranqueño",
      "slug": "cafe-barranqueno"
    },
    "tier": {
      "current_tier": "plata",
      "name": "Nivel Plata (Intermedio / Recurrente)",
      "perks": "5% de saldo disponible. Acceso inmediato al canje del premio del local tras completar 10 sellos y cupones de fidelidad recurrentes.",
      "next_tier": "oro",
      "visits_to_next_tier": 18,
      "progress_pct_to_next_tier": 14
    },
    "visits": {
      "total_accumulated_visits": 13,
      "total_spent": 580.00,
      "last_visit_at": "2026-11-11T11:45:00.000Z"
    },
    "balance": {
      "available_balance": 24.50,
      "locked_balance": 0.00,
      "total_balance": 24.50,
      "cashback_rate_pct": 5.0,
      "balance_mode": "available",
      "explanation": "Actualmente en nivel PLATA: Tu cashback se abona como Saldo Disponible para descuento inmediato en caja."
    },
    "card_progress": {
      "current_stamps": 3,
      "target_stamps": 10,
      "stamps_remaining": 7,
      "progress_pct": 30,
      "min_spend_per_stamp": 30.00,
      "reward": {
        "title": "Postre de la Casa Artesanal Gratis",
        "type": "free_product",
        "value": 20.00
      }
    },
    "active_coupons": [
      {
        "id": "coupon-uuid-1",
        "code": "PREMIO10-7B4K",
        "title": "¡Premio 10 Consumos! Postre de la Casa Artesanal Gratis",
        "discount_amount": 20.00,
        "expires_at": "2026-12-11T12:00:00.000Z"
      }
    ]
  }
}
```

---

### 3. Simular Cálculo de Consumo (Pre-Cobro)
Permite pre-calcular en memoria el desglose de sellos, saldos a abonar y posibles canjes antes de registrar la transacción en la base de datos.

- **Método**: `POST`
- **Ruta**: `/api/loyalty/simulate`
- **Body**: `{ "merchant_id": "...", "customer_id": "...", "monto": 65.00, "redeem_cashback": true }`

---

### 4. Validar Cupón de Recompensa
Verifica si un código de cupón es válido, está activo y cumple el consumo mínimo requerido.

- **Método**: `POST`
- **Ruta**: `/api/loyalty/validate-coupon`
- **Body**: `{ "merchant_id": "...", "coupon_code": "PREMIO10-7B4K", "monto": 50.00 }`

---

### 5. Health Check
- **Método**: `GET`
- **Ruta**: `/health`
- **Response**: `{ "service": "loyalty-engine", "status": "healthy", "timestamp": "..." }`

---

## Ejecución Local

```bash
# Modo desarrollo con auto-recarga (tsx watch)
pnpm --filter @expandemoney/loyalty-engine dev

# Compilar TypeScript
pnpm --filter @expandemoney/loyalty-engine build

# Iniciar producción
pnpm --filter @expandemoney/loyalty-engine start
```
