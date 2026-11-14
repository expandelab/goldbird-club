import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { AuthController } from './controllers/auth.controller';
import { requireAuth, requireRoles } from './middlewares/auth.middleware';

dotenv.config();

const app = express();
const PORT = process.env.AUTH_SERVICE_PORT || 4001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ service: 'auth-service', status: 'healthy', timestamp: new Date().toISOString() });
});

// Rutas de autenticación y alta de comercio
app.post('/api/auth/merchant-register', AuthController.registerMerchant);
app.post('/api/auth/merchant-login', AuthController.merchantLogin);
app.patch('/api/auth/merchants/:merchantId/approve', requireAuth, requireRoles(['super_admin']), AuthController.approveMerchant);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[auth-service] Microservicio iniciado en el puerto ${PORT}`);
  });
}

export default app;
