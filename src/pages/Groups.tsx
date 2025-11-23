import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Users, Plus, Search, Lock, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Header from "@/components/Header";
import { AppSidebar } from "@/components/AppSidebar";
import { CreateGroupModal } from "@/components/groups/CreateGroupModal";
import { JoinGroupModal } from "@/components/groups/JoinGroupModal";

interface StudyGroup {
  id: string;
  name: string;
  description: string;
  subject: string;
  is_private: boolean;
  member_count: number;
  avatar_url: string;
}

const Groups = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [myGroups, setMyGroups] = useState<StudyGroup[]>([]);
  const [allGroups, setAllGroups] = useState<StudyGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        loadGroups(session.user.id);
      } else {
        navigate("/auth");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        loadGroups(session.user.id);
      } else {
        setUser(null);
        setMyGroups([]);
        setAllGroups([]);
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadGroups = async (userId: string) => {
    try {
      setLoading(true);

      // Load user's groups
      const { data: memberData } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', userId);

      if (memberData) {
        const groupIds = memberData.map(m => m.group_id);
        
        if (groupIds.length > 0) {
          const { data: groupsData } = await supabase
            .from('study_groups')
            .select('*')
            .in('id', groupIds);

          if (groupsData) {
            const groupsWithCounts = await Promise.all(
              groupsData.map(async (group) => {
                const { count } = await supabase
                  .from('group_members')
                  .select('*', { count: 'exact', head: true })
                  .eq('group_id', group.id);

                return {
                  ...group,
                  member_count: count || 0
                };
              })
            );
            setMyGroups(groupsWithCounts);
          } else {
            setMyGroups([]);
          }
        } else {
          setMyGroups([]);
        }
      }

      // Load all public groups
      const { data: publicGroups } = await supabase
        .from('study_groups')
        .select('*')
        .eq('is_private', false);

      if (publicGroups) {
        const groupsWithCounts = await Promise.all(
          publicGroups.map(async (group) => {
            const { count } = await supabase
              .from('group_members')
              .select('*', { count: 'exact', head: true })
              .eq('group_id', group.id);

            return {
              ...group,
              member_count: count || 0
            };
          })
        );
        setAllGroups(groupsWithCounts);
      } else {
        setAllGroups([]);
      }
    } catch (error) {
      console.error('Error loading groups:', error);
      toast.error('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const filteredGroups = allGroups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.subject?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <AppSidebar />
      
      <div className="flex-1 flex flex-col min-h-screen w-full bg-gradient-to-br from-background via-muted/50 to-background">
        <Header />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-2">
                Study Groups
              </h1>
              <p className="text-muted-foreground">Collaborate and learn together</p>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={() => setShowJoinModal(true)} variant="outline" className="gap-2">
                <Search className="w-4 h-4" /> Join with Code
              </Button>
              <Button onClick={() => setShowCreateModal(true)} className="gap-2">
                <Plus className="w-4 h-4" /> Create Group
              </Button>
            </div>
          </div>

          <Tabs defaultValue="my-groups" className="space-y-6">
...
          </Tabs>

          <CreateGroupModal 
            open={showCreateModal}
            onOpenChange={setShowCreateModal}
            onSuccess={() => user && loadGroups(user.id)}
          />
          
          <JoinGroupModal
            open={showJoinModal}
            onOpenChange={setShowJoinModal}
            onSuccess={() => user && loadGroups(user.id)}
          />
        </main>
      </div>
    </>
  );
};

export default Groups;
