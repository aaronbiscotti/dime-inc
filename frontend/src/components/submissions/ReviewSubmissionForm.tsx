"use client";
import { useActionState } from "react";
import { reviewSubmissionAction } from "@/app/(protected)/campaigns/actions";

type Props = { submissionId: string; campaignId?: string };

export function ReviewSubmissionForm({ submissionId, campaignId }: Props) {
  const bound = async (_: any, fd: FormData) => {
    fd.set("submissionId", submissionId);
    if (campaignId) fd.set("campaignId", campaignId);
    return reviewSubmissionAction(_, fd);
  };
  const [state, formAction, pending] = useActionState(bound, null);

  return (
    <form action={formAction} className="flex gap-2 items-center">
      <select name="status" className="border rounded-xl px-2 py-1">
        <option value="approved">Approve</option>
        <option value="rejected">Reject</option>
      </select>
      <button disabled={pending} className="rounded-xl border px-3 py-1">
        {pending ? "Saving…" : "Save"}
      </button>
      {state?.error && (
        <span className="text-red-600 text-sm">{state.error}</span>
      )}
    </form>
  );
}
