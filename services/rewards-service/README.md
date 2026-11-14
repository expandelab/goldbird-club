# Rewards Service (`/services/rewards-service`)

Microservicio backend independiente dentro del monorepo de **expandeMoney 🇵🇪** para la definición, configuración y consulta de programas de fidelización, reglas de recompensa y niveles (Bronce, Plata, Oro) por comercio.

---

## 🏛️ Estructura del Servicio

Sigue la misma convención de arquitectura por capas utilizada en `loyalty-engine` y `auth-service`:

```
services/rewards-service/
├── package.json                          # Dependencias y scripts
├── tsconfig.json                         # Configuración TypeScript
├── README.md                             # Documentación técnica y especificación
└── src/
    ├── index.ts                          # Entrada Express, configuración CORS y ruteo
    ├── controllers/
    │   └── rewards.controller.ts         # Validación con Zod, manejo de peticiones HTTP
    ├── services/
    │   ├── rewards.service.ts            # Lógica de negocio, persistencia y fallback
    │   └── default-rules.ts              # Reglas EM.R estándar por defecto por nivel
    └── middlewares/
        └── auth.middleware.ts            # Verificación de JWT y roles (Staff / Admin)
```

---

## ⚙️ Reglas de Recompensa y Niveles EM.R

Cada comercio puede configurar o personalizar sus parámetros para cada uno de los 3 niveles:

| Parámetro | Descripción | Nivel Bronce | Nivel Plata | Nivel Oro |
| :--- | :--- | :---: | :---: | :---: |
| **`tier`** | Nivel de fidelización | `bronce` | `plata` | `oro` |
| **`consumption_goal`** | Meta de consumos calificados para completar o avanzar de nivel | 10 consumos | 30 consumos | 50 consumos |
| **`cashback_rate_pct`** | Porcentaje de saldo cashback abonado por visita calificada (≥ S/ 30) | 3.0% (Saldo bloqueado) | 5.0% (Saldo libre) | 8.0% (Saldo libre VIP) |
| **`balance_to_release`** | Saldo en S/. a liberar / desbloquear al alcanzar la meta o visita | S/ 0.00 (desbloqueo dinámico) | S/ 20.00 | S/ 30.00 |
| **`min_spend`** | Consumo mínimo por consumo en local | S/ 30.00 | S/ 30.00 | S/ 30.00 |
| **`reward_type`** | Tipo de recompensa (`free_product` o `balance_credit`) | Producto gratis | Producto gratis / Saldo | Saldo / VIP |

---

## 🚀 Endpoints de la API (Puerto `4005`)

### 1. Crear o Editar Regla de Recompensa
Crea o actualiza la regla de un nivel para un comercio determinado (`upsert`):

- **Método**: `POST` o `PUT`
- **Ruta**: `/api/rewards/rules` (o `/api/rewards/merchants/:merchantId/rules/:tier`)
- **Body de Ejemplo**:
```json
{
  "merchant_id": "a1111111-1111-1111-1111-111111111111",
  "tier": "plata",
  "consumption_goal": 20,
  "cashback_rate_pct": 5.5,
  "balance_to_release": 25.00,
  "min_spend": 30.00,
  "reward_type": "balance_credit",
  "reward_title": "S/ 25 de Saldo Plata",
  "reward_description": "Desbloquea S/ 25 al alcanzar los 20 consumos",
  "is_active": true
}
```

- **Respuesta (200 OK)**:
```json
{
  "success": true,
  "message": "Regla de recompensa para el nivel PLATA guardada exitosamente",
  "rule": {
    "id": "e9b21f8a-...",
    "merchant_id": "a1111111-1111-1111-1111-111111111111",
    "tier": "plata",
    "consumption_goal": 20,
    "cashback_rate_pct": 5.5,
    "balance_to_release": 25.0,
    "min_spend": 30.0,
    "reward_type": "balance_credit",
    "reward_title": "S/ 25 de Saldo Plata",
    "reward_description": "Desbloquea S/ 25 al alcanzar los 20 consumos",
    "is_active": true,
    "created_at": "2026-11-11T...",
    "updated_at": "2026-11-11T..."
  }
}
```

*Nota: Los campos aceptan tanto notación `camelCase` (`consumptionGoal`, `cashbackRatePct`, `balanceToRelease`) como `snake_case` o alias en español (`meta_consumos`, `saldo_cashback_visita`, `saldo_a_liberar`).*

---

### 2. Consultar Reglas según el Comercio
Obtiene las reglas configuradas para los 3 niveles del comercio. Si el comercio aún no ha personalizado algún nivel, se devuelven las reglas por defecto EM.R:

- **Método**: `GET`
- **Ruta**: `/api/rewards/merchants/:merchantId/rules` (o `/api/rewards/rules/:merchantId`)
- **Respuesta (200 OK)**:
```json
{
  "success": true,
  "program": {
    "merchant_id": "a1111111-1111-1111-1111-111111111111",
    "merchant_name": "Café Barranqueño",
    "rules": [
      {
        "merchant_id": "a1111111-1111-1111-1111-111111111111",
        "tier": "bronce",
        "consumption_goal": 10,
        "cashback_rate_pct": 3.0,
        "balance_to_release": 0.0,
        "min_spend": 30.0,
        "reward_type": "free_product",
        "reward_title": "Desayuno Completo o Postre Artesanal Gratis",
        "reward_description": "Nivel inicial (1 a 9 consumos)...",
        "is_active": true
      },
      {
        "merchant_id": "a1111111-1111-1111-1111-111111111111",
        "tier": "plata",
        "consumption_goal": 30,
        "cashback_rate_pct": 5.0,
        "balance_to_release": 25.0,
        "min_spend": 30.0,
        "reward_type": "free_product",
        "reward_title": "Beneficio Plata: Desayuno Completo o Postre Artesanal Gratis",
        "reward_description": "Nivel intermedio/recurrente (10 a 30 consumos)...",
        "is_active": true
      },
      {
        "merchant_id": "a1111111-1111-1111-1111-111111111111",
        "tier": "oro",
        "consumption_goal": 50,
        "cashback_rate_pct": 8.0,
        "balance_to_release": 37.5,
        "min_spend": 30.0,
        "reward_type": "balance_credit",
        "reward_title": "Premio VIP Oro: S/ 37.50 de Saldo Libre",
        "reward_description": "Nivel Top Tier / VIP (> 30 consumos)...",
        "is_active": true
      }
    ],
    "default_used": false,
    "updated_at": "2026-11-11T..."
  }
}
```

---

### 3. Consultar Regla de un Nivel Específico
- **Método**: `GET`
- **Ruta**: `/api/rewards/merchants/:merchantId/rules/:tier` (o `/api/rewards/rules/:merchantId/:tier`)
- **Parámetro `:tier`**: `bronce`, `plata` u `oro`.

---

### 4. Guardar Programa Completo (Batch)
- **Método**: `POST` o `PUT`
- **Ruta**: `/api/rewards/merchants/:merchantId/program`
- **Body**: `{ "rules": [ ... ] }`

---

### 5. Health Check
- **Método**: `GET`
- **Ruta**: `/health`
- **Respuesta**:
```json
{
  "service": "rewards-service",
  "status": "healthy",
  "port": 4005,
  "timestamp": "2026-11-11T..."
}
```

---

## 🛠️ Ejecución Local

```bash
# Modo desarrollo con recarga en caliente
pnpm --filter @expandemoney/rewards-service dev

# Compilar TypeScript
pnpm --filter @expandemoney/rewards-service build

# Iniciar compilado
pnpm --filter @expandemoney/rewards-service start
```
