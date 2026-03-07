import { getEnv, hasAuth0Env, hasSupabaseEnv } from "@/lib/config/env";
import { logApiRequest } from "@/lib/http/logging";
import { ok } from "@/lib/http/response";

export async function GET() {
  logApiRequest("GET", "/api/health");
  const env = getEnv();
  return ok({
    ok: true,
    service: "zonaviva-backend",
    timestamp: new Date().toISOString(),
    mode: env.nodeEnv,
    providers: {
      supabaseConfigured: hasSupabaseEnv(),
      auth0Configured: hasAuth0Env(),
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
      elevenLabsConfigured: Boolean(process.env.ELEVENLABS_API_KEY),
      cloudinaryConfigured: Boolean(process.env.CLOUDINARY_CLOUD_NAME),
    },
  });
}
