import { useEffect, useRef, useState } from "react";
import Button from "../ui/Button";
import Card from "../ui/Card";
import { spotApi } from "../../services/spot";
import { Loader2, MapPin, X, Search } from "lucide-react";

const AMENITY_OPTIONS = [
  "WiFi",
  "Charging Points",
  "AC",
  "Quiet Zone",
  "Snacks",
  "Parking",
  "Washroom",
  "Group Seating",
];

const TYPES = ["Public", "Private"];

export default function CreateSpotModal({ onClose, onSpotCreated }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  const [title, setTitle] = useState("");
  const [type, setType] = useState("Public");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [amenities, setAmenities] = useState([]);
  const [location, setLocation] = useState({
    lat: null,
    lng: null,
  });

  const [loadingMap, setLoadingMap] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const apiKey = import.meta.env.VITE_BARIKOI_API_KEY;

  const updateMarker = (lng, lat) => {
    setLocation({ lat, lng });

    if (markerRef.current) {
      markerRef.current.setLngLat([lng, lat]);
    } else {
      markerRef.current = new window.bkoigl.Marker({ draggable: true })
        .setLngLat([lng, lat])
        .addTo(mapRef.current);

      markerRef.current.on("dragend", async () => {
        const markerLngLat = markerRef.current.getLngLat();
        const newLat = markerLngLat.lat;
        const newLng = markerLngLat.lng;

        setLocation({
          lat: newLat,
          lng: newLng,
        });

        await reverseGeocode(newLat, newLng);
      });
    }
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://barikoi.xyz/v2/api/search/reverse/geocode?api_key=${apiKey}&latitude=${lat}&longitude=${lng}&district=true&post_code=true&country=true&sub_district=true&union=true&pauroshova=true&location_type=true&address=true&area=true`
      );

      const data = await response.json();

      const place = data?.place || {};
      const resolvedAddress =
        place.address ||
        [place.area, place.sub_district, place.district, place.country]
          .filter(Boolean)
          .join(", ");

      setAddress(resolvedAddress || "");
      setSearchQuery(resolvedAddress || "");
    } catch (err) {
      console.error("Reverse geocoding failed:", err);
    }
  };

  const searchPlaces = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);

      const response = await fetch(
        `https://barikoi.xyz/v1/api/search/autocomplete/${apiKey}/place?q=${encodeURIComponent(
          query
        )}`
      );

      const data = await response.json();
      const places = data?.places || data?.data || data?.place || [];

      setSearchResults(Array.isArray(places) ? places : []);
    } catch (err) {
      console.error("Place search failed:", err);
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

  const handleSelectPlace = async (place) => {
    const lat =
      Number(place.latitude) ||
      Number(place.lat) ||
      Number(place?.location?.lat);
    const lng =
      Number(place.longitude) ||
      Number(place.lng) ||
      Number(place.lon) ||
      Number(place?.location?.lng);

    const label =
      place.address ||
      place.place_address ||
      place.name ||
      place.area ||
      searchQuery;

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      setError("Selected place does not have valid coordinates");
      return;
    }

    setAddress(label);
    setSearchQuery(label);
    setSearchResults([]);

    updateMarker(lng, lat);

    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [lng, lat],
        zoom: 16,
      });
    }

    await reverseGeocode(lat, lng);
  };

  useEffect(() => {
    if (!window.bkoigl || !mapContainerRef.current || mapRef.current) return;

    if (!apiKey) {
      setError("Barikoi API key is missing. Add VITE_BARIKOI_API_KEY in client/.env");
      setLoadingMap(false);
      return;
    }

    const map = new window.bkoigl.Map({
      container: mapContainerRef.current,
      style: "https://map.barikoi.com/styles/barikoi-light/style.json",
      center: [90.4125, 23.8103],
      zoom: 11,
      accessToken: apiKey,
    });

    mapRef.current = map;

    map.addControl(new window.bkoigl.NavigationControl(), "top-right");

    map.on("load", () => {
      setLoadingMap(false);
    });

    map.on("click", async (e) => {
      const lng = e.lngLat.lng;
      const lat = e.lngLat.lat;

      updateMarker(lng, lat);
      await reverseGeocode(lat, lng);
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

  const toggleAmenity = (amenity) => {
    setAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((item) => item !== amenity)
        : [...prev, amenity]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      if (!title.trim() || !type || !address.trim()) {
        throw new Error("Title, type, and address are required");
      }

      if (location.lat === null || location.lng === null) {
        throw new Error("Please select the spot location from the map");
      }

      await spotApi.createSpot({
        title: title.trim(),
        type,
        description: description.trim(),
        address: address.trim(),
        amenities,
        lat: location.lat,
        lng: location.lng,
      });

      onSpotCreated?.();
    } catch (err) {
      setError(err.message || "Failed to create spot");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 px-4 py-6 overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        <Card className="p-6 sm:p-8 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Post a Study Spot</h2>
            <p className="text-sm text-gray-600 mt-1">
              Search a place or click the exact place on the map.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Spot title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Quiet café near BRACU"
                className="w-full h-11 px-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Spot type
              </label>
              <div className="flex gap-2 flex-wrap">
                {TYPES.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setType(item)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      type === item
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Search place
              </label>
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search a place or area..."
                  className="w-full h-11 pl-10 pr-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {(searching || searchResults.length > 0) && (
                <div className="mt-2 border border-gray-200 rounded-lg bg-white shadow-sm max-h-64 overflow-y-auto">
                  {searching ? (
                    <div className="px-4 py-3 text-sm text-gray-500">
                      Searching...
                    </div>
                  ) : (
                    searchResults.map((place, index) => {
                      const label =
                        place.address ||
                        place.place_address ||
                        place.name ||
                        place.area ||
                        "Unnamed place";

                      return (
                        <button
                          key={`${label}-${index}`}
                          type="button"
                          onClick={() => handleSelectPlace(place)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-b-0 border-gray-100"
                        >
                          <div className="text-sm font-medium text-gray-900">
                            {label}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {address && (
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Selected address
                </label>
                <div className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 text-sm">
                  {address}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Describe the environment, seating, and why it is good for studying"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Amenities
              </label>
              <div className="flex flex-wrap gap-2">
                {AMENITY_OPTIONS.map((amenity) => (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => toggleAmenity(amenity)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      amenities.includes(amenity)
                        ? "bg-slate-800 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {amenity}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <MapPin size={16} className="text-blue-600" />
                <label className="block text-sm font-medium text-gray-900">
                  Select exact location on map
                </label>
              </div>

              <div className="rounded-xl overflow-hidden border border-gray-200">
                <div ref={mapContainerRef} className="h-80 w-full" />
              </div>

              {loadingMap && (
                <div className="mt-3 inline-flex items-center gap-2 text-sm text-gray-600">
                  <Loader2 size={16} className="animate-spin" />
                  Loading map...
                </div>
              )}

              <p className="text-xs text-gray-500 mt-3">
                Search a place, or click on the map and drag the marker to adjust it.
              </p>

              {location.lat !== null && location.lng !== null && (
                <div className="mt-3 p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-800">
                  Selected location: lat {location.lat.toFixed(6)}, lng {location.lng.toFixed(6)}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Posting...
                  </>
                ) : (
                  "Post Spot"
                )}
              </Button>

              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}