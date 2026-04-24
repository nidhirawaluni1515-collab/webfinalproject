import { useParams, Link } from "react-router-dom";
import { Compass, ArrowLeft, MapPin, Heart, Plane, Camera, MapPinned, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { locations } from "@/data/locations";
import { getUserById } from "@/hooks/use-user-data";

export default function PublicProfile() {
  const { userId } = useParams();
  const user = userId ? getUserById(userId) : undefined;

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-xl font-bold text-foreground">User not found</p>
          <Link to="/connect" className="text-primary hover:underline text-sm">← Back to Connect</Link>
        </div>
      </div>
    );
  }

  const initials = user.username.slice(0, 2).toUpperCase();
  const favLocs = locations.filter((l) => user.favoriteLocations.includes(l.id));
  const visitedLocs = locations.filter((l) => user.visitedLocations.includes(l.id));

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Link to="/connect" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" /> Connect
            </Link>
            <div className="flex items-center gap-2">
              <Compass className="h-6 w-6 text-primary" />
              <span className="font-display text-xl font-bold text-foreground">AtlasHub</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto max-w-2xl px-4 py-10 space-y-8">
        {/* Profile Header */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-start gap-5">
            <Avatar className="h-16 w-16 text-lg">
              <AvatarFallback className="bg-primary/10 text-primary font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-foreground">{user.username}</h1>
              <p className="text-sm text-muted-foreground mt-1">{user.bio}</p>
              <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Heart className="h-3 w-3 text-destructive" /> {favLocs.length} favorites</span>
                <span className="flex items-center gap-1"><Plane className="h-3 w-3 text-primary" /> {visitedLocs.length} visited</span>
                <span className="flex items-center gap-1"><Camera className="h-3 w-3 text-accent" /> {user.travelPhotos.length} photos</span>
              </div>
              <Link to={`/inbox?chat=${user.id}`}>
                <Button size="sm" variant="outline" className="mt-3 gap-1.5">
                  <MessageCircle className="h-3.5 w-3.5" /> Message
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Visited Countries */}
        {visitedLocs.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
              <Plane className="h-5 w-5 text-primary" /> Countries Visited
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {visitedLocs.map((loc) => (
                <Link key={loc.id} to={`/location/${loc.id}`} className="flex items-center gap-2 rounded-xl border border-border bg-card p-3 hover:shadow-sm transition-shadow">
                  <span className="text-xl">{loc.flag}</span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{loc.city}</p>
                    <p className="text-xs text-muted-foreground">{loc.country}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Favorite Destinations */}
        {favLocs.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
              <Heart className="h-5 w-5 text-destructive" /> Favorite Destinations
            </h2>
            <div className="flex flex-wrap gap-2">
              {favLocs.map((loc) => (
                <Link key={loc.id} to={`/location/${loc.id}`} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm hover:shadow-sm transition-shadow">
                  <span>{loc.flag}</span>
                  <span className="font-medium text-foreground">{loc.city}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Travel Photos */}
        {user.travelPhotos.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
              <Camera className="h-5 w-5 text-accent" /> Travel Photos
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {user.travelPhotos.map((photo) => {
                const loc = locations.find((l) => l.id === photo.locationId);
                return (
                  <div key={photo.id} className="group relative rounded-xl overflow-hidden border border-border">
                    <img src={photo.url} alt={photo.caption} className="w-full h-36 object-cover" />
                    <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/50 transition-colors flex items-end">
                      <div className="p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-xs text-card font-medium">{photo.caption}</p>
                        {loc && <p className="text-xs text-card/70">{loc.flag} {loc.city}</p>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Hidden Gems */}
        {user.hiddenGems.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
              <MapPinned className="h-5 w-5 text-accent" /> Hidden Gems
            </h2>
            <div className="space-y-2">
              {user.hiddenGems.map((gem) => {
                const loc = locations.find((l) => l.id === gem.locationId);
                return (
                  <div key={gem.id} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-start gap-3">
                      <MapPinned className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                      <div>
                        <p className="font-semibold text-foreground">{gem.name}</p>
                        {loc && <p className="text-xs text-muted-foreground">{loc.flag} {loc.city}, {loc.country}</p>}
                        <p className="text-sm text-muted-foreground mt-1">{gem.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
