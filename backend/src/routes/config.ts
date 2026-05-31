import { Router } from 'express';
import { getConfigStatus } from '../services/configService';

const router = Router();

router.get('/status', (_req, res) => {
  res.json({ success: true, data: getConfigStatus() });
});

export default router;
