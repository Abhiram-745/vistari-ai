import { useLocation, useNavigate } from "react-router-dom";
import { Home, Users, Calendar, CalendarClock, ClipboardList, Trophy, BookOpen, Sparkles } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

interface AppSidebarProps {
  onNewTimetable?: () => void;
}

export function AppSidebar({ onNewTimetable }: AppSidebarProps) {
  const { open } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const mainItems = [
    { title: "Dashboard", url: "/", icon: Home },
    { title: "Calendar", url: "/calendar", icon: Calendar },
    { title: "Events", url: "/events", icon: CalendarClock },
    { title: "Homework", url: "/homework", icon: ClipboardList },
    { title: "Topic Mastery", url: "/topic-mastery", icon: Trophy },
  ];

  const socialItems = [
    { title: "Social", url: "/social", icon: Users },
    { title: "Groups", url: "/groups", icon: BookOpen },
  ];

  const isActive = (url: string) => {
    if (url === "/") {
      return currentPath === "/";
    }
    return currentPath.startsWith(url);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {/* New Timetable Button */}
        {onNewTimetable && (
          <div className="p-4">
            <Button
              onClick={onNewTimetable}
              className="w-full bg-gradient-primary hover:opacity-90 transition-all duration-200 shadow-md"
              size={open ? "default" : "icon"}
            >
              <Sparkles className="h-4 w-4" />
              {open && <span className="ml-2">New Timetable</span>}
            </Button>
          </div>
        )}

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => navigate(item.url)}
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <item.icon className="h-4 w-4" />
                    {open && <span>{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Social Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Social</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {socialItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => navigate(item.url)}
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <item.icon className="h-4 w-4" />
                    {open && <span>{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
