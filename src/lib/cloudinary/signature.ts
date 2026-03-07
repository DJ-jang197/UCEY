import crypto from "node:crypto";

export type CloudinaryCredentials = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
};

export function getCloudinaryCredentials(): CloudinaryCredentials | null {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME ?? "";
  const apiKey = process.env.CLOUDINARY_API_KEY ?? "";
  const apiSecret = process.env.CLOUDINARY_API_SECRET ?? "";

  if (!cloudName || !apiKey || !apiSecret) {
    return null;
  }

  return { cloudName, apiKey, apiSecret };
}

export function buildCloudinarySignature(
  params: Record<string, string | number>,
  apiSecret: string,
) {
  const payload = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  return crypto
    .createHash("sha1")
    .update(`${payload}${apiSecret}`)
    .digest("hex");
}
