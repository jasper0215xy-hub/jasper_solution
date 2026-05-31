import { Router, Request, Response } from 'express';
import { getSolution, generateSolution, updateSolution } from '../services/solutionService';

const router = Router({ mergeParams: true });

router.get('/', (req: Request, res: Response) => {
  const solution = getSolution(req.params.workspaceId);
  res.json({ success: true, data: solution });
});

router.post('/generate', async (req: Request, res: Response) => {
  try {
    const solution = await generateSolution(req.params.workspaceId);
    res.status(201).json({ success: true, data: solution });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

router.put('/', (req: Request, res: Response) => {
  const solution = updateSolution(req.params.workspaceId, req.body);
  if (!solution) {
    res.status(404).json({ success: false, error: 'Solution not found' });
    return;
  }
  res.json({ success: true, data: solution });
});

export default router;
