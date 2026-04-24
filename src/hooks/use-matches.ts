import { useMemo } from "react";
import type { UserProfile } from "@/hooks/use-user-data";
import { TRAVEL_STYLES } from "@/hooks/use-trips";

export interface MatchResult {
  userId: string;
  score: number;                      // 0–100
  sharedFavorites: string[];          // location ids
  sharedVisited: string[];            // location ids
  sharedStyles: string[];             // travel style ids
  sharedBudget: boolean;
  reasons: string[];                  // human-readable reasons shown in the UI
}

function extractStyles(bio: string): string[] {
  // Try to infer styles from bio keywords when no explicit styles stored
  const map: Record<string, string[]> = {
    adventure: ["adventure", "hike", "mountain", "trek"],
    foodie: ["food", "eat", "cuisine", "restaurant", "chef"],
    photography: ["photo", "camera", "photographer"],
    backpacker: ["backpack", "budget", "hostel"],
    culture: ["culture", "museum", "history", "heritage"],
    nature: ["nature", "wildlife", "beach", "ocean"],
    nightlife: ["nightlife", "party", "club", "bar"],
    luxury: ["luxury", "resort", "spa", "fine dining"],
    "digital-nomad": ["nomad", "remote", "freelance", "digital"],
    solo: ["solo", "alone", "independent"],
  };
  const lower = bio.toLowerCase();
  return Object.entries(map)
    .filter(([, keywords]) => keywords.some((k) => lower.includes(k)))
    .map(([id]) => id);
}

export function computeMatch(
  me: UserProfile,
  other: UserProfile
): MatchResult {
  const sharedFavorites = me.favoriteLocations.filter((id) =>
    other.favoriteLocations.includes(id)
  );
  const sharedVisited = me.visitedLocations.filter((id) =>
    other.visitedLocations.includes(id)
  );

  // Infer travel styles from bio if no explicit data
  const myStyles = me.favoriteLocations.length > 0
    ? extractStyles(me.bio ?? "")
    : [];
  const theirStyles = extractStyles(other.bio ?? "");
  const sharedStyles = myStyles.filter((s) => theirStyles.includes(s));

  const reasons: string[] = [];

  // Score weights
  let score = 0;

  // Shared favorites — highest weight (each = 15pts, cap 45)
  const favPts = Math.min(sharedFavorites.length * 15, 45);
  score += favPts;
  if (sharedFavorites.length > 0) {
    reasons.push(`Both love ${sharedFavorites.length} same destination${sharedFavorites.length > 1 ? "s" : ""}`);
  }

  // Shared visited — medium weight (each = 8pts, cap 24)
  const visitPts = Math.min(sharedVisited.length * 8, 24);
  score += visitPts;
  if (sharedVisited.length > 0) {
    reasons.push(`Visited ${sharedVisited.length} place${sharedVisited.length > 1 ? "s" : ""} in common`);
  }

  // Shared travel styles — (each = 8pts, cap 24)
  const stylePts = Math.min(sharedStyles.length * 8, 24);
  score += stylePts;
  if (sharedStyles.length > 0) {
    const labels = sharedStyles.map(
      (s) => TRAVEL_STYLES.find((ts) => ts.id === s)?.label ?? s
    );
    reasons.push(`Shared travel style: ${labels.slice(0, 2).join(", ")}`);
  }

  // Bonus: same home country
  const sharedBudget = false; // budget not on profile yet, reserved for future
  if (
    me.homeCountryCode &&
    other.homeCountryCode &&
    me.homeCountryCode === other.homeCountryCode
  ) {
    score += 7;
    reasons.push("Same home country");
  }

  // Cap at 100
  score = Math.min(score, 100);

  return {
    userId: other.id,
    score,
    sharedFavorites,
    sharedVisited,
    sharedStyles,
    sharedBudget,
    reasons,
  };
}

export function useMatches(
  me: UserProfile | null,
  allUsers: UserProfile[]
): MatchResult[] {
  return useMemo(() => {
    if (!me) return [];
    return allUsers
      .filter((u) => u.id !== me.id)
      .map((u) => computeMatch(me, u))
      .filter((m) => m.score > 0)
      .sort((a, b) => b.score - a.score);
  }, [me, allUsers]);
}
