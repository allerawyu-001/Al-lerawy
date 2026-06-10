// src/lib/cloudinary.ts

export const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "";
export const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "";

export const getCloudinaryUrl = (publicId: string, options: Record<string, string> = {}): string => {
  const params = new URLSearchParams(options).toString();
  const base = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload`;
  return params ? `${base}?${params}/${publicId}` : `${base}/${publicId}`;
};

/**
 * Uploads a file directly to Cloudinary via unsigned upload
 * @param file The file to upload
 * @param folder The folder path exactly as it should appear in Cloudinary (e.g. "avatars", "products")
 * @param onProgress Optional callback for upload progress (0-100)
 */
export const uploadToCloudinary = (
  file: File,
  folder: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      reject(new Error("Cloudinary configuration missing. Check environment variables."));
      return;
    }

    const xhr = new XMLHttpRequest();
    const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

    xhr.open("POST", url, true);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        const progress = Math.round((e.loaded / e.total) * 100);
        onProgress(progress);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        resolve(response.secure_url);
      } else {
        const err = JSON.parse(xhr.responseText);
        reject(new Error(err.error?.message || "Cloudinary upload failed"));
      }
    };

    xhr.onerror = () => {
      reject(new Error("Network error during upload"));
    };

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("folder", folder);

    xhr.send(formData);
  });
};
