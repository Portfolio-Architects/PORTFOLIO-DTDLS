/**
 * @module imageCompression
 * @description Client-side image compression utility.
 * Compresses images before Firebase Storage upload to reduce bandwidth and loading times.
 * Uses browser-image-compression library with Canvas API under the hood.
 */
import imageCompression from 'browser-image-compression';

/** Compression options — FHD max, optimized for mobile */
const COMPRESSION_OPTIONS = {
  maxSizeMB: 1,                // Target max ~1MB per image
  maxWidthOrHeight: 1920,      // FHD — sharp on mobile & most displays
  useWebWorker: true,          // Non-blocking compression
  fileType: 'image/jpeg' as const,
  initialQuality: 0.82,        // High visual quality, smaller file
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
    return compressed;
  } catch (error) {
    console.warn('[ImageCompression] Compression failed, using original:', error);
    return file;
  }
}
