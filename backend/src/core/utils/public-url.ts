import { env } from '../config/env';
import fs from 'fs/promises';

export function buildUploadUrl(filename: string) {
  const publicApiUrl = env.PUBLIC_API_URL.replace(/\/+$/, '').replace(/\/api$/, '');
  return `${publicApiUrl}/uploads/${filename}`;
}

export async function buildUploadedFileDataUrl(file: Express.Multer.File) {
  const buffer = file.buffer ?? await fs.readFile(file.path);

  if (file.path) {
    await fs.unlink(file.path).catch(() => undefined);
  }

  return `data:${file.mimetype};base64,${buffer.toString('base64')}`;
}
