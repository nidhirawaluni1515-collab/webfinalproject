import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Compass, ArrowLeft, MapPin, LogOut, Edit2, Save, Heart, Plane, Camera, Plus, MapPinned } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { locations } from "@/data/locations";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/use-user-data";
import { clearCurrentUser } from "@/lib/session";
import { NotificationBell } from "@/components/NotificationBell";
import { CitySearch } from "@/components/CitySearch";

export default function Profile() {
  const { user, update, addPhoto, addHiddenGem } = useCurrentUser();
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ username: "", bio: "" });
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [photoForm, setPhotoForm] = useState({ locationId: "", caption: "" });
  const [showGemForm, setShowGemForm] = useState(false);
  const [gemForm, setGemForm] = useState({ locationId: "", name: "", description: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  if (!user) {
    navigate("/auth");
    return null;
  }

  const initials = user.username.slice(0, 2).toUpperCase();
  const favoriteLocations = locations.filter((l) => user.favoriteLocations.includes(l.id));
  const visitedLocations = locations.filter((l) => user.visitedLocations.includes(l.id));

  const handleEdit = () => {
    setEditForm({ username: user.username, bio: user.bio || "" });
    setEditing(true);
  };

  const handleSave = () => {
    update({ username: editForm.username, bio: editForm.bio });
    setEditing(false);
    toast({ title: "Profile updated!" });
  };

  const handleLogout = () => {
    clearCurrentUser();
    toast({ title: "Logged out (this tab)" });
    navigate("/auth");
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !photoForm.locationId) return;
    const url = URL.createObjectURL(file);
    addPhoto({ locationId: photoForm.locationId, url, caption: photoForm.caption });
    setShowPhotoUpload(false);
    setPhotoForm({ locationId: "", caption: "" });
    toast({ title: "📸 Photo uploaded!" });
  };

  const handleAddGem = () => {
    if (!gemForm.locationId || !gemForm.name) return;
    addHiddenGem({ locationId: gemForm.locationId, name: gemForm.name, description: gemForm.description });
    setShowGemForm(false);
    setGemForm({ locationId: "", name: "", description: "" });
    toast({ title: "💎 Hidden gem added!" });
  };

  return (
    <div className="min-h-screen bg-background">
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
          <div className="flex items-center gap-1">
            <NotificationBell />
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground gap-1.5">
              <LogOut className="h-4 w-4" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto max-w-2xl px-4 py-10 space-y-8">
        {/* Profile Card */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-start gap-5">
            <Avatar className="h-16 w-16 text-lg">
              <AvatarFallback className="bg-primary/10 text-primary font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-username" className="text-xs">Username</Label>
                    <Input id="edit-username" value={editForm.username} onChange={(e) => setEditForm((f) => ({ ...f, username: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-bio" className="text-xs">Bio</Label>
                    <Input id="edit-bio" value={editForm.bio} onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value }))} />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSave} className="gap-1.5"><Save className="h-3.5 w-3.5" /> Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-foreground">{user.username}</h1>
                    <button onClick={handleEdit} className="text-muted-foreground hover:text-foreground">
                      <Edit2 className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  {user.bio && <p className="text-sm text-muted-foreground mt-2">{user.bio}</p>}
                  {user.homeCity && (
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {user.homeCity}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Home city — powered by Open-Meteo Geocoding (free, no key) */}
          <div className="mt-5 pt-5 border-t border-border space-y-1.5">
            <Label className="text-xs flex items-center gap-1">
              <MapPin className="h-3 w-3" /> Home city
            </Label>
            <CitySearch
              value={user.homeCity || ""}
              placeholder="Search any city in the world..."
              onSelect={(city) => {
                update({
                  homeCity: `${city.name}, ${city.country}`,
                  homeCountryCode: city.countryCode,
                });
                toast({ title: `📍 Home set to ${city.name}, ${city.country}` });
              }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Favorites", value: favoriteLocations.length, icon: Heart },
            { label: "Visited", value: visitedLocations.length, icon: Plane },
            { label: "Photos", value: user.travelPhotos.length, icon: Camera },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4 text-center">
              <s.icon className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Favorite Destinations */}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
            <Heart className="h-5 w-5 text-destructive" /> Favorite Destinations
          </h2>
          <div className="space-y-2">
            {favoriteLocations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No favorites yet. Like countries from the homepage!</p>
            ) : (
              favoriteLocations.map((loc) => (
                <Link key={loc.id} to={`/location/${loc.id}`} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:shadow-sm transition-shadow">
                  <span className="text-2xl">{loc.flag}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground">{loc.city}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> {loc.country}</p>
                  </div>
                  <img src={loc.image} alt={loc.city} className="h-10 w-10 rounded-lg object-cover" />
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Visited Countries */}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
            <Plane className="h-5 w-5 text-primary" /> Visited Countries
          </h2>
          <div className="space-y-2">
            {visitedLocations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No visited countries yet. Mark countries as visited from the homepage!</p>
            ) : (
              visitedLocations.map((loc) => (
                <Link key={loc.id} to={`/location/${loc.id}`} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:shadow-sm transition-shadow">
                  <span className="text-2xl">{loc.flag}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground">{loc.city}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> {loc.country}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Travel Photos */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Camera className="h-5 w-5 text-accent" /> Travel Photos
            </h2>
            <Button size="sm" variant="outline" onClick={() => setShowPhotoUpload(true)} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Upload
            </Button>
          </div>

          {showPhotoUpload && (
            <div className="rounded-xl border border-border bg-card p-4 mb-4 space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Country</Label>
                <select
                  value={photoForm.locationId}
                  onChange={(e) => setPhotoForm((f) => ({ ...f, locationId: e.target.value }))}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Select a country...</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>{l.flag} {l.city}, {l.country}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Caption</Label>
                <Input value={photoForm.caption} onChange={(e) => setPhotoForm((f) => ({ ...f, caption: e.target.value }))} placeholder="Describe your photo..." />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={!photoForm.locationId} className="gap-1.5">
                  <Camera className="h-3.5 w-3.5" /> Choose Photo
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowPhotoUpload(false)}>Cancel</Button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </div>
          )}

          {user.travelPhotos.length === 0 ? (
            <p className="text-sm text-muted-foreground">No travel photos yet. Upload your favorite moments!</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {user.travelPhotos.map((photo) => {
                const loc = locations.find((l) => l.id === photo.locationId);
                return (
                  <div key={photo.id} className="group relative rounded-xl overflow-hidden border border-border">
                    <img src={photo.url} alt={photo.caption} className="w-full h-32 object-cover" />
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
          )}
        </div>

        {/* Hidden Gems */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <MapPinned className="h-5 w-5 text-accent" /> Hidden Gems
            </h2>
            <Button size="sm" variant="outline" onClick={() => setShowGemForm(true)} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Add
            </Button>
          </div>

          {showGemForm && (
            <div className="rounded-xl border border-border bg-card p-4 mb-4 space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Country</Label>
                <select
                  value={gemForm.locationId}
                  onChange={(e) => setGemForm((f) => ({ ...f, locationId: e.target.value }))}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Select a country...</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>{l.flag} {l.city}, {l.country}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Place Name</Label>
                <Input value={gemForm.name} onChange={(e) => setGemForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Secret Rooftop Café" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Description</Label>
                <Input value={gemForm.description} onChange={(e) => setGemForm((f) => ({ ...f, description: e.target.value }))} placeholder="What makes it special?" />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddGem} disabled={!gemForm.locationId || !gemForm.name} className="gap-1.5">
                  <MapPinned className="h-3.5 w-3.5" /> Add Gem
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowGemForm(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {user.hiddenGems.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hidden gems yet. Share your secret spots!</p>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
}
