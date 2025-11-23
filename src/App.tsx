import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import TimetableView from "./pages/TimetableView";
import CalendarView from "./pages/CalendarView";
import Social from "./pages/Social";
import Groups from "./pages/Groups";
import GroupDetail from "./components/groups/GroupDetail";
import ImportTimetable from "./pages/ImportTimetable";
import Events from "./pages/Events";
import Homework from "./pages/Homework";
import TopicMastery from "./pages/TopicMastery";
import NotFound from "./pages/NotFound";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <PWAInstallPrompt />
      <BrowserRouter>
        <Routes>
          {/* Auth routes without sidebar */}
          <Route path="/auth" element={<Auth />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Authenticated routes with sidebar */}
          <Route path="/*" element={
            <SidebarProvider>
              <div className="flex min-h-screen w-full">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/calendar" element={<CalendarView />} />
                  <Route path="/social" element={<Social />} />
                  <Route path="/groups" element={<Groups />} />
                  <Route path="/groups/:id" element={<GroupDetail />} />
                  <Route path="/import-timetable" element={<ImportTimetable />} />
                  <Route path="/events" element={<Events />} />
                  <Route path="/homework" element={<Homework />} />
                  <Route path="/topic-mastery" element={<TopicMastery />} />
                  <Route path="/timetable/:id" element={<TimetableView />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
            </SidebarProvider>
          } />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
