import { supabase } from "../../lib/supabase";
import { unblockNow } from "../blocking/salahFocus";

export type VerifyResult = { passed: boolean; confidence: number; reason: string };

/**
 * Proof Mode: send a captured JPEG (base64, no data: prefix) to the
 * verify-prayer Edge Function. On a pass we clear the shield immediately.
 *
 * The image is sent over TLS, analyzed in-memory by Claude on the server, and
 * never stored. Only pass/fail + confidence come back.
 */
export async function verifyPrayerImage(
  imageBase64: string,
  prayerId?: string
): Promise<VerifyResult> {
  const { data, error } = await supabase.functions.invoke("verify-prayer", {
    body: { imageBase64, mediaType: "image/jpeg", prayerId },
  });
  if (error) throw error;
  const result = data as VerifyResult;
  if (result.passed) unblockNow();
  return result;
}
