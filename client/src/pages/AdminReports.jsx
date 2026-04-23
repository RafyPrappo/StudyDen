import { useEffect, useState } from "react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { adminApi } from "../services/admin";

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await adminApi.getSpotReports();
      setReports(data.reports || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleAction = async (reportId, action) => {
    if (action === "remove") {
      const confirmed = window.confirm(
        "Are you sure you want to remove this spot listing?"
      );
      if (!confirmed) return;
    }

    try {
      setActionLoadingId(reportId);
      await adminApi.resolveSpotReport(reportId, { action });
      fetchReports();
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to process report.");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900">Reported Spots</h1>
        <p className="mt-2 text-gray-600">
          Review reported spot listings and decide whether to keep or remove them.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-gray-500">Loading reports...</div>
      ) : reports.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-lg text-gray-500">No pending reports</p>
          <p className="text-sm text-gray-400 mt-2">
            All reported listings have been reviewed.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {reports.map((report) => (
            <Card key={report._id} className="p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {report.spot?.title || "Deleted Spot"}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {report.spot?.address || "No address available"}
                  </p>
                </div>

                <span className="rounded-full border border-yellow-200 bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">
                  Pending
                </span>
              </div>

              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700">Reason</p>
                <p className="mt-1 text-sm text-gray-600">{report.reason}</p>
              </div>

              <div className="mb-4 grid gap-3 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-gray-700">Reported By</p>
                  <p className="mt-1 text-sm text-gray-600">
                    {report.reportedBy?.name || "Unknown User"}
                  </p>
                  <p className="text-xs text-gray-400">
                    {report.reportedBy?.email || ""}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700">Spot Type</p>
                  <p className="mt-1 text-sm text-gray-600">
                    {report.spot?.type || "N/A"}
                  </p>
                </div>
              </div>

              <div className="mb-5">
                <p className="text-sm font-medium text-gray-700">Description</p>
                <p className="mt-1 text-sm text-gray-600">
                  {report.spot?.description || "No description provided."}
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={() => handleAction(report._id, "keep")}
                  disabled={actionLoadingId === report._id}
                >
                  {actionLoadingId === report._id ? "Processing..." : "Keep Listing"}
                </Button>

                <Button
                  onClick={() => handleAction(report._id, "remove")}
                  disabled={actionLoadingId === report._id}
                >
                  {actionLoadingId === report._id ? "Processing..." : "Remove Listing"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}