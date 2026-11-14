import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { NotificationController } from './controllers/notification.controller';

dotenv.config();

const app = express();
const PORT = process.env.NOTIFICATIONS_SERVICE_PORT || 4006;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    service: 'notifications-service',
    status: 'healthy',
    port: PORT,
    timestamp: new Date().toISOString(),
  });
});

// Rutas de Alertas y Notificaciones Transaccionales EM.N

// 1. Endpoint principal: Procesar evento de nuevo consumo o liberación de premio
app.post('/api/notifications/events', NotificationController.handleEvent);

// 2. Previsualizar mensaje y regla sin enviar
app.post('/api/notifications/preview', NotificationController.previewEvent);

// 3. Envío directo / manual de notificación
app.post('/api/notifications/send', NotificationController.sendDirect);

// 4. Historial y logs de notificaciones despachadas
app.get('/api/notifications/history', NotificationController.getHistory);

// 5. Catálogo de plantillas y reglas de fidelización disponibles
app.get('/api/notifications/templates', NotificationController.getTemplates);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[notifications-service] Microservicio iniciado en el puerto ${PORT}`);
  });
}

export default app;
