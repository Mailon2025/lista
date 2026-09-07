import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PlaylistProvider } from "@/contexts/PlaylistContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { ParentalProvider } from "@/contexts/ParentalContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { HomeScreen } from "@/components/home/HomeScreen";
import { LiveTVPage } from "@/pages/LiveTV";
import { MoviesPage } from "@/pages/Movies";
import { SeriesPage } from "@/pages/Series";
import { SeriesDetailPage } from "@/components/content/SeriesDetail";
import { WatchPage } from "@/pages/Watch";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SettingsProvider>
        <PlaylistProvider>
          <ParentalProvider>
            <FavoritesProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<HomeScreen />} />
                  <Route path="/live" element={<LiveTVPage />} />
                  <Route path="/movies" element={<MoviesPage />} />
                  <Route path="/series" element={<SeriesPage />} />
                  <Route path="/series/:seriesName" element={<SeriesDetailPage />} />
                  <Route path="/watch/:channelId" element={<WatchPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </FavoritesProvider>
          </ParentalProvider>
        </PlaylistProvider>
      </SettingsProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
