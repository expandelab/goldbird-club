import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { RewardsController } from './controllers/rewards.controller';

dotenv.config();

const app = express();
const PORT = process.env.REWARDS_SERVICE_PORT || 4005;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    service: 'rewards-service',
    status: 'healthy',
    port: PORT,
    timestamp: new Date().toISOString(),
  });
});

// Rutas de administración y consulta de programas de recompensa EM.R

// 1. Crear o editar una regla de recompensa por nivel (Bronce / Plata / Oro)
app.post('/api/rewards/rules', RewardsController.upsertRule);
app.put('/api/rewards/rules', RewardsController.upsertRule);
app.put('/api/rewards/merchants/:merchantId/rules/:tier', RewardsController.upsertRule);
app.post('/api/rewards/merchants/:merchantId/rules', RewardsController.upsertRule);

// 2. Consultar reglas de recompensa según el comercio
app.get('/api/rewards/merchants/:merchantId/rules', RewardsController.getRulesByMerchant);
app.get('/api/rewards/merchants/:merchantId', RewardsController.getRulesByMerchant);
app.get('/api/rewards/rules/:merchantId', RewardsController.getRulesByMerchant);

// 3. Consultar regla específica de un nivel para un comercio
app.get('/api/rewards/merchants/:merchantId/rules/:tier', RewardsController.getRuleByTier);
app.get('/api/rewards/rules/:merchantId/:tier', RewardsController.getRuleByTier);

// 4. Guardar o actualizar programa completo de recompensa (los 3 niveles)
app.post('/api/rewards/merchants/:merchantId/program', RewardsController.saveFullProgram);
app.put('/api/rewards/merchants/:merchantId/program', RewardsController.saveFullProgram);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[rewards-service] Microservicio iniciado en el puerto ${PORT}`);
  });
}

export default app;
