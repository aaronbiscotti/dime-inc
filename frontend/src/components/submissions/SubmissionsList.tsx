"use client";

import { Database } from "@/types/database";

type Submission = Database["public"]["Tables"]["campaign_submissions"]["Row"];
type SubmissionStatus = "pending_review" | "approved" | "requires_changes";
import { ExternalLink, CheckCircle, Clock, AlertTriangle } from "lucide-react";

interface SubmissionsListProps {
  submissions: Submission[];
  isClientView: boolean;
  onReview?: (submission: Submission) => void;
}

const statusConfig: Record<
  SubmissionStatus,
  { icon: React.ElementType; color: string; text: string }
> = {
  pending_review: {
    icon: Clock,
    color: "text-yellow-600",
    text: "Pending Review",
  },
  approved: { icon: CheckCircle, color: "text-green-600", text: "Approved" },
  requires_changes: {
    icon: AlertTriangle,
    color: "text-red-600",
    text: "Requires Changes",
  },
};

export function SubmissionsList({
  submissions,
  isClientView,
  onReview,
}: SubmissionsListProps) {
  if (submissions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
        <p>No content has been submitted for this campaign yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {submissions.map((submission) => {
        const StatusIcon = statusConfig[submission.status].icon;
        const statusColor = statusConfig[submission.status].color;
        const statusText = statusConfig[submission.status].text;

        return (
          <div
            key={submission.id}
            className="bg-white rounded-xl border border-gray-300 p-4 flex items-center justify-between gap-4"
          >
            <div className="flex-1 min-w-0">
              <a
                href={submission.content_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline truncate"
              >
                <span>{submission.content_url}</span>
                <ExternalLink className="w-4 h-4 flex-shrink-0" />
              </a>
              <p className="text-xs text-gray-500 mt-1">
                Submitted on{" "}
                {submission.submitted_at
                  ? new Date(submission.submitted_at).toLocaleDateString()
                  : "Unknown"}
              </p>
              {submission.ad_code && (
                <p className="text-xs text-gray-500 mt-1">
                  Ad Code:{" "}
                  <span className="font-mono bg-gray-100 px-1 rounded">
                    {submission.ad_code}
                  </span>
                </p>
              )}

              <div
                className={`flex items-center gap-2 mt-2 text-sm font-semibold ${statusColor}`}
              >
                <StatusIcon className="w-4 h-4" />
                <span>{statusText}</span>
              </div>

              {submission.status === "requires_changes" &&
                submission.feedback && (
                  <div className="mt-2 text-xs text-red-700 bg-red-50 p-2 rounded-md border border-red-200">
                    <strong>Feedback:</strong> {submission.feedback}
                  </div>
                )}
            </div>
            {isClientView && submission.status === "pending_review" && (
              <button
                onClick={() => onReview?.(submission)}
                className="px-4 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg"
              >
                Review
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
