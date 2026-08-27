
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export const isCloudinaryConfigured = () => !!CLOUDINARY_CLOUD_NAME && !!CLOUDINARY_UPLOAD_PRESET;

interface UploadOptions {
  folder?: string;
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
  type?: 'upload' | 'private' | 'authenticated';
  accessMode?: 'public' | 'authenticated';
}

export async function uploadToCloudinary(
  file: File,
  options: UploadOptions = {}
): Promise<string> {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured. Please add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET to your environment variables.');
  }

  const { folder = 'grouptherapy', resourceType = 'auto', type, accessMode } = options;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', folder);
  if (type) formData.append('type', type);
  if (accessMode) formData.append('access_mode', accessMode);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      let errorMsg = `HTTP ${response.status}: Upload failed`;
      try {
        const data = await response.json();
        errorMsg = data?.error?.message || data?.message || errorMsg;
      } catch {
        try {
          const text = await response.text();
          if (text) errorMsg = text;
        } catch {
          // ignore
        }
      }
      throw new Error(errorMsg);
    }

    const data = await response.json();
    const secureUrl: unknown = data?.secure_url;

    if (typeof secureUrl !== 'string' || !secureUrl) {
      throw new Error('No URL in upload response');
    }

    return secureUrl;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
}

export async function uploadToCloudinaryWithProgress(
  file: File,
  options: UploadOptions = {},
  onProgress?: (progress: number) => void,
  retries = 2
): Promise<string> {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured. Please add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET to your environment variables.');
  }

  const { folder = 'grouptherapy', resourceType = 'auto', type, accessMode } = options;
  const fileSizeMB = file.size / (1024 * 1024);
  
  // Calculate timeout based on file size (1 minute per 10MB, minimum 5 minutes, maximum 30 minutes)
  const timeout = Math.min(Math.max(fileSizeMB * 6000, 300000), 1800000);

  const attemptUpload = (attempt: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('folder', folder);
      if (type) formData.append('type', type);
      if (accessMode) formData.append('access_mode', accessMode);
      
      // For large files, use raw resource type and add chunking hints
      if (file.size > 100 * 1024 * 1024) {
        // Cloudinary automatically handles large files, but we can optimize
        formData.append('resource_type', resourceType === 'auto' ? 'raw' : resourceType);
        // Add async upload for very large files
        if (file.size > 200 * 1024 * 1024) {
          formData.append('async', 'true');
        }
      }

      let lastProgress = 0;
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100);
          // Only update if progress increased (avoid flickering)
          if (progress > lastProgress) {
            lastProgress = progress;
            onProgress(progress);
          }
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            if (data.secure_url) {
              resolve(data.secure_url);
            } else if (data.public_id) {
              // For async uploads, construct URL
              const version = typeof data.version === 'number' || typeof data.version === 'string' ? `v${data.version}/` : '';
              const url = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload/${version}${data.public_id}`;
              resolve(url);
            } else {
              reject(new Error('No URL in upload response'));
            }
          } catch (e) {
            reject(new Error('Failed to parse upload response'));
          }
        } else {
          let errorMsg = 'Upload failed';
          try {
            const errorData = JSON.parse(xhr.responseText);
            errorMsg = errorData.error?.message || errorMsg;
          } catch {
            errorMsg = xhr.responseText || `HTTP ${xhr.status}: Upload failed`;
          }
          
          // Retry on certain errors
          if (attempt < retries && (xhr.status === 0 || xhr.status >= 500 || xhr.status === 408)) {
            setTimeout(() => {
              attemptUpload(attempt + 1).then(resolve).catch(reject);
            }, Math.pow(2, attempt) * 1000); // Exponential backoff
            return;
          }
          
          reject(new Error(errorMsg));
        }
      });

      xhr.addEventListener('error', () => {
        if (attempt < retries) {
          setTimeout(() => {
            attemptUpload(attempt + 1).then(resolve).catch(reject);
          }, Math.pow(2, attempt) * 1000);
        } else {
          reject(new Error('Network error during upload. Please check your connection and try again.'));
        }
      });
      
      xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));
      
      xhr.addEventListener('timeout', () => {
        if (attempt < retries) {
          setTimeout(() => {
            attemptUpload(attempt + 1).then(resolve).catch(reject);
          }, Math.pow(2, attempt) * 1000);
        } else {
          reject(new Error(`Upload timeout after ${Math.round(timeout / 1000)} seconds. File may be too large.`));
        }
      });

      xhr.timeout = timeout;
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`);
      xhr.send(formData);
    });
  };

  return attemptUpload(0);
}

export async function uploadImage(
  file: File,
  folder: string = 'images',
  onProgress?: (progress: number) => void
): Promise<string> {
  if (onProgress) {
    return uploadToCloudinaryWithProgress(file, { folder, resourceType: 'image' }, onProgress);
  }
  return uploadToCloudinary(file, { folder, resourceType: 'image' });
}

export async function uploadVideo(
  file: File,
  folder: string = 'videos',
  onProgress?: (progress: number) => void
): Promise<string> {
  if (onProgress) {
    return uploadToCloudinaryWithProgress(file, { folder, resourceType: 'video' }, onProgress);
  }
  return uploadToCloudinary(file, { folder, resourceType: 'video' });
}

export async function uploadAudio(
  file: File,
  folder: string = 'audio',
  onProgress?: (progress: number) => void
): Promise<string> {
  // Always use progress version for audio to handle large files better
  return uploadToCloudinaryWithProgress(file, { folder, resourceType: 'video' }, onProgress, 3);
}
