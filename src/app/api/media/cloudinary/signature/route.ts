import { z } from "zod";
import { getRequestUser } from "@/lib/auth/user";
import {
  buildCloudinarySignature,
  getCloudinaryCredentials,
} from "@/lib/cloudinary/signature";
import { logApiRequest } from "@/lib/http/logging";
import { fail, ok } from "@/lib/http/response";

const payloadSchema = z.object({
  folder: z.string().min(1).default("rezone"),
  publicId: z.string().min(1).optional(),
  timestamp: z.number().int().positive().optional(),
});

export async function POST(req: Request) {
  const user = await getRequestUser(req);
  if (!user) {
    return fail(401, {
      code: "UNAUTHORIZED",
      message: "x-user-id header is required for this endpoint",
    });
  }

  const creds = getCloudinaryCredentials();
  if (!creds) {
    return fail(503, {
      code: "CLOUDINARY_NOT_CONFIGURED",
      message: "Cloudinary credentials are missing",
    });
  }

  const body = await req.json().catch(() => null);
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, {
      code: "INVALID_SIGNATURE_REQUEST",
      message: "Cloudinary signature payload is invalid",
      details: parsed.error.flatten(),
    });
  }

  const timestamp =
    parsed.data.timestamp ?? Math.floor(new Date().getTime() / 1000);
  const paramsToSign: Record<string, string | number> = {
    folder: parsed.data.folder,
    timestamp,
  };

  if (parsed.data.publicId) {
    paramsToSign.public_id = parsed.data.publicId;
  }

  const signature = buildCloudinarySignature(paramsToSign, creds.apiSecret);
  logApiRequest("POST", "/api/media/cloudinary/signature", {
    userId: user.id,
    folder: parsed.data.folder,
  });

  return ok({
    cloudName: creds.cloudName,
    apiKey: creds.apiKey,
    timestamp,
    signature,
    params: paramsToSign,
  });
}
