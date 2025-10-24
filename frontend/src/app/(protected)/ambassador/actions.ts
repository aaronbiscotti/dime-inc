"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/requireUser";
import { createClient } from "@/lib/supabase/server";

// Ambassador accepts a proposal tied to a chat. We map acceptance to
// advancing status from 'proposal_received' -> 'contract_drafted'.
export async function acceptProposalAction(_: any, formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const chatRoomId = String(formData.get("chatRoomId") ?? "").trim();

  if (!chatRoomId) {
    return { ok: false, error: "chatRoomId is required" } as const;
  }

  // Find the ambassador profile id for the current user
  const { data: amb, error: ambErr } = await supabase
    .from("ambassador_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (ambErr || !amb) {
    return { ok: false, error: "Ambassador profile not found" } as const;
  }

  // Locate the most recent pending campaign_ambassadors row for this chat and ambassador profile
  const { data: ca, error: findErr } = await supabase
    .from("campaign_ambassadors")
    .select("id, status, chat_room_id, created_at")
    .eq("chat_room_id", chatRoomId)
    .eq("ambassador_id", amb.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (findErr || !ca) {
    return { ok: false, error: "No pending proposal found for this chat" } as const;
  }

  if (ca.status !== "proposal_received") {
    return { ok: false, error: "Proposal already processed" } as const;
  }

  const { data: updated, error: updErr } = await supabase
    .from("campaign_ambassadors")
    .update({ status: "contract_drafted", selected_at: new Date().toISOString() })
    .eq("id", ca.id)
    .select("id,status,selected_at,campaign_id,ambassador_id,chat_room_id")
    .single();

  if (updErr) return { ok: false, error: updErr.message } as const;

  // Optional: add a system message to the chat room for visibility
  await supabase.from("messages").insert({
    chat_room_id: chatRoomId,
    sender_id: user.id,
    message_type: "system",
    content: "Ambassador accepted the campaign invitation",
  });

  // Revalidate chats and dashboard listings
  revalidatePath("/chats");
  revalidatePath("/ambassador/dashboard");
  return { ok: true, data: updated } as const;
}
