// client/src/components/spots/ReportSpotModal.jsx

import { useState } from "react";
import Button from "../ui/Button";
import { spotApi } from "../../services/spot";

export default function ReportSpotModal({ spotId, onClose }) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!reason.trim()) {
      alert("Please enter a reason for reporting this spot.");
      return;
    }

    setSubmitting(true);

    try {
      await spotApi.reportSpot(spotId, { reason: reason.trim() });
      alert("Report submitted successfully.");
      onClose();
    } catch (err) {
      console.error("Failed to submit report:", err);
      alert(err.message || "Failed to submit report.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Report Spot</h2>
          <p className="mt-1 text-sm text-gray-600">
            Tell us why this listing is incorrect or inappropriate.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="report-reason"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Reason
            </label>
            <textarea
              id="report-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={5}
              maxLength={300}
              placeholder="Example: Wrong address, fake listing, inappropriate description, etc."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-right text-xs text-gray-400">
              {reason.length}/300
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}