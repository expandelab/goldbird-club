# Payments Service (`/services/payments-service`)

Microservicio de cobros digitales y procesamiento de pagos con tarifa plana de 5% expandeMoney.

## Características
- **Links de Cobro Directos**: Creación de URLs cortas con slug personalizable para cobrar pedidos por WhatsApp, Instagram o QR.
- **División Automática de Liquidación**:
  - Monto Bruto (100%)
  - Tarifa expandeMoney (5%)
  - Abono Neto al Comercio (95%)
  - Saldo de Cashback acreditado al consumidor final.
- **Procesamiento de POS en Local**: Integración instantánea con el motor de fidelización para canjear saldo o cupones y registrar consumos presenciales.
- **Soporte de Medios de Pago Peruanos**: Yape, Plin, Tarjeta de Débito/Crédito y Efectivo.

## Endpoints
- `POST /api/payments/links`: Genera link de cobro digital con 5% de tarifa.
- `GET /api/payments/links/:slug`: Consulta datos de link para la pasarela de pago.
- `POST /api/payments/pos/quick-sale`: Registro de venta rápida en caja con cashback.
- `POST /api/payments/checkout`: Cobro y conciliación digital.
- `GET /health`: Estado del servicio.
