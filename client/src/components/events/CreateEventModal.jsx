import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import Card from "../ui/Card";
import Button from "../ui/Button";
import { eventApi } from "../../services/event";
import { X, Calendar, MapPin, Users, Tag, FileText, Clock, Loader2 } from "lucide-react";

const TOPICS = ["Design", "Development", "Academic", "Nature", "Other"];

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

  return (
    <div 
      className={`fixed inset-0 flex items-center justify-center p-4 z-50 transition-all duration-300 ease-out ${
        isVisible ? 'bg-black/50 backdrop-blur-sm' : 'bg-black/0 backdrop-blur-0 pointer-events-none'
      }`}
      onClick={handleClose}
    >
      <div 
        className={`transform transition-all duration-500 ease-out ${
          isVisible 
            ? 'opacity-100 scale-100 translate-y-0' 
            : 'opacity-0 scale-75 translate-y-10'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Create new event</h2>
              <button 
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2 animate-shake">
                <span className="w-1 h-6 bg-red-500 rounded-full" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div className="transform transition-all duration-300 delay-100" style={{ transform: isVisible ? 'translateY(0)' : 'translateY(20px)', opacity: isVisible ? 1 : 0 }}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event title
                </label>
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

              {/* Topic */}
              <div className="transform transition-all duration-300 delay-150" style={{ transform: isVisible ? 'translateY(0)' : 'translateY(20px)', opacity: isVisible ? 1 : 0 }}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Topic
                </label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <select
                    required
                    value={formData.topic}
                    onChange={(e) => setFormData({...formData, topic: e.target.value})}
                    style={{ paddingLeft: '2.5rem', paddingRight: '1rem' }}
                    className="w-full h-11 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white transition-all duration-200"
                  >
                    {TOPICS.map(topic => (
                      <option key={topic} value={topic}>{topic}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="transform transition-all duration-300 delay-200" style={{ transform: isVisible ? 'translateY(0)' : 'translateY(20px)', opacity: isVisible ? 1 : 0 }}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-gray-400 text-xs">(optional)</span>
                </label>
                <textarea
                  rows="3"
                  maxLength="500"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="What will you study? Any materials needed?"
                />
              </div>

              {/* Date and time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="transform transition-all duration-300 delay-250" style={{ transform: isVisible ? 'translateY(0)' : 'translateY(20px)', opacity: isVisible ? 1 : 0 }}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
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
                <div className="transform transition-all duration-300 delay-300" style={{ transform: isVisible ? 'translateY(0)' : 'translateY(20px)', opacity: isVisible ? 1 : 0 }}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time
                  </label>
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

              {/* Location */}
              <div className="transform transition-all duration-300 delay-350" style={{ transform: isVisible ? 'translateY(0)' : 'translateY(20px)', opacity: isVisible ? 1 : 0 }}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
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
                <p className="text-xs text-gray-400 mt-1">
                  We'll use OpenStreetMap to get coordinates
                </p>
              </div>

              {/* Max attendees */}
              <div className="transform transition-all duration-300 delay-400" style={{ transform: isVisible ? 'translateY(0)' : 'translateY(20px)', opacity: isVisible ? 1 : 0 }}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum attendees
                </label>
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

              {/* Actions */}
              <div className="flex gap-3 pt-4 transform transition-all duration-300 delay-450" style={{ transform: isVisible ? 'translateY(0)' : 'translateY(20px)', opacity: isVisible ? 1 : 0 }}>
                <Button type="submit" className="flex-1 h-11" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      Creating...
                    </span>
                  ) : (
                    "Create event"
                  )}
                </Button>
                <Button type="button" variant="ghost" className="flex-1 h-11" onClick={handleClose}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </Card>
      </div>

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
    </div>
  );
}