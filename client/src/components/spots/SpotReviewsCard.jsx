import { useEffect, useState } from "react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import { spotApi } from "../../services/spot";
import { Loader2, Star } from "lucide-react";

export default function SpotReviewsCard({
  spotId,
  canReview = true,
  amenities = [],
}) {
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({ averageRating: 0, totalReviews: 0 });
  const [myReview, setMyReview] = useState(null);

  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [selectedAmenities, setSelectedAmenities] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [editingReview, setEditingReview] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      setSaveMessage("");

      const [reviewsData, myReviewData] = await Promise.all([
        spotApi.getReviews(spotId),
        canReview
          ? spotApi.getMyReview(spotId).catch(() => ({ review: null }))
          : Promise.resolve({ review: null }),
      ]);

      setReviews(reviewsData.reviews || []);
      setSummary(reviewsData.summary || { averageRating: 0, totalReviews: 0 });

      const existingReview = myReviewData.review || null;
      setMyReview(existingReview);
      setEditingReview(!existingReview);

      if (existingReview) {
        setRating(existingReview.rating || 0);
        setReviewText(existingReview.reviewText || "");
        setSelectedAmenities(existingReview.availableAmenities || []);
      } else {
        setRating(0);
        setReviewText("");
        setSelectedAmenities([]);
      }
    } catch (err) {
      setError(err.message || "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!spotId) return;
    loadData();
  }, [spotId, canReview]);

  const toggleAmenity = (amenity) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((item) => item !== amenity)
        : [...prev, amenity]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!rating) {
      setError("Please select a rating");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSaveMessage("");

      await spotApi.saveReview(spotId, {
        rating,
        reviewText,
        availableAmenities: selectedAmenities,
      });

      await loadData();
      setSaveMessage("Review saved successfully");
      setEditingReview(false);
    } catch (err) {
      setError(err.message || "Failed to save review");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-5 h-fit">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-gray-900">Reviews & Ratings</h3>
        <p className="text-sm text-gray-500 mt-1">
          See what other students reported about this spot.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-blue-600" size={28} />
        </div>
      ) : (
        <>
          <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <div className="text-3xl font-bold text-gray-900">
                {summary.averageRating || 0}
              </div>
              <div>
                <div className="flex items-center gap-1 text-yellow-500">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={index}
                      size={16}
                      fill={
                        index < Math.round(summary.averageRating)
                          ? "currentColor"
                          : "none"
                      }
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {summary.totalReviews} review{summary.totalReviews === 1 ? "" : "s"}
                </p>
              </div>
            </div>
          </div>

          {myReview && !editingReview && (
            <div className="mb-6">
              <Button onClick={() => setEditingReview(true)}>
                Update Review
              </Button>
            </div>
          )}

          {canReview && (editingReview || !myReview) && (
            <form onSubmit={handleSubmit} className="mb-6 border-b border-slate-200 pb-6">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                {myReview ? "Update your review" : "Leave a review"}
              </h4>

              <div className="mb-4">
                <p className="text-sm text-gray-700 mb-2">Your rating</p>
                <div className="flex items-center gap-2">
                  {Array.from({ length: 5 }).map((_, index) => {
                    const value = index + 1;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setRating(value)}
                        className="text-yellow-500"
                      >
                        <Star
                          size={20}
                          fill={value <= rating ? "currentColor" : "none"}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {amenities.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm text-gray-700 mb-2">
                    Available amenities you noticed
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {amenities.map((amenity) => (
                      <button
                        key={amenity}
                        type="button"
                        onClick={() => toggleAmenity(amenity)}
                        className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                          selectedAmenities.includes(amenity)
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        {amenity}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm text-gray-700 mb-2">
                  Review
                </label>
                <textarea
                  rows={4}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share your experience with this study spot..."
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {error && (
                <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              {saveMessage && (
                <div className="mb-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                  {saveMessage}
                </div>
              )}

              {!myReview ? (
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                  Submit Review
                </Button>
              ) : (
                <div className="flex gap-3">
                  <Button type="submit" disabled={saving}>
                    {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                    Update Review
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setEditingReview(false)}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </form>
          )}

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            {reviews.length === 0 ? (
              <p className="text-sm text-gray-500">No reviews yet.</p>
            ) : (
              reviews.map((review) => (
                <div
                  key={review._id}
                  className="rounded-xl border border-slate-200 p-4 bg-white"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {review.user?.name || "Unknown"}
                      </p>
                      <div className="flex items-center gap-1 text-yellow-500 mt-1">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star
                            key={index}
                            size={14}
                            fill={index < review.rating ? "currentColor" : "none"}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {review.reviewText ? (
                    <p className="text-sm text-gray-600 mb-3">{review.reviewText}</p>
                  ) : null}

                  {review.availableAmenities?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {review.availableAmenities.map((item) => (
                        <span
                          key={item}
                          className="px-2.5 py-1 rounded-full text-xs bg-slate-100 text-slate-700"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </Card>
  );
}
