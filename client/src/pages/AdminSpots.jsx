import { useEffect, useState } from "react";
import Container from "../components/ui/Container";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { adminApi } from "../services/admin";
import { Loader2, MapPin } from "lucide-react";

export default function AdminSpots() {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [radius, setRadius] = useState(5);
  const [category, setCategory] = useState("all");
  const [error, setError] = useState("");
  const [importingId, setImportingId] = useState(null);

  useEffect(() => {
    getLocationAndFetch();
  }, [radius, category]);

  const getLocationAndFetch = () => {
    setError("");
    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;

        try {
          const data = await adminApi.getNearbyPlaces({
            lat: latitude,
            lng: longitude,
            radius,
            category,
          });

          setPlaces(data.places || []);
        } catch (err) {
          console.error(err);
          setError(err.message || "Failed to load nearby places");
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error("Location error:", err);
        setError("Location access is required to search nearby places.");
        setLoading(false);
      }
    );
  };

  const handleImport = async (place) => {
    try {
      setImportingId(place.id);

      await adminApi.importPlace({
        name: place.name,
        address: place.address,
        latitude: place.latitude,
        longitude: place.longitude,
        area: place.area,
        city: place.city,
        placeType: place.placeType,
        subType: place.subType,
      });

      setPlaces((prev) => prev.filter((p) => p.id !== place.id));
      alert("Imported successfully!");
    } catch (err) {
      console.error(err);
      alert(err.message || "Import failed");
    } finally {
      setImportingId(null);
    }
  };

  return (
    <Container>
      <div className="max-w-6xl mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Nearby Places (Admin Import)</h1>

        <div className="mb-4 flex gap-3 flex-wrap justify-center sm:justify-start">
          {[1, 3, 5, 10].map((r) => (
            <Button
              key={r}
              onClick={() => setRadius(r)}
              variant={radius === r ? "primary" : "ghost"}
            >
              {r} km
            </Button>
          ))}
        </div>

        <div className="mb-6 flex gap-3 flex-wrap">
          {[
            { label: "All", value: "all" },
            { label: "Cafes", value: "cafe" },
            { label: "Co-working", value: "coworking" },
            { label: "Libraries", value: "library" },
            { label: "Public", value: "public" },
          ].map((item) => (
            <Button
              key={item.value}
              onClick={() => setCategory(item.value)}
              variant={category === item.value ? "primary" : "ghost"}
            >
              {item.label}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        ) : places.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-8 text-center text-gray-500">
            No nearby places found.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {places.map((place) => (
              <Card key={place.id} className="p-5">
                <h3 className="font-semibold text-lg">{place.name}</h3>

                <div className="flex items-start gap-2 text-sm text-gray-600 mt-2">
                  <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                  <span>{place.address || "No address available"}</span>
                </div>

                {(place.area || place.city || place.subType) && (
                  <p className="text-xs text-gray-500 mt-3">
                    {[place.area, place.city, place.subType]
                      .filter(Boolean)
                      .join(" • ")}
                  </p>
                )}

                {place.distanceInMeters && (
                  <p className="text-xs text-gray-400 mt-2">
                    {Number(place.distanceInMeters).toFixed(1)} meters away
                  </p>
                )}

                <Button
                  className="mt-4 w-full"
                  onClick={() => handleImport(place)}
                  disabled={importingId === place.id}
                >
                  {importingId === place.id ? "Importing..." : "Import"}
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}