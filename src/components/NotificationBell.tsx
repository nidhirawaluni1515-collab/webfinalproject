import { Link } from "react-router-dom";
import { Bell, Heart, MessageCircle } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/use-notifications";
import { useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

export function NotificationBell() {
  const { notifications, unreadCount, markAllRead, clear } = useNotifications();
  const { toast } = useToast();
  const lastSeenIdsRef = useRef<Set<string>>(new Set());

  // Toast when new unread notifications arrive
  useEffect(() => {
    const newOnes = notifications.filter(
      (n) => !n.read && !lastSeenIdsRef.current.has(n.id),
    );
    // Only toast after baseline is established
    if (lastSeenIdsRef.current.size > 0 && newOnes.length > 0) {
      const latest = newOnes[0];
      toast({
        title:
          latest.type === "like"
            ? `❤️ ${latest.fromUsername} liked your post`
            : `💬 ${latest.fromUsername} commented`,
        description: latest.preview,
      });
    }
    notifications.forEach((n) => lastSeenIdsRef.current.add(n.id));
  }, [notifications, toast]);

  return (
    <Popover onOpenChange={(open) => open && unreadCount > 0 && markAllRead()}>
      <PopoverTrigger asChild>
        <button
          className="relative h-9 w-9 inline-flex items-center justify-center rounded-full hover:bg-secondary transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5 text-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
          <span className="text-sm font-semibold">Notifications</span>
          {notifications.length > 0 && (
            <button
              onClick={clear}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              No notifications yet.
            </p>
          ) : (
            notifications.map((n) => (
              <Link
                key={n.id}
                to="/feed"
                className="flex gap-3 px-3 py-2.5 border-b border-border/50 last:border-0 hover:bg-secondary/50 transition-colors"
              >
                <div className="mt-0.5">
                  {n.type === "like" ? (
                    <Heart className="h-4 w-4 text-destructive fill-current" />
                  ) : (
                    <MessageCircle className="h-4 w-4 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground">
                    <span className="font-semibold">{n.fromUsername}</span>{" "}
                    {n.type === "like"
                      ? "liked your post"
                      : "commented on your post"}
                  </p>
                  {n.preview && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      "{n.preview}"
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {new Date(n.timestamp).toLocaleString()}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
