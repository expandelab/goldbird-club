# Reports Service (`/services/reports-service`)

Microservicio de inteligencia de negocio, analítica de fidelización y exportación de reportes contables para comercios.

## Indicadores Clave
- **Ventas Totales Registradas (S/.)**: Volumen total facturado en caja y links digitales.
- **Saldo Abonado / Cashback Otorgado (S/.)**: Inversión en fidelización acumulada.
- **Costo de Fidelización Efectivo (%)**: `(Cashback Total / Ventas Brutas) * 100`. Permite comprobar el ROI de la lealtad.
- **Desglose de Clientes por Nivel**: Distribución entre Bronce, Plata y Oro.
- **Comparativa de Ticket Promedio**: Ticket promedio de clientes recurrentes (fidelizados) frente a clientes nuevos de primera visita.

## Exportación Contable
- Transacciones completas en formato CSV delimitado por comas con formato local (`es-PE`, PEN).
- Directorio de clientes con saldos disponibles, saldos bloqueados y última visita.

## Endpoints
- `GET /api/reports/metrics/:merchantId`: Métricas de dashboard en tiempo real.
- `GET /api/reports/export/transactions/:merchantId`: Descarga de archivo CSV de transacciones.
- `GET /api/reports/export/customers/:merchantId`: Descarga de archivo CSV de clientes.
- `GET /health`: Estado de salud del servicio.
