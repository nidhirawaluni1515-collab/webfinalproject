import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Compass, ArrowLeft, Heart, Plane, MapPin, Users,
  Sparkles, Search, SlidersHorizontal, X, MessageCircle,
  Star, Globe, ChevronRight,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { locations } from "@/data/locations";
import { getAllUsers, useCurrentUser } from "@/hooks/use-user-data";
import { useMatches, type MatchResult } from "@/hooks/use-matches";
import { TRAVEL_STYLES } from "@/hooks/use-trips";

// Match strength label + colour
function matchBadge(score: number): { label: string; color: string } {
  if (score >= 70) return { label: "🔥 Great match", color: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800" };
  if (score >= 40) return { label: "✨ Good match", color: "bg-primary/10 text-primary border-primary/20" };
  return { label: "🌍 Similar vibes", color: "bg-muted text-muted-foreground border-border" };
}

// Score ring
function ScoreRing({ score }: { score: number }) {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const color = score >= 70 ? "#f97316" : score >= 40 ? "hsl(var(--primary))" : "#94a3b8";
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" className="flex-shrink-0">
      <circle cx="24" cy="24" r={r} fill="none" stroke="currentColor" strokeWidth="3" className="text-muted/30" />
      <circle
        cx="24" cy="24" r={r} fill="none" stroke={color} strokeWidth="3"
        strokeDasharray={`${filled} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 24 24)"
        style={{ transition: "stroke-dasharray 0.6s ease" }}
      />
      <text x="24" y="28" textAnchor="middle" fontSize="11" fontWeight="700" fill={color}>{score}</text>
    </svg>
  );
}

export default function Connect() {
  const allUsers = getAllUsers();
  const { user: me } = useCurrentUser();
  const navigate = useNavigate();
  const matches = useMatches(me, allUsers);

  const [activeTab, setActiveTab] = useState<"matches" | "all">(me ? "matches" : "all");
  const [search, setSearch] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterStyle, setFilterStyle] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Build a map of userId → match score for sorting the All tab
  const matchScoreMap = useMemo(() => {
    const map = new Map<string, MatchResult>();
    matches.forEach((m) => map.set(m.userId, m));
    return map;
  }, [matches]);

  // All users list: matched users first (sorted by score), then others
  const sortedAll = useMemo(() => {
    return [...allUsers]
      .filter((u) => u.id !== me?.id)
      .sort((a, b) => {
        const sa = matchScoreMap.get(a.id)?.score ?? 0;
        const sb = matchScoreMap.get(b.id)?.score ?? 0;
        return sb - sa;
      });
  }, [allUsers, me, matchScoreMap]);

  // Filter logic
  const filterUser = (userId: string) => {
    const u = allUsers.find((x) => x.id === userId);
    if (!u) return false;
    if (search && !u.username.toLowerCase().includes(search.toLowerCase()) && !u.bio?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCity && !u.favoriteLocations.includes(filterCity) && !u.visitedLocations.includes(filterCity)) return false;
    if (filterStyle) {
      const bio = u.bio?.toLowerCase() ?? "";
      const styleKeywords: Record<string, string[]> = {
        adventure: ["adventure", "hike", "mountain", "trek"],
        foodie: ["food", "eat", "cuisine", "restaurant"],
        photography: ["photo", "camera", "photographer"],
        backpacker: ["backpack", "budget", "hostel"],
        culture: ["culture", "museum", "history"],
        nature: ["nature", "wildlife", "beach"],
        nightlife: ["nightlife", "party", "club"],
        luxury: ["luxury", "resort", "spa"],
        "digital-nomad": ["nomad", "remote", "freelance"],
        solo: ["solo", "alone", "independent"],
      };
      const kws = styleKeywords[filterStyle] ?? [];
      if (!kws.some((k) => bio.includes(k))) return false;
    }
    return true;
  };

  const filteredMatches = matches.filter((m) => filterUser(m.userId));
  const filteredAll = sortedAll.filter((u) => filterUser(u.id));

  const hasFilters = search || filterCity || filterStyle;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
            <div className="flex items-center gap-2">
              <Compass className="h-6 w-6 text-primary" />
              <span className="font-display text-xl font-bold text-foreground">AtlasHub</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="h-4 w-4" /> {allUsers.length} travelers
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 pt-10 pb-6 text-center">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">Connect with Travelers</h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          {me
            ? "Discover your travel matches and fellow explorers from around the world."
            : "Browse fellow explorers, their favorite destinations, and hidden gems."}
        </p>
      </section>

      <main className="container mx-auto px-4 pb-20 max-w-3xl">

        {/* Search + Filter bar */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search travelers…"
              className="pl-9 rounded-full"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full border text-sm transition-colors ${
              hasFilters ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary hover:text-primary"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {(filterCity || filterStyle) ? "Filtered" : "Filter"}
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="mb-5 rounded-xl border border-border bg-card p-4 space-y-3">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Filter by city</p>
              <div className="flex flex-wrap gap-1.5">
                {locations.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setFilterCity(filterCity === l.id ? "" : l.id)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      filterCity === l.id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary"
                    }`}
                  >
                    {l.flag} {l.city}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Filter by travel style</p>
              <div className="flex flex-wrap gap-1.5">
                {TRAVEL_STYLES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setFilterStyle(filterStyle === s.id ? "" : s.id)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      filterStyle === s.id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            {hasFilters && (
              <button onClick={() => { setSearch(""); setFilterCity(""); setFilterStyle(""); }} className="text-xs text-destructive hover:underline">
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-muted rounded-lg p-1 w-fit">
          {me && (
            <button
              onClick={() => setActiveTab("matches")}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === "matches" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Matches
              {matches.length > 0 && (
                <span className="bg-primary text-primary-foreground text-[10px] rounded-full px-1.5 py-0.5 leading-none">{matches.length}</span>
              )}
            </button>
          )}
          <button
            onClick={() => setActiveTab("all")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === "all" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Globe className="h-3.5 w-3.5" /> All Travelers
          </button>
        </div>

        {/* MATCHES TAB */}
        {activeTab === "matches" && me && (
          <div className="space-y-4">
            {filteredMatches.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-12 text-center">
                <Sparkles className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-semibold text-foreground mb-1">No matches yet</p>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  {hasFilters
                    ? "No matches found with these filters."
                    : "Add favorite cities and visited places to your profile to start matching with fellow travelers!"}
                </p>
                {!hasFilters && (
                  <Link to="/profile">
                    <Button size="sm" className="mt-4">Update my profile</Button>
                  </Link>
                )}
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">
                  {filteredMatches.length} traveler{filteredMatches.length !== 1 ? "s" : ""} matched based on your destinations & interests
                </p>
                {filteredMatches.map((match) => {
                  const u = allUsers.find((x) => x.id === match.userId);
                  if (!u) return null;
                  const favLocs = locations.filter((l) => u.favoriteLocations.includes(l.id));
                  const visitedLocs = locations.filter((l) => u.visitedLocations.includes(l.id));
                  const sharedFavLocs = locations.filter((l) => match.sharedFavorites.includes(l.id));
                  const sharedVisLocs = locations.filter((l) => match.sharedVisited.includes(l.id));
                  const badge = matchBadge(match.score);
                  const initials = u.username.slice(0, 2).toUpperCase();

                  return (
                    <div
                      key={u.id}
                      className="rounded-xl border border-border bg-card hover:shadow-md transition-shadow overflow-hidden"
                    >
                      {/* Top accent bar based on score */}
                      <div
                        className="h-1 w-full"
                        style={{
                          background: match.score >= 70
                            ? "linear-gradient(90deg, #f97316, #fbbf24)"
                            : match.score >= 40
                            ? "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary)/0.4))"
                            : "hsl(var(--muted))",
                        }}
                      />
                      <div className="p-5">
                        <div className="flex items-start gap-4">
                          {/* Score ring */}
                          <ScoreRing score={match.score} />

                          {/* Avatar + info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 flex-wrap">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h2 className="font-bold text-foreground">{u.username}</h2>
                                  <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${badge.color}`}>
                                    {badge.label}
                                  </span>
                                </div>
                                {u.bio && <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{u.bio}</p>}
                              </div>
                              <Avatar className="h-10 w-10 flex-shrink-0">
                                <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">{initials}</AvatarFallback>
                              </Avatar>
                            </div>

                            {/* Match reasons */}
                            {match.reasons.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {match.reasons.map((r, i) => (
                                  <span key={i} className="text-[11px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Star className="h-2.5 w-2.5 text-primary" /> {r}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Shared favorites */}
                            {sharedFavLocs.length > 0 && (
                              <div className="mt-3">
                                <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold mb-1">❤️ Shared favorites</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {sharedFavLocs.map((l) => (
                                    <span key={l.id} className="inline-flex items-center gap-1 rounded-full bg-destructive/10 border border-destructive/20 text-destructive px-2.5 py-0.5 text-xs font-medium">
                                      {l.flag} {l.city}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Shared visited */}
                            {sharedVisLocs.length > 0 && (
                              <div className="mt-2">
                                <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold mb-1">✈️ Both visited</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {sharedVisLocs.map((l) => (
                                    <span key={l.id} className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 text-primary px-2.5 py-0.5 text-xs">
                                      <MapPin className="h-2.5 w-2.5" /> {l.city}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Stats row */}
                            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Heart className="h-3 w-3 text-destructive" /> {favLocs.length} favorites
                              </span>
                              <span className="flex items-center gap-1">
                                <Plane className="h-3 w-3 text-primary" /> {visitedLocs.length} visited
                              </span>
                              {u.homeCity && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" /> {u.homeCity}
                                </span>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 mt-4">
                              <Link to={`/user/${u.id}`} className="flex-1">
                                <Button size="sm" variant="outline" className="w-full gap-1.5">
                                  View Profile <ChevronRight className="h-3.5 w-3.5" />
                                </Button>
                              </Link>
                              <Link to={`/inbox?chat=${u.id}`} className="flex-1">
                                <Button size="sm" className="w-full gap-1.5">
                                  <MessageCircle className="h-3.5 w-3.5" /> Message
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}

        {/* ALL TRAVELERS TAB */}
        {activeTab === "all" && (
          <div className="space-y-4">
            {!me && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center gap-3 mb-2">
                <Sparkles className="h-5 w-5 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">See your travel matches</p>
                  <p className="text-xs text-muted-foreground">Sign in to discover travelers who share your favorite destinations.</p>
                </div>
                <Link to="/auth">
                  <Button size="sm">Sign in</Button>
                </Link>
              </div>
            )}

            {filteredAll.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-12 text-center">
                <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">No travelers found{hasFilters ? " with these filters." : "."}</p>
              </div>
            ) : (
              <>
                {me && (
                  <p className="text-xs text-muted-foreground">Matched profiles appear first</p>
                )}
                {filteredAll.map((u) => {
                  const favLocs = locations.filter((l) => u.favoriteLocations.includes(l.id));
                  const visitedLocs = locations.filter((l) => u.visitedLocations.includes(l.id));
                  const initials = u.username.slice(0, 2).toUpperCase();
                  const match = matchScoreMap.get(u.id);

                  return (
                    <Link
                      key={u.id}
                      to={`/user/${u.id}`}
                      className="block rounded-xl border border-border bg-card p-5 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-primary/10 text-primary font-bold">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="font-bold text-foreground">{u.username}</h2>
                            {match && match.score > 0 && (
                              <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${matchBadge(match.score).color}`}>
                                {matchBadge(match.score).label} · {match.score}%
                              </span>
                            )}
                          </div>
                          {u.bio && <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{u.bio}</p>}

                          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Heart className="h-3 w-3 text-destructive" /> {favLocs.length} favorites
                            </span>
                            <span className="flex items-center gap-1">
                              <Plane className="h-3 w-3 text-primary" /> {visitedLocs.length} visited
                            </span>
                          </div>

                          {favLocs.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {favLocs.map((l) => (
                                <span key={l.id} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                                  {l.flag} {l.city}
                                </span>
                              ))}
                            </div>
                          )}

                          {visitedLocs.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {visitedLocs.map((l) => (
                                <span key={l.id} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                  <MapPin className="h-2.5 w-2.5" /> {l.city}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Show shared info inline for logged-in users */}
                          {match && match.reasons.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {match.reasons.map((r, i) => (
                                <span key={i} className="text-[11px] text-primary bg-primary/5 px-1.5 py-0.5 rounded-full">{r}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                      </div>
                    </Link>
                  );
                })}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
