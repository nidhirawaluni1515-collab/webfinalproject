import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Location } from "@/data/locations";
import { Users, Globe, ChevronRight, Eye, EyeOff, X, Heart, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/use-user-data";
import { signInOrSignUp } from "@/lib/session";

interface LocationCardProps {
  location: Location;
}

export function LocationCard({ location }: LocationCardProps) {
  const [showAuth, setShowAuth] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, toggleFavorite, toggleVisited } = useCurrentUser();

  const isLoggedIn = !!user;
  const isFavorite = user?.favoriteLocations.includes(location.id) ?? false;
  const isVisited = user?.visitedLocations.includes(location.id) ?? false;

  const handleCardClick = () => {
    if (isLoggedIn) {
      navigate(`/location/${location.id}`);
    } else {
      setShowAuth(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signInOrSignUp({ email, username });
    toast({ title: isLogin ? "Welcome back!" : "Account created!", description: `Exploring ${location.city}...` });
    setShowAuth(false);
    navigate(`/location/${location.id}`);
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn) { setShowAuth(true); return; }
    toggleFavorite(location.id);
    toast({ title: isFavorite ? "Removed from favorites" : `❤️ ${location.city} added to favorites!` });
  };

  const handleVisited = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn) { setShowAuth(true); return; }
    toggleVisited(location.id);
    toast({ title: isVisited ? "Removed from visited" : `✈️ ${location.city} marked as visited!` });
  };
  console.log(location.image, "image path");

  return (
    <>
      <div onClick={handleCardClick} className="group block cursor-pointer">
        <div className="overflow-hidden rounded-xl bg-card border border-border shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
          <div className="relative h-52 overflow-hidden">
            <img
              src={location.image}
              alt={location.city}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
            <div className="absolute top-3 right-3 flex items-center gap-1.5">
              <button
                onClick={handleFavorite}
                className={`flex items-center justify-center h-8 w-8 rounded-full backdrop-blur-sm transition-colors ${
                  isFavorite ? "bg-destructive/90 text-destructive-foreground" : "bg-card/30 text-card hover:bg-card/50"
                }`}
                title="Like"
              >
                <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
              </button>
              <button
                onClick={handleVisited}
                className={`flex items-center justify-center h-8 w-8 rounded-full backdrop-blur-sm transition-colors ${
                  isVisited ? "bg-primary/90 text-primary-foreground" : "bg-card/30 text-card hover:bg-card/50"
                }`}
                title="Mark as visited"
              >
                <Plane className={`h-4 w-4 ${isVisited ? "fill-current" : ""}`} />
              </button>
            </div>
            <div className="absolute top-3 left-3 text-2xl">{location.flag}</div>
            <div className="absolute bottom-3 left-3 right-3">
              <h3 className="font-display text-xl font-bold text-card">{location.city}</h3>
              <p className="text-sm text-card/80">{location.country}</p>
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {location.population}
              </span>
              <span className="flex items-center gap-1">
                <Globe className="h-3 w-3" />
                {location.language.split(",")[0]}
              </span>
            </div>
            <div className="flex items-center justify-center gap-1 rounded-lg border border-border py-2 text-sm text-muted-foreground group-hover:text-foreground group-hover:border-primary/30 transition-colors">
              Explore <ChevronRight className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>

      {showAuth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm" onClick={() => setShowAuth(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm mx-4 rounded-xl border border-border bg-card p-6 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground">{isLogin ? "Sign in" : "Create account"}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">to explore {location.city} {location.flag}</p>
              </div>
              <button onClick={() => setShowAuth(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              {!isLogin && (
                <div className="space-y-1.5">
                  <Label htmlFor={`username-${location.id}`} className="text-xs">Username</Label>
                  <Input id={`username-${location.id}`} value={username} onChange={(e) => setUsername(e.target.value)} placeholder="traveler42" required />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor={`email-${location.id}`} className="text-xs">Email</Label>
                <Input id={`email-${location.id}`} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`password-${location.id}`} className="text-xs">Password</Label>
                <div className="relative">
                  <Input
                    id={`password-${location.id}`}
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full">{isLogin ? "Sign In" : "Create Account"}</Button>
            </form>
            <p className="text-center text-xs text-muted-foreground">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button onClick={() => setIsLogin(!isLogin)} className="text-primary hover:underline font-medium">
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>
        </div>
      )}
    </>
  );
}
