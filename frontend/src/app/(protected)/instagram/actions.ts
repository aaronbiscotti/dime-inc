"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/requireUser";
import { createClient } from "@/lib/supabase/server";

// ============================================================================
// INSTAGRAM ACTIONS
// ============================================================================

export async function saveInstagramConnectionAction(
  _: any,
  formData: FormData
) {
  const user = await requireUser();
  const supabase = await createClient();

  const shortLivedToken = String(formData.get("shortLivedToken") ?? "");
  const instagramUserId = String(formData.get("instagramUserId") ?? "");
  const instagramUsername = String(formData.get("instagramUsername") ?? "");

  if (!shortLivedToken || !instagramUserId || !instagramUsername) {
    return {
      ok: false,
      error: "Instagram connection data is required",
    } as const;
  }

  // Save the connection to the database
  const { data: connection, error } = await supabase
    .from("instagram_connections")
    .upsert({
      ambassador_id: user.id,
      instagram_user_id: instagramUserId,
      instagram_username: instagramUsername,
      access_token: shortLivedToken,
      token_expires_at: new Date(
        Date.now() + 60 * 24 * 60 * 60 * 1000
      ).toISOString(), // 60 days
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message } as const;

  revalidatePath("/profile");
  return { ok: true, data: connection } as const;
}

export async function getInstagramConnectionAction() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: connection, error } = await supabase
    .from("instagram_connections")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error && error.code !== "PGRST116") {
    // Not found error
    return { ok: false, error: error.message } as const;
  }

  const isConnected =
    connection && new Date(connection.token_expires_at) > new Date();

  return {
    ok: true,
    data: {
      connected: isConnected,
      username: connection?.instagram_username,
      expires_at: connection?.token_expires_at,
    },
  } as const;
}

export async function disconnectInstagramAction() {
  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("instagram_connections")
    .delete()
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message } as const;

  revalidatePath("/profile");
  return { ok: true } as const;
}

export async function getInstagramMediaAction() {
  const user = await requireUser();
  const supabase = await createClient();

  // Get user's Instagram connection
  const { data: connection, error: fetchError } = await supabase
    .from("instagram_connections")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (fetchError || !connection) {
    return { ok: false, error: "Instagram not connected" } as const;
  }

  // Check if token is expired
  if (new Date(connection.token_expires_at) <= new Date()) {
    return { ok: false, error: "Instagram connection expired" } as const;
  }

  // For now, return mock data since we don't have actual Instagram API integration
  // In a real implementation, you would call the Instagram API here
  const mockMedia = [
    {
      id: "1",
      caption: "Sample Instagram post",
      media_type: "IMAGE" as const,
      media_url: "https://example.com/image.jpg",
      permalink: "https://instagram.com/p/example",
      timestamp: new Date().toISOString(),
      username: connection.instagram_username,
    },
  ];

  return { ok: true, data: mockMedia } as const;
}
