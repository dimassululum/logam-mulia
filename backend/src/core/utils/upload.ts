import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { maxFileSize, UPLOAD_DIR } from '../config/env';

// Ensure upload directory exists
const ensureDirectoryExists = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const subDir = req.body.uploadDir || 'products';
    const uploadPath = path.join(UPLOAD_DIR, subDir);
    ensureDirectoryExists(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  },
});

// File filter for images
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check if file is an image
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

// Multer configuration
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: maxFileSize,
    files: 10, // Maximum 10 files per request
  },
});

// Single file upload middleware
export const uploadSingle = (fieldName: string, subDir?: string) => {
  return (req: any, res: any, next: any) => {
    if (subDir) {
      req.body.uploadDir = subDir;
    }
    upload.single(fieldName)(req, res, next);
  };
};

// Multiple files upload middleware
export const uploadMultiple = (fieldName: string, maxCount: number = 5, subDir?: string) => {
  return (req: any, res: any, next: any) => {
    if (subDir) {
      req.body.uploadDir = subDir;
    }
    upload.array(fieldName, maxCount)(req, res, next);
  };
};

// Helper function to get file URL
export const getFileUrl = (filename: string, subDir: string = 'products'): string => {
  return `/uploads/${subDir}/${filename}`;
};

// Helper function to delete file
export const deleteFile = (filePath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const fullPath = path.join(process.cwd(), filePath);
    fs.unlink(fullPath, (err) => {
      if (err && err.code !== 'ENOENT') {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

// Helper function to validate uploaded files
export const validateUploadedFiles = (files: Express.Multer.File[], required: boolean = true) => {
  if (required && (!files || files.length === 0)) {
    throw new Error('No files uploaded');
  }

  const validFiles = files.filter(file => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    return validTypes.includes(file.mimetype);
  });

  if (validFiles.length !== files.length) {
    throw new Error('Only JPEG, PNG, and WebP images are allowed');
  }

  return validFiles;
};

// Product image upload middleware
export const uploadProductImages = uploadMultiple('images', 5, 'products');

// KTP upload middleware (for KYC)
export const uploadKTP = uploadSingle('ktp', 'kyc');

export default {
  upload,
  uploadSingle,
  uploadMultiple,
  uploadProductImages,
  uploadKTP,
  getFileUrl,
  deleteFile,
  validateUploadedFiles,
};
