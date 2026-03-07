import { GoogleGenerativeAI } from "@google/generative-ai";
import type { SiteDetail } from "@/lib/types/site";

function buildFallbackSummary(site: SiteDetail, reason?: string): { summary: string; rawJson: Record<string, unknown> } {
  const parts: string[] = [];

  const location = [site.city, site.province].filter(Boolean).join(", ");
  const nameLine = site.name || "This site";
  const type = site.siteType || "brownfield or underused parcel";

  parts.push(
    `${nameLine} is an underused ${type.toLowerCase()}${location ? ` in ${location}` : ""}.`,
  );

  if (site.contaminationStatus || site.estimates.remediationCost != null) {
    const status = site.contaminationStatus || "contamination risks";
    parts.push(
      `Available data indicates ${status.toLowerCase()} and an estimated remediation effort that is already reflected in the cost and viability scores shown in the panel.`,
    );
  }

  const v = site.viabilityScore;
  if (v != null) {
    if (v >= 75) {
      parts.push(
        "Overall viability is high, suggesting this site should be considered a strong candidate for near‑term infill or mixed‑use housing.",
      );
    } else if (v >= 50) {
      parts.push(
        "Overall viability is moderate, suggesting the site could support housing if remediation and infrastructure gaps are managed proactively.",
      );
    } else {
      parts.push(
        "Overall viability is lower, so this site may be better suited as a medium‑ to long‑term opportunity once higher‑scoring sites have advanced.",
      );
    }
  }

  const summary = parts.join(" ");

  return {
    summary,
    rawJson: {
      provider: "fallback",
      generatedAt: new Date().toISOString(),
      reason: reason ?? "Gemini unavailable or quota exceeded",
    },
  };
}

export async function generateSiteReport(site: SiteDetail) {
  const apiKey = process.env.GEMINI_API_KEY;

  // If we don't have an API key at all, immediately return a heuristic fallback summary.
  if (!apiKey) {
    return buildFallbackSummary(site, "GEMINI_API_KEY is not configured");
  }

  const summaryInput = {
    id: site.id,
    name: site.name,
    city: site.city,
    province: site.province,
    siteType: site.siteType,
    contaminationStatus: site.contaminationStatus,
    formerUse: site.formerUse,
    areaM2: site.areaM2,
    viabilityScore: site.viabilityScore,
    scores: site.scores,
    estimates: site.estimates,
  };

  const prompt = [
    "You are an urban planning assistant writing a concise briefing note for a municipal planner.",
    "",
    "Write 2–3 short paragraphs in plain language covering:",
    "- What this site is today and why it is underused.",
    "- Soil/contamination risk in lay terms.",
    "- Infrastructure context (transit, services) in qualitative terms based on the scores.",
    "- Housing potential (rough scale only, no precise unit math).",
    "- A recommendation (e.g. 'high-priority infill candidate', 'monitor but lower priority', etc.).",
    "",
    "Avoid bullet points. Do not invent specific addresses or legal references.",
    "Keep it under 220 words.",
    "",
    "Here is the structured input as JSON:",
    JSON.stringify(summaryInput, null, 2),
  ].join("\n");

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text().trim();

    if (!text) {
      return buildFallbackSummary(site, "Gemini returned an empty response");
    }

    return {
      summary: text,
      rawJson: {
        provider: "gemini-2.0-flash",
        model: "gemini-2.0-flash",
        generatedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    return buildFallbackSummary(
      site,
      error instanceof Error ? error.message : "Gemini call failed",
    );
  }
}


