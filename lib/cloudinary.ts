import { v2 as cloudinary } from "cloudinary";

if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
) {
    console.warn(
        "Cloudinary environment variables (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) are not set. File uploads will fail."
    );
}

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    timeout: 120000, // 2 minutes — avoids TimeoutError (499) on larger audio/video files
});

export { cloudinary };

export interface CloudinaryUploadResult {
    url: string;
    secure_url: string;
    public_id: string;
}

/**
 * Upload a Buffer to Cloudinary and return the secure URL.
 *
 * @param buffer - The file contents as a Node.js Buffer
 * @param options.folder - Cloudinary folder to organize uploads
 * @param options.resource_type - "image" | "video" | "raw" | "auto" (default "auto")
 * @param options.public_id - Optional custom public id (without folder)
 */
export async function uploadToCloudinary(
    buffer: Buffer,
    options: {
        folder: string;
        resource_type?: "image" | "video" | "raw" | "auto";
        public_id?: string;
        timeout?: number;
    }
): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: options.folder,
                resource_type: options.resource_type ?? "auto",
                timeout: options.timeout ?? 120000,
                ...(options.public_id ? { public_id: options.public_id } : {}),
            },
            (error, result) => {
                if (error) {
                    reject(error);
                    return;
                }
                if (!result) {
                    reject(new Error("Cloudinary upload returned no result"));
                    return;
                }
                resolve({
                    url: result.secure_url,
                    secure_url: result.secure_url,
                    public_id: result.public_id,
                });
            }
        );
        uploadStream.end(buffer);
    });
}
