import { useEffect, useRef, useState } from "react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import { spotApi } from "../../services/spot";
import {
  X,
  FileText,
  Tag,
  MapPin,
  CheckSquare,
  Loader2,
  Search,
} from "lucide-react";

const SPOT_TYPES = ["Public", "Private"];
const AMENITIES = [
  "WiFi",
  "Charging Points",
  "AC",
  "Quiet Zone",
  "Snacks",
  "Parking",
  "Washroom",
  "Group Seating",
];

export default function CreateSpotModal({ onClose, onSpotCreated }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [loadingMap, setLoadingMap] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [isVisible, setIsVisible] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const [formData, setFormData] = useState({
    title: "",
    type: "Public",
    description: "",
    address: "",
    amenities: [],
    lat: "",
    lng: "",
  });

  const apiKey = import.meta.env.VITE_BARIKOI_API_KEY;

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  useEffect(() => {
    if (!window.bkoigl || !mapContainerRef.current || mapRef.current) return;

    if (!apiKey) {
      setError("Barikoi API key is missing. Add VITE_BARIKOI_API_KEY in client/.env");
      setLoadingMap(false);
      return;
    }

    window.bkoigl.accessToken = apiKey;

    const map = new window.bkoigl.Map({
      container: mapContainerRef.current,
      center: [90.3938010872331, 23.821600277500405],
      zoom: 12,
    });

    mapRef.current = map;
    map.addControl(new window.bkoigl.NavigationControl(), "top-right");

    map.on("load", () => {
      setLoadingMap(false);
    });

    map.on("click", async (e) => {
      const lng = e.lngLat.lng;
      const lat = e.lngLat.lat;

      updateMarkerAndLocation(lng, lat);
      await fillAddressFromCoordinates(lat, lng);
    });

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markerRef.current = null;
    };
  }, [apiKey]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleAmenityToggle = (amenity) => {
    setFormData((prev) => {
      const exists = prev.amenities.includes(amenity);

      return {
        ...prev,
        amenities: exists
          ? prev.amenities.filter((item) => item !== amenity)
          : [...prev.amenities, amenity],
      };
    });
  };

  const updateMarkerAndLocation = (lng, lat) => {
    setFormData((prev) => ({
      ...prev,
      lat,
      lng,
    }));

    if (markerRef.current) {
      markerRef.current.setLngLat([lng, lat]);
      return;
    }

    markerRef.current = new window.bkoigl.Marker({ draggable: true })
      .setLngLat([lng, lat])
      .addTo(mapRef.current);

    markerRef.current.on("dragend", async () => {
      const markerLngLat = markerRef.current.getLngLat();
      const nextLat = markerLngLat.lat;
      const nextLng = markerLngLat.lng;

      setFormData((prev) => ({
        ...prev,
        lat: nextLat,
        lng: nextLng,
      }));

      await fillAddressFromCoordinates(nextLat, nextLng);
    });
  };

  const fillAddressFromCoordinates = async (lat, lng) => {
    try {
      const params = new URLSearchParams({
        api_key: apiKey,
        longitude: String(lng),
        latitude: String(lat),
        address: "true",
        area: "true",
        district: "true",
        division: "true",
        country: "true",
        thana: "true",
      });

      const res = await fetch(
        `https://barikoi.xyz/v2/api/search/reverse/geocode?${params.toString()}`
      );
      const data = await res.json();

      const place = data?.place || {};
      const resolvedAddress =
        place.address ||
        [place.area, place.thana, place.district, place.division]
          .filter(Boolean)
          .join(", ");

      setFormData((prev) => ({
        ...prev,
        address: resolvedAddress || "",
      }));
    } catch (err) {
      console.error("Reverse geocode failed:", err);
    }
  };

  const searchPlaces = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);

      const res = await fetch(
        `https://barikoi.xyz/v1/api/search/autocomplete/${apiKey}/place?q=${encodeURIComponent(
          query
        )}`
      );
      const data = await res.json();

      const places =
        data?.places ||
        data?.place ||
        data?.data ||
        data?.results ||
        [];

      setSearchResults(Array.isArray(places) ? places : []);
    } catch (err) {
      console.error("Autocomplete failed:", err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchPlaces(value);
    }, 400);
  };

  const handleSelectSearchResult = async (item) => {
    const lat =
      Number(item.latitude) ||
      Number(item.lat) ||
      Number(item?.location?.lat);
    const lng =
      Number(item.longitude) ||
      Number(item.lng) ||
      Number(item.lon) ||
      Number(item?.location?.lng);

    const label =
      item.address ||
      item.place_address ||
      item.name ||
      item.area ||
      searchQuery;

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      setError("Selected place does not contain valid coordinates.");
      return;
    }

    setSearchQuery(label);
    setSearchResults([]);

    setFormData((prev) => ({
      ...prev,
      address: label,
      lat,
      lng,
    }));

    updateMarkerAndLocation(lng, lat);

    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [lng, lat],
        zoom: 16,
      });
    }

    await fillAddressFromCoordinates(lat, lng);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!formData.address || formData.lat === "" || formData.lng === "") {
        throw new Error("Please search or select the location from the map.");
      }

      await spotApi.createSpot(formData);
      setIsVisible(false);
      setTimeout(onSpotCreated, 300);
    } catch (err) {
      setError(err.message || "Failed to create study spot");
      setLoading(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center p-4 z-50 transition-all duration-300 ease-out ${
        isVisible
          ? "bg-black/50 backdrop-blur-sm"
          : "bg-black/0 backdrop-blur-0 pointer-events-none"
      }`}
      onClick={handleClose}
    >
      <div
        className={`transform transition-all duration-500 ease-out w-full max-w-2xl ${
          isVisible
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-75 translate-y-10"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Post new study spot
              </h2>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                <span className="w-1 h-6 bg-red-500 rounded-full" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Spot title
                </label>
                <div className="relative">
                  <FileText
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="text"
                    required
                    maxLength="100"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    style={{ paddingLeft: "2.5rem", paddingRight: "1rem" }}
                    className="w-full h-11 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., North End Coffee - Dhanmondi"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Spot type
                </label>
                <div className="relative">
                  <Tag
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <select
                    required
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    style={{ paddingLeft: "2.5rem", paddingRight: "1rem" }}
                    className="w-full h-11 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                  >
                    {SPOT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-gray-400 text-xs">(optional)</span>
                </label>
                <textarea
                  rows="4"
                  maxLength="500"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe the study environment, crowd, comfort, or any useful tips."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search place
                </label>
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    style={{ paddingLeft: "2.5rem", paddingRight: "1rem" }}
                    className="w-full h-11 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Search by place or address"
                  />
                </div>

                {(searching || searchResults.length > 0) && (
                  <div className="mt-2 border border-gray-200 rounded-lg bg-white shadow-sm max-h-56 overflow-y-auto">
                    {searching ? (
                      <div className="px-4 py-3 text-sm text-gray-500">
                        Searching...
                      </div>
                    ) : (
                      searchResults.map((item, index) => {
                        const label =
                          item.address ||
                          item.place_address ||
                          item.name ||
                          item.area ||
                          "Unnamed place";

                        return (
                          <button
                            key={`${label}-${index}`}
                            type="button"
                            onClick={() => handleSelectSearchResult(item)}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-b-0 border-gray-100"
                          >
                            <div className="text-sm font-medium text-gray-900">
                              {label}
                            </div>
                            {(item.area || item.city || item.district) && (
                              <div className="text-xs text-gray-500 mt-1">
                                {[item.area, item.city, item.district]
                                  .filter(Boolean)
                                  .join(", ")}
                              </div>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select location from map
                </label>
                <div className="rounded-lg overflow-hidden border border-gray-200">
                  <div ref={mapContainerRef} className="h-72 w-full" />
                </div>

                {loadingMap && (
                  <div className="mt-2 text-sm text-gray-500 flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Loading map...
                  </div>
                )}

                <p className="text-xs text-gray-500 mt-2">
                  Search for a place, or click on the map and drag the marker to adjust.
                </p>

                {formData.address && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                    <span className="font-medium">Selected address:</span>{" "}
                    {formData.address}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amenities
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {AMENITIES.map((amenity) => {
                    const selected = formData.amenities.includes(amenity);

                    return (
                      <button
                        key={amenity}
                        type="button"
                        onClick={() => handleAmenityToggle(amenity)}
                        className={`rounded-lg border px-3 py-2 text-sm transition-colors text-left ${
                          selected
                            ? "bg-blue-50 border-blue-300 text-blue-700"
                            : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <CheckSquare size={14} />
                          {amenity}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1 h-11" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      Posting...
                    </span>
                  ) : (
                    "Post spot"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1 h-11"
                  onClick={handleClose}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}