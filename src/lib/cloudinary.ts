// src/lib/cloudinary.ts
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string;

export type CloudinaryResult = {
    url: string;
    public_id: string;
    width?: number;
    height?: number;
    bytes?: number;
    format?: string;
};

export async function uploadToCloudinary(
    file: File,
    opts?: { folder?: string; resourceType?: "image" | "raw" | "auto" },
): Promise<CloudinaryResult> {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
        throw new Error(
            "Cloudinary env vars missing (VITE_CLOUDINARY_CLOUD_NAME / VITE_CLOUDINARY_UPLOAD_PRESET)",
        );
    }

    const resourceType = opts?.resourceType ?? "image";
    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", UPLOAD_PRESET);
    if (opts?.folder) form.append("folder", opts.folder);

    const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`,
        { method: "POST", body: form },
    );

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Cloudinary upload failed (${res.status}): ${text}`);
    }

    const data = await res.json();
    return {
        url: data.secure_url,
        public_id: data.public_id,
        width: data.width,
        height: data.height,
        bytes: data.bytes,
        format: data.format,
    };
}