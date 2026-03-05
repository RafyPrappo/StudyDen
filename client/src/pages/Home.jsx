import { Link } from "react-router-dom";
import Container from "../components/ui/Container";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white/70 px-4 py-3">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-black/60">{label}</div>
    </div>
  );
}

function PlaceholderBlock({ title, desc }) {
  return (
    <Card className="p-4">
      <div className="text-sm font-semibold text-black">{title}</div>
      <p className="mt-1 text-xs text-black/60">{desc}</p>
      <div className="mt-3 h-2 w-24 rounded-full bg-black/10" />
      <div className="mt-2 h-2 w-40 rounded-full bg-black/10" />
    </Card>
  );
}

export default function Home() {
  const { user } = useAuth();

  // Buttons should gate like navbar:
  const spotsTo = user ? "/spots" : "/login";
  const eventsTo = user ? "/events" : "/login";
  const spotsState = user ? undefined : { from: "/spots" };
  const eventsState = user ? undefined : { from: "/events" };

  // -------------------------
  // LOGGED IN VIEW (placeholders)
  // -------------------------
  if (user) {
    return (
      <div className="py-10">
        <Container>
          {/* HERO */}
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-1 text-xs text-black/70">
                <span className="h-2 w-2 rounded-full bg-yellow-400 shadow-[0_0_18px_rgba(251,191,36,.7)]" />
                Student-friendly study spots • sessions • streaks
              </div>

              <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl text-black">
                Welcome Back{" "}
                <span className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl text-black">
                  {user?.name || "Student"}
                </span>{" "}
                !
              </h1>

              <p className="max-w-xl text-black/70">
                Discover study spots, join sessions, check in with friends, and
                climb the leaderboard — all in one place.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link to={spotsTo} state={spotsState}>
                  <Button className="group">Explore Spots →</Button>
                </Link>
                <Link to={eventsTo} state={eventsState}>
                  <Button variant="ghost">Join Events</Button>
                </Link>
              </div>

              <div className="grid max-w-xl grid-cols-3 gap-3 pt-3">
                <Stat label="Nearby spots" value="250+" />
                <Stat label="Weekly sessions" value="40+" />
                <Stat label="Streak rewards" value="🔥" />
              </div>
            </div>

            {/* RIGHT PANEL (placeholders for team decisions later) */}
            <Card className="p-5 sm:p-6">
              <div className="text-sm font-semibold text-black">Homepage Modules (Placeholder)</div>
              <p className="mt-1 text-xs text-black/60">
                This section will be finalized by the team when core features are ready.
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <PlaceholderBlock
                  title="Feature Card A"
                  desc="Placeholder — will be replaced with real feature content."
                />
                <PlaceholderBlock
                  title="Feature Card B"
                  desc="Placeholder — will be replaced with real feature content."
                />
                <PlaceholderBlock
                  title="Feature Card C"
                  desc="Placeholder — will be replaced with real feature content."
                />
                <PlaceholderBlock
                  title="Feature Card D"
                  desc="Placeholder — will be replaced with real feature content."
                />
              </div>

              <div className="mt-5 rounded-2xl border border-black/10 bg-white/70 p-4">
                <div className="text-sm font-semibold text-black">Quick Start (Placeholder)</div>
                <p className="mt-1 text-xs text-black/60">
                  Steps will be updated after Spots / Events / Check-ins are implemented.
                </p>
              </div>
            </Card>
          </div>

          {/* FOOTER CTA (placeholder) */}
          <div className="mt-10">
            <Card className="p-5 sm:p-6">
              <div className="text-sm font-semibold text-black">CTA Section (Placeholder)</div>
              <p className="mt-1 text-xs text-black/60">
                Team will decide the final call-to-action and content once features are implemented.
              </p>
            </Card>
          </div>
        </Container>
      </div>
    );
  }

  // -------------------------
  // LOGGED OUT VIEW (original homepage)
  // Only the two buttons are gated to /login via spotsTo/eventsTo
  // -------------------------
  return (
    <div className="py-10">
      <Container>
        {/* HERO */}
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-1 text-xs text-black/70">
              <span className="h-2 w-2 rounded-full bg-yellow-400 shadow-[0_0_18px_rgba(251,191,36,.7)]" />
              Student-friendly study spots • sessions • streaks
            </div>

            <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl text-black">
              Find your perfect{" "}
              <span className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl text-black">
                StudyDen
              </span>
              .
            </h1>
            <p className="max-w-xl text-black/70">
              Discover study spots, join sessions, check in with friends, and
              climb the leaderboard — all in one place.
            </p>

            {/* Only change: these two buttons are gated to /login when logged out */}
            <div className="flex flex-wrap gap-3">
              <Link to={spotsTo} state={spotsState}>
                <Button className="group">Explore Spots →</Button>
              </Link>
              <Link to={eventsTo} state={eventsState}>
                <Button variant="ghost">Join Events</Button>
              </Link>
            </div>

            <div className="grid max-w-xl grid-cols-3 gap-3 pt-3">
              <Stat label="Nearby spots" value="250+" />
              <Stat label="Weekly sessions" value="40+" />
              <Stat label="Streak rewards" value="🔥" />
            </div>
          </div>

          {/* RIGHT PANEL (original) */}
          <Card className="p-5 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="p-4 anim-float">
                <div className="text-sm font-semibold text-black">Smart Spot Finder</div>
                <p className="mt-1 text-xs text-black/60">
                  Filter by noise, wifi, plugs, and crowd level.
                </p>
              </Card>

              <Card className="p-4">
                <div className="text-sm font-semibold text-black">Check-ins &amp; Streaks</div>
                <p className="mt-1 text-xs text-black/60">
                  Build consistency and earn points.
                </p>
              </Card>

              <Card className="p-4">
                <div className="text-sm font-semibold text-black">Study Sessions</div>
                <p className="mt-1 text-xs text-black/60">
                  Create events and invite friends fast.
                </p>
              </Card>

              <Card className="p-4">
                <div className="text-sm font-semibold text-black">Leaderboard</div>
                <p className="mt-1 text-xs text-black/60">
                  Compete with friends in a healthy way.
                </p>
              </Card>
            </div>

            <div className="mt-5 rounded-2xl border border-black/10 bg-white/70 p-4">
              <div className="text-sm font-semibold text-black">Quick Start</div>
              <ol className="mt-2 space-y-1 text-xs text-black/60">
                <li>1) Pick a spot</li>
                <li>2) Join a session</li>
                <li>3) Check in &amp; keep your streak</li>
              </ol>
            </div>
          </Card>
        </div>

        {/* FOOTER CTA (original) */}
        <div className="mt-10">
          <Card className="p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-lg font-bold text-black">
                  Ready to start studying smarter?
                </div>
                <div className="text-sm text-black/60">
                  Create an account to save spots, track streaks, and join events.
                </div>
              </div>

              <div className="flex gap-3">
                <Link to="/register">
                  <Button>Get Started</Button>
                </Link>
                <Link to="/login">
                  <Button variant="ghost">I already have an account</Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </Container>
    </div>
  );
}