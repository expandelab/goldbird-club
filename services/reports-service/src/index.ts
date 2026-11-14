import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ReportsAnalytics } from './analytics';
import { ReportExporter } from './exporter';

dotenv.config();

const app = express();
const PORT = process.env.REPORTS_SERVICE_PORT || 4004;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ service: 'reports-service', status: 'healthy', timestamp: new Date().toISOString() });
});

/**
 * Métricas en tiempo real del comercio
 */
app.get('/api/reports/metrics/:merchantId', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const metrics = await ReportsAnalytics.getMerchantMetrics(merchantId);
    return res.json({ success: true, metrics });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Exportar transacciones en formato CSV
 */
app.get('/api/reports/export/transactions/:merchantId', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const csvContent = await ReportExporter.exportTransactionsCSV(merchantId);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="transacciones_${merchantId}_${Date.now()}.csv"`);
    return res.send(csvContent);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Exportar clientes en formato CSV
 */
app.get('/api/reports/export/customers/:merchantId', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const csvContent = await ReportExporter.exportCustomersCSV(merchantId);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="clientes_${merchantId}_${Date.now()}.csv"`);
    return res.send(csvContent);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[reports-service] Microservicio iniciado en el puerto ${PORT}`);
  });
}

export default app;
