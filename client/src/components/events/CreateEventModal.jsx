import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import Card from "../ui/Card";
import Button from "../ui/Button";
import { eventApi } from "../../services/event";
<<<<<<< Updated upstream
import { X, Calendar, MapPin, Users, Tag, FileText, Clock, Loader2 } from "lucide-react";
=======
import { X, Calendar, MapPin, Users, Tag, FileText, Clock, Loader2, Building2, Sparkles } from "lucide-react";
>>>>>>> Stashed changes

const TOPICS = ["Design", "Development", "Academic", "Nature", "Other"];
const BARIKOI_API_KEY = import.meta.env.VITE_BARIKOI_API_KEY;

export default function CreateEventModal({ onClose, onEventCreated }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    topic: "Development",
    description: "",
    date: "",
    time: "",
    location: "",
    maxAttendees: 10
  });
  const [isVisible, setIsVisible] = useState(false);
<<<<<<< Updated upstream
=======
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  const searchTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);
  const locationInputRef = useRef(null);
  const overlayRef = useRef(null);
  const [mouseDownTarget, setMouseDownTarget] = useState(null);
  const [suggestionsPosition, setSuggestionsPosition] = useState({ top: 0, left: 0, width: 0 });

  const cleanupPendingRequest = useCallback(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);
>>>>>>> Stashed changes

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await eventApi.createEvent(formData);
      setIsVisible(false);
      setTimeout(onEventCreated, 300);
    } catch (err) {
      setError(err.message || "Failed to create event");
      setLoading(false);
    }
  };

<<<<<<< Updated upstream
  return (
    <div 
=======
  // Search both Barikoi (direct, never fails) and local StudyDen spots (silently ignored on failure)
  const searchPlaces = async (query, signal) => {
    if (!query.trim()) return [];

    const results = [];

    // 1) Direct Barikoi call (always works, no auth required)
    try {
      const barikoiRes = await fetch(
        `https://barikoi.xyz/v1/api/search/autocomplete/${BARIKOI_API_KEY}/place?q=${encodeURIComponent(query)}`,
        { signal }
      );
      if (barikoiRes.ok) {
        const barikoiData = await barikoiRes.json();
        const places = barikoiData?.places || [];
        places.forEach(p => {
          results.push({
            id: p.id || `${Date.now()}_${Math.random()}`,
            address: p.address || p.place_address || p.name,
            title: p.address?.split(',')[0] || p.name,
            latitude: Number(p.latitude),
            longitude: Number(p.longitude),
            isLocal: false,
            source: 'Barikoi'
          });
        });
      }
    } catch (err) {
      if (err.name === 'AbortError') throw err;
      console.error("Barikoi autocomplete failed:", err);
    }

    // 2) Backend call for local StudyDen spots – raw fetch, never redirects
    try {
      const backendRes = await fetch(`/api/barikoi/search?q=${encodeURIComponent(query)}&limit=5`, {
        credentials: 'include',
        signal
      });
      if (backendRes.ok) {
        const backendData = await backendRes.json();
        const localSpots = (backendData.suggestions || []).map(s => ({
          id: s.id,
          address: s.address,
          title: s.title,
          latitude: s.latitude ? Number(s.latitude) : null,
          longitude: s.longitude ? Number(s.longitude) : null,
          isLocal: true,
          source: 'StudyDen'
        }));
        // Merge local spots first, avoid duplicates by coordinates
        const barikoiCoords = new Set(results.map(r => `${r.latitude?.toFixed(6)},${r.longitude?.toFixed(6)}`));
        localSpots.forEach(ls => {
          const key = `${ls.latitude?.toFixed(6)},${ls.longitude?.toFixed(6)}`;
          if (!barikoiCoords.has(key)) {
            results.unshift(ls);
            barikoiCoords.add(key);
          }
        });
      }
      // If not OK (401, 500, ...), simply ignore – we already have Barikoi results
    } catch (err) {
      if (err.name === 'AbortError') throw err;
      console.warn("Backend spot search failed, using Barikoi only:", err.message);
    }

    return results.slice(0, 5);
  };

  const handleLocationChange = (value) => {
    setFormData(prev => ({ ...prev, location: value }));
    setSearchError("");

    cleanupPendingRequest();

    if (value.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setShowSuggestions(true);
    setIsSearching(true);
    setSuggestions([]);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const merged = await searchPlaces(value, controller.signal);
        if (!controller.signal.aborted) {
          setSuggestions(merged);
          if (merged.length === 0) {
            setSearchError("No locations found. Try a different search.");
          } else {
            setSearchError("");
          }
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error("Search error:", err);
        setSearchError("Search failed. Please try again.");
        setSuggestions([]);
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false);
          abortControllerRef.current = null;
        }
      }
    }, 400);
  };

  const selectSuggestion = (suggestion) => {
    setFormData(prev => ({ ...prev, location: suggestion.address }));
    setSuggestions([]);
    setShowSuggestions(false);
    cleanupPendingRequest();
    setIsSearching(false);
    setSearchError("");
  };

  const handleInputFocus = () => {
    if (formData.location.trim().length >= 3) {
      setShowSuggestions(true);
    }
  };

  const handleMouseDown = (e) => {
    setMouseDownTarget(e.target);
  };

  const handleMouseUp = (e) => {
    if (mouseDownTarget === overlayRef.current && e.target === overlayRef.current) {
      handleClose();
    }
    setMouseDownTarget(null);
  };

  return (
    <div
      ref={overlayRef}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
>>>>>>> Stashed changes
      className={`fixed inset-0 flex items-center justify-center p-4 z-50 transition-all duration-300 ease-out ${
        isVisible ? 'bg-black/50 backdrop-blur-sm' : 'bg-black/0 backdrop-blur-0 pointer-events-none'
      }`}
      onClick={handleClose}
    >
      <div
        className={`transform transition-all duration-500 ease-out ${
          isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-75 translate-y-10'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Create new event</h2>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded transition-colors">
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
<<<<<<< Updated upstream
              {/* Title */}
              <div className="transform transition-all duration-300 delay-100" style={{ transform: isVisible ? 'translateY(0)' : 'translateY(20px)', opacity: isVisible ? 1 : 0 }}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event title
                </label>
=======
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event title</label>
>>>>>>> Stashed changes
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    required
                    maxLength="100"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    style={{ paddingLeft: '2.5rem', paddingRight: '1rem' }}
                    className="w-full h-11 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="e.g., React.js study group"
                  />
                </div>
              </div>

<<<<<<< Updated upstream
              {/* Topic */}
              <div className="transform transition-all duration-300 delay-150" style={{ transform: isVisible ? 'translateY(0)' : 'translateY(20px)', opacity: isVisible ? 1 : 0 }}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Topic
                </label>
=======
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
>>>>>>> Stashed changes
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <select
                    required
                    value={formData.topic}
                    onChange={(e) => setFormData({...formData, topic: e.target.value})}
                    style={{ paddingLeft: '2.5rem', paddingRight: '1rem' }}
                    className="w-full h-11 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white transition-all duration-200"
                  >
                    {TOPICS.map(topic => <option key={topic} value={topic}>{topic}</option>)}
                  </select>
                </div>
              </div>

<<<<<<< Updated upstream
              {/* Description */}
              <div className="transform transition-all duration-300 delay-200" style={{ transform: isVisible ? 'translateY(0)' : 'translateY(20px)', opacity: isVisible ? 1 : 0 }}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-gray-400 text-xs">(optional)</span>
                </label>
=======
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-gray-400 text-xs">(optional)</span></label>
>>>>>>> Stashed changes
                <textarea
                  rows="3"
                  maxLength="500"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="What will you study? Any materials needed?"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
<<<<<<< Updated upstream
                <div className="transform transition-all duration-300 delay-250" style={{ transform: isVisible ? 'translateY(0)' : 'translateY(20px)', opacity: isVisible ? 1 : 0 }}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
=======
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
>>>>>>> Stashed changes
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      style={{ paddingLeft: '2.5rem', paddingRight: '1rem' }}
                      className="w-full h-11 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </div>
<<<<<<< Updated upstream
                <div className="transform transition-all duration-300 delay-300" style={{ transform: isVisible ? 'translateY(0)' : 'translateY(20px)', opacity: isVisible ? 1 : 0 }}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time
                  </label>
=======
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
>>>>>>> Stashed changes
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="time"
                      required
                      value={formData.time}
                      onChange={(e) => setFormData({...formData, time: e.target.value})}
                      style={{ paddingLeft: '2.5rem', paddingRight: '1rem' }}
                      className="w-full h-11 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </div>
              </div>

<<<<<<< Updated upstream
              {/* Location */}
              <div className="transform transition-all duration-300 delay-350" style={{ transform: isVisible ? 'translateY(0)' : 'translateY(20px)', opacity: isVisible ? 1 : 0 }}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
=======
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
>>>>>>> Stashed changes
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    style={{ paddingLeft: '2.5rem', paddingRight: '1rem' }}
                    className="w-full h-11 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="e.g., Dhanmondi 27, Dhaka"
                  />
                </div>
<<<<<<< Updated upstream
                <p className="text-xs text-gray-400 mt-1">
                  We'll use OpenStreetMap to get coordinates
                </p>
              </div>

              {/* Max attendees */}
              <div className="transform transition-all duration-300 delay-400" style={{ transform: isVisible ? 'translateY(0)' : 'translateY(20px)', opacity: isVisible ? 1 : 0 }}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum attendees
                </label>
=======
                <p className="text-xs text-gray-400 mt-1">Suggestions from StudyDen spots and map</p>
                {searchError && <p className="text-xs text-red-500 mt-1">{searchError}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Maximum attendees</label>
>>>>>>> Stashed changes
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="number"
                    required
                    min="2"
                    max="100"
                    value={formData.maxAttendees}
                    onChange={(e) => setFormData({...formData, maxAttendees: parseInt(e.target.value)})}
                    style={{ paddingLeft: '2.5rem', paddingRight: '1rem' }}
                    className="w-full h-11 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1 h-11" disabled={loading}>
                  {loading ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : "Create event"}
                </Button>
                <Button type="button" variant="ghost" className="flex-1 h-11" onClick={handleClose}>Cancel</Button>
              </div>
            </form>
          </div>
        </Card>
      </div>

<<<<<<< Updated upstream
      {/* Animation keyframes */}
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
=======
      {showSuggestions && (suggestions.length > 0 || isSearching) && createPortal(
        <ul
          className="fixed z-[100] bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
          style={{ top: suggestionsPosition.top, left: suggestionsPosition.left, width: suggestionsPosition.width }}
        >
          {isSearching && (
            <li className="px-4 py-2 text-gray-400 text-sm flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" /> Searching...
            </li>
          )}
          {!isSearching && suggestions.map((place, idx) => (
            <li
              key={idx}
              className={`px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm flex items-start gap-2 ${
                place.isLocal ? 'border-l-4 border-blue-500 bg-blue-50/30' : ''
              }`}
              onClick={(e) => { e.stopPropagation(); selectSuggestion(place); }}
            >
              {place.isLocal ? (
                <Building2 size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
              ) : (
                <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-1">
                  <span className="font-medium">{place.title || place.address.split(',')[0]}</span>
                  {place.isLocal && (
                    <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <Sparkles size={10} />
                      StudyDen
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 truncate">{place.address}</div>
              </div>
            </li>
          ))}
        </ul>,
        document.body
      )}
>>>>>>> Stashed changes
    </div>
  );
}