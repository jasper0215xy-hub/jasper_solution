import { Router, Request, Response } from 'express';
import { listWorkspaces, getWorkspace, createWorkspace } from '../services/workspaceService';
import { ApiResponse, Workspace } from '../types/index';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const workspaces = listWorkspaces();
  const resp: ApiResponse<Workspace[]> = { success: true, data: workspaces };
  res.json(resp);
});

router.get('/:id', (req: Request, res: Response) => {
  const ws = getWorkspace(req.params.id);
  if (!ws) {
    res.status(404).json({ success: false, error: 'Workspace not found' });
    return;
  }
  res.json({ success: true, data: ws });
});

router.post('/', (req: Request, res: Response) => {
  const { name, customerName, industry, background, requirementSummary } = req.body as Partial<Workspace>;
  if (!name || !customerName) {
    res.status(400).json({ success: false, error: 'name and customerName are required' });
    return;
  }
  const ws = createWorkspace({
    name: name as string,
    customerName: customerName as string,
    industry: industry ?? '',
    background: background ?? '',
    requirementSummary: requirementSummary ?? '',
  });
  res.status(201).json({ success: true, data: ws });
});

export default router;
