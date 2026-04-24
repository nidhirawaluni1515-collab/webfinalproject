// Per-tab session for the currently logged-in user.
// Each browser tab has its OWN sessionStorage, so different tabs can be
// logged in as different users simultaneously. The full directory of users
// is still kept in localStorage (`atlashub_all_users`) so users in different
// tabs can discover each other, view profiles, and exchange messages.

import type { UserProfile } from "@/hooks/use-user-data";

export const CURRENT_USER_KEY = "atlashub_user";
export const ALL_USERS_KEY = "atlashub_all_users";

function genId() {
  return "u-" + Math.random().toString(36).substring(2, 10);
}

export function readAllUsers(): UserProfile[] {
  try {
    const raw = localStorage.getItem(ALL_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function writeAllUsers(users: UserProfile[]) {
  localStorage.setItem(ALL_USERS_KEY, JSON.stringify(users));
}

export function upsertUserInDirectory(user: UserProfile) {
  const all = readAllUsers();
  const idx = all.findIndex((u) => u.id === user.id);
  if (idx >= 0) all[idx] = user;
  else all.push(user);
  writeAllUsers(all);
}

export function findUserByEmail(email: string): UserProfile | undefined {
  return readAllUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function getCurrentUser(): UserProfile | null {
  try {
    const raw = sessionStorage.getItem(CURRENT_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: UserProfile) {
  // Ensure a unique id (don't reuse the legacy "current-user" placeholder).
  if (!user.id || user.id === "current-user") {
    const existing = findUserByEmail(user.email);
    user.id = existing?.id || genId();
  }
  sessionStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  upsertUserInDirectory(user);
  // Notify same-tab listeners.
  window.dispatchEvent(new Event("atlashub:user-changed"));
}

export function clearCurrentUser() {
  sessionStorage.removeItem(CURRENT_USER_KEY);
  window.dispatchEvent(new Event("atlashub:user-changed"));
}

/**
 * Sign in or sign up by email. If a user with this email already exists in
 * the shared directory, returns that record (preserving favorites, photos,
 * etc.). Otherwise creates a new one.
 */
export function signInOrSignUp(opts: {
  email: string;
  username?: string;
}): UserProfile {
  const existing = findUserByEmail(opts.email);
  const user: UserProfile = existing ?? {
    id: genId(),
    email: opts.email,
    username: opts.username || opts.email.split("@")[0],
    avatar: "",
    bio: "",
    favoriteLocations: [],
    visitedLocations: [],
    travelPhotos: [],
    hiddenGems: [],
  };
  setCurrentUser(user);
  return user;
}
