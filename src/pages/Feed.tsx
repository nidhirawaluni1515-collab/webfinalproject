import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Compass, ArrowLeft, Heart, MessageCircle, Send, Image, MapPin, Plus } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { locations } from "@/data/locations";
import { useCurrentUser, getAllUsers } from "@/hooks/use-user-data";
import { usePosts } from "@/hooks/use-posts";
import { useToast } from "@/hooks/use-toast";
import { NotificationBell } from "@/components/NotificationBell";

export default function Feed() {
  const { user } = useCurrentUser();
  const { posts, createPost, toggleLike, addComment } = usePosts();
  const { toast } = useToast();
  const allUsers = getAllUsers();
  const [showCompose, setShowCompose] = useState(false);
  const [composeText, setComposeText] = useState("");
  const [composeLocation, setComposeLocation] = useState("");
  const [composePhoto, setComposePhoto] = useState("");
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);

  const getUser = (id: string) => {
    if (user && id === user.id) return user;
    return allUsers.find((u) => u.id === id);
  };

  const handlePost = () => {
    if (!user || !composeText.trim()) return;
    createPost(user.id, composeText, composePhoto || undefined, composeLocation || undefined);
    setComposeText("");
    setComposePhoto("");
    setComposeLocation("");
    setShowCompose(false);
    toast({ title: "📝 Post published!" });
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setComposePhoto(URL.createObjectURL(file));
  };

  const handleComment = (postId: string) => {
    if (!user || !commentText[postId]?.trim()) return;
    addComment(postId, user.id, commentText[postId]);
    setCommentText((prev) => ({ ...prev, [postId]: "" }));
  };

  const toggleComments = (postId: string) => {
    setExpandedComments((prev) => {
      const next = new Set(prev);
      next.has(postId) ? next.delete(postId) : next.add(postId);
      return next;
    });
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
              <span className="font-display text-xl font-bold text-foreground">Feed</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {user && <NotificationBell />}
            {user && (
              <Button size="sm" onClick={() => setShowCompose(!showCompose)} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Post
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto max-w-xl px-4 py-6 space-y-4">
        {/* Compose */}
        {showCompose && user && (
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <Textarea
              value={composeText}
              onChange={(e) => setComposeText(e.target.value)}
              placeholder="Share your travel story..."
              className="min-h-[80px] resize-none"
            />
            {composePhoto && (
              <div className="relative">
                <img src={composePhoto} alt="Upload" className="w-full max-h-48 object-cover rounded-lg" />
                <button onClick={() => setComposePhoto("")} className="absolute top-2 right-2 bg-foreground/70 text-background rounded-full h-6 w-6 flex items-center justify-center text-xs">✕</button>
              </div>
            )}
            <div className="flex items-center gap-2">
              <button onClick={() => fileRef.current?.click()} className="text-muted-foreground hover:text-foreground transition-colors">
                <Image className="h-5 w-5" />
              </button>
              <select
                value={composeLocation}
                onChange={(e) => setComposeLocation(e.target.value)}
                className="h-8 rounded-md border border-input bg-background px-2 text-xs"
              >
                <option value="">📍 Add location</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>{l.flag} {l.city}</option>
                ))}
              </select>
              <div className="flex-1" />
              <Button size="sm" onClick={handlePost} disabled={!composeText.trim()}>Publish</Button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
          </div>
        )}

        {!user && (
          <div className="rounded-xl border border-border bg-card p-6 text-center">
            <p className="text-muted-foreground text-sm">
              <Link to="/auth" className="text-primary hover:underline font-medium">Sign in</Link> to create posts and interact with the community.
            </p>
          </div>
        )}

        {/* Posts */}
        {posts.map((post) => {
          const author = getUser(post.authorId);
          if (!author) return null;
          const initials = author.username.slice(0, 2).toUpperCase();
          const loc = post.locationId ? locations.find((l) => l.id === post.locationId) : null;
          const isLiked = user ? post.likes.includes(user.id) : false;
          const showingComments = expandedComments.has(post.id);

          return (
            <div key={post.id} className="rounded-xl border border-border bg-card overflow-hidden">
              {/* Author header */}
              <div className="flex items-center gap-3 p-4 pb-2">
                <Link to={post.authorId === user?.id ? "/profile" : `/user/${post.authorId}`}>
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{initials}</AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={post.authorId === user?.id ? "/profile" : `/user/${post.authorId}`} className="font-semibold text-foreground text-sm hover:underline">
                    {author.username}
                  </Link>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{new Date(post.timestamp).toLocaleDateString()}</span>
                    {loc && (
                      <span className="flex items-center gap-0.5">
                        <MapPin className="h-3 w-3" /> {loc.flag} {loc.city}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="px-4 pb-3">
                <p className="text-sm text-foreground whitespace-pre-wrap">{post.text}</p>
              </div>

              {post.photoUrl && (
                <img src={post.photoUrl} alt="Post" className="w-full max-h-80 object-cover" />
              )}

              {/* Actions */}
              <div className="flex items-center gap-4 px-4 py-3 border-t border-border">
                <button
                  onClick={() => user ? toggleLike(post.id, user.id) : toast({ title: "Sign in to like posts" })}
                  className={`flex items-center gap-1.5 text-sm transition-colors ${isLiked ? "text-destructive" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
                  {post.likes.length > 0 && post.likes.length}
                </button>
                <button
                  onClick={() => toggleComments(post.id)}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  {post.comments.length > 0 && post.comments.length}
                </button>
                {user && post.authorId !== user.id && (
                  <Link
                    to={`/inbox?chat=${post.authorId}`}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors ml-auto"
                  >
                    <Send className="h-4 w-4" /> Message
                  </Link>
                )}
              </div>

              {/* Comments */}
              {showingComments && (
                <div className="border-t border-border bg-secondary/30">
                  {post.comments.map((c) => {
                    const cAuthor = getUser(c.authorId);
                    return (
                      <div key={c.id} className="flex gap-2 px-4 py-2 border-b border-border/50 last:border-0">
                        <Avatar className="h-6 w-6 mt-0.5">
                          <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                            {cAuthor?.username.slice(0, 2).toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs">
                            <span className="font-semibold text-foreground">{cAuthor?.username || "Unknown"}</span>{" "}
                            <span className="text-muted-foreground">{c.text}</span>
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {new Date(c.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {user && (
                    <form
                      onSubmit={(e) => { e.preventDefault(); handleComment(post.id); }}
                      className="flex gap-2 p-3"
                    >
                      <Input
                        value={commentText[post.id] || ""}
                        onChange={(e) => setCommentText((prev) => ({ ...prev, [post.id]: e.target.value }))}
                        placeholder="Write a comment..."
                        className="flex-1 h-8 text-xs"
                      />
                      <Button type="submit" size="sm" variant="ghost" disabled={!commentText[post.id]?.trim()} className="h-8 px-2">
                        <Send className="h-3.5 w-3.5" />
                      </Button>
                    </form>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {posts.length === 0 && (
          <p className="text-center text-muted-foreground py-12 text-sm">No posts yet. Be the first to share!</p>
        )}
      </div>
    </div>
  );
}
