import { useState, useEffect, useCallback } from "react";
import { getCurrentUser } from "@/lib/session";

export interface TripStop {
  id: string;
  locationId: string;
  nights: number;
  notes: string;
  order: number;
}

export interface TripMessage {
  id: string;
  authorId: string;
  text: string;
  timestamp: string;
  reactions: Record<string, string[]>;
}

export interface PackingItem {
  id: string;
  text: string;
  checkedBy: string[];
  addedBy: string;
}

export interface TripPoll {
  id: string;
  question: string;
  options: { id: string; label: string; votes: string[] }[];
  createdBy: string;
  createdAt: string;
}

export interface JoinRequest {
  id: string;
  userId: string;
  message: string;
  status: "pending" | "approved" | "rejected";
  requestedAt: string;
}

export interface Trip {
  id: string;
  userId: string;
  name: string;
  description: string;
  stops: TripStop[];
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  maxMembers: number;
  members: string[];
  messages: TripMessage[];
  travelStyles: string[];
  budget: "budget" | "mid" | "luxury" | "";
  startDate: string;
  endDate: string;
  packingList: PackingItem[];
  polls: TripPoll[];
  joinRequests: JoinRequest[];
}

export const TRAVEL_STYLES = [
  { id: "backpacker", label: "🎒 Backpacker" },
  { id: "foodie", label: "🍜 Foodie" },
  { id: "adventure", label: "🧗 Adventure" },
  { id: "culture", label: "🏛️ Culture" },
  { id: "nightlife", label: "🎉 Nightlife" },
  { id: "nature", label: "🌿 Nature" },
  { id: "photography", label: "📸 Photography" },
  { id: "luxury", label: "✨ Luxury" },
  { id: "digital-nomad", label: "💻 Digital Nomad" },
  { id: "solo", label: "🧍 Solo Friendly" },
];

export const BUDGET_LABELS: Record<string, string> = {
  budget: "💸 Budget",
  mid: "💳 Mid-range",
  luxury: "💎 Luxury",
};

const TRIPS_KEY = "atlashub_trips";
function generateId() { return Math.random().toString(36).substring(2, 10); }

function loadTrips(): Trip[] {
  try {
    const raw = localStorage.getItem(TRIPS_KEY);
    const trips = raw ? JSON.parse(raw) : [];
    return trips.map((t: any) => ({
      ...t,
      members: t.members ?? [],
      messages: (t.messages ?? []).map((m: any) => ({ ...m, reactions: m.reactions ?? {} })),
      stops: t.stops ?? [],
      maxMembers: typeof t.maxMembers === "number" && !isNaN(t.maxMembers) ? t.maxMembers : 6,
      travelStyles: t.travelStyles ?? [],
      budget: t.budget ?? "",
      startDate: t.startDate ?? "",
      endDate: t.endDate ?? "",
      packingList: t.packingList ?? [],
      polls: t.polls ?? [],
      joinRequests: t.joinRequests ?? [],
    }));
  } catch { return []; }
}

function saveTrips(trips: Trip[]) {
  localStorage.setItem(TRIPS_KEY, JSON.stringify(trips));
}

export function useTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const user = getCurrentUser();

  useEffect(() => { setTrips(loadTrips()); }, []);
  const refresh = useCallback(() => { setTrips(loadTrips()); }, []);

  const myTrips = user ? trips.filter((t) => t.userId === user.id) : [];
  const joinedTrips = user ? trips.filter((t) => t.userId !== user.id && (t.members ?? []).includes(user.id)) : [];
  const publicTrips = trips.filter((t) => t.isPublic && t.userId !== user?.id && !(t.members ?? []).includes(user?.id ?? ""));

  const createTrip = useCallback((opts: {
    name: string; description: string; maxMembers?: number;
    travelStyles?: string[]; budget?: Trip["budget"]; startDate?: string; endDate?: string;
  }) => {
    if (!user) return null;
    const trip: Trip = {
      id: generateId(), userId: user.id, name: opts.name, description: opts.description,
      stops: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      isPublic: false, maxMembers: opts.maxMembers ?? 6, members: [user.id], messages: [],
      travelStyles: opts.travelStyles ?? [], budget: opts.budget ?? "",
      startDate: opts.startDate ?? "", endDate: opts.endDate ?? "",
      packingList: [], polls: [], joinRequests: [],
    };
    const updated = [...loadTrips(), trip];
    saveTrips(updated); setTrips(updated);
    return trip;
  }, [user]);

  const deleteTrip = useCallback((tripId: string) => {
    const updated = loadTrips().filter((t) => t.id !== tripId);
    saveTrips(updated); setTrips(updated);
  }, []);

  // Request to join (instead of instant join)
  const requestJoin = useCallback((tripId: string, message: string = ""): "ok" | "full" | "already_member" | "already_requested" | "error" => {
    if (!user) return "error";
    const all = loadTrips();
    const idx = all.findIndex((t) => t.id === tripId);
    if (idx === -1) return "error";
    const trip = all[idx];
    if ((trip.members ?? []).includes(user.id)) return "already_member";
    if ((trip.joinRequests ?? []).some((r) => r.userId === user.id && r.status === "pending")) return "already_requested";
    if ((trip.members ?? []).length >= trip.maxMembers) return "full";
    const req: JoinRequest = {
      id: generateId(), userId: user.id, message: message.trim(),
      status: "pending", requestedAt: new Date().toISOString(),
    };
    all[idx].joinRequests = [...(trip.joinRequests ?? []), req];
    all[idx].updatedAt = new Date().toISOString();
    saveTrips(all); setTrips([...all]);
    return "ok";
  }, [user]);

  const approveRequest = useCallback((tripId: string, requestId: string) => {
    const all = loadTrips();
    const idx = all.findIndex((t) => t.id === tripId);
    if (idx === -1) return;
    const req = all[idx].joinRequests.find((r) => r.id === requestId);
    if (!req) return;
    all[idx].joinRequests = all[idx].joinRequests.map((r) =>
      r.id === requestId ? { ...r, status: "approved" } : r
    );
    if (!all[idx].members.includes(req.userId)) {
      all[idx].members = [...all[idx].members, req.userId];
    }
    all[idx].updatedAt = new Date().toISOString();
    saveTrips(all); setTrips([...all]);
    return req.userId;
  }, []);

  const rejectRequest = useCallback((tripId: string, requestId: string) => {
    const all = loadTrips();
    const idx = all.findIndex((t) => t.id === tripId);
    if (idx === -1) return;
    all[idx].joinRequests = all[idx].joinRequests.map((r) =>
      r.id === requestId ? { ...r, status: "rejected" } : r
    );
    all[idx].updatedAt = new Date().toISOString();
    saveTrips(all); setTrips([...all]);
  }, []);

  const leaveTrip = useCallback((tripId: string) => {
    if (!user) return;
    const all = loadTrips();
    const idx = all.findIndex((t) => t.id === tripId);
    if (idx === -1) return;
    all[idx].members = all[idx].members.filter((id) => id !== user.id);
    all[idx].updatedAt = new Date().toISOString();
    saveTrips(all); setTrips([...all]);
  }, [user]);

  const sendMessage = useCallback((tripId: string, text: string) => {
    if (!user || !text.trim()) return;
    const all = loadTrips();
    const idx = all.findIndex((t) => t.id === tripId);
    if (idx === -1) return;
    const msg: TripMessage = { id: generateId(), authorId: user.id, text: text.trim(), timestamp: new Date().toISOString(), reactions: {} };
    all[idx].messages = [...(all[idx].messages ?? []), msg];
    all[idx].updatedAt = new Date().toISOString();
    saveTrips(all); setTrips([...all]);
  }, [user]);

  const reactToMessage = useCallback((tripId: string, msgId: string, emoji: string) => {
    if (!user) return;
    const all = loadTrips();
    const ti = all.findIndex((t) => t.id === tripId);
    if (ti === -1) return;
    all[ti].messages = all[ti].messages.map((m) => {
      if (m.id !== msgId) return m;
      const current = m.reactions[emoji] ?? [];
      const hasReacted = current.includes(user.id);
      return { ...m, reactions: { ...m.reactions, [emoji]: hasReacted ? current.filter((id) => id !== user.id) : [...current, user.id] } };
    });
    saveTrips(all); setTrips([...all]);
  }, [user]);

  const addStop = useCallback((tripId: string, locationId: string) => {
    const all = loadTrips();
    const idx = all.findIndex((t) => t.id === tripId);
    if (idx === -1) return;
    const stop: TripStop = { id: generateId(), locationId, nights: 3, notes: "", order: all[idx].stops.length };
    all[idx].stops = [...all[idx].stops, stop];
    all[idx].updatedAt = new Date().toISOString();
    saveTrips(all); setTrips([...all]);
  }, []);

  const removeStop = useCallback((tripId: string, stopId: string) => {
    const all = loadTrips();
    const idx = all.findIndex((t) => t.id === tripId);
    if (idx === -1) return;
    all[idx].stops = all[idx].stops.filter((s) => s.id !== stopId).map((s, i) => ({ ...s, order: i }));
    all[idx].updatedAt = new Date().toISOString();
    saveTrips(all); setTrips([...all]);
  }, []);

  const updateStop = useCallback((tripId: string, stopId: string, patch: Partial<TripStop>) => {
    const all = loadTrips();
    const idx = all.findIndex((t) => t.id === tripId);
    if (idx === -1) return;
    all[idx].stops = all[idx].stops.map((s) => s.id === stopId ? { ...s, ...patch } : s);
    all[idx].updatedAt = new Date().toISOString();
    saveTrips(all); setTrips([...all]);
  }, []);

  const reorderStops = useCallback((tripId: string, fromIdx: number, toIdx: number) => {
    const all = loadTrips();
    const idx = all.findIndex((t) => t.id === tripId);
    if (idx === -1) return;
    const stops = [...all[idx].stops];
    const [moved] = stops.splice(fromIdx, 1);
    stops.splice(toIdx, 0, moved);
    all[idx].stops = stops.map((s, i) => ({ ...s, order: i }));
    all[idx].updatedAt = new Date().toISOString();
    saveTrips(all); setTrips([...all]);
  }, []);

  const togglePublic = useCallback((tripId: string) => {
    const all = loadTrips();
    const idx = all.findIndex((t) => t.id === tripId);
    if (idx === -1) return;
    all[idx].isPublic = !all[idx].isPublic;
    all[idx].updatedAt = new Date().toISOString();
    saveTrips(all); setTrips([...all]);
  }, []);

  const updateMaxMembers = useCallback((tripId: string, max: number) => {
    const all = loadTrips();
    const idx = all.findIndex((t) => t.id === tripId);
    if (idx === -1) return;
    all[idx].maxMembers = Math.max(all[idx].members.length, Math.min(20, max));
    all[idx].updatedAt = new Date().toISOString();
    saveTrips(all); setTrips([...all]);
  }, []);

  const addPackingItem = useCallback((tripId: string, text: string) => {
    if (!user || !text.trim()) return;
    const all = loadTrips();
    const idx = all.findIndex((t) => t.id === tripId);
    if (idx === -1) return;
    const item: PackingItem = { id: generateId(), text: text.trim(), checkedBy: [], addedBy: user.id };
    all[idx].packingList = [...(all[idx].packingList ?? []), item];
    all[idx].updatedAt = new Date().toISOString();
    saveTrips(all); setTrips([...all]);
  }, [user]);

  const togglePackingItem = useCallback((tripId: string, itemId: string) => {
    if (!user) return;
    const all = loadTrips();
    const idx = all.findIndex((t) => t.id === tripId);
    if (idx === -1) return;
    all[idx].packingList = all[idx].packingList.map((item) => {
      if (item.id !== itemId) return item;
      const checked = item.checkedBy.includes(user.id);
      return { ...item, checkedBy: checked ? item.checkedBy.filter((id) => id !== user.id) : [...item.checkedBy, user.id] };
    });
    all[idx].updatedAt = new Date().toISOString();
    saveTrips(all); setTrips([...all]);
  }, [user]);

  const removePackingItem = useCallback((tripId: string, itemId: string) => {
    const all = loadTrips();
    const idx = all.findIndex((t) => t.id === tripId);
    if (idx === -1) return;
    all[idx].packingList = all[idx].packingList.filter((i) => i.id !== itemId);
    all[idx].updatedAt = new Date().toISOString();
    saveTrips(all); setTrips([...all]);
  }, []);

  const createPoll = useCallback((tripId: string, question: string, options: string[]) => {
    if (!user || !question.trim() || options.length < 2) return;
    const all = loadTrips();
    const idx = all.findIndex((t) => t.id === tripId);
    if (idx === -1) return;
    const poll: TripPoll = {
      id: generateId(), question: question.trim(),
      options: options.filter(o => o.trim()).map((o) => ({ id: generateId(), label: o.trim(), votes: [] })),
      createdBy: user.id, createdAt: new Date().toISOString(),
    };
    all[idx].polls = [...(all[idx].polls ?? []), poll];
    all[idx].updatedAt = new Date().toISOString();
    saveTrips(all); setTrips([...all]);
  }, [user]);

  const votePoll = useCallback((tripId: string, pollId: string, optionId: string) => {
    if (!user) return;
    const all = loadTrips();
    const idx = all.findIndex((t) => t.id === tripId);
    if (idx === -1) return;
    all[idx].polls = all[idx].polls.map((p) => {
      if (p.id !== pollId) return p;
      return {
        ...p,
        options: p.options.map((o) => ({
          ...o,
          votes: o.id === optionId
            ? o.votes.includes(user.id) ? o.votes.filter((v) => v !== user.id) : [...o.votes, user.id]
            : o.votes.filter((v) => v !== user.id),
        })),
      };
    });
    all[idx].updatedAt = new Date().toISOString();
    saveTrips(all); setTrips([...all]);
  }, [user]);

  const getTotalNights = (trip: Trip) => trip.stops.reduce((acc, s) => acc + s.nights, 0);
  const getTripById = (id: string) => loadTrips().find((t) => t.id === id);

  return {
    trips, myTrips, joinedTrips, publicTrips,
    createTrip, deleteTrip,
    requestJoin, approveRequest, rejectRequest, leaveTrip,
    sendMessage, reactToMessage,
    addStop, removeStop, updateStop, reorderStops,
    togglePublic, updateMaxMembers,
    addPackingItem, togglePackingItem, removePackingItem,
    createPoll, votePoll,
    getTotalNights, getTripById, refresh,
  };
}
