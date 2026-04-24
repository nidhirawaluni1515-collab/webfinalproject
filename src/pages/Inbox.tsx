import { locations } from "@/data/locations";
import { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Compass, ArrowLeft, Send, MessageCircle, MapPin, Users, Share2, X, ExternalLink } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCurrentUser, getAllUsers } from "@/hooks/use-user-data";
import { useMessages } from "@/hooks/use-messages";
import { useTrips } from "@/hooks/use-trips";

export default function Inbox() {
  const { user } = useCurrentUser();
  const [searchParams, setSearchParams] = useSearchParams();
  const activePartnerId = searchParams.get("chat");
  const { getConversations, getThread, sendMessage, markRead, totalUnread } = useMessages(user?.id);
  const { myTrips, joinedTrips } = useTrips();
  const [newMsg, setNewMsg] = useState("");
  const [showTripPicker, setShowTripPicker] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const allUsers = getAllUsers();

  const conversations = getConversations();
  const thread = activePartnerId ? getThread(activePartnerId) : [];
  const partner = activePartnerId ? allUsers.find((u) => u.id === activePartnerId) : null;
  const allMyTrips = [...myTrips, ...joinedTrips];

  useEffect(() => {
    if (activePartnerId && user) markRead(activePartnerId);
  }, [activePartnerId, user, markRead, thread.length]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [thread.length]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-xl font-bold text-foreground">Sign in to access your inbox</p>
          <Link to="/auth" className="text-primary hover:underline text-sm">Sign In →</Link>
        </div>
      </div>
    );
  }

  const handleSend = () => {
    if (!activePartnerId || !newMsg.trim()) return;
    sendMessage(activePartnerId, newMsg);
    setNewMsg("");
  };

  const handleShareTrip = (trip: ReturnType<typeof useTrips>["myTrips"][0]) => {
    if (!activePartnerId) return;
    const cityFlags = trip.stops
      .slice(0, 4)
      .map((s) => {
        
        const loc = locations.find((l: any) => l.id === s.locationId);
        return loc ? `${loc.flag} ${loc.city}` : "";
      })
      .filter(Boolean);

    sendMessage(activePartnerId, `Check out my trip: ${trip.name}`, {
      tripId: trip.id,
      tripName: trip.name,
      description: trip.description,
      cityFlags,
    });
    setShowTripPicker(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
            <div className="flex items-center gap-2">
              <Compass className="h-6 w-6 text-primary" />
              <span className="font-display text-xl font-bold text-foreground">Inbox</span>
            </div>
          </div>
          {totalUnread > 0 && (
            <span className="text-xs bg-destructive text-destructive-foreground rounded-full px-2 py-0.5">{totalUnread} unread</span>
          )}
        </div>
      </header>

      <div className="flex-1 flex container mx-auto max-w-4xl">
        {/* Conversation List */}
        <div className={`w-full md:w-80 border-r border-border bg-card overflow-y-auto ${activePartnerId ? "hidden md:block" : ""}`}>
          {conversations.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No messages yet</p>
              <p className="text-xs mt-1">Visit a traveler's profile to start chatting!</p>
            </div>
          ) : (
            conversations.map((convo) => {
              const p = allUsers.find((u) => u.id === convo.partnerId);
              if (!p) return null;
              const initials = p.username.slice(0, 2).toUpperCase();
              const lastIsTrip = !!convo.lastMessage.tripShare;
              return (
                <button
                  key={convo.partnerId}
                  onClick={() => setSearchParams({ chat: convo.partnerId })}
                  className={`w-full flex items-center gap-3 p-4 border-b border-border hover:bg-secondary/50 transition-colors text-left ${activePartnerId === convo.partnerId ? "bg-secondary" : ""}`}
                >
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-foreground text-sm">{p.username}</p>
                      {convo.unreadCount > 0 && (
                        <span className="bg-destructive text-destructive-foreground text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">{convo.unreadCount}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {lastIsTrip ? `✈️ Shared a trip: ${convo.lastMessage.tripShare!.tripName}` : convo.lastMessage.text}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Chat Thread */}
        <div className={`flex-1 flex flex-col ${!activePartnerId ? "hidden md:flex" : ""}`}>
          {activePartnerId && partner ? (
            <>
              {/* Thread header — partner name links to profile */}
              <div className="border-b border-border p-3 flex items-center gap-3 bg-card">
                <button onClick={() => setSearchParams({})} className="md:hidden text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <Link to={`/user/${partner.id}`} className="flex items-center gap-3 flex-1 hover:opacity-80 transition-opacity">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{partner.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-foreground text-sm hover:underline">{partner.username}</p>
                    <p className="text-xs text-muted-foreground">{partner.bio?.slice(0, 40)}</p>
                  </div>
                </Link>
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                {thread.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">Start the conversation!</p>}
                {thread.map((msg) => {
                  const isMine = msg.fromUserId === user.id;
                  // Trip share card
                  if (msg.tripShare) {
                    const ts = msg.tripShare;
                    return (
                      <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                        <div className="max-w-[80%] space-y-1">
                          <p className={`text-[11px] text-muted-foreground px-1 ${isMine ? "text-right" : ""}`}>
                            {isMine ? "You shared a trip" : `${partner.username} shared a trip`}
                          </p>
                          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                            {ts.cityFlags.length > 0 && (
                              <div className="bg-primary/5 px-4 py-2 flex flex-wrap gap-1.5">
                                {ts.cityFlags.map((f, i) => (
                                  <span key={i} className="text-xs bg-background border border-border rounded-full px-2 py-0.5">{f}</span>
                                ))}
                              </div>
                            )}
                            <div className="p-3">
                              <p className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5 text-primary" /> {ts.tripName}
                              </p>
                              {ts.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{ts.description}</p>}
                              <Link
                                to={`/trips?tripId=${ts.tripId}`}
                                className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                              >
                                <ExternalLink className="h-3 w-3" /> View Trip
                              </Link>
                            </div>
                          </div>
                          <p className={`text-[10px] text-muted-foreground px-1 ${isMine ? "text-right" : ""}`}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    );
                  }
                  // Normal message
                  return (
                    <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${isMine ? "bg-primary text-primary-foreground rounded-br-md" : "bg-secondary text-secondary-foreground rounded-bl-md"}`}>
                        <p>{msg.text}</p>
                        <p className={`text-[10px] mt-1 ${isMine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Trip picker overlay */}
              {showTripPicker && (
                <div className="border-t border-border bg-card p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">Share a trip</p>
                    <button onClick={() => setShowTripPicker(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
                  </div>
                  {allMyTrips.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2">You have no trips yet. <Link to="/trips" className="text-primary hover:underline">Create one →</Link></p>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {allMyTrips.map((trip) => (
                        <button key={trip.id} onClick={() => handleShareTrip(trip)}
                          className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left">
                          <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{trip.name}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Users className="h-3 w-3" />{trip.members.length}/{trip.maxMembers} travelers · {trip.stops.length} cities
                            </p>
                          </div>
                          {trip.isPublic && <span className="text-[10px] text-primary border border-primary/30 rounded-full px-1.5 py-0.5">Public</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="border-t border-border p-3 bg-card">
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowTripPicker(!showTripPicker)}
                    className={`flex-shrink-0 h-9 w-9 flex items-center justify-center rounded-md border transition-colors ${showTripPicker ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:border-primary hover:text-primary"}`}
                    title="Share a trip"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                  <Input
                    value={newMsg}
                    onChange={(e) => setNewMsg(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1"
                    onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
                  />
                  <Button size="icon" onClick={handleSend} disabled={!newMsg.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageCircle className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Select a conversation</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
