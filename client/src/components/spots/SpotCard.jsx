import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import Card from "../ui/Card";
import Button from "../ui/Button";
import ReportSpotModal from "./ReportSpotModal";
import { spotApi } from "../../services/spot";
import {
  MapPin,
  Wifi,
  Zap,
  Snowflake,
  VolumeX,
  Coffee,
  Car,
  Bath,
  Users,
  Trophy,
  Medal,
  Trash2,
  Loader2,
  Star,
  Heart,
  CheckCircle,
  AlertTriangle,
  Building2,
} from "lucide-react";

const amenityIcons = {
  WiFi: Wifi,
  "Charging Points": Zap,
  AC: Snowflake,
  "Quiet Zone": VolumeX,
  Snacks: Coffee,
  Parking: Car,
  Washroom: Bath,
  "Group Seating": Users,
};

const typeStyles = {
  Public: "bg-green-100 text-green-700 border-green-200",
  Private: "bg-purple-100 text-purple-700 border-purple-200",
};

export default function SpotCard({ spot, onUpdate, favouriteIds = [] }) {
  const { user } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isFavourite, setIsFavourite] = useState(false);
  const [favouriteLoading, setFavouriteLoading] = useState(false);

  const userId = String(user?._id || user?.id || "");
  const ownerId = String(spot.postedBy?._id || spot.postedBy || "");
  const isOwner = userId === ownerId;

  const averageRating = spot.averageRating || 0;
  const totalReviews = spot.totalReviews || 0;
  const ratingDisplay = averageRating > 0 ? averageRating.toFixed(1) : "New";

  useEffect(() => {
    const spotId = String(spot?._id || "");
    const exists = favouriteIds.some((id) => String(id) === spotId);
    setIsFavourite(exists);
  }, [favouriteIds, spot?._id]);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this study spot?")) {
      return;
    }
    setDeleting(true);
    try {
      await spotApi.deleteSpot(spot._id);
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error("Failed to delete spot:", err);
      alert(err.message || "Failed to delete spot");
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleFavourite = async () => {
    try {
      setFavouriteLoading(true);
      const data = await spotApi.toggleFavourite(spot._id);
      setIsFavourite(data.isFavourite);
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error("Failed to update favourite:", err);
      alert(err.message || "Failed to update favourite");
    } finally {
      setFavouriteLoading(false);
    }
  };

  return (
    <>
      <Card className="p-5 hover:shadow-lg transition-all duration-200 border border-gray-100 hover:border-blue-200 min-h-[420px] flex flex-col">
        <div className="flex items-start justify-between mb-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium border ${
              typeStyles[spot.type] || typeStyles.Public
            }`}
          >
            {spot.type}
          </span>

          <div className="flex items-center gap-2">
            {/* Favourite Button */}
            <Button
              variant="ghost"
              onClick={handleToggleFavourite}
              disabled={favouriteLoading}
              className={`px-3 py-2 border ${
                isFavourite
                  ? "border-pink-300 text-pink-600"
                  : "border-gray-200 hover:border-pink-300 hover:text-pink-600"
              }`}
            >
              {favouriteLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Heart size={16} fill={isFavourite ? "currentColor" : "none"} />
              )}
            </Button>

            {/* Report Button (non-owners only) */}
            {!isOwner && (
              <Button
                variant="ghost"
                onClick={() => setShowReportModal(true)}
                className="px-3 py-2 border border-gray-200 hover:border-yellow-300 hover:text-yellow-600"
              >
                Report
              </Button>
            )}

            {/* Delete Button (owners only) */}
            {isOwner && (
              <Button
                variant="ghost"
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-2 border border-gray-200 hover:border-red-300 hover:text-red-600"
              >
                {deleting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Title and Link */}
        <div className="flex-shrink-0">
          <Link to={`/spots/${spot._id}`} className="block">
            <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2 min-h-[3.5rem]">
              {spot.title}
            </h3>
          </Link>
        </div>

        {/* Address */}
        <div className="mt-2 mb-4">
          <Link to={`/spots/${spot._id}`} className="block">
            <div className="flex items-start gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors">
              <MapPin size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
              <span className="line-clamp-2">{spot.address}</span>
            </div>
          </Link>
        </div>

        {/* Rating, Reviews, Verification Badges */}
        <div className="mb-4 flex items-center gap-2 text-sm flex-wrap">
          <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 px-3 py-1.5 border border-amber-100">
            <Star size={14} fill="currentColor" />
            <span className="font-medium">{ratingDisplay}</span>
          </div>
          <span className="text-gray-500 text-xs">
            ({totalReviews} review{totalReviews === 1 ? "" : "s"})
          </span>

          {/* Verification Badges */}
          {spot.verificationStatus === "Verified" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full" title="Verified spot">
              <CheckCircle size={12} /> Verified
            </span>
          )}
          {spot.verificationStatus === "Unverified" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full" title="Unverified spot">
              <AlertTriangle size={12} /> Unverified
            </span>
          )}
          {spot.verificationStatus === "Commercial" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full" title="Commercial space">
              <Building2 size={12} /> Commercial
            </span>
          )}
        </div>

        {/* Crowd Status */}
        <div className="mb-4 flex items-center gap-2 text-sm">
          <div className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 px-3 py-1.5 border border-blue-100">
            <Users size={14} />
            <span className="font-medium">
              Crowd Status: {spot.crowdStatus || "N/A"}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 line-clamp-4 min-h-[6rem]">
          {spot.description || "No description provided."}
        </p>

        {/* Amenities */}
        <div className="mt-4">
          <p className="text-xs font-medium text-gray-500 mb-2">Amenities</p>
          {spot.amenities?.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {spot.amenities.slice(0, 4).map((amenity) => {
                const Icon = amenityIcons[amenity];
                return (
                  <span
                    key={amenity}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs bg-gray-100 text-gray-700"
                  >
                    {Icon ? <Icon size={12} /> : null}
                    {amenity}
                  </span>
                );
              })}
              {spot.amenities.length > 4 && (
                <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs bg-gray-100 text-gray-700">
                  +{spot.amenities.length - 4} more
                </span>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No amenities listed</p>
          )}
        </div>

        {/* Posted By */}
        <div className="mt-auto pt-4">
          <div className="flex items-center gap-3 p-2 -mx-2 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 overflow-hidden flex-shrink-0">
              {spot.postedBy?.profilePhoto ? (
                <img
                  src={`${import.meta.env.VITE_API_BASE_URL}${spot.postedBy.profilePhoto}`}
                  alt={spot.postedBy?.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white font-semibold text-lg">
                  {spot.postedBy?.name?.charAt(0).toUpperCase() || "?"}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {spot.postedBy?.name || "Unknown"}
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="flex items-center gap-1 flex-shrink-0">
                  <Trophy size={12} />
                  {spot.postedBy?.points || 0} pts
                </span>
                {spot.postedBy?.badges?.length > 0 && (
                  <>
                    <span className="flex-shrink-0">•</span>
                    <span className="flex items-center gap-0.5">
                      {spot.postedBy.badges.slice(0, 2).map((badge) => (
                        <Medal
                          key={badge}
                          size={12}
                          className="text-yellow-500 flex-shrink-0"
                        />
                      ))}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Report Modal */}
      {showReportModal && (
        <ReportSpotModal
          spotId={spot._id}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </>
  );
}