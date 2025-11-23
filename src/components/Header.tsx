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
import { Calendar, Plus, Home, LogOut, Settings, User, Sparkles, BookOpen, Users, Moon, Sun, ClipboardList, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import ProfileSettings from "./ProfileSettings";

interface HeaderProps {
  onNewTimetable?: () => void;
}

const Header = ({ onNewTimetable }: HeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showSettings, setShowSettings] = useState(false);
  const [profile, setProfile] = useState<{ full_name?: string; avatar_url?: string; id: string } | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
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
  }, []);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .single();
      
      setProfile({ full_name: data?.full_name || "", avatar_url: data?.avatar_url || undefined, id: user.id });
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
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <header className="glass-header sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div 
              className="flex items-center space-x-3 cursor-pointer group transition-all duration-300 hover:scale-110" 
              onClick={() => navigate("/")}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-hero rounded-xl blur-md opacity-60 group-hover:opacity-100 transition-all duration-300 animate-pulse"></div>
                <div className="relative bg-gradient-hero p-2.5 rounded-xl shadow-lg">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-display font-bold gradient-text">
                  Study Planner
                </h1>
                <p className="text-[10px] text-muted-foreground -mt-1 font-medium">Your revision companion</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                className="gap-2 hover:bg-gradient-primary/10 hover:text-primary hover-lift"
              >
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Dashboard</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/social")}
                className="gap-2 hover:bg-gradient-primary/10 hover:text-primary hover-lift"
              >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Social</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/groups")}
                className="gap-2 hover:bg-gradient-primary/10 hover:text-primary hover-lift"
              >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Groups</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/calendar")}
                className="gap-2 hover:bg-gradient-primary/10 hover:text-primary hover-lift"
              >
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Calendar</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/events")}
                className="gap-2 hover:bg-gradient-primary/10 hover:text-primary hover-lift"
              >
                <CalendarClock className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Events</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/homework")}
                className="gap-2 hover:bg-gradient-primary/10 hover:text-primary hover-lift"
              >
                <ClipboardList className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Homework</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="gap-2 hover:bg-primary/10 transition-all duration-200"
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
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  <span className="hidden sm:inline font-semibold">New Timetable</span>
                  <span className="sm:hidden font-semibold">New</span>
                </Button>
              )}
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
                        Study Account
                      </p>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-primary/10" />
                <DropdownMenuItem 
                  onClick={() => navigate("/")} 
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
