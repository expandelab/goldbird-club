import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PaymentLinkService } from './paymentLinks';
import { PaymentProcessor } from './processor';

dotenv.config();

const app = express();
const PORT = process.env.PAYMENTS_SERVICE_PORT || 4003;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ service: 'payments-service', status: 'healthy', timestamp: new Date().toISOString() });
});

/**
 * Crear link de cobro digital (tarifa 5%)
 */
app.post('/api/payments/links', async (req: Request, res: Response) => {
  try {
    const { merchantId, title, description, amount, customSlug } = req.body;
    if (!merchantId || !title || !amount) {
      return res.status(400).json({ success: false, error: 'Faltan campos requeridos (merchantId, title, amount)' });
    }

    const link = await PaymentLinkService.createLink({
      merchantId,
      title,
      description,
      amount: Number(amount),
      customSlug,
    });

    return res.status(201).json({ success: true, link });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Obtener detalle de link de cobro por slug
 */
app.get('/api/payments/links/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const link = await PaymentLinkService.getBySlug(slug);
    if (!link) {
      return res.status(404).json({ success: false, error: 'Link de cobro no encontrado' });
    }
    return res.json({ success: true, link });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Procesar consumo rápido en POS
 */
app.post('/api/payments/pos/quick-sale', async (req: Request, res: Response) => {
  try {
    const { merchant_id, phone, full_name, gross_amount, redeem_cashback, coupon_code, payment_method } = req.body;
    if (!merchant_id || !phone || !gross_amount) {
      return res.status(400).json({ success: false, error: 'merchant_id, phone y gross_amount son requeridos' });
    }

    const result = await PaymentProcessor.processInStoreSale({
      merchant_id,
      phone,
      full_name,
      gross_amount: Number(gross_amount),
      redeem_cashback: Boolean(redeem_cashback),
      coupon_code,
      payment_method: payment_method || 'yape',
    });

    return res.json({ success: true, result });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Procesar cobro digital vía Yape / Plin / Tarjeta
 */
app.post('/api/payments/checkout', async (req: Request, res: Response) => {
  try {
    const { merchantId, paymentLinkId, customerPhone, customerName, grossAmount, paymentMethod } = req.body;
    const tx = await PaymentProcessor.processDigitalPayment({
      merchantId,
      paymentLinkId,
      customerPhone,
      customerName,
      grossAmount: Number(grossAmount),
      paymentMethod: paymentMethod || 'yape',
    });

    return res.json({ success: true, transaction: tx });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[payments-service] Microservicio iniciado en el puerto ${PORT}`);
  });
}

export default app;
