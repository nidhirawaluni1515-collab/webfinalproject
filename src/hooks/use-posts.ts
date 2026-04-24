import { useState, useEffect, useCallback } from "react";

export interface Post {
  id: string;
  authorId: string;
  text: string;
  photoUrl?: string;
  locationId?: string;
  timestamp: string;
  likes: string[]; // user IDs
  comments: PostComment[];
}

export interface PostComment {
  id: string;
  authorId: string;
  text: string;
  timestamp: string;
}

const POSTS_KEY = "atlashub_posts";

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

// Seed some mock posts
const MOCK_POSTS: Post[] = [
  {
    id: "post-1",
    authorId: "user-sarah",
    text: "Just arrived in Tokyo! The energy here is unreal. Senso-ji Temple at sunrise was absolutely magical ✨🇯🇵",
    photoUrl: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600&q=80",
    locationId: "tokyo",
    timestamp: "2026-04-12T10:30:00Z",
    likes: ["user-marco", "user-emma"],
    comments: [
      { id: "c1", authorId: "user-marco", text: "Amazing! Tokyo is on my list next 🙌", timestamp: "2026-04-12T11:00:00Z" },
    ],
  },
  {
    id: "post-2",
    authorId: "user-marco",
    text: "Street food in Mumbai is next level. Vada Pav from this tiny stall near Marine Drive — the best I've ever had 🍜",
    photoUrl: "https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?w=600&q=80",
    locationId: "mumbai",
    timestamp: "2026-04-11T16:20:00Z",
    likes: ["user-sarah"],
    comments: [],
  },
  {
    id: "post-3",
    authorId: "user-emma",
    text: "Bondi Beach at dawn. No words needed. 🌅🏄‍♀️",
    photoUrl: "https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=600&q=80",
    locationId: "sydney",
    timestamp: "2026-04-10T06:15:00Z",
    likes: ["user-sarah", "user-marco"],
    comments: [
      { id: "c2", authorId: "user-sarah", text: "This is stunning Emma! 😍", timestamp: "2026-04-10T07:00:00Z" },
    ],
  },
];

function normalizePost(p: any): Post | null {
  if (!p || typeof p !== "object" || !p.id || !p.authorId) return null;
  return {
    id: String(p.id),
    authorId: String(p.authorId),
    text: typeof p.text === "string" ? p.text : "",
    photoUrl: p.photoUrl || undefined,
    locationId: p.locationId || undefined,
    timestamp: p.timestamp || new Date().toISOString(),
    likes: Array.isArray(p.likes) ? p.likes.filter((x: any) => typeof x === "string") : [],
    comments: Array.isArray(p.comments)
      ? p.comments
          .filter((c: any) => c && c.id && c.authorId)
          .map((c: any) => ({
            id: String(c.id),
            authorId: String(c.authorId),
            text: typeof c.text === "string" ? c.text : "",
            timestamp: c.timestamp || new Date().toISOString(),
          }))
      : [],
  };
}

function loadPosts(): Post[] {
  try {
    const stored = localStorage.getItem(POSTS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        const normalized = parsed.map(normalizePost).filter((p): p is Post => p !== null);
        if (normalized.length > 0) return normalized;
      }
    }
  } catch {}
  localStorage.setItem(POSTS_KEY, JSON.stringify(MOCK_POSTS));
  return MOCK_POSTS;
}

function savePosts(posts: Post[]) {
  localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
}

export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([]);

  const reload = useCallback(() => {
    setPosts(loadPosts());
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const createPost = useCallback((authorId: string, text: string, photoUrl?: string, locationId?: string) => {
    const post: Post = {
      id: generateId(),
      authorId,
      text,
      photoUrl,
      locationId,
      timestamp: new Date().toISOString(),
      likes: [],
      comments: [],
    };
    const all = [post, ...loadPosts()];
    savePosts(all);
    setPosts(all);
    return post;
  }, []);

  const toggleLike = useCallback((postId: string, userId: string) => {
    const all = loadPosts().map((p) => {
      if (p.id !== postId) return p;
      const likes = p.likes.includes(userId)
        ? p.likes.filter((id) => id !== userId)
        : [...p.likes, userId];
      return { ...p, likes };
    });
    savePosts(all);
    setPosts(all);
  }, []);

  const addComment = useCallback((postId: string, authorId: string, text: string) => {
    const comment: PostComment = {
      id: generateId(),
      authorId,
      text,
      timestamp: new Date().toISOString(),
    };
    const all = loadPosts().map((p) =>
      p.id === postId ? { ...p, comments: [...p.comments, comment] } : p
    );
    savePosts(all);
    setPosts(all);
  }, []);

  return { posts, createPost, toggleLike, addComment, reload };
}
