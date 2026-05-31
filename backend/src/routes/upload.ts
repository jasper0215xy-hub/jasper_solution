import { Router, Request, Response } from 'express';
import multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { listFiles, addFile, parseFile } from '../services/uploadService';
import { isAllowedUpload } from '../utils/fileType';

const UPLOAD_ROOT = path.resolve(process.cwd(), '../storage/uploads');

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const dir = path.join(UPLOAD_ROOT, req.params.workspaceId);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // prefix with a temp uuid-like prefix to avoid collisions; real id set after save
    cb(null, `tmp_${Date.now()}_${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (isAllowedUpload(file.mimetype, file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed: ${file.originalname} (${file.mimetype})`));
    }
  },
});

const router = Router({ mergeParams: true });

router.get('/', (req: Request, res: Response) => {
  const files = listFiles(req.params.workspaceId);
  res.json({ success: true, data: files });
});

router.post('/', upload.single('file'), (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ success: false, error: 'No file uploaded' });
    return;
  }
  const { workspaceId } = req.params;
  const fileRecord = addFile(
    workspaceId,
    req.file.originalname,
    req.file.mimetype,
    req.file.size,
    req.file.path
  );

  // Rename the temp file to use the new uuid as prefix
  const newPath = path.join(path.dirname(req.file.path), `${fileRecord.id}_${req.file.originalname}`);
  try {
    fs.renameSync(req.file.path, newPath);
  } catch {
    // If rename fails, keep original path
  }

  res.status(201).json({ success: true, data: fileRecord });
});

router.post('/:fileId/parse', async (req: Request, res: Response) => {
  const { workspaceId, fileId } = req.params;
  try {
    const result = await parseFile(workspaceId, fileId);
    if (!result) {
      res.status(404).json({ success: false, error: 'File not found' });
      return;
    }
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
