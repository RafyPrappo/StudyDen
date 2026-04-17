import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePoints } from "../context/PointsContext";
import Container from "../components/ui/Container";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { eventApi } from "../services/event";
import { calendarApi } from "../services/calendar";
import { Heart, Share2, Calendar, MapPin, Navigation, Loader2, CheckCircle, XCircle, MapPinCheck, AlertTriangle, RefreshCw } from "lucide-react";
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

// Toggle this for demo/presentation to bypass geolocation
const ALLOW_SIMULATE_PRESENCE = true; // Set to false in production

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
  const [endorsing, setEndorsing] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [locationError, setLocationError] = useState("");
  
  // Endorsement state
  const [userHasEndorsed, setUserHasEndorsed] = useState(false);
  
  // Tracking state
  const [isTracking, setIsTracking] = useState(false);
  const [trackingStatus, setTrackingStatus] = useState("");
  const [userCheckedIn, setUserCheckedIn] = useState(false);
  const [timeAccrued, setTimeAccrued] = useState(0);
  const trackingIntervalRef = useRef(null);

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
        setCalendarConnected(false);
      } finally {
        setCheckingConnection(false);
      }
    };
    checkConnection();
  }, [user]);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.type === 'CALENDAR_CONNECTED' && event.data.success) {
        setCalendarConnected(true);
        setShowAuthMessage(false);
        handleSyncToCalendar();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (!event?.coordinates || !mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const container = mapContainerRef.current;
    container.innerHTML = '';

    try {
      const map = L.map(container).setView([event.coordinates.lat, event.coordinates.lng], 15);
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
    } catch (err) {
      console.error("Map initialization error:", err);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [event]);

  useEffect(() => {
    if (!event || !user) return;
    const userId = user._id || user.id;
    const isHost = event.host?._id === userId;
    
    if (isHost) {
      setUserCheckedIn(event.hostPresent === true);
    } else {
      const timer = event.attendeeTimers?.[userId];
      setUserCheckedIn(timer?.present === true || timer?.joinedAt != null);
      setTimeAccrued(timer?.totalMinutes || 0);
    }
    
    // Check if user has already endorsed (from backend or local state)
    // You can also check event.endorsement status, but we'll rely on state
  }, [event, user]);

  useEffect(() => {
    if (!event || !user) return;
    const shouldPoll = userCheckedIn && (event.status === "ongoing" || event.status === "upcoming");
    
    if (shouldPoll) {
      startTracking();
    } else {
      stopTracking();
    }
    
    return () => stopTracking();
  }, [userCheckedIn, event?.status]);

  const startTracking = () => {
    if (trackingIntervalRef.current) return;
    
    setIsTracking(true);
    setTrackingStatus("Tracking your location...");
    
    sendLocation();
    
    trackingIntervalRef.current = setInterval(() => {
      sendLocation();
    }, 30000);
    
    console.log("📍 Location tracking started");
  };

  const stopTracking = () => {
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
      trackingIntervalRef.current = null;
    }
    setIsTracking(false);
    setTrackingStatus("");
  };

  const sendLocation = async () => {
    if (!navigator.geolocation) {
      setTrackingStatus("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const data = await eventApi.trackLocation(id, latitude, longitude);
          
          if (data.role === "host") {
            setTrackingStatus(`Host present: ${data.hostPresent ? "Yes" : "Outside event area"}`);
            if (data.hostPresent) {
              setUserCheckedIn(true);
            }
          } else if (data.role === "attendee") {
            const minutes = data.timer?.minutes || 0;
            const required = data.timer?.requiredMinutes || 1;
            setTimeAccrued(minutes);
            setTrackingStatus(`Present: ${data.withinRadius ? "Yes" : "Outside"} | Time: ${minutes}/${required} min`);
            
            if (data.timer?.completed) {
              fetchEvent();
            }
          }
          
          if (Math.random() < 0.3) {
            fetchEvent();
          }
        } catch (err) {
          console.error("Failed to send location:", err);
          setTrackingStatus("Location update failed");
        }
      },
      (err) => {
        console.error("Geolocation error:", err);
        setTrackingStatus(`Location error: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleCheckIn = async (useSimulated = false) => {
    setCheckingIn(true);
    setLocationError("");
    
    try {
      let lat, lng;
      
      if (useSimulated && event?.coordinates) {
        lat = event.coordinates.lat;
        lng = event.coordinates.lng;
        console.log("Using simulated event location:", lat, lng);
      } else {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { 
            enableHighAccuracy: true,
            timeout: 10000 
          });
        });
        lat = position.coords.latitude;
        lng = position.coords.longitude;
      }
      
      await eventApi.trackLocation(id, lat, lng);
      await fetchEvent();
      setUserCheckedIn(true);
      setTrackingStatus(useSimulated ? "Checked in with simulated location" : "Checked in! Tracking started.");
      setLocationError("");
    } catch (err) {
      console.error("Check-in error:", err);
      if (err.code === 1) {
        setLocationError("Location permission denied. Please enable location services or use 'Simulate Presence' for demo.");
      } else {
        setLocationError(err.message || "Failed to check in");
      }
    } finally {
      setCheckingIn(false);
    }
  };

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const data = await eventApi.getEvent(id);
      setEvent(data.event);
      setIsFavorited(data.event.isFavorited || false);
      setHasSynced(data.event.hasSynced || false);
      
      // Check if current user has already endorsed (if endpoint provides it, else rely on local state)
      // For now we'll reset endorsement state on fetch; you can enhance with a dedicated check
    } catch (err) {
      setError("Failed to load event details");
    } finally {
      setLoading(false);
    }
  };

  const handleFavorite = async () => {
    if (!user) return navigate("/login", { state: { from: `/events/${id}` } });
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
      await navigator.clipboard.writeText(`${window.location.origin}/events/${id}`);
      alert("Event link copied!");
    } catch (err) {
      console.error("Failed to share:", err);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("Cancel this event? This cannot be undone.")) return;
    try {
      await eventApi.deleteEvent(id);
      navigate("/events");
    } catch (err) {
      setError(err.message || "Failed to cancel");
    }
  };

  const handleSyncToCalendar = async () => {
    if (!calendarConnected) return setShowAuthMessage(true);
    setSyncing(true);
    try {
      const data = await calendarApi.syncEvent(id);
      if (data.link) {
        window.open(data.link, '_blank');
        setHasSynced(true);
        fetchEvent();
      } else {
        alert('Sync failed. Try again.');
      }
    } catch (err) {
      if (err.status === 401) setCalendarConnected(false);
    } finally {
      setSyncing(false);
    }
  };

  const connectCalendar = () => {
    calendarApi.connectCalendar();
    setShowAuthMessage(false);
  };

  const handleLeave = async () => {
    if (!window.confirm("Leave this event?")) return;
    setLeaving(true);
    try {
      if (hasSynced) await eventApi.removeCalendarEvent(id);
      await eventApi.leaveEvent(id);
      navigate("/events");
    } catch (err) {
      setError(err.message || "Failed to leave");
      setLeaving(false);
    }
  };

  const handleJoin = async () => {
    if (!user) return navigate("/login", { state: { from: `/events/${id}` } });
    try {
      await eventApi.joinEvent(id);
      fetchEvent();
    } catch (err) {
      setError(err.message || "Failed to join");
    }
  };

  const handleEndorse = async (endorsed) => {
    setEndorsing(true);
    try {
      await eventApi.submitEndorsement(id, { endorsed });
      setUserHasEndorsed(true);
      alert(endorsed ? "Thank you for endorsing!" : "Feedback recorded.");
      fetchEvent();
    } catch (err) {
      alert(err.message || "Failed to submit endorsement");
    } finally {
      setEndorsing(false);
    }
  };

  const handleCompleteEvent = async () => {
    if (!window.confirm("Mark event as completed? Attendees can then endorse.")) return;
    setCompleting(true);
    try {
      await eventApi.completeEvent(id);
      fetchEvent();
    } catch (err) {
      alert(err.message || "Failed to complete event");
    } finally {
      setCompleting(false);
    }
  };

  const openDirections = () => {
    if (event?.coordinates) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${event.coordinates.lat},${event.coordinates.lng}`, '_blank');
    }
  };

  if (loading) return <Container><div className="flex justify-center h-64"><Loader2 className="animate-spin text-blue-600" size={32} /></div></Container>;
  if (error || !event) return <Container><Card className="p-8 text-center"><p className="text-red-600">{error || "Event not found"}</p><Link to="/events"><Button className="mt-4">Back to Events</Button></Link></Card></Container>;

  const userId = user?._id || user?.id;
  const hostId = event.host?._id;
  const isHost = !!(userId && hostId && userId === hostId);
  const isAttending = event.isAttending === true;
  const isPastEvent = new Date(event.date) < new Date();
  const isFull = event.attendees?.length >= event.maxAttendees;
  const spotsText = `${event.attendees?.length || 0}/${event.maxAttendees} spots filled`;
  const spotsColor = isFull ? "text-red-600" : "text-green-600";
  const formattedDate = new Date(event.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const showSyncButton = user && (isHost || isAttending) && !hasSynced && !isPastEvent;
  const showConnectButton = showSyncButton && !calendarConnected && !checkingConnection;
  const canEndorse = event.status === "completed" && isAttending && event.attendeesPresent?.includes(userId);
  
  const showCheckInButton = (isHost || isAttending) && 
                            (event.status === "upcoming" || event.status === "ongoing") && 
                            !userCheckedIn;

  return (
    <Container>
      <div className="mb-4"><Link to="/events" className="text-blue-600 hover:underline">← Back to Events</Link></div>
      {isPastEvent && event.status === 'upcoming' && <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">This event has already passed.</div>}
      
      {isTracking && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm flex items-center gap-2">
          <Loader2 size={16} className="animate-spin" />
          {trackingStatus}
        </div>
      )}
      
      {userCheckedIn && !isTracking && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
          <CheckCircle size={16} />
          You are checked in! {timeAccrued > 0 && `Time accrued: ${timeAccrued} min`}
        </div>
      )}
      
      {locationError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
          <AlertTriangle size={16} />
          {locationError}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="flex justify-between items-start mb-4">
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${TOPIC_COLORS[event.topic] || TOPIC_COLORS.Other}`}>{event.topic}</span>
              <div className="flex gap-2">
                <button onClick={handleShare} className="text-gray-400 hover:text-blue-600 p-1"><Share2 size={18} /></button>
                <button onClick={handleFavorite} className={`p-1 ${isFavorited ? "text-red-500" : "text-gray-400 hover:text-red-500"}`}><Heart size={18} fill={isFavorited ? "currentColor" : "none"} /></button>
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-4">{event.title}</h1>
            {event.description && <div className="mb-6"><h3 className="text-lg font-semibold mb-2">About</h3><p className="text-gray-700 whitespace-pre-wrap">{event.description}</p></div>}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div><p className="text-sm text-gray-500">Date</p><p className="font-medium">{formattedDate}</p></div>
              <div><p className="text-sm text-gray-500">Time</p><p className="font-medium">{event.time}</p></div>
              <div><p className="text-sm text-gray-500">Location</p><p className="font-medium">{event.location}</p></div>
              <div><p className="text-sm text-gray-500">Spots</p><p className={`font-medium ${spotsColor}`}>{spotsText}</p></div>
            </div>
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-3">Hosted by</h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-white flex items-center justify-center text-lg">{event.host?.name?.charAt(0).toUpperCase()}</div>
                <div><p className="font-semibold">{event.host?.name}</p><p className="text-sm text-gray-500">{event.host?.points || 0} points • {event.host?.badges?.length || 0} badges</p></div>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Attendees ({event.attendees?.length || 0})</h3>
              <button onClick={() => setShowAttendees(!showAttendees)} className="text-blue-600 hover:underline text-sm">{showAttendees ? "Hide" : "Show all"}</button>
            </div>
            {showAttendees && (
              <div className="space-y-2">
                {event.attendees?.map(att => (
                  <div key={att._id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm">{att.name?.charAt(0).toUpperCase()}</div>
                    <span>{att.name}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
          {canEndorse && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-3">Endorse this Event</h3>
              <p className="text-sm text-gray-600 mb-4">Did this event meet your expectations? Your endorsement helps the host earn rewards.</p>
              {userHasEndorsed ? (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
                  <CheckCircle size={16} />
                  Thank you for your endorsement!
                </div>
              ) : (
                <div className="flex gap-3">
                  <Button onClick={() => handleEndorse(true)} disabled={endorsing} variant="primary"><CheckCircle size={16} /> Endorse</Button>
                  <Button onClick={() => handleEndorse(false)} disabled={endorsing} variant="ghost"><XCircle size={16} /> Not Endorse</Button>
                </div>
              )}
              {event.endorsement > 0 && <p className="mt-4 text-sm text-gray-500">Current endorsement: {event.endorsement}% positive</p>}
              {event.isSuccessful && <p className="mt-2 text-green-600 text-sm font-medium">This event was marked successful!</p>}
            </Card>
          )}
        </div>
        <div className="space-y-6">
          <Card className="p-6">
            <div className="text-center mb-4"><span className={`text-2xl font-bold ${spotsColor}`}>{event.attendees?.length || 0}/{event.maxAttendees}</span><p className="text-sm text-gray-500">spots filled</p></div>
            
            {showCheckInButton && (
              <div className="space-y-2 mb-3">
                <Button 
                  onClick={() => handleCheckIn(false)} 
                  disabled={checkingIn} 
                  variant="primary" 
                  className="w-full"
                >
                  {checkingIn ? (
                    <><Loader2 size={16} className="animate-spin" /> Checking in...</>
                  ) : (
                    <><MapPinCheck size={16} /> Check In (Use My Location)</>
                  )}
                </Button>
                
                {ALLOW_SIMULATE_PRESENCE && event?.coordinates && (
                  <Button 
                    onClick={() => handleCheckIn(true)} 
                    disabled={checkingIn} 
                    variant="ghost" 
                    className="w-full border border-gray-300"
                  >
                    <RefreshCw size={16} /> Simulate Presence (Test Mode)
                  </Button>
                )}
                <p className="text-xs text-gray-400 text-center">Your location is used to verify attendance</p>
              </div>
            )}
            
            {isHost ? (
              <div className="space-y-2">
                <Button variant="ghost" className="w-full text-red-600 border-red-200 hover:bg-red-50" onClick={handleCancel}>Cancel Event</Button>
                {event.status === "ongoing" && event.hostPresent && (
                  <Button onClick={handleCompleteEvent} disabled={completing} className="w-full">{completing ? "Completing..." : "Mark as Completed"}</Button>
                )}
                {showSyncButton && (
                  showConnectButton ? <Button onClick={connectCalendar} variant="ghost" className="w-full">Connect Google Calendar</Button>
                  : <Button onClick={handleSyncToCalendar} disabled={syncing} variant="ghost" className="w-full">{syncing ? "Syncing..." : "Sync to Google Calendar"}</Button>
                )}
                {event.calendarLink && <div className="mt-2 text-center"><a href={event.calendarLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm flex items-center justify-center gap-1"><Calendar size={14} /> View in Google Calendar →</a></div>}
              </div>
            ) : (
              <div className="space-y-2">
                {!isAttending ? <Button onClick={handleJoin} className="w-full" variant="primary">Join Event</Button>
                : <Button onClick={handleLeave} disabled={leaving} variant="ghost" className="w-full text-red-600 border-red-200">{leaving ? "Leaving..." : "Leave Event"}</Button>}
                {showSyncButton && (
                  showConnectButton ? <Button onClick={connectCalendar} variant="ghost" className="w-full">Connect Google Calendar</Button>
                  : <Button onClick={handleSyncToCalendar} disabled={syncing} variant="ghost" className="w-full">{syncing ? "Syncing..." : "Sync to Google Calendar"}</Button>
                )}
                {event.calendarLink && <div className="mt-2 text-center"><a href={event.calendarLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm flex items-center justify-center gap-1"><Calendar size={14} /> View in Google Calendar →</a></div>}
              </div>
            )}
            {!user && <p className="text-xs text-gray-500 text-center mt-3"><Link to="/login" className="text-blue-600 hover:underline">Login</Link> to join</p>}
            
            <Button onClick={fetchEvent} variant="ghost" size="sm" className="w-full mt-3 text-xs">
              <RefreshCw size={12} /> Refresh Status
            </Button>
          </Card>
          <Card className="p-4">
            <h3 className="text-md font-semibold mb-2 flex items-center gap-2"><MapPin size={16} /> Location</h3>
            <div ref={mapContainerRef} style={{ height: "200px", width: "100%", borderRadius: "8px", marginBottom: "8px" }}></div>
            <div className="flex justify-between items-center gap-2">
              <p className="text-xs text-gray-600 truncate flex-1">{event.location}</p>
              <button onClick={openDirections} className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700"><Navigation size={12} />Directions</button>
            </div>
          </Card>
        </div>
      </div>
    </Container>
  );
}