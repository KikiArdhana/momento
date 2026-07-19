"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function updateTogetherSince(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const raw = String(formData.get("together_since") ?? "").trim();
  await supabase
    .from("profiles")
    .update({ together_since: raw || null })
    .eq("id", user.id);

  revalidatePath("/profile");
}
