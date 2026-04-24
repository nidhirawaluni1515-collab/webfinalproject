import { useState, useEffect, useCallback, useRef } from "react";
import { usePosts } from "./use-posts";
import { useCurrentUser } from "./use-user-data";
import { getAllUsers } from "./use-user-data";

export type NotificationType = "like" | "comment";

export interface AppNotification {
  id: string;
  type: NotificationType;
  postId: string;
  fromUserId: string;
  fromUsername: string;
  preview?: string; // comment preview
  timestamp: string;
  read: boolean;
}

const NOTIF_KEY_PREFIX = "atlashub_notifs_";
const SEEN_KEY_PREFIX = "atlashub_notif_seen_";

function key(userId: string) {
  return NOTIF_KEY_PREFIX + userId;
}
function seenKey(userId: string) {
  return SEEN_KEY_PREFIX + userId;
}

function loadNotifs(userId: string): AppNotification[] {
  try {
    const raw = localStorage.getItem(key(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveNotifs(userId: string, notifs: AppNotification[]) {
  localStorage.setItem(key(userId), JSON.stringify(notifs.slice(0, 100)));
}

/**
 * Polls posts every few seconds, diffs likes & comments against a "seen" snapshot
 * stored per user, and generates notifications for new interactions on posts the
 * current user authored. This is the "near real-time" delivery mechanism.
 */
export function useNotifications() {
  const { user } = useCurrentUser();
  const { posts, reload } = usePosts();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const allUsersRef = useRef(getAllUsers());

  // Refresh on tab visibility
  useEffect(() => {
    if (!user) return;
    setNotifications(loadNotifs(user.id));
  }, [user?.id]);

  // Poll for new posts state every 5s
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      reload();
      allUsersRef.current = getAllUsers();
    }, 5000);
    return () => clearInterval(interval);
  }, [user?.id, reload]);

  // Diff posts against "seen" snapshot to detect new likes/comments
  useEffect(() => {
    if (!user) return;
    const seenRaw = localStorage.getItem(seenKey(user.id));
    const seen: Record<string, { likes: string[]; commentIds: string[] }> = seenRaw
      ? JSON.parse(seenRaw)
      : {};

    const newNotifs: AppNotification[] = [];
    const myPosts = posts.filter((p) => p.authorId === user.id);
    const findUsername = (id: string) =>
      allUsersRef.current.find((u) => u.id === id)?.username || "Someone";

    for (const post of myPosts) {
      const prev = seen[post.id] || { likes: [], commentIds: [] };

      // New likes
      for (const likerId of post.likes) {
        if (likerId === user.id) continue;
        if (!prev.likes.includes(likerId)) {
          newNotifs.push({
            id: `${post.id}-like-${likerId}-${Date.now()}`,
            type: "like",
            postId: post.id,
            fromUserId: likerId,
            fromUsername: findUsername(likerId),
            timestamp: new Date().toISOString(),
            read: false,
          });
        }
      }

      // New comments
      for (const c of post.comments) {
        if (c.authorId === user.id) continue;
        if (!prev.commentIds.includes(c.id)) {
          newNotifs.push({
            id: `${post.id}-comment-${c.id}`,
            type: "comment",
            postId: post.id,
            fromUserId: c.authorId,
            fromUsername: findUsername(c.authorId),
            preview: c.text.slice(0, 80),
            timestamp: c.timestamp,
            read: false,
          });
        }
      }
    }

    // Update seen snapshot
    const nextSeen: typeof seen = {};
    for (const post of myPosts) {
      nextSeen[post.id] = {
        likes: [...post.likes],
        commentIds: post.comments.map((c) => c.id),
      };
    }
    localStorage.setItem(seenKey(user.id), JSON.stringify(nextSeen));

    // First-ever load: don't spam — just establish baseline
    if (!seenRaw) return;

    if (newNotifs.length === 0) return;
    const existing = loadNotifs(user.id);
    const merged = [...newNotifs, ...existing];
    saveNotifs(user.id, merged);
    setNotifications(merged);
  }, [posts, user?.id]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = useCallback(() => {
    if (!user) return;
    const updated = notifications.map((n) => ({ ...n, read: true }));
    saveNotifs(user.id, updated);
    setNotifications(updated);
  }, [user?.id, notifications]);

  const clear = useCallback(() => {
    if (!user) return;
    saveNotifs(user.id, []);
    setNotifications([]);
  }, [user?.id]);

  return { notifications, unreadCount, markAllRead, clear };
}
