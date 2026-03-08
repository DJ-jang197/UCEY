import { z } from "zod";
import { fail, ok } from "@/lib/http/response";
import { logApiRequest } from "@/lib/http/logging";
import { synthesizeReportAudio } from "@/lib/ai/elevenlabs";

const bodySchema = z.object({
  text: z.string().min(1, "Text is required"),
});

/** Normalize text for TTS: expand province abbreviations and treat | like a comma. */
function normalizeTextForTTS(text: string): string {
  let out = text
    .replace(/\|/g, ", ")
    .replace(/\bQN\b/gi, "Quebec")
    .replace(/\bQC\b/gi, "Quebec")
    .replace(/\bON\b/g, "Ontario")
    .replace(/\bBC\b/g, "British Columbia");
  return out;
}

export async function POST(req: Request) {
  logApiRequest("POST", "/api/audio/synthesize");

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);

  if (!parsed.success) {
    return fail(400, {
      code: "INVALID_INPUT",
      message: "Invalid request body",
      details: parsed.error.flatten(),
    });
  }

  const { text } = parsed.data;
  const normalizedText = normalizeTextForTTS(text);

  try {
    const audioUrl = await synthesizeReportAudio(normalizedText, "audio-synthesize");
    if (!audioUrl) {
      return fail(503, {
        code: "AUDIO_UNAVAILABLE",
        message: "ElevenLabs is not configured or failed. Set ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID.",
      });
    }
    return ok({ audioUrl });
  } catch (error) {
    return fail(500, {
      code: "SYNTHESIS_FAILED",
      message: "Could not synthesize audio",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
