import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePoints } from "../context/PointsContext";
import Container from "../components/ui/Container";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { eventApi } from "../services/event";
import { Heart, Share2 } from "lucide-react";

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
  const [isAttending, setIsAttending] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showAttendees, setShowAttendees] = useState(false);

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const data = await eventApi.getEvent(id);
      setEvent(data.event);
      setIsAttending(data.event.isAttending || false);
      setIsFavorited(data.event.isFavorited || false);
    } catch (err) {
      setError("Failed to load event details");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!user) {
      navigate("/login", { state: { from: `/events/${id}` } });
      return;
    }

    try {
      if (isAttending) {
        await eventApi.leaveEvent(id);
        setIsAttending(false);
      } else {
        await eventApi.joinEvent(id);
        setIsAttending(true);
        refreshPoints();
      }
      fetchEvent();
    } catch (err) {
      setError(err.message || "Failed to join/leave event");
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
    if (!window.confirm("Are you sure you want to cancel this event? This action cannot be undone.")) {
      return;
    }

    try {
      await eventApi.deleteEvent(id);
      navigate("/events");
    } catch (err) {
      setError(err.message || "Failed to cancel event");
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

  const isHost = user?.id === event.host?._id;
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
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${TOPIC_COLORS[event.topic] || TOPIC_COLORS.Other}`}>
                {event.topic}
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={handleShare}
                  className="text-gray-400 hover:text-blue-600 transition p-1 hover:bg-blue-50 rounded"
                  title="Share event"
                >
                  <Share2 size={18} />
                </button>
                <button 
                  onClick={handleFavorite}
                  className={`transition p-1 hover:bg-red-50 rounded ${
                    isFavorited ? "text-red-500" : "text-gray-400 hover:text-red-500"
                  }`}
                  title={isFavorited ? "Remove from favorites" : "Add to favorites"}
                >
                  <Heart size={18} fill={isFavorited ? "currentColor" : "none"} />
                </button>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{event.title}</h1>

            {/* Description */}
            {event.description && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">About</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
              </div>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-medium">{formattedDate}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Time</p>
                <p className="font-medium">{event.time}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="font-medium">{event.location}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Spots</p>
                <p className={`font-medium ${spotsColor}`}>{spotsText}</p>
              </div>
            </div>

            {/* Host Info */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-3">Hosted by</h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-white flex items-center justify-center text-lg font-medium">
                  {event.host?.name?.charAt(0).toUpperCase() || "?"}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{event.host?.name}</p>
                  <p className="text-sm text-gray-500">
                    {event.host?.points || 0} points • {event.host?.badges?.length || 0} badges
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Attendees Section */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Attendees ({event.attendees?.length || 0})
              </h3>
              <button 
                onClick={() => setShowAttendees(!showAttendees)}
                className="text-blue-600 hover:underline text-sm"
              >
                {showAttendees ? "Hide" : "Show all"}
              </button>
            </div>
            
            {showAttendees && (
              <div className="space-y-2">
                {event.attendees?.map(attendee => (
                  <div key={attendee._id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm">
                      {attendee.name?.charAt(0).toUpperCase()}
                    </div>
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
              <span className={`text-2xl font-bold ${spotsColor}`}>
                {event.attendees?.length || 0}/{event.maxAttendees}
              </span>
              <p className="text-sm text-gray-500">spots filled</p>
            </div>

            {isHost ? (
              <div className="space-y-2">
                <Button 
                  variant="ghost" 
                  className="w-full"
                  onClick={() => navigate(`/events/${id}/manage`)}
                >
                  Manage Event
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full text-red-600 border-red-200 hover:bg-red-50"
                  onClick={handleCancel}
                >
                  Cancel Event
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleJoin}
                disabled={isFull && !isAttending}
                className="w-full"
                variant={isAttending ? "ghost" : "primary"}
              >
                {isAttending ? "✓ You're attending" : 
                 isFull ? "Event Full" : "Join Event"}
              </Button>
            )}

            {!user && (
              <p className="text-xs text-gray-500 text-center mt-3">
                <Link to="/login" className="text-blue-600 hover:underline">Login</Link> to join this event
              </p>
            )}
          </Card>

          {/* Location Card */}
          <Card className="p-6">
            <h3 className="font-semibold mb-3">Location</h3>
            <p className="text-sm text-gray-700 mb-2">{event.location}</p>
            <div className="bg-gray-100 h-32 rounded-lg flex items-center justify-center text-gray-400">
              Map will be displayed here
            </div>
          </Card>

          {/* Status Card (if event is ongoing) */}
          {event.status === "ongoing" && (
            <Card className="p-6 bg-green-50 border-green-200">
              <h3 className="font-semibold text-green-800 mb-2">Event Ongoing</h3>
              <p className="text-sm text-green-700">
                {event.hostPresent ? "Host is present" : "Waiting for host..."}
              </p>
            </Card>
          )}

          {/* Cancelled Card */}
          {event.status === "cancelled" && (
            <Card className="p-6 bg-red-50 border-red-200">
              <h3 className="font-semibold text-red-800 mb-2">Event Cancelled</h3>
              <p className="text-sm text-red-700">
                This event has been cancelled by the host.
              </p>
            </Card>
          )}
        </div>
      </div>
    </Container>
  );
}