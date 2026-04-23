import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Container from "../components/ui/Container";
import Button from "../components/ui/Button";
import SpotCard from "../components/spots/SpotCard";
import CreateSpotModal from "../components/spots/CreateSpotModal";
import { spotApi } from "../services/spot";
import { useAuth } from "../context/AuthContext";
import { Search, Loader2, Plus, Star, SlidersHorizontal } from "lucide-react";

const TYPES = ["All", "Public", "Private"];

const AMENITY_FILTERS = [
  "All",
  "WiFi",
  "Charging Points",
  "AC",
  "Quiet Zone",
  "Snacks",
  "Parking",
  "Washroom",
  "Group Seating",
];

const RATING_FILTERS = [
  { label: "All", value: "All" },
  { label: "4+ Stars", value: "4" },
  { label: "3+ Stars", value: "3" },
  { label: "2+ Stars", value: "2" },
  { label: "1+ Stars", value: "1" },
];

export default function Spots() {
  const location = useLocation();
  const { user } = useAuth();

  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState("All");
  const [selectedAmenity, setSelectedAmenity] = useState("All");
  const [selectedRating, setSelectedRating] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState("");
  const [isPreferenceMode, setIsPreferenceMode] = useState(false);
  const [favouriteIds, setFavouriteIds] = useState([]);

  useEffect(() => {
    const event = new CustomEvent("navbar-events-page", {
      detail: location.pathname === "/events",
    });
    window.dispatchEvent(event);
  }, [location]);

  const fetchSpots = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await spotApi.getSpots({
        type: selectedType,
        amenity: selectedAmenity,
        minRating: selectedRating,
        search: searchQuery,
        page,
        limit: 9,
      });

      setSpots(data.spots || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch (err) {
      setError("Failed to load study spots. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPreferredSpots = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await spotApi.getMyPreferredSpots({
        page,
        limit: 9,
      });

      setSpots(data.spots || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch (err) {
      setError("Failed to load spots based on your preferences.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavouriteIds = async () => {
    try {
      const data = await spotApi.getFavouriteSpots();
      const ids = (data.spots || []).map((spot) => spot._id);
      setFavouriteIds(ids);
    } catch (err) {
      console.error("Failed to load favourites:", err);
    }
  };

  useEffect(() => {
    if (isPreferenceMode) {
      fetchPreferredSpots();
    } else {
      fetchSpots();
    }

    fetchFavouriteIds();
  }, [selectedType, selectedAmenity, selectedRating, page, isPreferenceMode]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setPage(1);

    if (isPreferenceMode) {
      setIsPreferenceMode(false);
    } else {
      fetchSpots();
    }
  };

  const handleMyPreferences = async () => {
    setPage(1);
    setIsPreferenceMode(true);
  };

  const handleBackToAllSpots = async () => {
    setPage(1);
    setIsPreferenceMode(false);
  };

  return (
    <Container>
      <div className="mb-12">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Find study spots across Dhaka
          </h1>
          <p className="text-gray-600 mb-8">
            Browse student-friendly public and private study spaces, or post a new one for others to discover.
          </p>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search by title, address, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: "3rem", paddingRight: "1rem" }}
                className="w-full h-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <Button type="submit" className="h-12 px-8 w-full sm:w-auto">
              Search
            </Button>

            <Button
              type="button"
              className="h-12 px-5 whitespace-nowrap"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus size={16} />
              Post Spot
            </Button>

            {user && (
              <Button
                type="button"
                variant="ghost"
                className="h-12 px-5 whitespace-nowrap"
                onClick={isPreferenceMode ? handleBackToAllSpots : handleMyPreferences}
              >
                <SlidersHorizontal size={16} />
                {isPreferenceMode ? "All Spots" : "My Preferences"}
              </Button>
            )}
          </form>
        </div>
      </div>

      {isPreferenceMode && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700">
          Showing spots based on your saved preferences.
        </div>
      )}

      {!isPreferenceMode && (
        <div className="mb-6">
          <div className="flex justify-center gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
            {TYPES.map((type) => (
              <button
                key={type}
                onClick={() => {
                  setSelectedType(type);
                  setPage(1);
                }}
                className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedType === type
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="flex justify-center gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
            {AMENITY_FILTERS.map((amenity) => (
              <button
                key={amenity}
                onClick={() => {
                  setSelectedAmenity(amenity);
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedAmenity === amenity
                    ? "bg-slate-800 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {amenity}
              </button>
            ))}
          </div>

          <div className="flex justify-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {RATING_FILTERS.map((rating) => (
              <button
                key={rating.value}
                onClick={() => {
                  setSelectedRating(rating.value);
                  setPage(1);
                }}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedRating === rating.value
                    ? "bg-amber-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Star size={14} />
                {rating.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-3">
          <span className="w-1 h-8 bg-red-500 rounded-full" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 size={36} className="text-blue-600 animate-spin" />
        </div>
      ) : spots.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg mb-2">No study spots found</p>
          <p className="text-gray-400">
            {isPreferenceMode
              ? "No spots currently match your saved preferences."
              : "Try adjusting your search or filters, or post a new spot."}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {spots.map((spot) => (
              <SpotCard
                key={spot._id}
                spot={spot}
                onUpdate={() => {
                  if (isPreferenceMode) {
                    fetchPreferredSpots();
                  } else {
                    fetchSpots();
                  }
                  fetchFavouriteIds();
                }}
                favouriteIds={favouriteIds}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-3 mt-10">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className={`px-5 py-2 rounded-lg text-sm transition-colors ${
                  page === 1
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                Previous
              </button>

              <span className="px-5 py-2 text-sm text-gray-700">
                Page {page} of {totalPages}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className={`px-5 py-2 rounded-lg text-sm transition-colors ${
                  page === totalPages
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {showCreateModal && (
        <CreateSpotModal
          onClose={() => setShowCreateModal(false)}
          onSpotCreated={() => {
            setShowCreateModal(false);
            if (isPreferenceMode) {
              fetchPreferredSpots();
            } else {
              fetchSpots();
            }
          }}
        />
      )}
    </Container>
  );
}