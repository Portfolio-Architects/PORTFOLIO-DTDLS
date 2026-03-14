/**
 * @module imageCompression
 * @description Client-side image compression utility.
 * Compresses images before Firebase Storage upload to reduce bandwidth and loading times.
 * Uses browser-image-compression library with Canvas API under the hood.
 */
import imageCompression from 'browser-image-compression';

/** Compression options — QHD max, high visual quality */
const COMPRESSION_OPTIONS = {
  maxSizeMB: 2,                // Target max ~2MB per image
  maxWidthOrHeight: 2560,      // QHD — sharp even on 4K displays
  useWebWorker: true,          // Non-blocking compression
  fileType: 'image/jpeg' as const,
  initialQuality: 0.85,       // Near-lossless visual quality
};

/**
 * Compresses a File (image) before upload.
 * Non-image files are returned unchanged.
 * @param file - The original File object
 * @returns Compressed File object (or original if not an image)
 */
export async function compressImage(file: File): Promise<File> {
  // Skip non-image files
  if (!file.type.startsWith('image/')) return file;

  try {
    const compressed = await imageCompression(file, COMPRESSION_OPTIONS);
    console.log(
      `[ImageCompression] ${file.name}: ${(file.size / 1024 / 1024).toFixed(1)}MB → ${(compressed.size / 1024 / 1024).toFixed(1)}MB (${Math.round((1 - compressed.size / file.size) * 100)}% reduced)`
    );
    return compressed;
  } catch (error) {
    console.warn('[ImageCompression] Compression failed, using original:', error);
    return file;
  }
}
