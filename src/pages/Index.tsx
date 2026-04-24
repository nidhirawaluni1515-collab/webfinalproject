import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { locations } from "@/data/locations";
import { LocationCard } from "@/components/LocationCard";
import { SearchBar } from "@/components/SearchBar";
import { FloatingChat } from "@/components/FloatingChat";
import { Compass, User, LogOut, Users, MessageCircle, Newspaper, Map, Globe2, Loader2, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMessages } from "@/hooks/use-messages";
import { useCurrentUser } from "@/hooks/use-user-data";
import { clearCurrentUser, getCurrentUser } from "@/lib/session";
import { NotificationBell } from "@/components/NotificationBell";
import { fetchCountries, type Country } from "@/lib/geo-api";

// Get flag emoji from ISO country code
function flagEmoji(code: string) {
  if (!code || code.length !== 2) return "🌍";
  return code.toUpperCase().replace(/./g, (char) =>
    String.fromCodePoint(127397 + char.charCodeAt(0))
  );
}

export default function Index() {
  const [search, setSearch] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [countries, setCountries] = useState<Country[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"featured" | "world">("featured");
  const [regionFilter, setRegionFilter] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useCurrentUser();
  const { totalUnread } = useMessages(user?.id);

  useEffect(() => {
    const sync = () => {
      const u = getCurrentUser();
      setIsLoggedIn(!!u);
      setUsername(u?.username || u?.email?.split("@")[0] || "");
    };
    sync();
    window.addEventListener("atlashub:user-changed", sync);
    return () => window.removeEventListener("atlashub:user-changed", sync);
  }, [user]);

  // Load countries from REST Countries API when world tab is selected
  useEffect(() => {
    if (activeTab === "world" && countries.length === 0) {
      setCountriesLoading(true);
      fetchCountries().then((data) => {
        setCountries(data);
        setCountriesLoading(false);
      });
    }
  }, [activeTab]);

  const handleLogout = () => {
    clearCurrentUser();
    setIsLoggedIn(false);
    setUsername("");
    toast({ title: "Logged out successfully (this tab)" });
  };

  const filtered = locations.filter(
    (l) =>
      l.city.toLowerCase().includes(search.toLowerCase()) ||
      l.country.toLowerCase().includes(search.toLowerCase())
  );

  // Filter world countries
  const regions = [...new Set(countries.map((c) => c.region).filter(Boolean))].sort();
  const filteredCountries = countries.filter((c) => {
    if (regionFilter && c.region !== regionFilter) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Compass className="h-6 w-6 text-primary" />
            <span className="font-display text-xl font-bold text-foreground">AtlasHub</span>
          </div>
          <SearchBar value={search} onChange={setSearch} />
          <div className="flex items-center gap-3">
            <Link to="/feed" className="flex items-center gap-1.5 h-9 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors px-3 text-sm font-medium">
              <Newspaper className="h-4 w-4" /><span className="hidden sm:inline">Feed</span>
            </Link>
            <Link to="/trips" className="flex items-center gap-1.5 h-9 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors px-3 text-sm font-medium">
              <Map className="h-4 w-4" /><span className="hidden sm:inline">Trips</span>
            </Link>
            <Link to="/connect" className="flex items-center gap-1.5 h-9 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors px-3 text-sm font-medium">
              <Users className="h-4 w-4" /><span className="hidden sm:inline">Connect</span>
            </Link>
            <Link to="/inbox" className="relative flex items-center justify-center h-9 w-9 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors" title="Inbox">
              <MessageCircle className="h-4 w-4" />
              {totalUnread > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] rounded-full h-4 min-w-[16px] flex items-center justify-center px-1">{totalUnread}</span>
              )}
            </Link>
            {isLoggedIn ? (
              <div className="flex items-center gap-2">
                <NotificationBell />
                <Link to="/profile" className="flex items-center gap-2 h-9 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors px-3">
                  <User className="h-4 w-4" />
                  <span className="text-sm font-medium hidden sm:inline">{username}</span>
                </Link>
                <button onClick={handleLogout} className="flex items-center justify-center h-9 w-9 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" title="Logout">
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Link to="/auth" className="flex items-center justify-center h-9 w-9 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                <User className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      </header>

      <section className="container mx-auto px-4 pt-12 pb-8 text-center">
        <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-3">Discover the World</h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">Explore cities, cultures, and hidden gems from every corner of the globe.</p>
      </section>

      {/* Tab switcher */}
      <div className="container mx-auto px-4 pb-6">
        <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit mx-auto">
          <button
            onClick={() => setActiveTab("featured")}
            className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "featured" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
             Featured Cities
          </button>
          <button
            onClick={() => setActiveTab("world")}
            className={`flex items-center gap-1.5 px-5 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "world" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Globe2 className="h-3.5 w-3.5" /> All Countries
          </button>
        </div>
      </div>

      <main className="container mx-auto px-4 pb-20">

        {/* FEATURED TAB */}
        {activeTab === "featured" && (
          <>
            {filtered.length === 0 ? (
              <p className="text-center text-muted-foreground py-20">No destinations found for "{search}"</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filtered.map((location) => (
                  <LocationCard key={location.id} location={location} />
                ))}
              </div>
            )}
          </>
        )}

        {/* WORLD TAB */}
        {activeTab === "world" && (
          <div>
            {/* Region filter */}
            {!countriesLoading && countries.length > 0 && (
              <div className="flex gap-2 mb-6 flex-wrap items-center">
                <span className="text-sm text-muted-foreground">Region:</span>
                <button
                  onClick={() => setRegionFilter("")}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${!regionFilter ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary"}`}
                >
                  All
                </button>
                {regions.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRegionFilter(r === regionFilter ? "" : r)}
                    className={`text-xs px-3 py-1 rounded-full border transition-colors ${regionFilter === r ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary"}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}

            {countriesLoading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground text-sm">Loading countries from around the world…</p>
              </div>
            ) : filteredCountries.length === 0 ? (
              <p className="text-center text-muted-foreground py-20">No countries found{search ? ` for "${search}"` : ""}.</p>
            ) : (
              <>
                <p className="text-xs text-muted-foreground mb-4">{filteredCountries.length} countries</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {filteredCountries.map((country) => (
                    <button
                      key={country.code}
                      onClick={() => navigate(`/city/${encodeURIComponent(country.capital ?? country.name)}?country=${encodeURIComponent(country.name)}&cc=${country.code}`)}
                      className="group flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all text-center"
                    >
                      <span className="text-4xl leading-none">{country.flag || flagEmoji(country.code)}</span>
                      <div>
                        <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-tight">{country.name}</p>
                        {country.capital && <p className="text-[11px] text-muted-foreground mt-0.5">{country.capital}</p>}
                        <p className="text-[10px] text-muted-foreground/70 mt-0.5">{country.region}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </main>

    </div>
  );
}
