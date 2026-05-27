import { env } from '../config/env';
import fs from 'fs/promises';
import path from 'path';
import { createHash } from 'crypto';

export function buildUploadUrl(filename: string) {
  const publicApiUrl = env.PUBLIC_API_URL.replace(/\/+$/, '').replace(/\/api$/, '');
  return `${publicApiUrl}/uploads/${filename}`;
}

export function buildUploadedFileUrl(file: Express.Multer.File) {
  return `/uploads/${path.basename(file.filename)}`;
}

export async function buildUploadedFileDataUrl(file: Express.Multer.File) {
  const buffer = file.buffer ?? await fs.readFile(file.path);

  if (file.path) {
    await fs.unlink(file.path).catch(() => undefined);
  }

  return `data:${file.mimetype};base64,${buffer.toString('base64')}`;
}

function extensionForMime(mimeType: string) {
  if (mimeType === 'image/jpeg') return 'jpg';
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  return null;
}

export async function persistDataUrlToUpload(value: string, prefix: string) {
  const match = value.match(/^data:(image\/(?:jpeg|png|webp));base64,([a-z0-9+/=\s]+)$/i);
  if (!match) return value;

  const [, mimeType, base64] = match;
  const ext = extensionForMime(mimeType.toLowerCase());
  if (!ext) return value;

  const buffer = Buffer.from(base64.replace(/\s/g, ''), 'base64');
  const hash = createHash('sha256').update(buffer).digest('hex').slice(0, 20);
  const safePrefix = prefix.replace(/[^a-z0-9-]/gi, '-').toLowerCase() || 'upload';
  const filename = `${safePrefix}-${hash}.${ext}`;
  const uploadDir = path.resolve(env.UPLOAD_DIR);

  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(path.join(uploadDir, filename), buffer).catch(async (error: NodeJS.ErrnoException) => {
    if (error.code !== 'EEXIST') throw error;
  });

  return `/uploads/${filename}`;
}
