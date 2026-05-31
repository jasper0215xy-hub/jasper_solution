import { Router, Request, Response } from 'express';
import { getFeishuDoc, generateFeishuDoc } from '../services/feishuService';

const router = Router({ mergeParams: true });

router.get('/doc', (req: Request, res: Response) => {
  const doc = getFeishuDoc(req.params.workspaceId);
  res.json({ success: true, data: doc });
});

router.post('/doc', async (req: Request, res: Response) => {
  try {
    const doc = await generateFeishuDoc(req.params.workspaceId);
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

export default router;
