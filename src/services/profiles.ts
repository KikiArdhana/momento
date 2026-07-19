import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";
import type { UserProfile } from "@/types";

function toUserProfile(row: Tables<"profiles">): UserProfile {
  return {
    id: row.id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    togetherSince: row.together_since,
    createdAt: row.created_at,
  };
}

/**
 * The signed-in user's profile plus their email (email lives in auth,
 * not in our profiles table). Returns null when signed out — callers
 * behind the middleware can treat that as unreachable.
 */
export async function getCurrentProfile(): Promise<
  (UserProfile & { email: string | null }) | null
> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !data) return null;

  return { ...toUserProfile(data), email: user.email ?? null };
}
