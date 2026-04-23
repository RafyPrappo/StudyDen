import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Container from "../components/ui/Container";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import {
  Star, MapPin, Search, Users, CheckCircle,
  Calendar, ArrowRight, Sparkles, Shield
} from "lucide-react";

function useScrollReveal(threshold = 0.1) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold }
    );
    observer.observe(node);
    return () => observer.unobserve(node);
  }, [threshold]);
  return [ref, visible];
}

function CountUp({ value, suffix = "" }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const increment = value / 40;
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display.toLocaleString()}{suffix}</>;
}

function SignBoard({ title, subtitle }) {
  return (
    <div className="flex flex-col items-center mb-12">
      <div className="relative bg-white border-2 border-blue-200 rounded-xl px-8 py-3 shadow-md">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-800">{title}</h2>
        {subtitle && <p className="text-sm text-blue-600 mt-1">{subtitle}</p>}
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-blue-200" />
      </div>
    </div>
  );
}

function FeaturedSpotCard({ spot }) {
  return (
    <Link to={`/spots/${spot._id}`}>
      <div className="bg-white border border-gray-100 rounded-2xl p-5 h-full shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1">
        <div className="flex items-center gap-1 text-amber-500 mb-2">
          <Star size={14} fill="currentColor" />
          <span className="font-semibold text-gray-800">{spot.averageRating || 0}</span>
          <span className="text-xs text-gray-400">({spot.totalReviews})</span>
        </div>
        <h3 className="font-semibold text-gray-800 line-clamp-1">{spot.title}</h3>
        <div className="mt-2 flex items-start gap-1 text-sm text-gray-500">
          <MapPin size={14} className="mt-0.5 flex-shrink-0 text-gray-400" />
          <span className="line-clamp-2">{spot.address}</span>
        </div>
      </div>
    </Link>
  );
}

function TrendingEventCard({ event }) {
  const d = new Date(event.date);
  const formatted = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return (
    <Link to={`/events/${event._id}`}>
      <div className="bg-white border border-gray-100 rounded-2xl p-4 w-72 flex-shrink-0 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-[1.02]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{event.topic}</span>
          <span className="text-xs text-gray-400">{formatted}</span>
        </div>
        <h4 className="font-semibold text-gray-800 line-clamp-1">{event.title}</h4>
        <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
          <MapPin size={12} />
          <span className="line-clamp-1">{event.location}</span>
        </div>
        <div className="flex items-center gap-1 mt-2 text-xs text-blue-600">
          <Users size={12} />
          <span>{event.attendeesCount} / {event.maxAttendees}</span>
        </div>
      </div>
    </Link>
  );
}

function Step({ icon: Icon, title, desc }) {
  return (
    <div className="flex gap-4 items-start p-5 bg-white border border-gray-100 rounded-2xl shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 h-full">
      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon size={20} />
      </div>
      <div>
        <h4 className="font-semibold text-gray-800 mb-1">{title}</h4>
        <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalSpots: 0, upcomingEvents: 0, totalUsers: 0 });
  const [featured, setFeatured] = useState([]);
  const [trending, setTrending] = useState([]);
  const [community, setCommunity] = useState({ totalCheckIns: 0, totalReviews: 0 });

  useEffect(() => {
    Promise.all([
      fetch("/api/home/stats").then(r => r.json()),
      fetch("/api/home/featured").then(r => r.json()),
      fetch("/api/home/trending").then(r => r.json()),
      fetch("/api/home/community").then(r => r.json())
    ]).then(([s, f, t, c]) => {
      setStats(s);
      setFeatured(f.spots || []);
      setTrending(t.events || []);
      setCommunity(c);
    }).catch(console.error);
  }, []);

  const [heroRef, heroVisible] = useScrollReveal(0.1);
  const [howRef, howVisible] = useScrollReveal(0.1);
  const [trendRef, trendVisible] = useScrollReveal(0.1);
  const [commRef, commVisible] = useScrollReveal(0.1);
  const [ctaRef, ctaVisible] = useScrollReveal(0.1);

  const spotsTo = user ? "/spots" : "/login";
  const eventsTo = user ? "/events" : "/login";

  return (
    <div className="bg-[#f8fafc] overflow-x-hidden">
      {/* ==================== HERO ==================== */}
      <section className="relative min-h-[85vh] flex items-center bg-gradient-to-b from-blue-50/40 to-white border-b border-gray-200">
        <Container>
          <div
            ref={heroRef}
            className={`grid lg:grid-cols-2 gap-12 items-center py-16 transition-all duration-700 ${
              heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            {/* Left text */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-1.5 text-sm text-gray-600 shadow-sm">
                <Sparkles size={14} className="text-blue-500" />
                The smarter way to study
              </div>
              <h1 className="text-5xl lg:text-6xl font-extrabold text-gray-900 leading-[1.15]">
                {user ? `Welcome back, ${user.name.split(" ")[0]}!` : "Discover your perfect study spot."}
              </h1>
              <p className="text-lg text-gray-600 max-w-xl">
                Join live study sessions, earn points and badges, and find the best spots in town.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to={spotsTo}><Button>Explore Spots <ArrowRight size={18} /></Button></Link>
                <Link to={eventsTo}><Button variant="ghost">Join Events</Button></Link>
              </div>
              <div className="grid grid-cols-3 gap-8 pt-4">
                <div className="text-center"><div className="text-2xl font-bold text-gray-900"><CountUp value={stats.totalSpots} /></div><div className="text-sm text-gray-500">Study Spots</div></div>
                <div className="text-center"><div className="text-2xl font-bold text-gray-900"><CountUp value={stats.upcomingEvents} /></div><div className="text-sm text-gray-500">Sessions</div></div>
                <div className="text-center"><div className="text-2xl font-bold text-gray-900"><CountUp value={stats.totalUsers} /></div><div className="text-sm text-gray-500">Members</div></div>
              </div>
            </div>
            {/* Right: Featured spots */}
            <div className="lg:sticky lg:top-28">
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
                <div className="flex items-center gap-2 mb-5">
                  <Star size={20} className="text-amber-500" fill="currentColor" />
                  <h3 className="font-bold text-gray-800">Top Rated Spots</h3>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {featured.length > 0 ? featured.map(spot => <FeaturedSpotCard key={spot._id} spot={spot} />) : <div className="col-span-2 text-center text-gray-400 py-8">Loading...</div>}
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ==================== HOW IT WORKS ==================== */}
      <section ref={howRef} className="py-16 bg-white border-t border-gray-200">
        <SignBoard title="How it works" subtitle="Three simple steps" />
        <Container>
          <div className="grid gap-6 md:grid-cols-3 items-stretch">
            <div className={`transition-all duration-700 delay-100 ${howVisible ? "translate-x-0 opacity-100" : "-translate-x-12 opacity-0"}`}>
              <Step icon={Search} title="Discover spots" desc="Filter by amenities, noise level, and ratings." />
            </div>
            <div className={`transition-all duration-700 delay-250 ${howVisible ? "translate-x-0 opacity-100" : "translate-x-12 opacity-0"}`}>
              <Step icon={Users} title="Join sessions" desc="Create or join live study events." />
            </div>
            <div className={`transition-all duration-700 delay-400 ${howVisible ? "translate-x-0 opacity-100" : "translate-x-12 opacity-0"}`}>
              <Step icon={Shield} title="Earn rewards" desc="Check in, complete sessions, collect points." />
            </div>
          </div>
        </Container>
      </section>

      {/* ==================== TRENDING EVENTS ==================== */}
      <section ref={trendRef} className="py-16 bg-[#f8fafc] border-t border-gray-200">
        <SignBoard title="Trending Events" subtitle="Popular upcoming sessions" />
        <Container>
          <div className={`transition-all duration-700 ${trendVisible ? "translate-x-0 opacity-100" : "-translate-x-12 opacity-0"}`}>
            <div className="flex gap-5 overflow-x-auto pb-6 scrollbar-hide">
              {trending.length > 0 ? trending.map(event => <TrendingEventCard key={event._id} event={event} />) : <div className="text-gray-400 py-12 text-center w-full">No upcoming events.</div>}
            </div>
          </div>
        </Container>
      </section>

      {/* ==================== COMMUNITY STATS ==================== */}
      <section ref={commRef} className="py-16 bg-white border-t border-gray-200">
        <SignBoard title="Community Stats" subtitle="Our growing family" />
        <Container>
          <div className={`transition-all duration-700 ${commVisible ? "translate-x-0 opacity-100" : "translate-x-12 opacity-0"}`}>
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-8 sm:p-10">
              <div className="grid gap-6 sm:grid-cols-3 text-center">
                <div><div className="text-3xl font-bold text-blue-600"><CountUp value={community.totalCheckIns} suffix="+" /></div><p className="text-gray-600 mt-2 font-medium">Total Check‑Ins</p></div>
                <div><div className="text-3xl font-bold text-blue-600"><CountUp value={community.totalReviews} suffix="+" /></div><p className="text-gray-600 mt-2 font-medium">Reviews Written</p></div>
                <div><div className="text-3xl font-bold text-blue-600"><CountUp value={stats.totalSpots} suffix="+" /></div><p className="text-gray-600 mt-2 font-medium">Spots Discovered</p></div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ==================== FINAL CTA ==================== */}
      <section ref={ctaRef} className="py-16 bg-[#f8fafc] border-t border-gray-200">
        <SignBoard title="Ready to explore?" subtitle="Your next spot awaits" />
        <Container>
          <div className={`transition-all duration-700 ${ctaVisible ? "opacity-100" : "opacity-0"}`}>
            <div className="text-center bg-white border border-gray-100 rounded-2xl shadow-sm p-8 sm:p-10">
              {user ? (
                <>
                  <h3 className="text-2xl font-bold text-gray-900">Ready for your next session?</h3>
                  <p className="text-gray-500 mt-2 max-w-md mx-auto">Explore new spots or create an event to study together.</p>
                  <div className="flex justify-center gap-4 mt-6">
                    <Link to="/spots"><Button>Browse Spots</Button></Link>
                    <Link to="/events"><Button variant="ghost">View Events</Button></Link>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-2xl font-bold text-gray-900">Start studying smarter today</h3>
                  <p className="text-gray-500 mt-2 max-w-md mx-auto">Join the community, earn points, and find the perfect place to focus.</p>
                  <div className="flex justify-center gap-4 mt-6">
                    <Link to="/register"><Button>Get Started</Button></Link>
                    <Link to="/login"><Button variant="ghost">I already have an account</Button></Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}