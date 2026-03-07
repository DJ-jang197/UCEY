import { Buffer } from "node:buffer";

const ELEVEN_BASE_URL = "https://api.elevenlabs.io/v1/text-to-speech";

export function hasElevenLabsEnv(): boolean {
  return Boolean(process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_VOICE_ID);
}

export async function synthesizeReportAudio(
  text: string,
  _siteId: string,
): Promise<string | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  if (!apiKey || !voiceId) return null;

  try {
    const res = await fetch(`${ELEVEN_BASE_URL}/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.4,
          similarity_boost: 0.8,
        },
      }),
    });

    if (!res.ok) {
      // If ElevenLabs is misconfigured or unreachable, just skip audio.
      return null;
    }

    const arrayBuffer = await res.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    return `data:audio/mpeg;base64,${base64}`;
  } catch {
    // Fail soft: return null so the UI shows "Audio unavailable" but the text report still works.
    return null;
  }
}

