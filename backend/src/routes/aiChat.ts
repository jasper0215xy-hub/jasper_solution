import { Router, Request, Response } from 'express';
import { getMessages, sendMessage, applyPatch } from '../services/aiChatService';

const router = Router({ mergeParams: true });

router.get('/messages', (req: Request, res: Response) => {
  const messages = getMessages(req.params.workspaceId);
  res.json({ success: true, data: messages });
});

router.post('/messages', async (req: Request, res: Response) => {
  const { content } = req.body as { content: string };
  if (!content?.trim()) {
    res.status(400).json({ success: false, error: 'content is required' });
    return;
  }
  try {
    const msg = await sendMessage(req.params.workspaceId, content.trim());
    res.status(201).json({ success: true, data: msg });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

router.post('/apply', (req: Request, res: Response) => {
  const { messageId } = req.body as { messageId: string };
  if (!messageId) {
    res.status(400).json({ success: false, error: 'messageId is required' });
    return;
  }
  const ok = applyPatch(req.params.workspaceId, messageId);
  if (!ok) {
    res.status(400).json({ success: false, error: 'Cannot apply: message not found, no patch, or already applied' });
    return;
  }
  res.json({ success: true });
});

export default router;
