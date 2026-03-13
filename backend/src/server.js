import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { z } from 'zod';
import { analyzeAndStoreFingerprint } from './riskService.js';

const app = express();

const port = Number(process.env.PORT || 8080);
const corsOrigin = process.env.CORS_ORIGIN || '*';

app.use(helmet());
app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: '32kb' }));
app.use(morgan('dev'));

app.get('/health', (_req, res) => {
  res.status(200).json({ ok: true, service: 'password-pattern-detector-api' });
});

app.get('/docs', (_req, res) => {
  res.status(200).json({
    name: 'Password Pattern Detector API',
    version: '1.0.0',
    endpoints: [
      {
        method: 'GET',
        path: '/health',
        description: 'Service health status'
      },
      {
        method: 'POST',
        path: '/api/v1/risk/check',
        description: 'Analyze and store password fingerprint risk'
      }
    ]
  });
});

const riskCheckSchema = z.object({
  userId: z.string().min(1),
  site: z.string().min(1),
  passwordHash: z.string().min(10),
  structure: z.string().min(1),
  tokens: z.object({
    baseWord: z.string().default(''),
    numbers: z.string().default(''),
    symbols: z.string().default('')
  }),
  passwordLength: z.number().int().min(1).max(256)
});

app.post('/api/v1/risk/check', async (req, res) => {
  const parsed = riskCheckSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Invalid request payload',
      details: parsed.error.flatten()
    });
  }

  try {
    const risk = await analyzeAndStoreFingerprint(parsed.data);
    return res.status(200).json({ risk });
  } catch (error) {
    console.error('Risk check failed:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});
