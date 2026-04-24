import { MessageCircle, X, Send } from "lucide-react";
import { useState } from "react";

export function FloatingChat() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    { id: "1", user: "TravelBot", avatar: "🤖", text: "Welcome! Pick a city to join its community chat.", time: "now" },
  ]);

  const handleSend = () => {
    if (!message.trim()) return;
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), user: "You", avatar: "👤", text: message, time: "now" },
    ]);
    setMessage("");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="mb-3 w-80 rounded-xl border border-border bg-card shadow-xl overflow-hidden animate-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between bg-primary px-4 py-3">
            <span className="text-sm font-medium text-primary-foreground">Travel Chat</span>
            <button onClick={() => setOpen(false)} className="text-primary-foreground/70 hover:text-primary-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="h-64 overflow-y-auto p-3 space-y-3">
            {messages.map((m) => (
              <div key={m.id} className="flex gap-2">
                <span className="text-lg">{m.avatar}</span>
                <div>
                  <span className="text-xs font-medium text-foreground">{m.user}</span>
                  <p className="text-sm text-muted-foreground">{m.text}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-border p-3 flex gap-2">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type a message..."
              className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button onClick={handleSend} className="rounded-lg bg-primary p-2 text-primary-foreground hover:bg-primary/90 transition-colors">
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all flex items-center justify-center hover:scale-105"
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </button>
    </div>
  );
}
