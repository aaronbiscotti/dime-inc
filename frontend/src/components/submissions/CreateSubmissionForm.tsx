"use client";
import { useActionState } from "react";
import { createSubmissionAction } from "@/app/(protected)/campaigns/actions";

type Props = { campaignId: string };

export function CreateSubmissionForm({ campaignId }: Props) {
  const bound = async (_: any, fd: FormData) => {
    fd.set("campaignId", campaignId);
    return createSubmissionAction(_, fd);
  };
  const [state, formAction, pending] = useActionState(bound, null);

  return (
    <form action={formAction} className="space-y-3 max-w-md">
      <input
        name="contentUrl"
        placeholder="Content URL"
        className="w-full border rounded-xl px-3 py-2"
      />
      <button disabled={pending} className="rounded-xl border px-4 py-2">
        {pending ? "Submitting…" : "Submit"}
      </button>
      {state?.error && <p className="text-red-600 text-sm">{state.error}</p>}
    </form>
  );
}
