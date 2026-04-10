import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { eventApi } from "../../services/event";
import Card from "../ui/Card";
import Button from "../ui/Button";
import { 
  Calendar, 
  MapPin, 
  Users, 
  Heart, 
  Share2, 
  Trophy,
  Medal,
  X,
  Check,
  MoreVertical,
  Loader2,
  LogOut
} from "lucide-react";

const TOPIC_STYLES = {
  Design: "bg-purple-100 text-purple-700 border-purple-200",
  Development: "bg-blue-100 text-blue-700 border-blue-200",
  Academic: "bg-green-100 text-green-700 border-green-200",
  Nature: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Other: "bg-gray-100 text-gray-700 border-gray-200"
};

export default function EventCard({ event, onJoinLeave }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isFavorited, setIsFavorited] = useState(event.isFavorited || false);
  const [showShareTooltip, setShowShareTooltip] = useState(false);

  // Use user._id if user.id is undefined (AuthContext may provide _id)
  const userId = user?.id || user?._id;
  const hostId = event.host?._id || event.host?.id;
  const isHost = userId && hostId && userId === hostId;
  const isAttending = event.isAttending || false;
  const isFull = event.attendees?.length >= event.maxAttendees;
  const spotsLeft = event.maxAttendees - (event.attendees?.length || 0);
  const spotsText = `${event.attendees?.length || 0}/${event.maxAttendees}`;
  
  const eventDate = new Date(event.date);
  const formattedDate = eventDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  const handleJoin = async () => {
    if (!user) {
      navigate("/login", { state: { from: `/events/${event._id}` } });
      return;
    }
    setLoading(true);
    try {
      await eventApi.joinEvent(event._id);
      if (onJoinLeave) onJoinLeave(event._id, true);
    } catch (err) {
      console.error("Failed to join event:", err);
      alert(err.message || "Failed to join");
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!window.confirm("Are you sure you want to leave this event?")) return;
    setLoading(true);
    try {
      await eventApi.leaveEvent(event._id);
      if (onJoinLeave) onJoinLeave(event._id, false);
    } catch (err) {
      console.error("Failed to leave event:", err);
      alert(err.message || "Failed to leave");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel this event? This cannot be undone.")) return;
    setLoading(true);
    try {
      await eventApi.deleteEvent(event._id);
      window.location.reload();
    } catch (err) {
      console.error("Failed to cancel event:", err);
      alert(err.message || "Failed to cancel");
    } finally {
      setLoading(false);
    }
  };

  const handleFavorite = async () => {
    if (!user) {
      navigate("/login", { state: { from: `/events/${event._id}` } });
      return;
    }
    try {
      await eventApi.toggleFavorite(event._id);
      setIsFavorited(!isFavorited);
    } catch (err) {
      console.error("Failed to favorite event:", err);
    }
  };

  const handleShare = async () => {
    try {
      await eventApi.shareEvent(event._id);
      const url = `${window.location.origin}/events/${event._id}`;
      await navigator.clipboard.writeText(url);
      setShowShareTooltip(true);
      setTimeout(() => setShowShareTooltip(false), 2000);
    } catch (err) {
      console.error("Failed to share event:", err);
    }
  };

  if (event.status === "cancelled") {
    return (
      <Card className="p-5 border border-red-200 bg-red-50 relative overflow-hidden h-[430px] flex flex-col">
        <div className="absolute top-3 right-3">
          <span className="bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded flex items-center gap-1">
            <X size={12} />
            CANCELLED
          </span>
        </div>
        <div className="flex items-start justify-between mb-3">
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${TOPIC_STYLES[event.topic] || TOPIC_STYLES.Other}`}>
            {event.topic}
          </span>
          <button 
            onClick={handleFavorite}
            className={`transition-colors ${isFavorited ? "text-red-500" : "text-gray-300 hover:text-red-500"}`}
          >
            <Heart size={18} fill={isFavorited ? "currentColor" : "none"} />
          </button>
        </div>
        <h3 className="text-base font-semibold text-red-800 line-through mb-2 line-clamp-2 min-h-[3rem]">{event.title}</h3>
        <div className="space-y-1 mb-3">
          <div className="flex items-center gap-2 text-sm text-red-700">
            <Calendar size={16} />
            <span>{formattedDate} • {event.time}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-red-700">
            <MapPin size={16} />
            <span className="truncate">{event.location}</span>
          </div>
        </div>
        <p className="text-sm text-red-600 mt-auto">This event was cancelled by the host</p>
      </Card>
    );
  }

  return (
    <Card className="p-5 hover:shadow-lg transition-all duration-200 border border-gray-100 hover:border-blue-200 relative group h-[490px] flex flex-col">
      <div className="flex items-start justify-between mb-2">
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${TOPIC_STYLES[event.topic] || TOPIC_STYLES.Other}`}>
          {event.topic}
        </span>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button 
              onClick={handleShare}
              className="text-gray-400 hover:text-blue-600 transition-colors p-1 hover:bg-blue-50 rounded"
            >
              <Share2 size={18} />
            </button>
            {showShareTooltip && (
              <div className="absolute right-0 top-8 bg-gray-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap z-10">
                Link copied!
              </div>
            )}
          </div>
          <button 
            onClick={handleFavorite}
            className={`transition-colors p-1 hover:bg-red-50 rounded ${
              isFavorited ? "text-red-500" : "text-gray-400 hover:text-red-500"
            }`}
          >
            <Heart size={18} fill={isFavorited ? "currentColor" : "none"} />
          </button>
        </div>
      </div>

      <Link to={`/events/${event._id}`} className="block mb-3">
        <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2 min-h-[3.5rem]">
          {event.title}
        </h3>
      </Link>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar size={16} className="text-gray-400 flex-shrink-0" />
          <span>{formattedDate} • {event.time}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin size={16} className="text-gray-400 flex-shrink-0" />
          <span className="truncate">{event.location}</span>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-1">
          <div className="flex items-center gap-1 text-gray-600">
            <Users size={16} />
            <span>Spots filled</span>
          </div>
          <span className={`font-medium ${
            spotsLeft === 0 ? "text-red-600" : 
            spotsLeft < 5 ? "text-yellow-600" : 
            "text-green-600"
          }`}>
            {spotsText}
          </span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all ${
              spotsLeft === 0 ? "bg-red-500" : 
              spotsLeft < 5 ? "bg-yellow-500" : 
              "bg-green-500"
            }`}
            style={{ width: `${((event.attendees?.length || 0) / event.maxAttendees) * 100}%` }}
          />
        </div>
      </div>

      <Link to={`/profile/${event.host?._id || event.host}`} className="block mb-4">
        <div className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-semibold text-lg flex-shrink-0">
            {event.host?.name?.charAt(0).toUpperCase() || "?"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 truncate">{event.host?.name || "Unknown"}</p>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="flex items-center gap-1 flex-shrink-0">
                <Trophy size={12} />
                {event.host?.points || 0} pts
              </span>
              {event.host?.badges?.length > 0 && (
                <>
                  <span className="flex-shrink-0">•</span>
                  <span className="flex items-center gap-0.5">
                    {event.host.badges.slice(0, 2).map(badge => (
                      <Medal key={badge} size={12} className="text-yellow-500 flex-shrink-0" />
                    ))}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </Link>

      <div className="mt-auto space-y-2">
        {isHost ? (
          <Button 
            variant="ghost" 
            onClick={handleCancel}
            disabled={loading}
            className="w-full border border-red-200 text-red-600 hover:bg-red-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Cancelling...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <X size={16} />
                Cancel Event
              </span>
            )}
          </Button>
        ) : (
          <>
            {isAttending ? (
              <>
                <Button
                  disabled
                  className="w-full bg-green-500 text-white opacity-100 cursor-not-allowed"
                >
                  <Check size={16} className="mr-2" />
                  You're attending
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={handleLeave}
                  disabled={loading}
                  className="w-full border border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      Leaving...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <LogOut size={16} />
                      Leave
                    </span>
                  )}
                </Button>
              </>
            ) : (
              <Button
                onClick={handleJoin}
                disabled={loading || isFull}
                className={`w-full ${
                  isFull ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Joining...
                  </span>
                ) : isFull ? (
                  "Event full"
                ) : (
                  "Join"
                )}
              </Button>
            )}
          </>
        )}
      </div>
    </Card>
  );
}