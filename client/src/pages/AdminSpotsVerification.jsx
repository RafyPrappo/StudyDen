import { useEffect, useState } from "react";
import Container from "../components/ui/Container";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { adminApi } from "../services/admin";
import { spotApi } from "../services/spot";
import { Loader2, CheckCircle, Building2, Trash2 } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "Verified", label: "Verified", icon: CheckCircle, color: "green" },
  { value: "Commercial", label: "Commercial", icon: Building2, color: "purple" },
];

export default function AdminSpotsVerification() {
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPendingSpots();
  }, []);

  const fetchPendingSpots = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await adminApi.getPendingSpots();
      console.log("Pending spots:", data);
      setSpots(data.spots || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load spots");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (spotId, newStatus) => {
    setUpdatingId(spotId);
    try {
      await adminApi.updateSpotStatus(spotId, newStatus);
      setSpots(spots.filter((s) => s._id !== spotId));
    } catch (err) {
      alert("Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (spotId, spotTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${spotTitle}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(spotId);
    try {
      await spotApi.deleteSpot(spotId);
      setSpots(spots.filter((s) => s._id !== spotId));
    } catch (err) {
      alert(err.message || "Failed to delete spot");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <Container>
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin" size={32} />
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <div className="p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>
      </Container>
    );
  }

  return (
    <Container>
      <h1 className="text-2xl font-bold mb-6">Verify Study Spots</h1>
      {spots.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500 mb-2">No pending spots to verify.</p>
          <p className="text-sm text-gray-400">Newly created spots will appear here with "Unverified" status.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {spots.map((spot) => (
            <Card key={spot._id} className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{spot.title}</h3>
                  <p className="text-gray-600">{spot.address}</p>
                  <p className="text-sm text-gray-500 mt-1">Posted by: {spot.postedBy?.name}</p>
                  <p className="text-xs text-gray-400 mt-1">Current status: {spot.verificationStatus}</p>
                </div>
                <div className="flex gap-2">
                  {STATUS_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <Button
                        key={opt.value}
                        size="sm"
                        variant="ghost"
                        onClick={() => handleStatusChange(spot._id, opt.value)}
                        disabled={updatingId === spot._id || deletingId === spot._id}
                        className={`border-${opt.color}-200 hover:bg-${opt.color}-50`}
                      >
                        <Icon size={14} className={`text-${opt.color}-600`} />
                        {opt.label}
                      </Button>
                    );
                  })}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(spot._id, spot.title)}
                    disabled={updatingId === spot._id || deletingId === spot._id}
                    className="border-red-200 hover:bg-red-50 text-red-600"
                  >
                    <Trash2 size={14} className="text-red-600" />
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Container>
  );
}