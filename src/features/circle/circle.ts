import { supabase } from "../../lib/supabase";

/** Prayer Circle API — the social accountability layer. */

export type Circle = { id: string; name: string; invite_code: string; owner_id: string };
export type FeedItem = {
  id: string;
  user_id: string;
  kind: string;
  payload: Record<string, unknown>;
  created_at: string;
  profiles?: { username: string; display_name: string | null; avatar_emoji: string };
};
export type LeaderRow = {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_emoji: string;
  noor_score: number;
  current_streak: number;
};

export async function createCircle(name: string): Promise<Circle> {
  const { data: u } = await supabase.auth.getUser();
  const uid = u.user!.id;
  const { data, error } = await supabase
    .from("circles")
    .insert({ name, owner_id: uid })
    .select()
    .single();
  if (error) throw error;
  await supabase.from("circle_members").insert({ circle_id: data.id, user_id: uid, role: "owner" });
  return data as Circle;
}

export async function joinByCode(code: string): Promise<Circle> {
  const { data: circle, error } = await supabase
    .from("circles")
    .select("*")
    .eq("invite_code", code.toUpperCase())
    .single();
  if (error || !circle) throw new Error("Circle not found");
  const { data: u } = await supabase.auth.getUser();
  await supabase
    .from("circle_members")
    .insert({ circle_id: circle.id, user_id: u.user!.id });
  await postToFeed(circle.id, "join", {});
  return circle as Circle;
}

export async function myCircles(): Promise<Circle[]> {
  const { data, error } = await supabase
    .from("circle_members")
    .select("circles(*)")
    .order("joined_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r: any) => r.circles) as Circle[];
}

export async function getFeed(circleId: string, limit = 50): Promise<FeedItem[]> {
  const { data, error } = await supabase
    .from("circle_feed")
    .select("*, profiles(username, display_name, avatar_emoji)")
    .eq("circle_id", circleId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as FeedItem[];
}

export async function postToFeed(
  circleId: string,
  kind: string,
  payload: Record<string, unknown>
) {
  const { data: u } = await supabase.auth.getUser();
  await supabase
    .from("circle_feed")
    .insert({ circle_id: circleId, user_id: u.user!.id, kind, payload });
}

/** Leaderboard = members joined to their profile score, ranked. */
export async function leaderboard(circleId: string): Promise<LeaderRow[]> {
  const { data, error } = await supabase
    .from("circle_members")
    .select("user_id, profiles(username, display_name, avatar_emoji, noor_score, current_streak)")
    .eq("circle_id", circleId);
  if (error) throw error;
  return (data ?? [])
    .map((r: any) => ({ user_id: r.user_id, ...r.profiles }))
    .sort((a: LeaderRow, b: LeaderRow) => b.noor_score - a.noor_score);
}

/** Gentle nudge to a circle-mate ("your circle is waiting for Fajr"). */
export async function nudge(circleId: string, toUsername: string) {
  await postToFeed(circleId, "nudge", { to: toUsername });
}

/** Live feed subscription for a circle. */
export function subscribeFeed(circleId: string, onInsert: (item: FeedItem) => void) {
  return supabase
    .channel(`circle:${circleId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "circle_feed", filter: `circle_id=eq.${circleId}` },
      (payload) => onInsert(payload.new as FeedItem)
    )
    .subscribe();
}
