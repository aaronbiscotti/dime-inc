"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Database } from "@/types/database";
import { reviewSubmissionAction } from "@/app/(protected)/submissions/actions";

type Submission = Database["public"]["Tables"]["campaign_submissions"]["Row"];

interface ClientReviewModalProps {
  submission: Submission | null;
  onClose: () => void;
  onReviewed: () => void; // Callback to refresh list
}

export function ClientReviewModal({
  submission,
  onClose,
  onReviewed,
}: ClientReviewModalProps) {
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!submission) return null;

  const handleReview = async (status: "approved" | "requires_changes") => {
    if (status === "requires_changes" && !feedback.trim()) {
      setError("Feedback is required when requesting changes.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("submissionId", submission.id);
      formData.append("status", status);
      formData.append("feedback", feedback);

      const result = await reviewSubmissionAction(null, formData);
      if (result.ok) {
        onReviewed();
        onClose();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={!!submission} onClose={onClose} title="Review Submission">
      <div className="space-y-4">
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div>
          <Label htmlFor="feedback">
            Feedback for Creator (required if requesting changes)
          </Label>
          <Textarea
            id="feedback"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="e.g., 'Please use a different caption.'"
            rows={4}
          />
        </div>
        <div className="flex justify-end gap-3">
          <Button
            variant="destructive"
            onClick={() => handleReview("requires_changes")}
            disabled={loading}
          >
            Request Changes
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={() => handleReview("approved")}
            disabled={loading}
          >
            Approve
          </Button>
        </div>
      </div>
    </Modal>
  );
}
