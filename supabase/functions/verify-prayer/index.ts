// Proof Mode verification — Claude Haiku vision, server-side.
//
// The device sends a base64 JPEG of the user's prayer spot/posture. We ask Claude
// to judge whether it plausibly shows someone who has prayed (prayer mat laid out,
// person in a prayer posture, prayer space). We return only a pass/fail + a
// confidence score, persist the METADATA (never the image), and let the app clear
// the shield on a pass.
//
// Secrets (set with: supabase secrets set ...):
//   ANTHROPIC_API_KEY   - your Claude key, NEVER shipped to the device
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY - injected automatically
//
// Deploy: supabase functions deploy verify-prayer

import { createClient } from "jsr:@supabase/supabase-js@2";

const MODEL = "claude-haiku-5-5"; // cheap, fast vision — right call for a gate
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

const SYSTEM = `You verify a photo for a Muslim prayer-accountability app's optional "Proof Mode".
The user chose to confirm they prayed by photographing their prayer space or posture.
Judge ONLY whether the image plausibly shows a genuine prayer context: a prayer mat
(sajjada) laid out, a person in a salah posture (standing with hands folded, ruku,
or sujood), or a clear dedicated prayer space. Be lenient and respectful — this is a
gentle accountability nudge, not surveillance or a security system. Reject clearly
unrelated photos (a wall, a meal, a screenshot, a selfie with no prayer context).
Never describe or store the person. Respond with a tool call only.`;

const TOOL = {
  name: "report",
  description: "Report the verification result.",
  input_schema: {
    type: "object",
    properties: {
      passed: { type: "boolean", description: "true if a plausible prayer context is shown" },
      confidence: { type: "number", description: "0..1 confidence in the judgment" },
      reason: { type: "string", description: "short, kind, one sentence" },
    },
    required: ["passed", "confidence", "reason"],
  },
};

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supa = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData } = await supa.auth.getUser();
    const user = userData.user;
    if (!user) return json({ error: "unauthorized" }, 401);

    const { imageBase64, mediaType = "image/jpeg", prayerId } = await req.json();
    if (!imageBase64) return json({ error: "imageBase64 required" }, 400);

    const resp = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "x-api-key": Deno.env.get("ANTHROPIC_API_KEY")!,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 300,
        system: SYSTEM,
        tools: [TOOL],
        tool_choice: { type: "tool", name: "report" },
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mediaType, data: imageBase64 } },
              { type: "text", text: "Did the user pray? Report with the tool." },
            ],
          },
        ],
      }),
    });

    if (!resp.ok) return json({ error: "model_error", detail: await resp.text() }, 502);
    const data = await resp.json();
    const toolUse = data.content?.find((b: any) => b.type === "tool_use");
    const result = toolUse?.input ?? { passed: false, confidence: 0, reason: "No result." };

    // Persist metadata only — the image is never written anywhere.
    await supa.from("verifications").insert({
      user_id: user.id,
      prayer_id: prayerId ?? null,
      method: "proof_ai",
      confidence: result.confidence,
      model: MODEL,
      passed: result.passed,
    });

    return json({
      passed: !!result.passed,
      confidence: result.confidence ?? 0,
      reason: result.reason ?? "",
    });
  } catch (e) {
    return json({ error: "server_error", detail: String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "content-type": "application/json" },
  });
}
