import { useState, useEffect, useCallback } from "react";

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  avatar: string;
  bio: string;
  favoriteLocations: string[];
  visitedLocations: string[];
  travelPhotos: TravelPhoto[];
  hiddenGems: HiddenGem[];
  homeCity?: string;       // e.g. "Lisbon, Portugal"
  homeCountryCode?: string; // ISO alpha-2
}

export interface TravelPhoto {
  id: string;
  locationId: string;
  url: string;
  caption: string;
  uploadedAt: string;
}

export interface HiddenGem {
  id: string;
  locationId: string;
  name: string;
  description: string;
  photoUrl?: string;
}

import {
  CURRENT_USER_KEY,
  ALL_USERS_KEY,
  getCurrentUser,
  setCurrentUser as sessionSetCurrentUser,
  upsertUserInDirectory,
} from "@/lib/session";

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

// Mock users for the Connect feature
const MOCK_USERS: UserProfile[] = [
  {
    id: "user-sarah",
    email: "sarah@travel.com",
    username: "SarahWanders",
    avatar: "",
    bio: "Solo traveler | 30 countries and counting 🌍",
    favoriteLocations: ["tokyo", "paris", "istanbul"],
    visitedLocations: ["tokyo", "paris", "istanbul", "london", "new-york", "sydney"],
    travelPhotos: [
      { id: "p1", locationId: "tokyo", url: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&q=80", caption: "Morning at Senso-ji Temple", uploadedAt: "2025-12-10" },
      { id: "p2", locationId: "paris", url: "https://images.unsplash.com/photo-1431274172761-fca41d930114?w=400&q=80", caption: "Sunset from Sacré-Cœur", uploadedAt: "2025-11-05" },
      { id: "p3", locationId: "istanbul", url: "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=400&q=80", caption: "Grand Bazaar treasures", uploadedAt: "2025-10-20" },
    ],
    hiddenGems: [
      { id: "h1", locationId: "tokyo", name: "Yanaka Ginza", description: "A charming old-town shopping street that feels like stepping back in time. Locals' favorite for street snacks." },
      { id: "h2", locationId: "paris", name: "Rue Crémieux", description: "The most colorful street in Paris — pastel houses and zero tourists on weekday mornings." },
    ],
  },
  {
    id: "user-marco",
    email: "marco@travel.com",
    username: "MarcoExplores",
    avatar: "",
    bio: "Food-first traveler 🍜 | Photographer",
    favoriteLocations: ["mumbai", "cairo", "mexico-city"],
    visitedLocations: ["mumbai", "cairo", "mexico-city", "rome", "tokyo"],
    travelPhotos: [
      { id: "p4", locationId: "mumbai", url: "https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?w=400&q=80", caption: "Marine Drive at golden hour", uploadedAt: "2025-09-15" },
      { id: "p5", locationId: "cairo", url: "https://images.unsplash.com/photo-1539768942893-daf53e736b68?w=400&q=80", caption: "Pyramids from a different angle", uploadedAt: "2025-08-12" },
    ],
    hiddenGems: [
      { id: "h3", locationId: "mumbai", name: "Banganga Tank", description: "An ancient water tank surrounded by temples, hidden in the heart of Malabar Hill." },
      { id: "h4", locationId: "cairo", name: "Al-Azhar Park", description: "A peaceful garden oasis overlooking Islamic Cairo — best views at sunset." },
    ],
  },
  {
    id: "user-emma",
    email: "emma@travel.com",
    username: "EmmaAbroad",
    avatar: "",
    bio: "Adventure seeker | Mountain lover ⛰️",
    favoriteLocations: ["sydney", "rio-de-janeiro", "cape-town"],
    visitedLocations: ["sydney", "rio-de-janeiro", "cape-town", "london", "paris"],
    travelPhotos: [
      { id: "p6", locationId: "sydney", url: "https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=400&q=80", caption: "Bondi Beach sunrise", uploadedAt: "2025-07-22" },
      { id: "p7", locationId: "rio-de-janeiro", url: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=400&q=80", caption: "View from Sugarloaf Mountain", uploadedAt: "2025-06-18" },
    ],
    hiddenGems: [
      { id: "h5", locationId: "sydney", name: "Wattamolla Beach", description: "A secluded beach in Royal National Park — lagoon, waterfall, and almost no crowds." },
    ],
  },
];

function loadAllUsers(): UserProfile[] {
  let stored: UserProfile[] = [];
  try {
    const raw = localStorage.getItem(ALL_USERS_KEY);
    if (raw) stored = JSON.parse(raw);
  } catch {}
  // Ensure mock users are always present (merged by id).
  const byId = new Map<string, UserProfile>();
  [...MOCK_USERS, ...stored].forEach((u) => byId.set(u.id, u));
  const merged = Array.from(byId.values());
  localStorage.setItem(ALL_USERS_KEY, JSON.stringify(merged));
  return merged;
}

export function getAllUsers(): UserProfile[] {
  return loadAllUsers();
}

export function getUserById(id: string): UserProfile | undefined {
  return loadAllUsers().find((u) => u.id === id);
}

export function useCurrentUser() {
  const [user, setUser] = useState<UserProfile | null>(null);

  const load = useCallback(() => {
    setUser(getCurrentUser());
  }, []);

  useEffect(() => {
    load();
    const handler = () => load();
    // Same-tab session changes
    window.addEventListener("atlashub:user-changed", handler);
    // Cross-tab directory updates (e.g. another tab updated this user's profile)
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("atlashub:user-changed", handler);
      window.removeEventListener("storage", handler);
    };
  }, [load]);

  const persist = useCallback((updated: UserProfile) => {
    sessionStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updated));
    upsertUserInDirectory(updated);
    setUser(updated);
  }, []);

  const update = useCallback((partial: Partial<UserProfile>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...partial };
      persist(updated);
      return updated;
    });
  }, [persist]);

  const toggleFavorite = useCallback((locationId: string) => {
    setUser((prev) => {
      if (!prev) return prev;
      const favs = prev.favoriteLocations.includes(locationId)
        ? prev.favoriteLocations.filter((id) => id !== locationId)
        : [...prev.favoriteLocations, locationId];
      const updated = { ...prev, favoriteLocations: favs };
      persist(updated);
      return updated;
    });
  }, [persist]);

  const toggleVisited = useCallback((locationId: string) => {
    setUser((prev) => {
      if (!prev) return prev;
      const visited = prev.visitedLocations.includes(locationId)
        ? prev.visitedLocations.filter((id) => id !== locationId)
        : [...prev.visitedLocations, locationId];
      const updated = { ...prev, visitedLocations: visited };
      persist(updated);
      return updated;
    });
  }, [persist]);

  const addPhoto = useCallback((photo: Omit<TravelPhoto, "id" | "uploadedAt">) => {
    setUser((prev) => {
      if (!prev) return prev;
      const newPhoto: TravelPhoto = { ...photo, id: generateId(), uploadedAt: new Date().toISOString().split("T")[0] };
      const updated = { ...prev, travelPhotos: [...prev.travelPhotos, newPhoto] };
      persist(updated);
      return updated;
    });
  }, [persist]);

  const addHiddenGem = useCallback((gem: Omit<HiddenGem, "id">) => {
    setUser((prev) => {
      if (!prev) return prev;
      const newGem: HiddenGem = { ...gem, id: generateId() };
      const updated = { ...prev, hiddenGems: [...prev.hiddenGems, newGem] };
      persist(updated);
      return updated;
    });
  }, [persist]);

  return { user, update, toggleFavorite, toggleVisited, addPhoto, addHiddenGem, reload: load };
}
