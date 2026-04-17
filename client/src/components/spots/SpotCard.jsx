import { Link } from "react-router-dom";
import Card from "../ui/Card";
import { MapPin, Wifi, Zap, Snowflake, VolumeX, Coffee, Car, Bath, Users, Star, CheckCircle, AlertTriangle, Building2 } from "lucide-react";

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

export default function SpotCard({ spot, onUpdate }) {
  const averageRating = spot.averageRating || 0;
  const totalReviews = spot.totalReviews || 0;
  const ratingDisplay = averageRating > 0 ? averageRating.toFixed(1) : "New";

  return (
    <Link to={`/spots/${spot._id}`}>
      <Card className="p-5 hover:shadow-lg transition-all duration-200 border border-gray-100 hover:border-blue-200 h-full flex flex-col">
        <div className="flex items-start justify-between mb-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${typeStyles[spot.type] || typeStyles.Public}`}>
            {spot.type}
          </span>
          <div className="flex items-center gap-1">
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
            {totalReviews > 0 && (
              <span className="flex items-center gap-1 text-amber-500 text-sm font-medium ml-1">
                <Star size={14} fill="currentColor" /> {ratingDisplay}
              </span>
            )}
          </div>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">{spot.title}</h3>

        <div className="flex items-start gap-2 text-sm text-gray-600 mb-3">
          <MapPin size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
          <span className="line-clamp-2">{spot.address}</span>
        </div>

        <div className="flex flex-wrap gap-1 mb-4">
          {spot.amenities?.slice(0, 4).map((amenity) => {
            const Icon = amenityIcons[amenity];
            return Icon ? (
              <span key={amenity} className="p-1.5 bg-gray-100 rounded-md text-gray-600" title={amenity}>
                <Icon size={14} />
              </span>
            ) : null;
          })}
          {spot.amenities?.length > 4 && (
            <span className="p-1.5 bg-gray-100 rounded-md text-gray-600 text-xs font-medium">+{spot.amenities.length - 4}</span>
          )}
        </div>

        <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-medium">
              {spot.postedBy?.name?.charAt(0).toUpperCase() || "?"}
            </div>
            <span className="text-xs text-gray-500">{spot.postedBy?.name || "Unknown"}</span>
          </div>
          {totalReviews > 0 && <span className="text-xs text-gray-400">{totalReviews} review{totalReviews !== 1 ? "s" : ""}</span>}
        </div>
      </Card>
    </Link>
  );
}