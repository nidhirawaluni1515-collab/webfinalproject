import { useParams, Link } from "react-router-dom";
import { locations } from "@/data/locations";
import { CurrencyConverter } from "@/components/CurrencyConverter";
import { FloatingChat } from "@/components/FloatingChat";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, MapPin, Users, Globe, Clock, Send } from "lucide-react";
import { useState } from "react";

export default function LocationDetail() {
  const { id } = useParams();
  const location = locations.find((l) => l.id === id);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState(location?.chatMessages || []);

  if (!location) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Location not found</h1>
          <Link to="/" className="text-primary hover:underline">← Back to home</Link>
        </div>
      </div>
    );
  }

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    setChatMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), user: "You", avatar: "YO", text: chatInput, time: "now" },
    ]);
    setChatInput("");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <div className="sticky top-0 z-20 bg-card border-b border-border px-4 py-3">
        <div className="container mx-auto max-w-4xl flex items-center gap-4">
          <Link to="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{location.flag}</span>
            <div>
              <h1 className="text-lg font-bold text-foreground leading-tight">{location.city}</h1>
              <p className="text-sm text-primary">{location.country}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="relative h-56 md:h-72">
        <img src={location.image} alt={location.city} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/30 to-transparent" />
        <div className="absolute bottom-6 left-6 right-6">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-card mb-2">{location.city}</h2>
          <p className="text-card/90 text-sm md:text-base leading-relaxed max-w-2xl">{location.description}</p>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-8">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto mb-6 bg-muted">
            <TabsTrigger value="overview" className="gap-1.5">⊕ Overview</TabsTrigger>
            <TabsTrigger value="food" className="gap-1.5">🍴 Food</TabsTrigger>
            <TabsTrigger value="culture" className="gap-1.5">🏛️ Culture</TabsTrigger>
            <TabsTrigger value="currency" className="gap-1.5">$ Currency</TabsTrigger>
            {/* <TabsTrigger value="videos" className="gap-1.5">▶ Videos</TabsTrigger> */}
            <TabsTrigger value="chat" className="gap-1.5">💬 Chat</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-semibold text-foreground mb-4">Quick Facts</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { label: "Population", value: location.population },
                  { label: "Language", value: location.language },
                  { label: "Currency", value: location.currencyCode },
                  { label: "Timezone", value: location.timezone },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-base font-semibold text-foreground mt-0.5">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="food" className="space-y-4">
            <h2 className="font-display text-2xl font-bold text-foreground">Local Cuisine</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {location.dishes.map((dish) => (
                <div key={dish.name} className="rounded-xl border border-border bg-card p-5 flex gap-4">
                  <span className="text-3xl">{dish.emoji}</span>
                  <div>
                    <h3 className="font-semibold text-foreground">{dish.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{dish.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="culture" className="space-y-6">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-3">History</h2>
              <p className="text-muted-foreground leading-relaxed">{location.history}</p>
            </div>
            <div>
              <h3 className="font-display text-xl font-bold text-foreground mb-3">Festivals & Celebrations</h3>
              <div className="space-y-3">
                {location.festivals.map((f) => (
                  <div key={f.name} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-foreground">{f.name}</h4>
                      <span className="text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5">{f.period}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{f.description}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-display text-xl font-bold text-foreground mb-3">Local Traditions</h3>
              <ul className="space-y-2">
                {location.traditions.map((t) => (
                  <li key={t} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent flex-shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="currency" className="space-y-6">
            <CurrencyConverter defaultCurrency={location.currencyCode} />
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-semibold text-foreground mb-4">About {location.currencyCode}</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Currency Symbol</p>
                  <p className="text-2xl font-bold text-foreground">{location.currencySymbol}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Currency Code</p>
                  <p className="text-2xl font-bold text-foreground">{location.currencyCode}</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="videos">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {location.videos.map((v) => (
                <a
                  key={v.id + v.title}
                  href={`https://www.youtube.com/watch?v=${v.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="relative">
                    <img src={v.thumbnail} alt={v.title} className="w-full h-48 object-cover" loading="lazy" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-12 w-12 rounded-full bg-destructive flex items-center justify-center shadow-lg">
                        <span className="text-destructive-foreground text-lg ml-0.5">▶</span>
                      </div>
                    </div>
                  </div>
                  <p className="p-3 text-sm font-medium text-foreground">{v.title}</p>
                </a>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="chat" className="space-y-4">
            <h2 className="font-display text-2xl font-bold text-foreground">Community Chat — {location.city}</h2>
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="h-80 overflow-y-auto p-4 space-y-4">
                {chatMessages.map((m) => (
                  <div key={m.id} className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                      {m.avatar}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{m.user}</span>
                        <span className="text-xs text-muted-foreground">{m.time}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{m.text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-border p-3 flex gap-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                  placeholder={`Say something about ${location.city}...`}
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <button onClick={handleSendChat} className="rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 transition-colors">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

    </div>
  );
}
