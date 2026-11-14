import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { LoyaltyController } from './controllers/loyalty.controller';

dotenv.config();

const app = express();
const PORT = process.env.LOYALTY_ENGINE_PORT || 4002;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ service: 'loyalty-engine', status: 'healthy', timestamp: new Date().toISOString() });
});

// Rutas del motor de fidelización EM.R
// 1. Registro de consumo en comercio y cálculo de saldo abonado (bloqueado o disponible según nivel)
app.post('/api/loyalty/record-consumption', LoyaltyController.recordConsumption);
app.post('/api/loyalty/consumption', LoyaltyController.recordConsumption);

// 2. Consulta de estado actual del cliente (visitas acumuladas, saldo abonado y progreso de tarjeta)
app.get('/api/loyalty/customers/:customerId/status', LoyaltyController.getCustomerStatus);
app.get('/api/loyalty/customer-status', LoyaltyController.getCustomerStatus);

// 3. Simulación de cálculo previo y validación de cupones
app.post('/api/loyalty/simulate', LoyaltyController.simulate);
app.post('/api/loyalty/validate-coupon', LoyaltyController.validateCoupon);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[loyalty-engine] Microservicio iniciado en el puerto ${PORT}`);
  });
}

export default app;
