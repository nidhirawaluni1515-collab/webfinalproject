import { useEffect, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { searchCities, type City } from "@/lib/geo-api";

interface CitySearchProps {
  value?: string;
  onSelect: (city: City) => void;
  placeholder?: string;
}

export function CitySearch({ value = "", onSelect, placeholder = "Search any city worldwide..." }: CitySearchProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      const cities = await searchCities(query);
      setResults(cities);
      setLoading(false);
      setOpen(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="relative">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
      />
      {loading && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
      )}
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md max-h-64 overflow-y-auto">
          {results.map((c) => (
            <button
              key={c.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(c);
                setQuery(`${c.name}, ${c.country}`);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-secondary flex items-center gap-2"
            >
              <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="flex-1 min-w-0 truncate">
                <span className="font-medium text-foreground">{c.name}</span>
                {c.admin1 && <span className="text-muted-foreground">, {c.admin1}</span>}
                <span className="text-muted-foreground">, {c.country}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
