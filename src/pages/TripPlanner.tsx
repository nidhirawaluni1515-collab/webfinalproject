import { useState, useRef, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Compass, ArrowLeft, Plus, Trash2, ChevronUp, ChevronDown,
  Globe, Moon, MapPin, Lock, Unlock, Users, StickyNote,
  X, Check, MessageCircle, Send, LogOut as LeaveIcon,
  AlertCircle, Backpack, Calendar, Wallet, BarChart2, ListChecks,
  UserCheck, UserX, Clock, ExternalLink, Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { locations } from "@/data/locations";
import { CitySearch } from "@/components/CitySearch";
import { searchCities, type City as GeoCity } from "@/lib/geo-api";
import { useTrips, Trip, TRAVEL_STYLES, BUDGET_LABELS } from "@/hooks/use-trips";
import { useCurrentUser, getAllUsers } from "@/hooks/use-user-data";
import { useToast } from "@/hooks/use-toast";

type PanelView = "planner" | "chat"  | "polls" | "requests";
type TabView = "mine" | "joined" | "community";
const REACTION_EMOJIS = ["❤️", "😂", "🔥", "👍", "😮", "✈️"];

export default function TripPlanner() {
  const [searchParams] = useSearchParams();
  const { user } = useCurrentUser();
  const {
    myTrips, joinedTrips, publicTrips,
    createTrip, deleteTrip,
    requestJoin, approveRequest, rejectRequest, leaveTrip,
    sendMessage, reactToMessage,
    addStop, removeStop, updateStop, reorderStops,
    togglePublic, updateMaxMembers,
    addPackingItem, togglePackingItem, removePackingItem,
    createPoll, votePoll,
    getTotalNights, getTripById,
  } = useTrips();
  const { toast } = useToast();
  const allUsers = getAllUsers();

  // Helper function to add a geo city stop
  const addGeoStop = (tripId: string, geoCity: GeoCity) => {
    const geoId = `geo:${geoCity.id || Date.now()}`;
    const geoCities = JSON.parse(localStorage.getItem("atlashub_geo_cities") || "{}");
    geoCities[geoId] = geoCity;
    localStorage.setItem("atlashub_geo_cities", JSON.stringify(geoCities));
    addStop(tripId, geoId);
  };

  const [activeTab, setActiveTab] = useState<TabView>("mine");
  const [activeTrip, setActiveTrip] = useState<string | null>(null);
  const [panelView, setPanelView] = useState<PanelView>("planner");

  // New trip form
  const [showNewTrip, setShowNewTrip] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newMax, setNewMax] = useState(6);
  const [newStyles, setNewStyles] = useState<string[]>([]);
  const [newBudget, setNewBudget] = useState<Trip["budget"]>("");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");

  // Stop
  const [addingStop, setAddingStop] = useState(false);
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedGeoCity, setSelectedGeoCity] = useState<GeoCity | null>(null);
  const [citySearchQuery, setCitySearchQuery] = useState("");
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  // Community filter
  const [filterStyle, setFilterStyle] = useState("");
  const [filterBudget, setFilterBudget] = useState("");

  // Chat
  const [chatInput, setChatInput] = useState("");
  const [showReactFor, setShowReactFor] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Packing
  const [packingInput, setPackingInput] = useState("");

  // Polls
  const [showPollForm, setShowPollForm] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);

  // Join request message
  const [joinMsg, setJoinMsg] = useState("");
  const [showJoinForm, setShowJoinForm] = useState<string | null>(null);

  // Deep-link from ?tripId= param (shared from Inbox)
  useEffect(() => {
    const tid = searchParams.get("tripId");
    if (tid) {
      const trip = getTripById?.(tid);
      if (trip) {
        if (trip.userId === user?.id) {
          setActiveTab("mine"); setActiveTrip(tid);
        } else if (trip.members.includes(user?.id ?? "")) {
          setActiveTab("joined"); setActiveTrip(tid);
        } else if (trip.isPublic) {
          setActiveTab("community");
        }
      }
    }
  }, []);

  const currentTrip: Trip | undefined =
    activeTab === "mine" ? myTrips.find((t) => t.id === activeTrip)
    : activeTab === "joined" ? joinedTrips.find((t) => t.id === activeTrip)
    : undefined;

  useEffect(() => {
    if (panelView === "chat")
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 60);
  }, [panelView, currentTrip?.messages?.length]);

  // Pending requests count for owner
  const pendingCount = currentTrip?.joinRequests?.filter((r) => r.status === "pending").length ?? 0;

  const handleCreate = () => {
    if (!newName.trim()) return;
    const trip = createTrip({ name: newName.trim(), description: newDesc.trim(), maxMembers: newMax, travelStyles: newStyles, budget: newBudget, startDate: newStart, endDate: newEnd });
    if (trip) {
      setActiveTrip(trip.id); setActiveTab("mine"); setShowNewTrip(false);
      setNewName(""); setNewDesc(""); setNewMax(6); setNewStyles([]); setNewBudget(""); setNewStart(""); setNewEnd("");
      toast({ title: "✈️ Trip created!" });
    }
  };

  const handleAddStop = () => {
    if (!activeTrip) return;
    if (selectedCity) {
      // Static location from local data
      addStop(activeTrip, selectedCity);
      setSelectedCity(""); setAddingStop(false);
      setCitySearchQuery("");
      toast({ title: "📍 City added!" });
    } else if (selectedGeoCity) {
      // Dynamic geo city — store as a geo stop
      addGeoStop(activeTrip, selectedGeoCity);
      setSelectedGeoCity(null); setAddingStop(false);
      setCitySearchQuery("");
      toast({ title: `📍 ${selectedGeoCity.name} added!` });
    }
  };

  const handleSaveNote = (stopId: string) => {
    if (!activeTrip) return;
    updateStop(activeTrip, stopId, { notes: noteText });
    setEditingNote(null); setNoteText("");
  };

  const handleRequestJoin = (tripId: string) => {
    const result = requestJoin(tripId, joinMsg);
    setShowJoinForm(null); setJoinMsg("");
    if (result === "ok") toast({ title: "✅ Join request sent! Waiting for owner approval." });
    else if (result === "full") toast({ title: "This trip is full." });
    else if (result === "already_member") toast({ title: "You're already a member!" });
    else if (result === "already_requested") toast({ title: "You already sent a request for this trip." });
  };

  const handleApprove = (tripId: string, reqId: string, reqUsername: string) => {
    approveRequest(tripId, reqId);
    toast({ title: `✅ ${reqUsername} has been approved!` });
  };

  const handleReject = (tripId: string, reqId: string, reqUsername: string) => {
    rejectRequest(tripId, reqId);
    toast({ title: `${reqUsername}'s request was rejected.` });
  };

  const handleLeave = (tripId: string) => {
    leaveTrip(tripId);
    if (activeTrip === tripId) { setActiveTrip(null); setPanelView("planner"); }
    toast({ title: "You left the trip." });
  };

  const handleSendMsg = () => {
    if (!activeTrip || !chatInput.trim()) return;
    sendMessage(activeTrip, chatInput); setChatInput("");
  };

  const handleAddPacking = () => {
    if (!activeTrip || !packingInput.trim()) return;
    addPackingItem(activeTrip, packingInput); setPackingInput("");
  };

  const handleCreatePoll = () => {
    if (!activeTrip || !pollQuestion.trim()) return;
    createPoll(activeTrip, pollQuestion, pollOptions);
    setPollQuestion(""); setPollOptions(["", ""]); setShowPollForm(false);
    toast({ title: "📊 Poll created!" });
  };

  const toggleStyle = (s: string) => setNewStyles((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  const getUser = (id: string) => allUsers.find((u) => u.id === id);
  const getUserName = (id: string) => getUser(id)?.username ?? "Traveler";
  const getInitials = (id: string) => getUserName(id).slice(0, 2).toUpperCase();
  const getLocation = (id: string) => locations.find((l) => l.id === id);

  const usedCityIds = currentTrip?.stops.map((s) => s.locationId) ?? [];
  const availableCities = locations.filter((l) => !usedCityIds.includes(l.id));
  // Load cached geo city metadata
  const geoCities: Record<string, GeoCity> = JSON.parse(localStorage.getItem("atlashub_geo_cities") || "{}");
  const getLocationOrGeo = (id: string) => {
    if (id.startsWith("geo:")) {
      const g = geoCities[id];
      if (!g) return null;
      const flag = g.countryCode ? g.countryCode.toUpperCase().replace(/./g, (c: string) => String.fromCodePoint(127397 + c.charCodeAt(0))) : "🌍";
      return { id, city: g.name, country: g.country, flag, image: `https://source.unsplash.com/featured/400x300/?${encodeURIComponent(g.name + " city")}`, isGeo: true, geoData: g };
    }
    const loc = locations.find((l) => l.id === id);
    return loc ? { ...loc, isGeo: false, geoData: null } : null;
  };
  const isMine = !!(currentTrip && user && currentTrip.userId === user.id);

  const filteredPublic = publicTrips.filter((t) => {
    if (filterStyle && !t.travelStyles.includes(filterStyle)) return false;
    if (filterBudget && t.budget !== filterBudget) return false;
    return true;
  });

  const TABS: { key: TabView; label: string }[] = [
    { key: "mine", label: "My Trips" },
    { key: "joined", label: `Joined${joinedTrips.length > 0 ? ` (${joinedTrips.length})` : ""}` },
    { key: "community", label: "Community" },
  ];

  const PANEL_TABS: { key: PanelView; icon: React.ReactNode; label: string; ownerOnly?: boolean }[] = [
    { key: "chat", icon: <MessageCircle className="h-3.5 w-3.5" />, label: `Chat${currentTrip?.messages?.length ? ` (${currentTrip.messages.length})` : ""}` },
    { key: "polls", icon: <BarChart2 className="h-3.5 w-3.5" />, label: `Polls${currentTrip?.polls?.length ? ` (${currentTrip.polls.length})` : ""}` },
    { key: "requests", icon: <Bell className="h-3.5 w-3.5" />, label: `Requests${pendingCount > 0 ? ` (${pendingCount})` : ""}`, ownerOnly: true },
  ];

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
              <span className="font-display text-xl font-bold text-foreground">Trip Planner</span>
            </div>
          </div>
          {user && <Button size="sm" onClick={() => setShowNewTrip(true)} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> New Trip</Button>}
        </div>
      </header>

      {!user && (
        <div className="container mx-auto max-w-xl px-4 py-20 text-center">
          <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">Plan your next adventure</h2>
          <p className="text-muted-foreground mb-6">Sign in to create trips, join others, and collaborate.</p>
          <Link to="/auth"><Button>Sign in to get started</Button></Link>
        </div>
      )}

      {user && (
        <div className="container mx-auto px-4 py-6 max-w-5xl">

          {/* NEW TRIP FORM */}
          {showNewTrip && (
            <div className="mb-6 rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm">
              <h3 className="font-semibold text-foreground">Create a new trip</h3>
              <Input placeholder="Trip name" value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus />
              <Textarea placeholder="Description (optional)" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="min-h-[60px] resize-none" />
              <div className="flex gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Start:</span>
                  <input type="date" value={newStart} onChange={(e) => setNewStart(e.target.value)} className="h-8 rounded-md border border-input bg-background px-2 text-sm" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">End:</span>
                  <input type="date" value={newEnd} onChange={(e) => setNewEnd(e.target.value)} className="h-8 rounded-md border border-input bg-background px-2 text-sm" />
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Budget:</span>
                {(["budget", "mid", "luxury"] as Trip["budget"][]).map((b) => (
                  <button key={b} onClick={() => setNewBudget(newBudget === b ? "" : b)} className={`text-xs px-3 py-1 rounded-full border transition-colors ${newBudget === b ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary"}`}>{BUDGET_LABELS[b as string]}</button>
                ))}
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1"><Backpack className="h-4 w-4" /> Travel style:</p>
                <div className="flex flex-wrap gap-2">
                  {TRAVEL_STYLES.map((s) => (
                    <button key={s.id} onClick={() => toggleStyle(s.id)} className={`text-xs px-3 py-1 rounded-full border transition-colors ${newStyles.includes(s.id) ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary"}`}>{s.label}</button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Max travelers:</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setNewMax((v) => Math.max(2, v - 1))} className="h-6 w-6 rounded border border-border flex items-center justify-center text-xs hover:bg-muted">−</button>
                  <span className="text-sm font-semibold w-6 text-center">{newMax}</span>
                  <button onClick={() => setNewMax((v) => Math.min(20, v + 1))} className="h-6 w-6 rounded border border-border flex items-center justify-center text-xs hover:bg-muted">+</button>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleCreate} disabled={!newName.trim()}>Create Trip</Button>
                <Button size="sm" variant="ghost" onClick={() => setShowNewTrip(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {/* TABS */}
          <div className="flex gap-1 mb-6 bg-muted rounded-lg p-1 w-fit">
            {TABS.map((tab) => (
              <button key={tab.key} onClick={() => { setActiveTab(tab.key); setActiveTrip(null); setPanelView("planner"); }}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === tab.key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* MY / JOINED TRIPS */}
          {(activeTab === "mine" || activeTab === "joined") && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Sidebar */}
              <div className="space-y-3">
                {(activeTab === "mine" ? myTrips : joinedTrips).length === 0 && (
                  <div className="rounded-xl border border-dashed border-border p-8 text-center">
                    <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">{activeTab === "mine" ? "No trips yet. Create one!" : "You haven't joined any trips yet."}</p>
                  </div>
                )}
                {(activeTab === "mine" ? myTrips : joinedTrips).map((trip) => {
                  const pending = trip.joinRequests?.filter((r) => r.status === "pending").length ?? 0;
                  return (
                    <button key={trip.id} onClick={() => setActiveTrip(trip.id === activeTrip ? null : trip.id)}
                      className={`w-full text-left rounded-xl border p-4 transition-all ${activeTrip === trip.id ? "border-primary bg-primary/5" : "border-border bg-card hover:shadow-sm"}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-foreground text-sm truncate">{trip.name}</p>
                            {pending > 0 && activeTab === "mine" && (
                              <span className="flex-shrink-0 bg-amber-500 text-white text-[10px] rounded-full px-1.5 py-0.5">{pending}</span>
                            )}
                          </div>
                          {(trip.startDate || trip.endDate) && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {trip.startDate && new Date(trip.startDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                              {trip.startDate && trip.endDate && " → "}
                              {trip.endDate && new Date(trip.endDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1"><Users className="h-3 w-3" />{trip.members.length}/{trip.maxMembers}</span>
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{trip.stops.length}</span>
                            <span className="flex items-center gap-1"><Moon className="h-3 w-3" />{getTotalNights(trip)}n</span>
                            {trip.budget && <span className="text-primary">{BUDGET_LABELS[trip.budget]}</span>}
                          </div>
                          {trip.travelStyles.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {trip.travelStyles.slice(0, 3).map((s) => {
                                const style = TRAVEL_STYLES.find((ts) => ts.id === s);
                                return style ? <span key={s} className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full">{style.label}</span> : null;
                              })}
                            </div>
                          )}
                        </div>
                        {activeTab === "mine" ? (
                          <button onClick={(e) => { e.stopPropagation(); deleteTrip(trip.id); if (activeTrip === trip.id) setActiveTrip(null); }} className="text-muted-foreground hover:text-destructive p-1"><Trash2 className="h-3.5 w-3.5" /></button>
                        ) : (
                          <button onClick={(e) => { e.stopPropagation(); handleLeave(trip.id); }} className="text-muted-foreground hover:text-destructive p-1" title="Leave trip"><LeaveIcon className="h-3.5 w-3.5" /></button>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Main panel */}
              <div className="lg:col-span-2">
                {!currentTrip ? (
                  <div className="rounded-xl border border-dashed border-border p-12 text-center h-full flex flex-col items-center justify-center">
                    <Globe className="h-10 w-10 text-muted-foreground mb-3" />
                    <p className="text-muted-foreground text-sm">Select a trip to view it</p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-border bg-card overflow-hidden flex flex-col">
                    {/* Trip header */}
                    <div className="p-5 border-b border-border">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <h2 className="font-display text-xl font-bold text-foreground">{currentTrip.name}</h2>
                          {currentTrip.description && <p className="text-sm text-muted-foreground mt-1">{currentTrip.description}</p>}
                          {(currentTrip.startDate || currentTrip.endDate) && (
                            <p className="text-xs text-primary mt-1 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {currentTrip.startDate && new Date(currentTrip.startDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                              {currentTrip.startDate && currentTrip.endDate && " → "}
                              {currentTrip.endDate && new Date(currentTrip.endDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{currentTrip.stops.length} cities</span>
                            <span className="flex items-center gap-1.5"><Moon className="h-4 w-4" />{getTotalNights(currentTrip)} nights</span>
                            <span className="flex items-center gap-1.5"><Users className="h-4 w-4" />{currentTrip.members.length}/{currentTrip.maxMembers}</span>
                            {currentTrip.budget && <span className="text-primary font-medium">{BUDGET_LABELS[currentTrip.budget]}</span>}
                          </div>
                          {currentTrip.travelStyles.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {currentTrip.travelStyles.map((s) => {
                                const style = TRAVEL_STYLES.find((ts) => ts.id === s);
                                return style ? <span key={s} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{style.label}</span> : null;
                              })}
                            </div>
                          )}
                        </div>
                        {isMine && (
                          <button onClick={() => { togglePublic(currentTrip.id); toast({ title: currentTrip.isPublic ? "Trip set to private" : "Trip is now public!" }); }}
                            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors flex-shrink-0 ${currentTrip.isPublic ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:border-primary hover:text-primary"}`}>
                            {currentTrip.isPublic ? <><Unlock className="h-3 w-3" /> Public</> : <><Lock className="h-3 w-3" /> Private</>}
                          </button>
                        )}
                      </div>

                      {/* Members row */}
                      <div className="mt-3 flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-muted-foreground">Travelers:</span>
                        {currentTrip.members.map((uid) => (
                          <Link key={uid} to={`/user/${uid}`} className="flex items-center gap-1 hover:opacity-80 transition-opacity" title={`View ${getUserName(uid)}'s profile`}>
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">{getInitials(uid)}</AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-foreground underline-offset-2 hover:underline">{getUserName(uid)}</span>
                            {uid === currentTrip.userId && <span className="text-[10px] text-primary">(host)</span>}
                          </Link>
                        ))}
                        {isMine && (
                          <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                            <span>Limit:</span>
                            <button onClick={() => updateMaxMembers(currentTrip.id, currentTrip.maxMembers - 1)} className="h-5 w-5 rounded border border-border flex items-center justify-center hover:bg-muted">−</button>
                            <span className="font-semibold w-4 text-center text-foreground">{currentTrip.maxMembers}</span>
                            <button onClick={() => updateMaxMembers(currentTrip.id, currentTrip.maxMembers + 1)} className="h-5 w-5 rounded border border-border flex items-center justify-center hover:bg-muted">+</button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Sub-tabs */}
                    <div className="flex border-b border-border overflow-x-auto">
                      {PANEL_TABS.filter((pt) => !pt.ownerOnly || isMine).map((pt) => (
                        <button key={pt.key} onClick={() => setPanelView(pt.key)}
                          className={`relative flex-shrink-0 flex-1 py-2.5 text-xs font-medium flex items-center justify-center gap-1 transition-colors ${panelView === pt.key ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                          {pt.icon}{pt.label}
                          {pt.key === "requests" && pendingCount > 0 && (
                            <span className="absolute top-1 right-1 h-2 w-2 bg-amber-500 rounded-full" />
                          )}
                        </button>
                      ))}
                    </div>

                    {/* ITINERARY */}
                    {panelView === "planner" && (
                      <>
                        <div className="divide-y divide-border">
                          {currentTrip.stops.length === 0 && <div className="p-8 text-center"><p className="text-sm text-muted-foreground">No cities yet{isMine ? " — add below!" : "."}</p></div>}
                          {currentTrip.stops.map((stop, idx) => {
                            const loc = getLocationOrGeo(stop.locationId);
                            if (!loc) return null;
                            return (
                              <div key={stop.id} className="p-4">
                                <div className="flex items-start gap-3">
                                  {isMine && (
                                    <div className="flex flex-col items-center gap-0.5 pt-1">
                                      <button disabled={idx === 0} onClick={() => reorderStops(currentTrip.id, idx, idx - 1)} className="text-muted-foreground hover:text-foreground disabled:opacity-20"><ChevronUp className="h-4 w-4" /></button>
                                      <span className="text-xs font-bold text-muted-foreground">{idx + 1}</span>
                                      <button disabled={idx === currentTrip.stops.length - 1} onClick={() => reorderStops(currentTrip.id, idx, idx + 1)} className="text-muted-foreground hover:text-foreground disabled:opacity-20"><ChevronDown className="h-4 w-4" /></button>
                                    </div>
                                  )}
                                  {!isMine && <span className="text-xs font-bold text-muted-foreground mt-5 w-4 text-center">{idx + 1}</span>}
                                  {loc.image && (
                                    <img
                                      src={loc.image}
                                      alt={loc.city}
                                      className="h-14 w-20 object-cover rounded-lg flex-shrink-0"
                                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                                    />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-lg">{loc.flag}</span>
                                      <Link to={`/location/${loc.id}`} className="font-semibold text-foreground hover:text-primary text-sm">{loc.city}</Link>
                                      <span className="text-xs text-muted-foreground">{loc.country}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                      <Moon className="h-3.5 w-3.5 text-muted-foreground" />
                                      <span className="text-xs text-muted-foreground">Nights:</span>
                                      {isMine ? (
                                        <div className="flex items-center gap-1">
                                          <button onClick={() => updateStop(currentTrip.id, stop.id, { nights: Math.max(1, stop.nights - 1) })} className="h-5 w-5 rounded border border-border flex items-center justify-center text-xs hover:bg-muted">−</button>
                                          <span className="text-sm font-semibold w-5 text-center">{stop.nights}</span>
                                          <button onClick={() => updateStop(currentTrip.id, stop.id, { nights: stop.nights + 1 })} className="h-5 w-5 rounded border border-border flex items-center justify-center text-xs hover:bg-muted">+</button>
                                        </div>
                                      ) : <span className="text-sm font-semibold">{stop.nights}</span>}
                                    </div>
                                    {editingNote === stop.id ? (
                                      <div className="mt-2 flex gap-2">
                                        <Input value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Add a note..." className="h-7 text-xs flex-1" autoFocus onKeyDown={(e) => { if (e.key === "Enter") handleSaveNote(stop.id); if (e.key === "Escape") setEditingNote(null); }} />
                                        <button onClick={() => handleSaveNote(stop.id)} className="text-primary"><Check className="h-4 w-4" /></button>
                                        <button onClick={() => setEditingNote(null)} className="text-muted-foreground"><X className="h-4 w-4" /></button>
                                      </div>
                                    ) : isMine ? (
                                      <button onClick={() => { setEditingNote(stop.id); setNoteText(stop.notes); }} className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                                        <StickyNote className="h-3 w-3" />
                                        {stop.notes ? <span className="italic truncate max-w-[180px]">{stop.notes}</span> : <span>Add note…</span>}
                                      </button>
                                    ) : stop.notes ? <p className="mt-1.5 text-xs text-muted-foreground italic flex items-center gap-1"><StickyNote className="h-3 w-3" />{stop.notes}</p> : null}
                                  </div>
                                  {isMine && <button onClick={() => removeStop(currentTrip.id, stop.id)} className="text-muted-foreground hover:text-destructive p-1"><X className="h-4 w-4" /></button>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {isMine && (
                          <div className="p-4 border-t border-border bg-muted/30">
                            {addingStop ? (
                              <div className="space-y-2">
                                <CitySearch
                                  value={citySearchQuery}
                                  placeholder="Search any city worldwide…"
                                  onSelect={(city) => {
                                    // Check if it matches a local location
                                    const local = availableCities.find(
                                      (l) => l.city.toLowerCase() === city.name.toLowerCase()
                                    );
                                    if (local) {
                                      setSelectedCity(local.id);
                                      setSelectedGeoCity(null);
                                    } else {
                                      setSelectedGeoCity(city);
                                      setSelectedCity("");
                                    }
                                    setCitySearchQuery(`${city.name}, ${city.country}`);
                                  }}
                                />
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={handleAddStop} disabled={!selectedCity && !selectedGeoCity} className="flex-1">
                                    Add to Trip
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => { setAddingStop(false); setSelectedCity(""); setSelectedGeoCity(null); setCitySearchQuery(""); }}>Cancel</Button>
                                </div>
                              </div>
                            ) : (
                              <Button size="sm" variant="outline" onClick={() => setAddingStop(true)} className="w-full gap-1.5">
                                <Plus className="h-3.5 w-3.5" /> Add a city
                              </Button>
                            )}
                          </div>
                        )}
                      </>
                    )}

                    {/* GROUP CHAT */}
                    {panelView === "chat" && (
                      <div className="flex flex-col" style={{ minHeight: 360 }}>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: 420 }}>
                          {(currentTrip.messages ?? []).length === 0 && (
                            <div className="text-center py-10">
                              <MessageCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                              <p className="text-sm text-muted-foreground">No messages yet. Say hello!</p>
                            </div>
                          )}
                          {(currentTrip.messages ?? []).map((msg) => {
                            const isMe = msg.authorId === user?.id;
                            const totalReactions = Object.entries(msg.reactions ?? {}).filter(([, users]) => users.length > 0);
                            return (
                              <div key={msg.id} className={`flex gap-2 group ${isMe ? "flex-row-reverse" : ""}`}>
                                {/* Avatar — clickable to profile */}
                                <Link to={`/user/${msg.authorId}`} title={`View ${getUserName(msg.authorId)}'s profile`}>
                                  <Avatar className="h-7 w-7 flex-shrink-0 hover:ring-2 hover:ring-primary transition-all">
                                    <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">{getInitials(msg.authorId)}</AvatarFallback>
                                  </Avatar>
                                </Link>
                                <div className={`max-w-[70%] flex flex-col gap-0.5 ${isMe ? "items-end" : "items-start"}`}>
                                  {!isMe && (
                                    <Link to={`/user/${msg.authorId}`} className="text-[11px] text-muted-foreground px-1 hover:text-primary transition-colors hover:underline">
                                      {getUserName(msg.authorId)}
                                    </Link>
                                  )}
                                  <div className="relative">
                                    <div className={`rounded-2xl px-3 py-2 text-sm ${isMe ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted text-foreground rounded-tl-sm"}`}>{msg.text}</div>
                                    <button onClick={() => setShowReactFor(showReactFor === msg.id ? null : msg.id)}
                                      className="absolute -bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background border border-border rounded-full p-0.5 text-[10px]">😊</button>
                                    {showReactFor === msg.id && (
                                      <div className="absolute bottom-6 right-0 flex gap-1 bg-card border border-border rounded-full px-2 py-1 shadow-lg z-10">
                                        {REACTION_EMOJIS.map((e) => (
                                          <button key={e} onClick={() => { reactToMessage(currentTrip.id, msg.id, e); setShowReactFor(null); }} className="text-base hover:scale-125 transition-transform">{e}</button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  {totalReactions.length > 0 && (
                                    <div className="flex gap-1 flex-wrap px-1">
                                      {totalReactions.map(([emoji, users]) => (
                                        <button key={emoji} onClick={() => reactToMessage(currentTrip.id, msg.id, emoji)}
                                          className={`text-xs flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 transition-colors ${users.includes(user?.id ?? "") ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary"}`}>
                                          {emoji} {users.length}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                  <span className="text-[10px] text-muted-foreground px-1">{new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                                </div>
                              </div>
                            );
                          })}
                          <div ref={chatEndRef} />
                        </div>
                        <div className="border-t border-border p-3 flex gap-2">
                          <Input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Message the group…" className="flex-1 h-9 text-sm" onKeyDown={(e) => { if (e.key === "Enter") handleSendMsg(); }} />
                          <Button size="sm" onClick={handleSendMsg} disabled={!chatInput.trim()} className="h-9 px-3"><Send className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    )}

                    {/* PACKING LIST */}
                    {/* {panelView === "packing" && (
                      <div className="p-4 space-y-3">
                        <div className="flex gap-2">
                          <Input value={packingInput} onChange={(e) => setPackingInput(e.target.value)} placeholder="Add an item…" className="flex-1 h-9 text-sm" onKeyDown={(e) => { if (e.key === "Enter") handleAddPacking(); }} />
                          <Button size="sm" onClick={handleAddPacking} disabled={!packingInput.trim()} className="h-9"><Plus className="h-4 w-4" /></Button>
                        </div>
                        {(currentTrip.packingList ?? []).length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No items yet.</p>}
                        <div className="space-y-2">
                          {(currentTrip.packingList ?? []).map((item) => {
                            const isChecked = item.checkedBy.includes(user?.id ?? "");
                            return (
                              <div key={item.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${isChecked ? "bg-muted/50 border-border" : "bg-card border-border hover:bg-muted/20"}`}>
                                <button onClick={() => togglePackingItem(currentTrip.id, item.id)} className={`h-5 w-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${isChecked ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"}`}>
                                  {isChecked && <Check className="h-3 w-3" />}
                                </button>
                                <span className={`flex-1 text-sm ${isChecked ? "line-through text-muted-foreground" : "text-foreground"}`}>{item.text}</span>
                                {item.checkedBy.length > 0 && <span className="text-xs text-muted-foreground">{item.checkedBy.length} packed</span>}
                                <span className="text-xs text-muted-foreground hidden sm:block">by {getUserName(item.addedBy)}</span>
                                <button onClick={() => removePackingItem(currentTrip.id, item.id)} className="text-muted-foreground hover:text-destructive p-0.5"><X className="h-3.5 w-3.5" /></button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )} */}

                    {/* POLLS */}
                    {panelView === "polls" && (
                      <div className="p-4 space-y-4">
                        <Button size="sm" variant="outline" onClick={() => setShowPollForm(!showPollForm)} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> New Poll</Button>
                        {showPollForm && (
                          <div className="rounded-lg border border-border p-4 space-y-3 bg-muted/20">
                            <Input placeholder="Poll question" value={pollQuestion} onChange={(e) => setPollQuestion(e.target.value)} autoFocus />
                            {pollOptions.map((opt, i) => (
                              <div key={i} className="flex gap-2">
                                <Input placeholder={`Option ${i + 1}`} value={opt} onChange={(e) => { const o = [...pollOptions]; o[i] = e.target.value; setPollOptions(o); }} className="flex-1" />
                                {pollOptions.length > 2 && <button onClick={() => setPollOptions(pollOptions.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button>}
                              </div>
                            ))}
                            {pollOptions.length < 5 && <Button size="sm" variant="ghost" onClick={() => setPollOptions([...pollOptions, ""])} className="gap-1"><Plus className="h-3 w-3" /> Add option</Button>}
                            <div className="flex gap-2">
                              <Button size="sm" onClick={handleCreatePoll} disabled={!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2}>Create Poll</Button>
                              <Button size="sm" variant="ghost" onClick={() => setShowPollForm(false)}>Cancel</Button>
                            </div>
                          </div>
                        )}
                        {(currentTrip.polls ?? []).length === 0 && !showPollForm && <p className="text-sm text-muted-foreground text-center py-6">No polls yet.</p>}
                        {(currentTrip.polls ?? []).map((poll) => {
                          const totalVotes = poll.options.reduce((acc, o) => acc + o.votes.length, 0);
                          const userVote = poll.options.find((o) => o.votes.includes(user?.id ?? ""))?.id;
                          return (
                            <div key={poll.id} className="rounded-lg border border-border p-4 space-y-3 bg-card">
                              <div>
                                <p className="font-semibold text-foreground text-sm">{poll.question}</p>
                                <p className="text-xs text-muted-foreground">by {getUserName(poll.createdBy)} · {totalVotes} vote{totalVotes !== 1 ? "s" : ""}</p>
                              </div>
                              <div className="space-y-2">
                                {poll.options.map((opt) => {
                                  const pct = totalVotes > 0 ? Math.round((opt.votes.length / totalVotes) * 100) : 0;
                                  const isVoted = opt.id === userVote;
                                  return (
                                    <button key={opt.id} onClick={() => votePoll(currentTrip.id, poll.id, opt.id)} className="w-full text-left">
                                      <div className={`relative rounded-lg border p-2.5 overflow-hidden transition-colors ${isVoted ? "border-primary" : "border-border hover:border-primary/50"}`}>
                                        <div className={`absolute inset-0 ${isVoted ? "bg-primary/15" : "bg-muted/40"} transition-all`} style={{ width: `${pct}%` }} />
                                        <div className="relative flex items-center justify-between">
                                          <span className={`text-sm font-medium ${isVoted ? "text-primary" : "text-foreground"}`}>{opt.label}</span>
                                          <span className="text-xs text-muted-foreground">{pct}% ({opt.votes.length})</span>
                                        </div>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* JOIN REQUESTS (owner only) */}
                    {panelView === "requests" && isMine && (
                      <div className="p-4 space-y-4">
                        {(currentTrip.joinRequests ?? []).length === 0 && (
                          <div className="text-center py-10">
                            <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">No join requests yet.</p>
                            <p className="text-xs text-muted-foreground mt-1">Make your trip public so travelers can request to join.</p>
                          </div>
                        )}
                        {/* Pending first, then others */}
                        {["pending", "approved", "rejected"].map((status) => {
                          const reqs = (currentTrip.joinRequests ?? []).filter((r) => r.status === status);
                          if (reqs.length === 0) return null;
                          return (
                            <div key={status}>
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                                {status === "pending" ? "⏳ Pending" : status === "approved" ? "✅ Approved" : "❌ Rejected"}
                              </p>
                              <div className="space-y-3">
                                {reqs.map((req) => {
                                  const requester = getUser(req.userId);
                                  const name = requester?.username ?? "Traveler";
                                  const initials = name.slice(0, 2).toUpperCase();
                                  const favCount = requester?.favoriteLocations?.length ?? 0;
                                  const visitedCount = requester?.visitedLocations?.length ?? 0;
                                  return (
                                    <div key={req.id} className={`rounded-xl border p-4 ${status === "pending" ? "border-amber-200 bg-amber-50/30 dark:border-amber-900 dark:bg-amber-950/20" : "border-border bg-card"}`}>
                                      <div className="flex items-start gap-3">
                                        <Avatar className="h-10 w-10 flex-shrink-0">
                                          <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">{initials}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-semibold text-foreground text-sm">{name}</p>
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                              <span>❤️ {favCount} fav</span>
                                              <span>✈️ {visitedCount} visited</span>
                                            </div>
                                          </div>
                                          {requester?.bio && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{requester.bio}</p>}
                                          {req.message && (
                                            <p className="text-xs text-foreground mt-1.5 bg-background rounded-md px-2.5 py-1.5 border border-border italic">"{req.message}"</p>
                                          )}
                                          <p className="text-[10px] text-muted-foreground mt-1">{new Date(req.requestedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                                        {/* View profile */}
                                        <Link to={`/user/${req.userId}`}
                                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors border border-border rounded-full px-2.5 py-1 hover:border-primary">
                                          <ExternalLink className="h-3 w-3" /> View Profile
                                        </Link>
                                        {status === "pending" && (
                                          <>
                                            <Button size="sm" onClick={() => handleApprove(currentTrip.id, req.id, name)} className="h-7 gap-1 text-xs bg-green-600 hover:bg-green-700 text-white">
                                              <UserCheck className="h-3.5 w-3.5" /> Approve
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => handleReject(currentTrip.id, req.id, name)} className="h-7 gap-1 text-xs text-destructive border-destructive hover:bg-destructive/10">
                                              <UserX className="h-3.5 w-3.5" /> Reject
                                            </Button>
                                          </>
                                        )}
                                        {status === "approved" && <span className="text-xs text-green-600 flex items-center gap-1"><UserCheck className="h-3.5 w-3.5" /> Approved</span>}
                                        {status === "rejected" && <span className="text-xs text-destructive flex items-center gap-1"><UserX className="h-3.5 w-3.5" /> Rejected</span>}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* COMMUNITY */}
          {activeTab === "community" && (
            <div>
              <div className="flex gap-3 mb-5 flex-wrap items-center">
                <span className="text-sm text-muted-foreground">Filter:</span>
                <select value={filterStyle} onChange={(e) => setFilterStyle(e.target.value)} className="h-8 rounded-md border border-input bg-background px-2 text-xs">
                  <option value="">All styles</option>
                  {TRAVEL_STYLES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
                <select value={filterBudget} onChange={(e) => setFilterBudget(e.target.value)} className="h-8 rounded-md border border-input bg-background px-2 text-xs">
                  <option value="">All budgets</option>
                  {Object.entries(BUDGET_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                {(filterStyle || filterBudget) && <button onClick={() => { setFilterStyle(""); setFilterBudget(""); }} className="text-xs text-muted-foreground hover:text-foreground">Clear</button>}
              </div>

              {filteredPublic.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-16 text-center">
                  <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">{publicTrips.length === 0 ? "No open trips yet." : "No trips match your filters."}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filteredPublic.map((trip) => {
                    const author = allUsers.find((u) => u.id === trip.userId);
                    const initials = (author?.username ?? "??").slice(0, 2).toUpperCase();
                    const isFull = trip.members.length >= trip.maxMembers;
                    const spotsLeft = trip.maxMembers - trip.members.length;
                    const myRequest = trip.joinRequests?.find((r) => r.userId === user?.id);

                    return (
                      <div key={trip.id} className="rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                        {trip.stops.length > 0 && (
                          <div className="flex h-24 overflow-hidden">
                            {trip.stops.slice(0, 3).map((stop) => {
                              const loc = getLocation(stop.locationId);
                              if (!loc || !loc.image) return null;
                              return (
                                <img
                                  key={stop.id}
                                  src={loc.image}
                                  alt={loc.city}
                                  className="flex-1 object-cover"
                                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                                />
                              );
                            })}
                          </div>
                        )}
                        <div className="p-4 flex-1 flex flex-col gap-2">
                          <div className="flex items-start gap-3">
                            <Link to={`/user/${trip.userId}`}>
                              <Avatar className="h-8 w-8 hover:ring-2 hover:ring-primary transition-all">
                                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{initials}</AvatarFallback>
                              </Avatar>
                            </Link>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-foreground text-sm truncate">{trip.name}</p>
                              <Link to={`/user/${trip.userId}`} className="text-xs text-muted-foreground hover:text-primary hover:underline">by {author?.username ?? "Traveler"}</Link>
                            </div>
                            {trip.budget && <span className="text-xs text-primary font-medium flex-shrink-0">{BUDGET_LABELS[trip.budget]}</span>}
                          </div>

                          {(trip.startDate || trip.endDate) && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {trip.startDate && new Date(trip.startDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                              {trip.startDate && trip.endDate && " → "}
                              {trip.endDate && new Date(trip.endDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                            </p>
                          )}

                          {trip.description && <p className="text-xs text-muted-foreground line-clamp-2">{trip.description}</p>}

                          {trip.travelStyles.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {trip.travelStyles.map((s) => {
                                const style = TRAVEL_STYLES.find((ts) => ts.id === s);
                                return style ? <span key={s} className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{style.label}</span> : null;
                              })}
                            </div>
                          )}

                          <div className="flex flex-wrap gap-1">
                            {trip.stops.slice(0, 4).map((stop) => {
                              const loc = getLocation(stop.locationId);
                              return loc ? <span key={stop.id} className="text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">{loc.flag} {loc.city}</span> : null;
                            })}
                            {trip.stops.length > 4 && <span className="text-[10px] text-muted-foreground">+{trip.stops.length - 4} more</span>}
                          </div>

                          {/* Capacity bar */}
                          <div>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="flex items-center gap-1 text-muted-foreground"><Users className="h-3 w-3" />{trip.members.length}/{trip.maxMembers}</span>
                              {isFull ? <span className="flex items-center gap-1 text-destructive font-medium"><AlertCircle className="h-3 w-3" /> Full</span>
                                : <span className="text-primary font-medium">{spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} left</span>}
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all ${isFull ? "bg-destructive" : "bg-primary"}`} style={{ width: `${(trip.members.length / trip.maxMembers) * 100}%` }} />
                            </div>
                          </div>

                          {/* Join / Request state */}
                          <div className="mt-auto">
                            {myRequest?.status === "pending" ? (
                              <div className="flex items-center justify-center gap-1.5 w-full h-9 rounded-md border border-amber-300 bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 text-sm">
                                <Clock className="h-4 w-4" /> Request pending…
                              </div>
                            ) : myRequest?.status === "rejected" ? (
                              <div className="flex items-center justify-center gap-1.5 w-full h-9 rounded-md border border-destructive/30 bg-destructive/5 text-destructive text-sm">
                                <UserX className="h-4 w-4" /> Request rejected
                              </div>
                            ) : isFull ? (
                              <Button size="sm" className="w-full gap-1.5" disabled variant="outline">
                                <AlertCircle className="h-3.5 w-3.5" /> Trip Full
                              </Button>
                            ) : showJoinForm === trip.id ? (
                              <div className="space-y-2">
                                <Textarea value={joinMsg} onChange={(e) => setJoinMsg(e.target.value)} placeholder="Introduce yourself to the trip owner (optional)…" className="text-xs min-h-[60px] resize-none" />
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => handleRequestJoin(trip.id)} className="flex-1 gap-1"><UserCheck className="h-3.5 w-3.5" /> Send Request</Button>
                                  <Button size="sm" variant="ghost" onClick={() => { setShowJoinForm(null); setJoinMsg(""); }}>Cancel</Button>
                                </div>
                              </div>
                            ) : (
                              <Button size="sm" className="w-full gap-1.5" onClick={() => setShowJoinForm(trip.id)}>
                                <UserCheck className="h-3.5 w-3.5" /> Request to Join
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
