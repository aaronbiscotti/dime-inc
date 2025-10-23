"use client";
import { useActionState } from "react";
import { createCampaignAction } from "@/app/(protected)/campaigns/actions";

export function CreateCampaignForm() {
  const [state, formAction, pending] = useActionState(
    createCampaignAction,
    null
  );

  return (
    <form action={formAction} className="space-y-3 max-w-md">
      <input
        name="title"
        placeholder="Title"
        className="w-full border rounded-xl px-3 py-2"
      />
      <textarea
        name="description"
        placeholder="Description"
        className="w-full border rounded-xl px-3 py-2"
      />
      <button disabled={pending} className="rounded-xl border px-4 py-2">
        {pending ? "Creating…" : "Create"}
      </button>
      {state?.error && <p className="text-red-600 text-sm">{state.error}</p>}
    </form>
  );
}
