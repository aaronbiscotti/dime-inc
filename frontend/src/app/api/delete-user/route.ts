import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    console.log("Attempting to delete user:", userId);

    // ✅ Use the service role key (only on server)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // make sure this is NOT public
    );

    // First, delete related data from custom tables
    // This is a fallback in case there's no RPC function or cascade setup
    try {
      // Delete user's chats/messages
      await supabaseAdmin.from("chats").delete().eq("client_id", userId);
      await supabaseAdmin.from("chats").delete().eq("ambassador_id", userId);
      await supabaseAdmin.from("messages").delete().eq("sender_id", userId);
      
      // Delete user's campaigns
      await supabaseAdmin.from("campaigns").delete().eq("client_id", userId);
      await supabaseAdmin.from("campaigns").delete().eq("ambassador_id", userId);
      
      // Delete user profile
      await supabaseAdmin.from("profiles").delete().eq("id", userId);
      
      console.log("Related data deletion completed");
    } catch (dbError) {
      console.warn("Error deleting related data:", dbError);
      // Continue with auth deletion even if this fails
    }

    // Delete the user from Supabase Auth
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) {
      console.error("Auth deletion error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("User deletion successful");
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ 
      error: "Internal server error", 
      details: err instanceof Error ? err.message : "Unknown error"
    }, { status: 500 });
  }
}
