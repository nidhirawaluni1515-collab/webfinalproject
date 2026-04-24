import { Search, X, MapPin, Loader2 } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { searchCities, type City } from "@/lib/geo-api";
import { useNavigate } from "react-router-dom";
import { locations } from "@/data/locations";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  const [focused, setFocused] = useState(false);
  const [apiResults, setApiResults] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Static local matches (always instant)
  const localMatches = value.length > 0
    ? locations.filter(
        (l) =>
          l.city.toLowerCase().includes(value.toLowerCase()) ||
          l.country.toLowerCase().includes(value.toLowerCase())
      )
    : [];

  // Debounced geo API search
  const doSearch = useCallback((q: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (q.trim().length < 2) { setApiResults([]); setLoading(false); return; }
    setLoading(true);
    timerRef.current = setTimeout(async () => {
      const cities = await searchCities(q);
      // Filter out cities already in local data
      const localIds = new Set(locations.map((l) => l.city.toLowerCase()));
      setApiResults(cities.filter((c) => !localIds.has(c.name.toLowerCase())));
      setLoading(false);
    }, 300);
  }, []);

  useEffect(() => { doSearch(value); }, [value, doSearch]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setFocused(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const hasSuggestions = localMatches.length > 0 || apiResults.length > 0;

  // Get country flag emoji from country code
  const getFlagEmoji = (countryCode: string) => {
    if (!countryCode || countryCode.length !== 2) return "🌍";
    return countryCode.toUpperCase().replace(/./g, (char) =>
      String.fromCodePoint(127397 + char.charCodeAt(0))
    );
  };

  return (
    <div ref={ref} className="relative w-full max-w-md mx-auto">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search any city worldwide..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          className="w-full rounded-full border border-border bg-card pl-10 pr-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
        />
        {loading && (
          <Loader2 className="absolute right-8 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground" />
        )}
        {value && (
          <button onClick={() => { onChange(""); setApiResults([]); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {focused && hasSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-border bg-card shadow-lg z-50 overflow-hidden">
          {/* Local (rich) results */}
          {localMatches.map((l) => (
            <button
              key={l.id}
              onClick={() => { navigate(`/location/${l.id}`); setFocused(false); onChange(""); }}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-muted transition-colors text-left"
            >
              <img src={l.image} alt="" className="h-8 w-8 rounded-md object-cover flex-shrink-0" />
              <div className="min-w-0">
                <span className="font-medium text-foreground">{l.city}</span>
                <span className="text-muted-foreground">, {l.country}</span>
              </div>
              <span className="ml-auto text-[10px] bg-primary/10 text-primary rounded-full px-1.5 py-0.5 flex-shrink-0">Featured</span>
            </button>
          ))}

          {/* Divider if both sets have results */}
          {localMatches.length > 0 && apiResults.length > 0 && (
            <div className="border-t border-border px-4 py-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">More cities</p>
            </div>
          )}

          {/* API results */}
          {apiResults.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                // Navigate to a dynamic geo city page
                navigate(`/city/${encodeURIComponent(c.name)}?country=${encodeURIComponent(c.country)}&lat=${c.latitude}&lng=${c.longitude}&cc=${c.countryCode}`);
                setFocused(false);
                onChange("");
              }}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-muted transition-colors text-left"
            >
              <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center text-lg flex-shrink-0">
                {getFlagEmoji(c.countryCode)}
              </div>
              <div className="min-w-0">
                <span className="font-medium text-foreground">{c.name}</span>
                {c.admin1 && <span className="text-muted-foreground">, {c.admin1}</span>}
                <span className="text-muted-foreground">, {c.country}</span>
              </div>
              <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 ml-auto" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
