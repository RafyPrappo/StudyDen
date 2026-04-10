import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePoints } from "../context/PointsContext";
import Container from "../components/ui/Container";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { userApi } from "../services/user";
import { 
  User, 
  Calendar, 
  Trophy, 
  Medal, 
  Bell,
  X,
  Check,
  Loader2,
  Camera,
  Trash2,
  AlertCircle,
  Settings,
  SlidersHorizontal
} from "lucide-react";

const BADGE_ICONS = {
  Explorer: "🌍",
  Critic: "📝",
  Organizer: "🎯",
  Guardian: "🛡️",
  "Perfect Host": "⭐",
  Dedicated: "🔥"
};

const BADGE_COLORS = {
  Explorer: "bg-blue-50 text-blue-700 border-blue-200",
  Critic: "bg-purple-50 text-purple-700 border-purple-200",
  Organizer: "bg-green-50 text-green-700 border-green-200",
  Guardian: "bg-amber-50 text-amber-700 border-amber-200",
  "Perfect Host": "bg-yellow-50 text-yellow-700 border-yellow-200",
  Dedicated: "bg-red-50 text-red-700 border-red-200"
};
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

const LEVEL_OPTIONS = [1, 2, 3, 4, 5];


export default function ProfilePage() {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const { refreshPoints } = usePoints();
  const fileInputRef = useRef(null);
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [notifications, setNotifications] = useState([]);
  const [notificationsPage, setNotificationsPage] = useState(1);
  const [notificationsTotal, setNotificationsTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [completedEvents, setCompletedEvents] = useState([]);
  const [eventsPage, setEventsPage] = useState(1);
  const [eventsTotal, setEventsTotal] = useState(0);
  const [ditchStreak, setDitchStreak] = useState({ currentStreak: 0, totalDitched: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
    const [showPreferencesBox, setShowPreferencesBox] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [preferencesError, setPreferencesError] = useState("");
  const [preferencesForm, setPreferencesForm] = useState({
    amenities: [],
    crowdLevel: "",
    noiseLevel: "",
    minRating: "",
  });

  const isOwnProfile = !userId || userId === currentUser?.id;

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await userApi.getProfile(userId);
      setProfile(data.user);
      setEditName(data.user.name);
      
      if (isOwnProfile) {
        fetchNotifications();
        fetchCompletedEvents();
        fetchDitchStreak();
      }
    } catch (err) {
      setError("Failed to load profile");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const data = await userApi.getNotifications(notificationsPage);
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
      setNotificationsTotal(data.pagination.total);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  };

  const fetchCompletedEvents = async () => {
    try {
      const data = await userApi.getCompletedEvents(eventsPage);
      setCompletedEvents(data.events);
      setEventsTotal(data.pagination.total);
    } catch (err) {
      console.error("Failed to load completed events:", err);
    }
  };

  const fetchDitchStreak = async () => {
    try {
      const data = await userApi.getDitchStreak();
      setDitchStreak(data);
    } catch (err) {
      console.error("Failed to load ditch streak:", err);
    }
  };
    const loadPreferences = async () => {
    try {
      setPreferencesError("");
      const data = await userApi.getPreferences();

      setPreferencesForm({
        amenities: data.preferences?.amenities || [],
        crowdLevel: data.preferences?.crowdLevel ?? "",
        noiseLevel: data.preferences?.noiseLevel ?? "",
        minRating: data.preferences?.minRating ?? "",
      });
    } catch (err) {
      setPreferencesError("Failed to load preferences");
      console.error("Failed to load preferences:", err);
    }
  };

  const handleTogglePreferences = async () => {
    const nextOpen = !showPreferencesBox;
    setShowPreferencesBox(nextOpen);

    if (nextOpen) {
      await loadPreferences();
    }
  };

  const handleAmenityToggle = (amenity) => {
    setPreferencesForm((prev) => {
      const exists = prev.amenities.includes(amenity);

      return {
        ...prev,
        amenities: exists
          ? prev.amenities.filter((item) => item !== amenity)
          : [...prev.amenities, amenity],
      };
    });
  };

  const handleSavePreferences = async () => {
    try {
      setSavingPreferences(true);
      setPreferencesError("");

      await userApi.updatePreferences({
        amenities: preferencesForm.amenities,
        crowdLevel: preferencesForm.crowdLevel === "" ? null : Number(preferencesForm.crowdLevel),
        noiseLevel: preferencesForm.noiseLevel === "" ? null : Number(preferencesForm.noiseLevel),
        minRating: preferencesForm.minRating === "" ? null : Number(preferencesForm.minRating),
      });

      await fetchProfile();
      setShowPreferencesBox(false);
    } catch (err) {
      setPreferencesError("Failed to save preferences");
      console.error("Failed to save preferences:", err);
    } finally {
      setSavingPreferences(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("photo", file);

    setUploading(true);
    try {
      const data = await userApi.uploadPhoto(formData);
      setProfile(data.user);
      refreshPoints();
      fetchProfile();
    } catch (err) {
      setError("Failed to upload photo");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handlePhotoRemove = async () => {
    if (!window.confirm("Are you sure you want to remove your profile photo?")) return;

    setUploading(true);
    try {
      const data = await userApi.removePhoto();
      setProfile(data.user);
      refreshPoints();
      fetchProfile();
    } catch (err) {
      setError("Failed to remove photo");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const data = await userApi.updateProfile({ name: editName });
      setProfile(data.user);
      setIsEditing(false);
      fetchProfile();
    } catch (err) {
      setError("Failed to update profile");
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await userApi.markAllRead();
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await userApi.markNotificationRead(id);
      setNotifications(notifications.map(n => 
        n._id === id ? { ...n, read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      await userApi.deleteNotification(id);
      setNotifications(notifications.filter(n => n._id !== id));
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Date not set";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid date";
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
      });
    } catch {
      return "Invalid date";
    }
  };

  const formatDateTime = (dateString, timeString) => {
    if (!dateString) return "Date not set";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid date";
      const formattedDate = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
      });
      return `${formattedDate} at ${timeString || "Time not set"}`;
    } catch {
      return "Invalid date";
    }
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

  if (error || !profile) {
    return (
      <Container>
        <Card className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error || "Profile not found"}</p>
          <Link to="/">
            <Button className="mt-4">Go Home</Button>
          </Link>
        </Card>
      </Container>
    );
  }

  return (
    <Container>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar - Left Column */}
        <div className="lg:col-span-1 -mt-12">
          <Card className="p-6 sticky top-24">
            {/* Profile Photo - Using same logic as EventCard */}
            <div className="text-center mb-6">
              <div className="relative inline-block">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mx-auto overflow-hidden">
                  {profile.profilePhoto ? (
                    <img 
                      src={`http://localhost:5000${profile.profilePhoto}`} 
                      alt={profile.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = 'none';
                        const parent = e.target.parentElement;
                        const fallback = document.createElement('div');
                        fallback.className = 'w-full h-full flex items-center justify-center text-white text-3xl font-bold';
                        fallback.textContent = profile.name?.charAt(0).toUpperCase() || '?';
                        parent.appendChild(fallback);
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-3xl font-bold">
                      {profile.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                {isOwnProfile && (
                  <div className="absolute -bottom-2 -right-2 flex gap-1">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition disabled:opacity-50"
                      title="Upload photo"
                    >
                      {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                    </button>
                    {profile.profilePhoto && (
                      <button
                        onClick={handlePhotoRemove}
                        disabled={uploading}
                        className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition disabled:opacity-50"
                        title="Remove photo"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            </div>

            {/* Profile Info */}
            <div className="text-center mb-6">
              {isEditing ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleUpdateProfile} className="flex-1">
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">{profile.name}</h2>
                  <p className="text-sm text-gray-500 mb-2">{profile.email}</p>
                  {isOwnProfile && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Edit profile
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Stats */}
            <div className="border-t pt-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Points</span>
                <span className="font-bold text-blue-600">{profile.points}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Badges</span>
                <span className="flex gap-1">
                  {profile.badges?.slice(0, 3).map(badge => (
                    <span key={badge} className="text-lg" title={badge}>
                      {BADGE_ICONS[badge] || "🏅"}
                    </span>
                  ))}
                  {profile.badges?.length > 3 && (
                    <span className="text-sm text-gray-500">+{profile.badges.length - 3}</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Ditch streak</span>
                <span className={`font-bold ${ditchStreak.currentStreak >= 3 ? 'text-red-600' : 'text-gray-700'}`}>
                  {ditchStreak.currentStreak}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Events completed</span>
                <span className="font-bold text-green-600">{profile.completedEvents?.length || 0}</span>
              </div>
            </div>

            {/* Tabs */}
            {isOwnProfile && (
              <div className="border-t pt-4 mt-4">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`w-full text-left px-3 py-3 rounded-lg mb-1 flex items-center gap-2 ${
                    activeTab === "profile" ? "bg-blue-50 text-blue-600" : "hover:bg-gray-50"
                  }`}
                >
                  <User size={16} />
                  Profile
                </button>
                <button
                  onClick={() => setActiveTab("notifications")}
                  className={`w-full text-left px-3 py-3 rounded-lg mb-1 flex items-center gap-2 relative ${
                    activeTab === "notifications" ? "bg-blue-50 text-blue-600" : "hover:bg-gray-50"
                  }`}
                >
                  <Bell size={16} />
                  Notifications
                  {unreadCount > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("completed")}
                  className={`w-full text-left px-3 py-3 rounded-lg flex items-center gap-2 ${
                    activeTab === "completed" ? "bg-blue-50 text-blue-600" : "hover:bg-gray-50"
                  }`}
                >
                  <Check size={16} />
                  Completed
                </button>
              </div>
            )}
          </Card>
        </div>

        {/* Main Content - Right Column */}
        <div className="lg:col-span-3">
          {activeTab === "profile" && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">About</h3>
              <p className="text-gray-700 mb-6">
                Member since {formatDate(profile.createdAt)}
              </p>
              
              <h3 className="text-lg font-semibold mb-4">Badges</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                {profile.badges?.map(badge => (
                  <div key={badge} className={`border rounded-lg p-4 text-center ${BADGE_COLORS[badge] || 'bg-gray-50'}`}>
                    <div className="text-3xl mb-2">{BADGE_ICONS[badge] || "🏅"}</div>
                    <p className="text-sm font-medium">{badge}</p>
                  </div>
                ))}
                {(!profile.badges || profile.badges.length === 0) && (
                  <p className="text-gray-500 col-span-3 text-center py-8">
                    No badges yet. Join events to earn badges!
                  </p>
                )}
              </div>

              <h3 className="text-lg font-semibold mb-4">Joined Events</h3>
              <div className="space-y-3">
                {profile.joinedEvents && profile.joinedEvents.length > 0 ? (
                  profile.joinedEvents.map(event => (
                    <Link to={`/events/${event._id}`} key={event._id}>
                      <div className="border rounded-lg p-4 hover:bg-gray-50 transition">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <p className="font-medium text-gray-900">{event.title || "Untitled Event"}</p>
                            <p className="text-sm text-gray-500">
                              {event.date ? formatDateTime(event.date, event.time) : "Date not available"}
                            </p>
                          </div>
                          <span className={`text-xs px-3 py-1.5 rounded ${
                            event.status === "cancelled" ? "bg-red-100 text-red-700" :
                            event.status === "completed" ? "bg-green-100 text-green-700" :
                            "bg-blue-100 text-blue-700"
                          }`}>
                            {event.status || "upcoming"}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">No joined events yet.</p>
                )}
              </div>
                            {isOwnProfile && (
                <div className="mt-8 border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Study Spot Preferences</h3>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleTogglePreferences}
                      className="inline-flex items-center gap-2"
                    >
                      <Settings size={16} />
                      Set Preferences
                    </Button>
                  </div>

                  {showPreferencesBox && (
                    <div className="border rounded-xl p-5 bg-gray-50 space-y-5">
                      {preferencesError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                          {preferencesError}
                        </div>
                      )}

                      <div>
                        <p className="text-sm font-medium text-gray-800 mb-3">
                          Amenities
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {AMENITY_OPTIONS.map((amenity) => {
                            const selected = preferencesForm.amenities.includes(amenity);

                            return (
                              <button
                                key={amenity}
                                type="button"
                                onClick={() => handleAmenityToggle(amenity)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                  selected
                                    ? "bg-slate-800 text-white"
                                    : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
                                }`}
                              >
                                {amenity}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-800 mb-2">
                            Crowd Level
                          </label>
                          <select
                            value={preferencesForm.crowdLevel}
                            onChange={(e) =>
                              setPreferencesForm((prev) => ({
                                ...prev,
                                crowdLevel: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          >
                            <option value="">Any</option>
                            {LEVEL_OPTIONS.map((level) => (
                              <option key={level} value={level}>
                                {level}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-800 mb-2">
                            Noise Level
                          </label>
                          <select
                            value={preferencesForm.noiseLevel}
                            onChange={(e) =>
                              setPreferencesForm((prev) => ({
                                ...prev,
                                noiseLevel: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          >
                            <option value="">Any</option>
                            {LEVEL_OPTIONS.map((level) => (
                              <option key={level} value={level}>
                                {level}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-800 mb-2">
                            Minimum Rating
                          </label>
                          <select
                            value={preferencesForm.minRating}
                            onChange={(e) =>
                              setPreferencesForm((prev) => ({
                                ...prev,
                                minRating: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          >
                            <option value="">Any</option>
                            {LEVEL_OPTIONS.map((level) => (
                              <option key={level} value={level}>
                                {level}+
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button
                          onClick={handleSavePreferences}
                          disabled={savingPreferences}
                          className="inline-flex items-center gap-2"
                        >
                          {savingPreferences ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <SlidersHorizontal size={16} />
                          )}
                          Save Preferences
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          )}

          {activeTab === "notifications" && (
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Notifications</h3>
                {unreadCount > 0 && (
                  <Button size="sm" variant="ghost" onClick={handleMarkAllRead}>
                    Mark all as read
                  </Button>
                )}
              </div>

              <div className="space-y-3">
                {notifications.length > 0 ? (
                  notifications.map(notification => (
                    <div
                      key={notification._id}
                      className={`border rounded-lg p-4 transition ${
                        notification.read ? 'bg-white' : 'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {notification.type === "event_cancelled" && (
                              <X size={16} className="text-red-500" />
                            )}
                            {notification.type === "badge_earned" && (
                              <Medal size={16} className="text-yellow-500" />
                            )}
                            {notification.type === "points_earned" && (
                              <Trophy size={16} className="text-blue-500" />
                            )}
                            <span className="font-medium">{notification.title || "Notification"}</span>
                            {!notification.read && (
                              <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{notification.message || ""}</p>
                          {notification.event && (
                            <p className="text-xs text-gray-400 mb-1">
                              Event: {notification.event.title || "Unknown"} on {formatDate(notification.event.date)}
                            </p>
                          )}
                          <p className="text-xs text-gray-400">
                            {notification.createdAt ? new Date(notification.createdAt).toLocaleString() : ""}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          {!notification.read && (
                            <button
                              onClick={() => handleMarkRead(notification._id)}
                              className="p-1.5 hover:bg-blue-100 rounded"
                              title="Mark as read"
                            >
                              <Check size={14} className="text-blue-600" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteNotification(notification._id)}
                            className="p-1.5 hover:bg-red-100 rounded"
                            title="Delete"
                          >
                            <X size={14} className="text-red-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-8">No notifications</p>
                )}
              </div>

              {notificationsTotal > notifications.length && (
                <div className="flex justify-center mt-4">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setNotificationsPage(p => p + 1);
                      fetchNotifications();
                    }}
                  >
                    Load more
                  </Button>
                </div>
              )}
            </Card>
          )}

          {activeTab === "completed" && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Completed Events</h3>

              <div className="space-y-3">
                {completedEvents.length > 0 ? (
                  completedEvents.map(event => (
                    <Link to={`/events/${event._id}`} key={event._id}>
                      <div className="border rounded-lg p-4 hover:bg-gray-50 transition">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <p className="font-medium text-gray-900">{event.title || "Untitled Event"}</p>
                            <p className="text-sm text-gray-500">
                              Hosted by {event.host?.name || "Unknown"}
                            </p>
                            <p className="text-xs text-gray-400">
                              {event.date ? formatDateTime(event.date, event.time) : "Date not available"}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded">
                              Completed
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    No completed events yet. Join and attend events to see them here!
                  </p>
                )}
              </div>

              {eventsTotal > completedEvents.length && (
                <div className="flex justify-center mt-4">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEventsPage(p => p + 1);
                      fetchCompletedEvents();
                    }}
                  >
                    Load more
                  </Button>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </Container>
  );
}