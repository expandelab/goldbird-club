# Auth Service (`/services/auth-service`)

Microservicio de autenticación, gestión de roles de usuarios y emisión de sesiones seguras para expandeMoney.

## Funcionalidades
- **Autenticación de Comercio (Admin y Cajero)**: Login vía Supabase Auth con email y contraseña, vinculación con perfil de comercio (`merchant_id`).
- **Verificación sin App para Consumidor**: Flujo OTP / Magic Link vía WhatsApp (+51) para acceso seguro a la Web Wallet sin requerir descarga de apps ni contraseñas.
- **Emisión de Tokens JWT**: Emisión de tokens firmados y middleware de validación de roles (`merchant_admin`, `merchant_cashier`, `customer`).

## Endpoints
- `POST /api/auth/merchant-login`: Inicio de sesión de comercio.
- `POST /api/auth/customer-otp`: Solicitud de código OTP WhatsApp para cliente.
- `GET /api/auth/session`: Validación de token de sesión actual.
- `GET /health`: Estado de salud del servicio.
