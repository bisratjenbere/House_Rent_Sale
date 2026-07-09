import { v2 as cloudinary } from 'cloudinary';

// Lazy-initialize Cloudinary to avoid build-time errors
let cloudinaryConfigured = false;

function ensureCloudinaryConfigured() {
  if (!cloudinaryConfigured) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    cloudinaryConfigured = true;
  }
}

/**
 * Generate signed upload parameters for Cloudinary client-side uploads
 * @returns Signature and related parameters for secure upload
 */
export function generateUploadSignature(): {
  signature: string;
  timestamp: number;
  api_key: string;
  cloud_name: string;
  upload_preset: string;
  folder: string;
  allowed_formats: string;
  max_bytes: number;
} {
  ensureCloudinaryConfigured();

  const timestamp = Math.round(Date.now() / 1000);
  const upload_preset = process.env.CLOUDINARY_UPLOAD_PRESET!;
  const folder = 'properties';
  const allowed_formats = 'jpg,jpeg,png,webp';
  const max_bytes = 10 * 1024 * 1024; // 10 MB

  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      upload_preset,
      folder,
      allowed_formats,
      max_bytes,
    },
    process.env.CLOUDINARY_API_SECRET!
  );

  return {
    signature,
    timestamp,
    api_key: process.env.CLOUDINARY_API_KEY!,
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    upload_preset,
    folder,
    allowed_formats,
    max_bytes,
  };
}

/**
 * Clean up orphaned Cloudinary images when property images are updated
 * Compares old and new image arrays, deletes removed images from Cloudinary
 * @param oldImages - Previous image array
 * @param newImages - Updated image array
 */
export async function cleanupOrphanedImages(
  oldImages: Array<{ url: string; publicId: string }>,
  newImages: Array<{ url: string; publicId: string }>
): Promise<void> {
  ensureCloudinaryConfigured();

  // Extract publicIds from both arrays
  const newPublicIds = new Set(newImages.map((img) => img.publicId));
  const removedImages = oldImages.filter((img) => !newPublicIds.has(img.publicId));

  // Delete each removed image from Cloudinary
  for (const image of removedImages) {
    try {
      await cloudinary.uploader.destroy(image.publicId);
    } catch (error) {
      // Log and continue - don't let individual Cloudinary failures block the operation
      console.error(`Failed to delete Cloudinary image ${image.publicId}:`, error);
    }
  }
}
