import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

let configured = false;

function ensureConfigured() {
  if (!env.cloudinary.cloudName || !env.cloudinary.apiKey || !env.cloudinary.apiSecret) {
    throw new ApiError(503, 'Image uploads are not configured yet.');
  }
  if (env.cloudinary.apiKey === env.cloudinary.apiSecret) {
    throw new ApiError(
      502,
      'Cloudinary rejected the API credentials. CLOUDINARY_API_SECRET is the same value as CLOUDINARY_API_KEY. Paste the API secret from the Cloudinary dashboard, then restart the API.'
    );
  }
  if (!configured) {
    cloudinary.config({
      cloud_name: env.cloudinary.cloudName,
      api_key: env.cloudinary.apiKey,
      api_secret: env.cloudinary.apiSecret,
    });
    configured = true;
  }
}

export function uploadImage(buffer, folder) {
  ensureConfigured();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error || !result?.secure_url) {
          const rejected = error?.http_code === 401;
          reject(
            new ApiError(
              502,
              rejected
                ? 'Cloudinary rejected the API credentials. In the backend environment, CLOUDINARY_API_SECRET must be the API secret from the Cloudinary dashboard, not the numeric API key.'
                : 'The image could not be uploaded.'
            )
          );
          return;
        }
        resolve({ url: result.secure_url, publicId: result.public_id || '' });
      }
    );
    stream.end(buffer);
  });
}

export async function deleteImage(publicId) {
  if (!publicId) return;
  if (!env.cloudinary.cloudName) return;
  ensureConfigured();
  await cloudinary.uploader.destroy(publicId);
}
