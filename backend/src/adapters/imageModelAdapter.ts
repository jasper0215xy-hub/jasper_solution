import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { PNG } from 'pngjs';
import { logger } from '../utils/logger';

dotenv.config({ path: path.resolve(process.cwd(), '../.env.ai') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env.ai') });

export interface ImageGenParams {
  prompt: string;
  width: 3840;
  height: 2160;
  format: 'png';
}

export interface ImageGenResult {
  localPath: string;
  url: string;
}

interface ImageModelConfig {
  provider: string;
  apiKey: string;
  baseUrl: string;
  modelName: string;
}

// ─── Mock: generate a deterministic 4K PNG dashboard placeholder ─────────────

function setPixel(png: PNG, x: number, y: number, r: number, g: number, b: number, a = 255): void {
  if (x < 0 || y < 0 || x >= png.width || y >= png.height) return;
  const idx = (png.width * y + x) << 2;
  png.data[idx] = r;
  png.data[idx + 1] = g;
  png.data[idx + 2] = b;
  png.data[idx + 3] = a;
}

function rect(png: PNG, x: number, y: number, w: number, h: number, color: [number, number, number], alpha = 255): void {
  for (let yy = y; yy < y + h; yy += 1) {
    for (let xx = x; xx < x + w; xx += 1) {
      setPixel(png, xx, yy, color[0], color[1], color[2], alpha);
    }
  }
}

function generatePlaceholderPng(prompt: string, outputPath: string): Promise<void> {
  const png = new PNG({ width: 3840, height: 2160 });
  const seed = prompt.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);

  for (let y = 0; y < png.height; y += 1) {
    for (let x = 0; x < png.width; x += 1) {
      const idx = (png.width * y + x) << 2;
      png.data[idx] = 244 - Math.floor(y / 180);
      png.data[idx + 1] = 247 - Math.floor(y / 260);
      png.data[idx + 2] = 251;
      png.data[idx + 3] = 255;
    }
  }

  rect(png, 0, 0, 3840, 210, [26, 39, 68]);
  rect(png, 80, 260, 3680, 2, [226, 230, 234]);

  const cardColors: [number, number, number][] = [[59, 110, 248], [22, 163, 74], [217, 119, 6], [99, 102, 241], [14, 165, 233], [220, 38, 38]];
  for (let i = 0; i < 6; i += 1) {
    const x = 80 + i * 610;
    rect(png, x, 300, 560, 250, [255, 255, 255]);
    rect(png, x, 300, 8, 250, cardColors[i]);
    rect(png, x + 44, 470 - ((seed + i * 17) % 80), 160, 18, cardColors[i]);
    rect(png, x + 44, 510, 320, 10, [226, 230, 234]);
  }

  const chartBlocks = [
    [80, 610, 1760, 620],
    [1920, 610, 1840, 620],
    [80, 1290, 1180, 690],
    [1320, 1290, 1180, 690],
    [2560, 1290, 1200, 690],
  ];
  chartBlocks.forEach(([x, y, w, h], index) => {
    rect(png, x, y, w, h, [255, 255, 255]);
    rect(png, x + 36, y + 70, w - 72, 2, [226, 230, 234]);
    if (index === 0) {
      for (let i = 0; i < 8; i += 1) rect(png, x + 80 + i * 190, y + 500 - i * 34, 90, 210 + i * 34, [59, 110, 248]);
    } else if (index === 1) {
      for (let i = 0; i < 11; i += 1) rect(png, x + 70 + i * 150, y + 430 - ((i * 37 + seed) % 170), 72, 72, [22, 163, 74]);
    } else if (index === 2) {
      rect(png, x + 280, y + 170, 430, 430, [59, 110, 248]);
      rect(png, x + 400, y + 290, 190, 190, [255, 255, 255]);
    } else {
      for (let i = 0; i < 5; i += 1) {
        rect(png, x + 50, y + 130 + i * 92, w - 100, 2, [226, 230, 234]);
        rect(png, x + 60, y + 158 + i * 92, 260 + i * 80, 18, index === 3 ? [217, 119, 6] : [220, 38, 38]);
      }
    }
  });

  return new Promise((resolve, reject) => {
    png.pack().pipe(fs.createWriteStream(outputPath)).on('finish', resolve).on('error', reject);
  });
}

async function mockImageGeneration(
  params: ImageGenParams,
  outputDir: string,
  fileId: string
): Promise<ImageGenResult> {
  logger.info('[mockImageAdapter] generating placeholder image');
  await new Promise((r) => setTimeout(r, 800));

  const filename = `${fileId}.png`;
  const localPath = path.join(outputDir, filename);
  fs.mkdirSync(outputDir, { recursive: true });
  await generatePlaceholderPng(params.prompt, localPath);

  return {
    localPath,
    url: `/api/static/generated-images/${path.basename(outputDir)}/${filename}`,
  };
}

// ─── Real image generation entry point ───────────────────────────────────────
// TODO: 真实接入时实现此函数（支持 Stable Diffusion / DALL-E / 通义万象等）

async function saveImageResponse(
  image: { b64_json?: string; url?: string },
  localPath: string,
  apiKey: string
): Promise<void> {
  if (image.b64_json) {
    const base64 = image.b64_json.includes(',') ? image.b64_json.split(',').pop() ?? '' : image.b64_json;
    fs.writeFileSync(localPath, Buffer.from(base64, 'base64'));
    return;
  }

  if (image.url) {
    const response = await fetch(image.url, {
      headers: image.url.includes('aihubmix.com') ? { Authorization: `Bearer ${apiKey}` } : undefined,
    });
    if (!response.ok) {
      throw new Error(`Image download failed: ${response.status} ${(await response.text()).slice(0, 200)}`);
    }
    fs.writeFileSync(localPath, Buffer.from(await response.arrayBuffer()));
    return;
  }

  throw new Error('Image model response did not include b64_json or url');
}

async function requestImageGeneration(config: ImageModelConfig, payload: Record<string, unknown>): Promise<{
  data?: Array<{ b64_json?: string; url?: string }>;
}> {
  const endpoint = `${config.baseUrl.replace(/\/$/, '')}/images/generations`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Image model request failed: ${response.status} ${body.slice(0, 500)}`);
  }

  return response.json() as Promise<{ data?: Array<{ b64_json?: string; url?: string }> }>;
}

async function realImageGeneration(
  params: ImageGenParams,
  outputDir: string,
  fileId: string,
  config: ImageModelConfig
): Promise<ImageGenResult> {
  logger.info('[imageAdapter] image generation called', {
    provider: config.provider,
    modelName: config.modelName,
    width: params.width,
    height: params.height,
  });

  const filename = `${fileId}.png`;
  const localPath = path.join(outputDir, filename);
  fs.mkdirSync(outputDir, { recursive: true });

  const basePayload = {
    model: config.modelName,
    prompt: params.prompt,
    n: 1,
    size: `${params.width}x${params.height}`,
  };

  const attempts: Array<Record<string, unknown>> = [
    { ...basePayload, response_format: 'b64_json', output_format: params.format, quality: 'high' },
    { ...basePayload, response_format: 'b64_json' },
    basePayload,
  ];

  let lastError: unknown;
  for (const payload of attempts) {
    try {
      const result = await requestImageGeneration(config, payload);
      const image = result.data?.[0];
      if (!image) throw new Error('Image model returned empty data');
      await saveImageResponse(image, localPath, config.apiKey);
      return {
        localPath,
        url: `/api/static/generated-images/${path.basename(outputDir)}/${filename}`,
      };
    } catch (err) {
      lastError = err;
      logger.info('[imageAdapter] image generation attempt failed, trying fallback payload');
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function generateImage(
  params: ImageGenParams,
  outputDir: string,
  fileId: string
): Promise<ImageGenResult> {
  const provider = process.env.IMAGE_MODEL_PROVIDER || 'openai-compatible';
  const apiKey = process.env.IMAGE_MODEL_API_KEY ?? '';
  const baseUrl = process.env.IMAGE_MODEL_BASE_URL ?? '';
  const modelName = process.env.IMAGE_MODEL_NAME ?? '';

  if (provider === 'mock' || !apiKey || !baseUrl || !modelName) {
    return mockImageGeneration(params, outputDir, fileId);
  }
  return realImageGeneration(params, outputDir, fileId, { provider, apiKey, baseUrl, modelName });
}
