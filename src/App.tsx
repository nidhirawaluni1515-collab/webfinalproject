import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import LocationDetail from "./pages/LocationDetail.tsx";
import GeoCity from "./pages/GeoCity.tsx";
import Auth from "./pages/Auth.tsx";
import Profile from "./pages/Profile.tsx";
import Connect from "./pages/Connect.tsx";
import PublicProfile from "./pages/PublicProfile.tsx";
import Inbox from "./pages/Inbox.tsx";
import Feed from "./pages/Feed.tsx";
import TripPlanner from "./pages/TripPlanner.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/location/:id" element={<LocationDetail />} />
          <Route path="/city/:cityName" element={<GeoCity />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/connect" element={<Connect />} />
          <Route path="/user/:userId" element={<PublicProfile />} />
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/trips" element={<TripPlanner />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
