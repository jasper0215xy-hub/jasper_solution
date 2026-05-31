import { Router, Request, Response } from 'express';
import { getMatches, runMatch, selectCases } from '../services/caseService';
import { getWorkspace } from '../services/workspaceService';

const router = Router({ mergeParams: true });

router.get('/matches', (req: Request, res: Response) => {
  const matches = getMatches(req.params.workspaceId);
  res.json({ success: true, data: matches });
});

router.post('/match', async (req: Request, res: Response) => {
  const { workspaceId } = req.params;
  const workspace = getWorkspace(workspaceId);
  if (!workspace) {
    res.status(404).json({ success: false, error: 'Workspace not found' });
    return;
  }
  try {
    const matches = await runMatch(workspaceId, workspace.industry, workspace.requirementSummary);
    res.json({ success: true, data: matches });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

router.post('/select', (req: Request, res: Response) => {
  const { caseIds } = req.body as { caseIds: string[] };
  if (!Array.isArray(caseIds)) {
    res.status(400).json({ success: false, error: 'caseIds must be an array' });
    return;
  }
  const updated = selectCases(req.params.workspaceId, caseIds);
  res.json({ success: true, data: updated });
});

export default router;
