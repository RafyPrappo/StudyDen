import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePoints } from "../context/PointsContext";
import Container from "../components/ui/Container";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { eventApi } from "../services/event";
import { calendarApi } from "../services/calendar";
import { Heart, Share2, Calendar, MapPin, Navigation } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const TOPIC_COLORS = {
  Design: "bg-purple-100 text-purple-700 border-purple-200",
  Development: "bg-blue-100 text-blue-700 border-blue-200",
  Academic: "bg-green-100 text-green-700 border-green-200",
  Nature: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Other: "bg-gray-100 text-gray-700 border-gray-200"
};

export default function EventDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const { refreshPoints } = usePoints();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFavorited, setIsFavorited] = useState(false);
  const [showAttendees, setShowAttendees] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showAuthMessage, setShowAuthMessage] = useState(false);
  const [hasSynced, setHasSynced] = useState(false);
  const [leaving, setLeaving] = useState(false);
  
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [checkingConnection, setCheckingConnection] = useState(true);

  // Map refs
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    fetchEvent();
  }, [id]);

  useEffect(() => {
    if (!user) {
      setCheckingConnection(false);
      return;
    }
    
    const checkConnection = async () => {
      try {
        const { connected } = await calendarApi.checkConnection();
        setCalendarConnected(connected);
      } catch (err) {
        console.error('Failed to check calendar connection:', err);
        setCalendarConnected(false);
      } finally {
        setCheckingConnection(false);
      }
    };
    checkConnection();
  }, [user]);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'CALENDAR_CONNECTED') {
        if (event.data.success) {
          setCalendarConnected(true);
          setShowAuthMessage(false);
          handleSyncToCalendar();
        } else {
          alert('Failed to connect Google Calendar. Please try again.');
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Initialize map when event data is loaded
  useEffect(() => {
    if (!event?.coordinates || !mapContainerRef.current) return;
    
    // Clean up previous map if exists
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current).setView([event.coordinates.lat, event.coordinates.lng], 15);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; CartoDB',
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(map);
    
    L.marker([event.coordinates.lat, event.coordinates.lng])
      .addTo(map)
      .bindPopup(`<b>${event.title}</b><br>${event.location}`)
      .openPopup();
    
    mapInstanceRef.current = map;

    // Cleanup on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [event]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const data = await eventApi.getEvent(id);
      setEvent(data.event);
      setIsFavorited(data.event.isFavorited || false);
      setHasSynced(data.event.hasSynced || false);
      setShowAuthMessage(false);
    } catch (err) {
      setError("Failed to load event details");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFavorite = async () => {
    if (!user) {
      navigate("/login", { state: { from: `/events/${id}` } });
      return;
    }
    try {
      await eventApi.toggleFavorite(id);
      setIsFavorited(!isFavorited);
    } catch (err) {
      console.error("Failed to favorite event:", err);
    }
  };

  const handleShare = async () => {
    try {
      await eventApi.shareEvent(id);
      const url = `${window.location.origin}/events/${id}`;
      await navigator.clipboard.writeText(url);
      alert("Event link copied to clipboard!");
    } catch (err) {
      console.error("Failed to share event:", err);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel this event? This action cannot be undone.")) return;
    try {
      await eventApi.deleteEvent(id);
      navigate("/events");
    } catch (err) {
      setError(err.message || "Failed to cancel event");
    }
  };

  const handleSyncToCalendar = async () => {
    if (!calendarConnected) {
      setShowAuthMessage(true);
      return;
    }
    
    setSyncing(true);
    setShowAuthMessage(false);
    try {
      const data = await calendarApi.syncEvent(id);
      if (data.link) {
        window.open(data.link, '_blank');
        alert('Event synced to Google Calendar!');
        setHasSynced(true);
        fetchEvent();
      } else {
        alert('Failed to sync. Please try again.');
      }
    } catch (err) {
      if (err.status === 401) {
        setCalendarConnected(false);
        setShowAuthMessage(true);
      } else {
        alert('Failed to sync. Please try again.');
      }
    } finally {
      setSyncing(false);
    }
  };

  const connectCalendar = () => {
    calendarApi.connectCalendar();
    setShowAuthMessage(false);
  };

  const handleLeave = async () => {
    if (!window.confirm("Are you sure you want to leave this event?")) return;
    setLeaving(true);
    try {
      // Remove calendar sync if exists
      if (hasSynced) {
        try {
          await eventApi.removeCalendarEvent(id);
        } catch (err) {
          console.error("Failed to remove calendar event:", err);
        }
      }
      await eventApi.leaveEvent(id);
      navigate("/events");
    } catch (err) {
      setError(err.message || "Failed to leave event");
      setLeaving(false);
    }
  };

  const handleJoin = async () => {
    if (!user) {
      navigate("/login", { state: { from: `/events/${id}` } });
      return;
    }
    try {
      await eventApi.joinEvent(id);
      fetchEvent();
    } catch (err) {
      setError(err.message || "Failed to join event");
    }
  };

  const openDirections = () => {
    if (event?.coordinates) {
      const { lat, lng } = event.coordinates;
      const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      window.open(url, '_blank');
    }
  };

  if (loading) {
    return (
      <Container>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Container>
    );
  }

  if (error || !event) {
    return (
      <Container>
        <Card className="p-8 text-center">
          <p className="text-red-600">{error || "Event not found"}</p>
          <Link to="/events">
            <Button className="mt-4">Back to Events</Button>
          </Link>
        </Card>
      </Container>
    );
  }

  const userId = user?._id || user?.id;
  const hostId = event.host?._id;
  const isHost = !!(userId && hostId && userId === hostId);
  const isAttending = event.isAttending === true;
  const isFull = event.attendees?.length >= event.maxAttendees;
  const spotsText = `${event.attendees?.length || 0}/${event.maxAttendees} spots filled`;
  const spotsColor = isFull ? "text-red-600" : "text-green-600";
  const eventDate = new Date(event.date);
  const formattedDate = eventDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });

  const showSyncButton = user && (isHost || isAttending) && !hasSynced;
  const showConnectButton = showSyncButton && !calendarConnected && !checkingConnection;

  return (
    <Container>
      <div className="mb-4">
        <Link to="/events" className="text-blue-600 hover:underline">
          ← Back to Events
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="flex justify-between items-start mb-4">
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${TOPIC_COLORS[event.topic] || TOPIC_COLORS.Other}`}>
                {event.topic}
              </span>
              <div className="flex gap-2">
                <button onClick={handleShare} className="text-gray-400 hover:text-blue-600 transition p-1 hover:bg-blue-50 rounded">
                  <Share2 size={18} />
                </button>
                <button onClick={handleFavorite} className={`transition p-1 hover:bg-red-50 rounded ${isFavorited ? "text-red-500" : "text-gray-400 hover:text-red-500"}`}>
                  <Heart size={18} fill={isFavorited ? "currentColor" : "none"} />
                </button>
              </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">{event.title}</h1>

            {event.description && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">About</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div><p className="text-sm text-gray-500">Date</p><p className="font-medium">{formattedDate}</p></div>
              <div><p className="text-sm text-gray-500">Time</p><p className="font-medium">{event.time}</p></div>
              <div><p className="text-sm text-gray-500">Location</p><p className="font-medium">{event.location}</p></div>
              <div><p className="text-sm text-gray-500">Spots</p><p className={`font-medium ${spotsColor}`}>{spotsText}</p></div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-3">Hosted by</h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-white flex items-center justify-center text-lg font-medium">
                  {event.host?.name?.charAt(0).toUpperCase() || "?"}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{event.host?.name}</p>
                  <p className="text-sm text-gray-500">{event.host?.points || 0} points • {event.host?.badges?.length || 0} badges</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Attendees Section */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Attendees ({event.attendees?.length || 0})</h3>
              <button onClick={() => setShowAttendees(!showAttendees)} className="text-blue-600 hover:underline text-sm">
                {showAttendees ? "Hide" : "Show all"}
              </button>
            </div>
            {showAttendees && (
              <div className="space-y-2">
                {event.attendees?.map(attendee => (
                  <div key={attendee._id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm">{attendee.name?.charAt(0).toUpperCase()}</div>
                    <span>{attendee.name}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Action Card */}
          <Card className="p-6">
            <div className="text-center mb-4">
              <span className={`text-2xl font-bold ${spotsColor}`}>{event.attendees?.length || 0}/{event.maxAttendees}</span>
              <p className="text-sm text-gray-500">spots filled</p>
            </div>

            {isHost ? (
              <div className="space-y-2">
                <Button variant="ghost" className="w-full text-red-600 border-red-200 hover:bg-red-50" onClick={handleCancel}>Cancel Event</Button>
                {showSyncButton && (
                  <>
                    {showConnectButton ? (
                      <>
                        <Button onClick={connectCalendar} variant="ghost" className="w-full mt-2">
                          Connect Google Calendar
                        </Button>
                        {showAuthMessage && (
                          <p className="text-xs text-center mt-2 text-gray-500">
                            Click the button above to connect your Google Calendar first.
                          </p>
                        )}
                      </>
                    ) : (
                      <Button onClick={handleSyncToCalendar} disabled={syncing} className="w-full mt-2" variant="ghost">
                        {syncing ? "Syncing..." : "Sync to Google Calendar"}
                      </Button>
                    )}
                  </>
                )}
                {event.calendarLink && (
                  <div className="mt-2 text-center">
                    <a href={event.calendarLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm flex items-center justify-center gap-1">
                      <Calendar size={14} /> View in Google Calendar →
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {!isAttending ? (
                  <Button onClick={handleJoin} className="w-full" variant="primary">Join Event</Button>
                ) : (
                  <Button onClick={handleLeave} disabled={leaving} variant="ghost" className="w-full text-red-600 border-red-200 hover:bg-red-50">
                    {leaving ? "Leaving..." : "Leave Event"}
                  </Button>
                )}
                {showSyncButton && (
                  <>
                    {showConnectButton ? (
                      <>
                        <Button onClick={connectCalendar} variant="ghost" className="w-full mt-2">
                          Connect Google Calendar
                        </Button>
                        {showAuthMessage && (
                          <p className="text-xs text-center mt-2 text-gray-500">
                            Click the button above to connect your Google Calendar first.
                          </p>
                        )}
                      </>
                    ) : (
                      <Button onClick={handleSyncToCalendar} disabled={syncing} className="w-full mt-2" variant="ghost">
                        {syncing ? "Syncing..." : "Sync to Google Calendar"}
                      </Button>
                    )}
                  </>
                )}
                {event.calendarLink && (
                  <div className="mt-2 text-center">
                    <a href={event.calendarLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm flex items-center justify-center gap-1">
                      <Calendar size={14} /> View in Google Calendar →
                    </a>
                  </div>
                )}
              </div>
            )}

            {!user && (
              <p className="text-xs text-gray-500 text-center mt-3">
                <Link to="/login" className="text-blue-600 hover:underline">Login</Link> to join this event
              </p>
            )}
          </Card>

          {/* Map Card */}
          <Card className="p-4">
            <h3 className="text-md font-semibold mb-2 flex items-center gap-2">
              <MapPin size={16} className="text-gray-600" />
              Location
            </h3>
            <div ref={mapContainerRef} style={{ height: "200px", width: "100%", borderRadius: "8px", marginBottom: "8px" }}></div>
            <div className="flex justify-between items-center gap-2">
              <p className="text-xs text-gray-600 truncate flex-1">{event.location}</p>
              <button
                onClick={openDirections}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition flex-shrink-0"
              >
                <Navigation size={12} />
                Directions
              </button>
            </div>
          </Card>
        </div>
      </div>
    </Container>
  );
}