import { useParams, useSearchParams, Link } from "react-router-dom";
import { ArrowLeft, Compass, MapPin, Globe, Loader2, ExternalLink, Map } from "lucide-react";
import { useEffect, useState } from "react";
import { searchCities, type City } from "@/lib/geo-api";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-user-data";

// Get flag emoji from ISO country code
function flagEmoji(code: string) {
  if (!code || code.length !== 2) return "🌍";
  return code.toUpperCase().replace(/./g, (char) =>
    String.fromCodePoint(127397 + char.charCodeAt(0))
  );
}

export default function GeoCity() {
  const { cityName } = useParams<{ cityName: string }>();
  const [searchParams] = useSearchParams();
  const country = searchParams.get("country") ?? "";
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const cc = searchParams.get("cc") ?? "";
  const { user } = useCurrentUser();

  const [cityData, setCityData] = useState<City | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cityName) return;
    // If we already have coords from the URL, no need to re-search
    if (lat && lng) {
      setCityData({
        id: 0,
        name: decodeURIComponent(cityName),
        country,
        countryCode: cc,
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
      });
      setLoading(false);
      return;
    }
    // Otherwise search for it
    searchCities(decodeURIComponent(cityName)).then((results) => {
      const match = results.find(
        (r) => r.name.toLowerCase() === decodeURIComponent(cityName).toLowerCase()
      ) ?? results[0];
      if (match) setCityData(match);
      setLoading(false);
    });
  }, [cityName, lat, lng, country, cc]);

  const decodedName = decodeURIComponent(cityName ?? "");
  const flag = flagEmoji((cc || cityData?.countryCode) ?? "");

  const mapUrl = cityData
    ? `https://www.openstreetmap.org/?mlat=${cityData.latitude}&mlon=${cityData.longitude}#map=12/${cityData.latitude}/${cityData.longitude}`
    : null;

  const unsplashUrl = `https://source.unsplash.com/featured/1200x600/?${encodeURIComponent(decodedName + " city")}`;

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-20 bg-card border-b border-border px-4 py-3">
        <div className="container mx-auto max-w-4xl flex items-center gap-4">
          <Link to="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{flag}</span>
            <div>
              <h1 className="text-lg font-bold text-foreground leading-tight">{decodedName}</h1>
              <p className="text-sm text-primary">{country}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Hero with Unsplash image */}
      <div className="relative h-56 md:h-72 bg-muted overflow-hidden">
        <img
          src={unsplashUrl}
          alt={decodedName}
          className="h-full w-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/30 to-transparent" />
        <div className="absolute bottom-6 left-6 right-6">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-card mb-1">{decodedName}</h2>
          <p className="text-card/90 text-sm">{flag} {country}</p>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 py-8 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Info card */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <h3 className="font-semibold text-foreground">Location Info</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">City</p>
                  <p className="font-semibold text-foreground">{decodedName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Country</p>
                  <p className="font-semibold text-foreground">{flag} {country}</p>
                </div>
                {cityData && (
                  <div>
                    <p className="text-xs text-muted-foreground">Coordinates</p>
                    <p className="font-semibold text-foreground text-sm">{cityData.latitude.toFixed(3)}, {cityData.longitude.toFixed(3)}</p>
                  </div>
                )}
                {cityData?.admin1 && (
                  <div>
                    <p className="text-xs text-muted-foreground">Region</p>
                    <p className="font-semibold text-foreground">{cityData.admin1}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Map link */}
            {mapUrl && (
              <div className="rounded-xl border border-border bg-card p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Map className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">View on Map</p>
                    <p className="text-xs text-muted-foreground">OpenStreetMap · {cityData?.latitude.toFixed(2)}, {cityData?.longitude.toFixed(2)}</p>
                  </div>
                </div>
                <a href={mapUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <ExternalLink className="h-3.5 w-3.5" /> Open Map
                  </Button>
                </a>
              </div>
            )}

            {/* CTA to add to trip */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 text-center space-y-2">
              <p className="font-semibold text-foreground">Want to visit {decodedName}?</p>
              <p className="text-sm text-muted-foreground">Add it to a trip and plan your adventure with fellow travelers.</p>
              <Link to="/trips">
                <Button size="sm" className="gap-1.5 mt-2">
                  <MapPin className="h-3.5 w-3.5" /> Plan a Trip
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
