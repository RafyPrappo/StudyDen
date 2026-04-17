import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Container from "../components/ui/Container";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import SpotReviewsCard from "../components/spots/SpotReviewsCard";
import { spotApi } from "../services/spot";
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
  ArrowLeft,
  Trash2,
  Loader2,
  CalendarDays,
  Clock3,
  Volume2,
  UserCheck,
  Navigation,
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

const CROWD_LEVELS = [
  { value: 1, label: "Very Low" },
  { value: 2, label: "Low" },
  { value: 3, label: "Moderate" },
  { value: 4, label: "Busy" },
  { value: 5, label: "Packed" },
];

const NOISE_LEVELS = [
  { value: 1, label: "Silent" },
  { value: 2, label: "Quiet" },
  { value: 3, label: "Moderate" },
  { value: 4, label: "Noisy" },
  { value: 5, label: "Very Noisy" },
];

export default function SpotDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [spot, setSpot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [gettingDirection, setGettingDirection] = useState(false);
  const [error, setError] = useState("");

  const [showCheckInForm, setShowCheckInForm] = useState(false);
  const [submittingCheckIn, setSubmittingCheckIn] = useState(false);
  const [checkInError, setCheckInError] = useState("");
  const [crowdLevel, setCrowdLevel] = useState(3);
  const [noiseLevel, setNoiseLevel] = useState(3);

  const [myLatestCheckIn, setMyLatestCheckIn] = useState(null);
  const [latestCheckIn, setLatestCheckIn] = useState(null);
  const [analytics, setAnalytics] = useState(null);

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const routeSourceReadyRef = useRef(false);
  const [routeData, setRouteData] = useState(null);
  const [routeError, setRouteError] = useState("");
  const [selectedProfile, setSelectedProfile] = useState("car");
  const destinationMarkerRef = useRef(null);
  const userMarkerRef = useRef(null);
  const watchIdRef = useRef(null);
  const [liveLocation, setLiveLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [autoFollow, setAutoFollow] = useState(true);

  useEffect(() => {
    fetchSpotDetails();
  }, [id]);

  useEffect(() => {
    if (!spot?.location?.lat || !spot?.location?.lng) return;
    if (!window.bkoigl || !mapContainerRef.current || mapRef.current) return;

    const map = new window.bkoigl.Map({
      container: mapContainerRef.current,
      center: [spot.location.lng, spot.location.lat],
      zoom: 14,
      accessToken: import.meta.env.VITE_BARIKOI_API_KEY,
    });

    mapRef.current = map;
    map.addControl(new window.bkoigl.NavigationControl(), "top-right");

    map.on("load", () => {
      map.addSource("route-line", {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: [],
          },
        },
      });

      map.addLayer({
        id: "route-line-layer",
        type: "line",
        source: "route-line",
        paint: {
          "line-width": 5,
        },
      });

      routeSourceReadyRef.current = true;

      destinationMarkerRef.current = new window.bkoigl.Marker()
        .setLngLat([spot.location.lng, spot.location.lat])
        .addTo(map);
    });

    return () => {
      routeSourceReadyRef.current = false;
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [spot]);

  useEffect(() => {
    if (!routeData || !mapRef.current || !routeSourceReadyRef.current) return;

    const source = mapRef.current.getSource("route-line");
    if (!source) return;

    source.setData({
      type: "Feature",
      geometry: routeData.geometry,
    });

    const bounds = new window.bkoigl.LngLatBounds();
    routeData.geometry.coordinates.forEach((coord) => bounds.extend(coord));
    mapRef.current.fitBounds(bounds, { padding: 50 });
  }, [routeData]);

  const fetchSpotDetails = async () => {
    try {
      setLoading(true);
      setError("");

      const [spotData, checkInData, analyticsData] = await Promise.all([
        spotApi.getSpot(id),
        spotApi.getCheckInStatus(id),
        spotApi.getSpotAnalytics(id),
      ]);

      setSpot(spotData.spot);
      setMyLatestCheckIn(checkInData.myLatestCheckIn || null);
      setLatestCheckIn(checkInData.latestCheckIn || null);
      setAnalytics(analyticsData.analytics || null);
    } catch (err) {
      setError(err.message || "Failed to load study spot");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!spot) return;

    if (!window.confirm("Are you sure you want to delete this study spot?")) {
      return;
    }

    setDeleting(true);
    try {
      await spotApi.deleteSpot(spot._id);
      navigate("/spots");
    } catch (err) {
      console.error("Failed to delete spot:", err);
      alert(err.message || "Failed to delete spot");
      setDeleting(false);
    }
  };

  const handleCheckIn = async (e) => {
    e.preventDefault();

    setSubmittingCheckIn(true);
    setCheckInError("");

    try {
      const data = await spotApi.createCheckIn(id, {
        crowdLevel,
        noiseLevel,
      });

      setMyLatestCheckIn(data.checkIn);
      setLatestCheckIn(data.checkIn);
      setShowCheckInForm(false);
    } catch (err) {
      console.error("Failed to check in:", err);
      setCheckInError(err.message || "Failed to check in");
    } finally {
      setSubmittingCheckIn(false);
    }
  };

  const handleDirection = async () => {
  if (!spot?.location?.lat || !spot?.location?.lng) {
    alert("Location coordinates are not available for this spot yet.");
    return;
  }
  setGettingDirection(true);
  setRouteError("");

  try {
    let userLat;
    let userLng;

    if (liveLocation?.lat && liveLocation?.lng) {
      userLat = liveLocation.lat;
      userLng = liveLocation.lng;
    } else {
      if (!navigator.geolocation) {
        throw new Error("Geolocation is not supported by your browser.");
      }

      const position = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject)
      );

      userLat = position.coords.latitude;
      userLng = position.coords.longitude;
    }

    // optional reset
    setRouteData(null);

    const data = await spotApi.getDirections(id, {
      startLat: userLat,
      startLng: userLng,
      profile: selectedProfile,
    });

    if (!data.route) {
      setRouteError(data.message || "No route found.");
      return;
    }

    setRouteData(data.route);

    if (!isTracking) {
      startLiveTracking();
    }

  } catch (err) {
    console.error("Failed to get route:", err);
    setRouteError(err.message || "Failed to load route.");
  } finally {
    setGettingDirection(false);
  }
};

  const updateUserMarker = (lng, lat) => {
  if (!mapRef.current) return;

  if (userMarkerRef.current) {
    userMarkerRef.current.setLngLat([lng, lat]);
  } else {
    userMarkerRef.current = new window.bkoigl.Marker()
      .setLngLat([lng, lat])
      .addTo(mapRef.current);
  }

  if (autoFollow) {
    mapRef.current.easeTo({
      center: [lng, lat],
      zoom: Math.max(mapRef.current.getZoom(), 15),
      duration: 800,
    });
  }
};

  const startLiveTracking = () => {
  if (!navigator.geolocation) {
    setRouteError("Geolocation is not supported by your browser.");
    return;
  }

  if (watchIdRef.current !== null) return;

  setIsTracking(true);

  watchIdRef.current = navigator.geolocation.watchPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      setLiveLocation({ lat, lng });
      updateUserMarker(lng, lat);
    },
    (err) => {
      console.error("Live location error:", err);
      setRouteError("Unable to track your live location.");
      setIsTracking(false);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 3000,
      timeout: 10000,
    }
  );
};

  const stopLiveTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  };

  const formatDateTime = (dateValue) => {
    if (!dateValue) return "N/A";

    return new Date(dateValue).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <Container>
        <div className="flex justify-center items-center h-64">
          <Loader2 size={36} className="text-blue-600 animate-spin" />
        </div>
      </Container>
    );
  }

  if (error || !spot) {
    return (
      <Container>
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <Link to="/spots">
              <Button variant="ghost">
                <ArrowLeft size={16} />
                Back to spots
              </Button>
            </Link>
          </div>

          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error || "Spot not found"}
          </div>
        </div>
      </Container>
    );
  }

  const isOwner = user?.id === spot.postedBy?._id;
  const canReview = !!myLatestCheckIn;
  const createdDate = new Date(spot.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Container>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <Link to="/spots">
            <Button variant="ghost">
              <ArrowLeft size={16} />
              Back to spots
            </Button>
          </Link>

          {isOwner && (
            <Button
              variant="ghost"
              onClick={handleDelete}
              disabled={deleting}
              className="border border-gray-200 hover:border-red-300 hover:text-red-600"
            >
              {deleting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  Delete spot
                </>
              )}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border mb-4 ${
                      typeStyles[spot.type] || typeStyles.Public
                    }`}
                  >
                    {spot.type}
                  </span>

                  <h1 className="text-3xl font-bold text-gray-900 mb-3">
                    {spot.title}
                  </h1>

                  <div className="flex items-start gap-2 text-gray-600 mb-2">
                    <MapPin
                      size={18}
                      className="text-gray-400 flex-shrink-0 mt-0.5"
                    />
                    <span>{spot.address}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-3">
                    <CalendarDays size={16} className="text-gray-400" />
                    <span>Posted on {createdDate}</span>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">
                  Description
                </h2>
                <p className="text-gray-700 leading-7">
                  {spot.description || "No description provided."}
                </p>
              </div>

              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">
                  Amenities
                </h2>

                {spot.amenities?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {spot.amenities.map((amenity) => {
                      const Icon = amenityIcons[amenity];
                      return (
                        <span
                          key={amenity}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm bg-gray-100 text-gray-700"
                        >
                          {Icon ? <Icon size={14} /> : null}
                          {amenity}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-400">No amenities listed</p>
                )}
              </div>

              <div className="mb-8">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Route Map
                  </h2>

                  <Button onClick={handleDirection} disabled={gettingDirection}>
                    {gettingDirection ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Getting route...
                      </>
                    ) : (
                      <>
                        <Navigation size={16} />
                        Directions
                      </>
                    )}
                  </Button>
                </div>

                <div className="relative rounded-xl overflow-hidden border border-gray-200">
                  <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-2 max-w-[90%]">
                    <button
                      type="button"
                      onClick={() => setSelectedProfile("car")}
                      className={`px-4 py-2 rounded-full text-sm font-medium shadow-sm ${
                        selectedProfile === "car"
                          ? "bg-blue-600 text-white"
                          : "bg-white text-gray-700 border border-gray-200"
                      }`}
                    >
                      Car
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedProfile("bike")}
                      className={`px-4 py-2 rounded-full text-sm font-medium shadow-sm ${
                        selectedProfile === "bike"
                          ? "bg-blue-600 text-white"
                          : "bg-white text-gray-700 border border-gray-200"
                      }`}
                    >
                      Bike
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedProfile("foot")}
                      className={`px-4 py-2 rounded-full text-sm font-medium shadow-sm ${
                        selectedProfile === "foot"
                          ? "bg-blue-600 text-white"
                          : "bg-white text-gray-700 border border-gray-200"
                      }`}
                    >
                      Walk
                    </button>
                  </div>

                  <div ref={mapContainerRef} className="h-80 w-full" />
                </div>

                {routeError && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {routeError}
                  </div>
                )}

                {routeData && (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-sm">
                      <span className="font-medium">Distance:</span>{" "}
                      {(routeData.distance / 1000).toFixed(2)} km
                    </div>
                    <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-sm">
                      <span className="font-medium">Estimated time:</span>{" "}
                      {Math.ceil(routeData.duration / 60)} min
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setAutoFollow((prev) => !prev)}
                >
                  {autoFollow ? "Auto-follow: On" : "Auto-follow: Off"}
                </Button>

                {isTracking ? (
                  <Button type="button" variant="ghost" onClick={stopLiveTracking}>
                    Stop Tracking
                  </Button>
                ) : (
                  <Button type="button" variant="ghost" onClick={startLiveTracking}>
                    Start Tracking
                  </Button>
                )}
              </div>

              {liveLocation && (
                <div className="mt-3 p-3 rounded-lg bg-gray-50 border border-gray-200 text-sm">
                  <span className="font-medium">Live location:</span>{" "}
                  {liveLocation.lat.toFixed(6)}, {liveLocation.lng.toFixed(6)}
                </div>
              )}

              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">
                  Check In
                </h2>

                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => setShowCheckInForm((prev) => !prev)}>
                    <UserCheck size={16} />
                    {myLatestCheckIn ? "Update Check-In" : "Check In"}
                  </Button>

                  {myLatestCheckIn && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-50 text-green-700 border border-green-200 text-sm">
                      <Clock3 size={16} />
                      Last checked in at{" "}
                      {formatDateTime(myLatestCheckIn.checkedInAt)}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">
                  Posted by
                </h2>

                <Link to={`/profile/${spot.postedBy?._id}`} className="block">
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 overflow-hidden flex-shrink-0">
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
                              {spot.postedBy.badges
                                .slice(0, 2)
                                .map((badge) => (
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
                </Link>
              </div>
            </Card>

            {showCheckInForm && (
              <Card className="p-6 mt-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {myLatestCheckIn
                    ? "Update your check-in"
                    : "Check in to this study spot"}
                </h2>
                <p className="text-sm text-gray-600 mb-6">
                  Share the current crowd and noise level to help other
                  students.
                </p>

                {checkInError && (
                  <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {checkInError}
                  </div>
                )}

                <form onSubmit={handleCheckIn} className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3">
                      Crowd level
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {CROWD_LEVELS.map((level) => (
                        <button
                          key={level.value}
                          type="button"
                          onClick={() => setCrowdLevel(level.value)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                            crowdLevel === level.value
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {level.value} - {level.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3">
                      Noise level
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {NOISE_LEVELS.map((level) => (
                        <button
                          key={level.value}
                          type="button"
                          onClick={() => setNoiseLevel(level.value)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                            noiseLevel === level.value
                              ? "bg-slate-800 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {level.value} - {level.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button type="submit" disabled={submittingCheckIn}>
                      {submittingCheckIn ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <UserCheck size={16} />
                          Submit Check-In
                        </>
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowCheckInForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {myLatestCheckIn && (
              <Card className="p-6 mt-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  My Check-In
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                      <Clock3 size={16} />
                      Checked in at
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDateTime(myLatestCheckIn.checkedInAt)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                      <Users size={16} />
                      Crowd level
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {myLatestCheckIn.crowdLevel} -{" "}
                      {myLatestCheckIn.crowdLabel}
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                      <Volume2 size={16} />
                      Noise level
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {myLatestCheckIn.noiseLevel} -{" "}
                      {myLatestCheckIn.noiseLabel}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            <Card className="p-6 mt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Latest Activity
              </h2>

              {latestCheckIn ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <div className="text-sm text-gray-500 mb-2">
                      Latest check-in
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDateTime(latestCheckIn.checkedInAt)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <div className="text-sm text-gray-500 mb-2">
                      Checked in by
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {latestCheckIn.user?.name || "Unknown"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <div className="text-sm text-gray-500 mb-2">
                      Crowd level
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {latestCheckIn.crowdLevel} - {latestCheckIn.crowdLabel}
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <div className="text-sm text-gray-500 mb-2">
                      Noise level
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {latestCheckIn.noiseLevel} - {latestCheckIn.noiseLabel}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">
                  No one has checked in to this study spot yet.
                </p>
              )}
            </Card>

            <Card className="p-6 mt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Spot Analytics
              </h2>

              {analytics && analytics.totalCheckIns > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                      <Users size={16} />
                      Average crowd
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {analytics.averageCrowdLevel} - {analytics.averageCrowdLabel}
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                      <Volume2 size={16} />
                      Average noise
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {analytics.averageNoiseLevel} - {analytics.averageNoiseLabel}
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                      <Clock3 size={16} />
                      Peak hour
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {analytics.peakHour?.label || "N/A"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <div className="text-sm text-gray-500 mb-2">
                      Total check-ins
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {analytics.totalCheckIns}
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <div className="text-sm text-gray-500 mb-2">
                      Check-ins in last 24 hours
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {analytics.recentCheckIns?.last24Hours || 0}
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <div className="text-sm text-gray-500 mb-2">
                      Check-ins in last 7 days
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {analytics.recentCheckIns?.last7Days || 0}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">
                  No analytics available yet for this study spot.
                </p>
              )}
            </Card>

          </div>

          <div className="lg:col-span-1 self-start">
          <SpotReviewsCard
            spotId={spot._id}
            canReview={canReview}
            amenities={spot.amenities || []}
            analytics={analytics}
          />
          </div>
        </div>
      </div>
    </Container>
  );
}