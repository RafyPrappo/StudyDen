import { useState, useEffect } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Container from "../components/ui/Container";
import Button from "../components/ui/Button";
import EventCard from "../components/events/EventCard";
import CreateEventModal from "../components/events/CreateEventModal";
import { eventApi } from "../services/event";
import { Search, Loader2 } from "lucide-react";

const TOPICS = ["All", "Design", "Development", "Academic", "Nature", "Other", "Joined Events"];

export default function EventsPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState("");

  useEffect(() => {
    const event = new CustomEvent('navbar-events-page', { detail: location.pathname === '/events' });
    window.dispatchEvent(event);
  }, [location]);

  useEffect(() => {
    if (searchParams.get("create") === "true" && user) {
      setShowCreateModal(true);
      setSearchParams({});
    }
  }, [searchParams, user]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError("");
      const params = {
        topic: selectedTopic,
        page,
        limit: 9
      };
      if (searchQuery) params.search = searchQuery;
      const data = await eventApi.getEvents(params);
      let filteredEvents = data.events || [];
      if (selectedTopic === "Joined Events" && user) {
        filteredEvents = filteredEvents.filter(e => e.isAttending);
      }
      setEvents(filteredEvents);
      setTotalPages(data.pagination?.pages || 1);
    } catch (err) {
      setError("Failed to load events. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [selectedTopic, page, user]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchEvents();
  };

  const updateEventAttendStatus = (eventId, isAttending) => {
    setEvents(prevEvents =>
      prevEvents.map(ev =>
        ev._id === eventId
          ? { ...ev, isAttending, attendees: isAttending ? [...ev.attendees, user.id] : ev.attendees.filter(id => id !== user.id) }
          : ev
      )
    );
  };

  return (
    <Container>
      <div className="mb-12">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Upcoming events</h1>
          <p className="text-gray-600 mb-8">
            Join workshops, networking sessions and community meetups
          </p>
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '3rem', paddingRight: '1rem' }}
                className="w-full h-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <Button type="submit" className="h-12 px-8">
              Search
            </Button>
          </form>
        </div>
      </div>

      <div className="flex justify-center gap-2 mb-10 overflow-x-auto pb-2 scrollbar-hide">
        {TOPICS.map((topic) => (
          <button
            key={topic}
            onClick={() => {
              setSelectedTopic(topic);
              setPage(1);
            }}
            className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedTopic === topic
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {topic}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-3">
          <span className="w-1 h-8 bg-red-500 rounded-full" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 size={36} className="text-blue-600 animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg mb-2">No events found</p>
          <p className="text-gray-400">Try adjusting your filters or create a new event</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard 
                key={event._id} 
                event={event} 
                onJoinLeave={updateEventAttendStatus}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center gap-3 mt-10">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className={`px-5 py-2 rounded-lg text-sm transition-colors ${
                  page === 1
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                Previous
              </button>
              <span className="px-5 py-2 text-sm text-gray-700">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className={`px-5 py-2 rounded-lg text-sm transition-colors ${
                  page === totalPages
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {showCreateModal && (
        <CreateEventModal 
          onClose={() => setShowCreateModal(false)}
          onEventCreated={() => {
            setShowCreateModal(false);
            fetchEvents();
          }}
        />
      )}
    </Container>
  );
}