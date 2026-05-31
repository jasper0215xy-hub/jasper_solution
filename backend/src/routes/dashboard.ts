import { Router, Request, Response } from 'express';
import {
  generateDashboard,
  getDashboard,
  getDashboardPromptDraft,
  saveDashboardPromptDraft,
} from '../services/dashboardService';

const router = Router({ mergeParams: true });

router.get('/', (req: Request, res: Response) => {
  const dashboard = getDashboard(req.params.workspaceId);
  res.json({ success: true, data: dashboard });
});

router.get('/prompt', (req: Request, res: Response) => {
  const draft = getDashboardPromptDraft(req.params.workspaceId);
  res.json({ success: true, data: draft });
});

router.put('/prompt', (req: Request, res: Response) => {
  const { imagePrompt, sourceFileIds, title, summary } = req.body as {
    imagePrompt?: string;
    sourceFileIds?: string[];
    title?: string;
    summary?: string;
  };
  if (!imagePrompt?.trim()) {
    res.status(400).json({ success: false, error: 'imagePrompt is required' });
    return;
  }
  const draft = saveDashboardPromptDraft(
    req.params.workspaceId,
    imagePrompt.trim(),
    sourceFileIds ?? [],
    title ?? 'Demo驾驶舱',
    summary ?? ''
  );
  res.json({ success: true, data: draft });
});

router.post('/generate', async (req: Request, res: Response) => {
  try {
    const dashboard = await generateDashboard(req.params.workspaceId);
    res.status(201).json({ success: true, data: dashboard });
  } catch (err) {
    res.status(400).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
