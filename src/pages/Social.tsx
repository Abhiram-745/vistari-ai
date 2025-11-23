import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Trophy, TrendingUp } from "lucide-react";
import Header from "@/components/Header";
import { AppSidebar } from "@/components/AppSidebar";
import FriendsList from "@/components/social/FriendsList";
import AddFriend from "@/components/social/AddFriend";
import Leaderboard from "@/components/social/Leaderboard";
import SocialStats from "@/components/social/SocialStats";

const Social = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUserId(session.user.id);
      setLoading(false);
    } else {
      navigate("/auth");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <AppSidebar />
      
      <div className="flex-1 flex flex-col min-h-screen w-full bg-gradient-to-br from-background via-muted/50 to-background">
        <Header />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          <div className="space-y-6 animate-fade-in">
            {/* Header Section */}
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Social Hub
              </h1>
              <p className="text-muted-foreground">
                Connect with friends and compete on the leaderboard
              </p>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="friends" className="w-full">
              <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-3 gap-2 bg-muted/50">
                <TabsTrigger value="friends" className="gap-2">
                  <Users className="h-4 w-4" />
                  Friends
                </TabsTrigger>
                <TabsTrigger value="leaderboard" className="gap-2">
                  <Trophy className="h-4 w-4" />
                  Leaderboard
                </TabsTrigger>
                <TabsTrigger value="stats" className="gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Stats
                </TabsTrigger>
              </TabsList>

              <TabsContent value="friends" className="space-y-6 mt-6">
                <AddFriend userId={userId} />
                <FriendsList userId={userId} />
              </TabsContent>

              <TabsContent value="leaderboard" className="mt-6">
                <Leaderboard userId={userId} />
              </TabsContent>

              <TabsContent value="stats" className="mt-6">
                <SocialStats userId={userId} />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </>
  );
};

export default Social;
