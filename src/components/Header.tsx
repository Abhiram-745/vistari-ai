import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Plus, Home, LogOut, Settings, User, Sparkles, BookOpen, Users, Moon, Sun, ClipboardList, CalendarClock, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import ProfileSettings from "./ProfileSettings";
import { useUserRole, useUsageLimits } from "@/hooks/useUserRole";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  onNewTimetable?: () => void;
}

const Header = ({ onNewTimetable }: HeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showSettings, setShowSettings] = useState(false);
  const [profile, setProfile] = useState<{ full_name?: string; avatar_url?: string; id: string } | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const { data: userRole } = useUserRole();
  const { data: usageLimits } = useUsageLimits();
  const isOnDashboard = location.pathname === "/";
  const isOnSocial = location.pathname === "/social";

  useEffect(() => {
    loadProfile();
    // Load theme from localStorage
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    }

    // Set up realtime subscription for profile changes
    const channel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles'
        },
        () => {
          loadProfile();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      
      if (data) {
        setProfile({ full_name: data.full_name || "", avatar_url: data.avatar_url || undefined, id: user.id });
      } else {
        // Create profile if doesn't exist - use email username as fallback
        const emailUsername = user.email?.split('@')[0] || "User";
        const fallbackName = user.user_metadata?.full_name || emailUsername;
        await supabase.from("profiles").insert({ 
          id: user.id, 
          full_name: fallbackName 
        });
        setProfile({ full_name: fallbackName, id: user.id });
      }
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
    toast.success("Signed out successfully");
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
    localStorage.setItem("theme", newTheme);
    toast.success(`${newTheme === "dark" ? "Dark" : "Light"} mode enabled`);
  };

  const getInitials = (name?: string) => {
    if (!name || name.trim() === "") return "U";
    return name
      .split(" ")
      .filter(n => n.length > 0)
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <header className="glass-header sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 h-16">
            {/* Logo */}
            <div 
              className="flex-shrink-0 flex items-center space-x-2 cursor-pointer group transition-all duration-300 hover:scale-105" 
              onClick={() => navigate("/dashboard")}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-hero rounded-xl blur-md opacity-60 group-hover:opacity-100 transition-all duration-300 animate-pulse"></div>
                <div className="relative bg-gradient-hero p-2 rounded-xl shadow-lg">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="hidden sm:flex flex-col">
                <h1 className="text-lg font-display font-bold gradient-text">
                  Study Planner
                </h1>
                <p className="text-[9px] text-muted-foreground -mt-1 font-medium">Your revision companion</p>
              </div>
            </div>

            {/* Scrollable Navigation */}
            <div className="flex-1 overflow-x-auto scrollbar-hide">
              <div className="flex items-center gap-1 px-2 min-w-max">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/dashboard")}
                  className="gap-1.5 hover:bg-gradient-primary/10 hover:text-primary hover-lift flex-shrink-0"
                >
                  <Home className="h-4 w-4" />
                  <span className="text-xs sm:text-sm font-medium">Dashboard</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/social")}
                  className="gap-1.5 hover:bg-gradient-primary/10 hover:text-primary hover-lift flex-shrink-0"
                >
                  <Users className="h-4 w-4" />
                  <span className="text-xs sm:text-sm font-medium">Social</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/groups")}
                  className="gap-1.5 hover:bg-gradient-primary/10 hover:text-primary hover-lift flex-shrink-0"
                >
                  <Users className="h-4 w-4" />
                  <span className="text-xs sm:text-sm font-medium">Groups</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/timetables")}
                  className="gap-1.5 hover:bg-gradient-primary/10 hover:text-primary hover-lift flex-shrink-0"
                >
                  <BookOpen className="h-4 w-4" />
                  <span className="text-xs sm:text-sm font-medium">Timetables</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/calendar")}
                  className="gap-1.5 hover:bg-gradient-primary/10 hover:text-primary hover-lift flex-shrink-0"
                >
                  <Calendar className="h-4 w-4" />
                  <span className="text-xs sm:text-sm font-medium">Calendar</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/events")}
                  className="gap-1.5 hover:bg-gradient-primary/10 hover:text-primary hover-lift flex-shrink-0"
                >
                  <CalendarClock className="h-4 w-4" />
                  <span className="text-xs sm:text-sm font-medium">Events</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/homework")}
                  className="gap-1.5 hover:bg-gradient-primary/10 hover:text-primary hover-lift flex-shrink-0"
                >
                  <ClipboardList className="h-4 w-4" />
                  <span className="text-xs sm:text-sm font-medium">Homework</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/test-scores")}
                  className="gap-1.5 hover:bg-gradient-primary/10 hover:text-primary hover-lift flex-shrink-0"
                >
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xs sm:text-sm font-medium">Test Scores</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleTheme}
                  className="gap-1.5 hover:bg-primary/10 transition-all duration-200 flex-shrink-0"
                >
                  {theme === "light" ? (
                    <Moon className="h-4 w-4" />
                  ) : (
                    <Sun className="h-4 w-4" />
                  )}
                </Button>
                
                {onNewTimetable && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={onNewTimetable}
                    className="gap-1.5 flex-shrink-0"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span className="text-xs sm:text-sm font-semibold">New</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="relative h-11 w-11 rounded-full hover:ring-2 hover:ring-primary/30 transition-all duration-300 hover:scale-110 hover:shadow-lg"
                >
                  <Avatar className="h-11 w-11 ring-2 ring-primary/30 shadow-md">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback className="bg-gradient-hero text-white font-bold text-sm">
                      {getInitials(profile?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 bg-green-500 rounded-full border-2 border-card shadow-sm animate-pulse"></div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className="w-64 glass-card z-50 animate-scale-in rounded-2xl" 
                align="end" 
                forceMount
              >
                <DropdownMenuLabel className="font-normal p-3">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12 ring-2 ring-primary/30">
                      <AvatarImage src={profile?.avatar_url} />
                      <AvatarFallback className="bg-gradient-primary text-white font-semibold">
                        {getInitials(profile?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-semibold leading-none">
                        {profile?.full_name || "User"}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        {userRole === "paid" ? "Premium Account" : "Free Account"}
                      </p>
                    </div>
                  </div>
                </DropdownMenuLabel>
                
                {/* Usage Limits for Free Users */}
                {userRole === "free" && usageLimits && (
                  <>
                    <DropdownMenuSeparator className="bg-primary/10" />
                    <div className="px-3 py-3 space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Daily Usage
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Timetable Creations</span>
                          <Badge variant={usageLimits.timetableCreations >= 1 ? "destructive" : "secondary"} className="text-xs">
                            {usageLimits.timetableCreations}/1
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Regenerations</span>
                          <Badge variant={usageLimits.timetableRegenerations >= 1 ? "destructive" : "secondary"} className="text-xs">
                            {usageLimits.timetableRegenerations}/1
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Daily Insights</span>
                          <Badge variant={usageLimits.dailyInsightsUsed ? "destructive" : "secondary"} className="text-xs">
                            {usageLimits.dailyInsightsUsed ? "Used" : "Available"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">AI Insights</span>
                          <Badge variant={usageLimits.aiInsightsGenerations >= 1 ? "destructive" : "secondary"} className="text-xs">
                            {usageLimits.aiInsightsGenerations}/1
                          </Badge>
                        </div>
                      </div>
                      <div className="pt-2">
                        <Button
                          onClick={() => navigate("/dashboard")}
                          size="sm"
                          className="w-full text-xs bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                        >
                          <Sparkles className="h-3 w-3 mr-1" />
                          Upgrade to Premium
                        </Button>
                      </div>
                    </div>
                  </>
                )}
                
                <DropdownMenuSeparator className="bg-primary/10" />
                <DropdownMenuItem
                  onClick={() => navigate("/dashboard")} 
                  className="cursor-pointer hover:bg-primary/10 transition-colors py-2.5"
                >
                  <Home className="mr-3 h-4 w-4 text-primary" />
                  <span className="font-medium">Dashboard</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setShowSettings(true)} 
                  className="cursor-pointer hover:bg-primary/10 transition-colors py-2.5"
                >
                  <Settings className="mr-3 h-4 w-4 text-primary" />
                  <span className="font-medium">Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-primary/10" />
                <DropdownMenuItem 
                  onClick={handleSignOut} 
                  className="cursor-pointer text-destructive hover:bg-destructive/10 transition-colors py-2.5"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  <span className="font-medium">Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <ProfileSettings
        open={showSettings}
        onOpenChange={setShowSettings}
        onProfileUpdate={loadProfile}
      />
    </>
  );
};

export default Header;
