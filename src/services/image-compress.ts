// Image compression service using browser-image-compression
// Replaces Squoosh (archived by Google) with the same capability:
// - WebWorker-based compression (non-blocking)
// - Resize to max dimensions
// - Quality reduction to target file size
// - Format-preserving (JPEG/PNG/WebP)
import imageCompression from 'browser-image-compression';

export interface CompressionOptions {
  maxSizeMB: number;      // Target max file size (default: 1)
  maxWidthPx: number;     // Max width/height in pixels (default: 1920)
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxSizeMB: 1,
  maxWidthPx: 1920,
};

/**
 * Compress an image file before uploading to Google Drive.
 * Reduces file size and dimensions while maintaining quality.
 * Runs in a WebWorker so it doesn't block the UI.
 */
export async function compressImage(
  file: File,
  options: Partial<CompressionOptions> = {}
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Skip compression for already-small files (< 200KB)
  if (file.size < 200 * 1024) {
    return file;
  }

  const compressed = await imageCompression(file, {
    maxSizeMB: opts.maxSizeMB,
    maxWidthOrHeight: opts.maxWidthPx,
    useWebWorker: true,
    preserveExif: false,        // Strip metadata to save space
    fileType: file.type as string || 'image/jpeg',
  });

  console.log(
    `[Stepsy] Image compressed: ${(file.size / 1024).toFixed(0)}KB → ${(compressed.size / 1024).toFixed(0)}KB ` +
    `(${Math.round((1 - compressed.size / file.size) * 100)}% reduction)`
  );

  // Return as File (browser-image-compression returns Blob)
  return new File([compressed], file.name, {
    type: compressed.type,
    lastModified: Date.now(),
  });
}

/**
 * Create a thumbnail version (max 400px, ~50KB) for quick previews.
 */
export async function createThumbnail(file: File): Promise<File> {
  const compressed = await imageCompression(file, {
    maxSizeMB: 0.05,
    maxWidthOrHeight: 400,
    useWebWorker: true,
    preserveExif: false,
  });

  return new File([compressed], `thumb_${file.name}`, {
    type: compressed.type,
    lastModified: Date.now(),
  });
}
