import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import Card from "../ui/Card";
import Button from "../ui/Button";
import { spotApi } from "../../services/spot";
import { Loader2, Star, Sparkles, ThumbsUp, ThumbsDown, Clock3 } from "lucide-react";

const amenityIcons = { /* same as before if any */ };

export default function SpotReviewsCard({ spotId, canReview, amenities, analytics }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(null);
  const [aiSummary, setAiSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [availableAmenities, setAvailableAmenities] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchReviews();
  }, [spotId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const data = await spotApi.getReviews(spotId);
      setReviews(data.reviews || []);
      setSummary(data.summary || null);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) return setError("Please select a rating");
    setSubmitting(true);
    setError("");
    try {
      await spotApi.saveReview(spotId, { rating, reviewText, availableAmenities });
      setReviewText("");
      setRating(0);
      setAvailableAmenities([]);
      fetchReviews();
    } catch (err) {
      setError(err.message || "Failed to save review");
    } finally { setSubmitting(false); }
  };

  const toggleAmenity = (a) => {
    setAvailableAmenities((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );
  };

  if (loading) {
    return <Card className="p-6"><div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div></Card>;
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Reviews</h3>

      {summary && (
        <div className="flex items-center gap-2 mb-4 text-sm">
          <Star size={18} className="text-amber-500" fill="currentColor" />
          <span className="font-bold text-gray-800">{summary.averageRating}</span>
          <span className="text-gray-500">({summary.totalReviews} review{summary.totalReviews !== 1 ? "s" : ""})</span>
        </div>
      )}

      {canReview && (
        <form onSubmit={handleSubmit} className="mb-6 border-b pb-6">
          <div className="flex gap-1 mb-3">
            {[1,2,3,4,5].map((i) => (
              <button type="button" key={i} onClick={() => setRating(i)}
                className={`p-1 ${i <= rating ? "text-amber-500" : "text-gray-300"}`}>
                <Star size={22} fill={i <= rating ? "currentColor" : "none"} />
              </button>
            ))}
          </div>
          <textarea rows={3} value={reviewText} onChange={(e) => setReviewText(e.target.value)}
            className="w-full border border-gray-200 rounded-lg p-3 mb-3"
            placeholder="Share your experience..." />
          <div className="flex flex-wrap gap-2 mb-3">
            {(amenities || []).map((a) => (
              <button type="button" key={a} onClick={() => toggleAmenity(a)}
                className={`px-3 py-1 rounded-full text-xs font-medium border ${availableAmenities.includes(a) ? "bg-blue-50 border-blue-300 text-blue-700" : "bg-gray-50 border-gray-200 text-gray-600"}`}>
                {a}
              </button>
            ))}
          </div>
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : "Submit Review"}</Button>
        </form>
      )}

      {reviews.length === 0 ? (
        <p className="text-sm text-gray-500">No reviews yet.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r._id} className="border-b pb-4 last:border-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-gray-800">{r.user?.name || "Anonymous"}</span>
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map((i) => (
                    <Star key={i} size={12} className={i <= r.rating ? "text-amber-500" : "text-gray-300"} fill={i <= r.rating ? "currentColor" : "none"} />
                  ))}
                </div>
                <span className="text-xs text-gray-400 ml-auto">{new Date(r.createdAt).toLocaleDateString()}</span>
              </div>
              {r.reviewText && <p className="text-sm text-gray-600">{r.reviewText}</p>}
              {r.availableAmenities?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {r.availableAmenities.map((a) => (
                    <span key={a} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">{a}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}