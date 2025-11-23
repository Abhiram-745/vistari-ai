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

  const handleJoinGroup = async (groupId: string) => {
    if (!user) return;

    try {
      // Check if already a member
      const { data: existingMember } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingMember) {
        toast.error('You are already a member of this group');
        navigate(`/groups/${groupId}`);
        return;
      }

      // Add user as a member
      const { error } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: user.id,
          role: 'member'
        });

      if (error) throw error;

      toast.success('Joined group successfully!');
      navigate(`/groups/${groupId}`);
      loadGroups(user.id);
    } catch (error: any) {
      console.error('Error joining group:', error);
      toast.error('Failed to join group');
    }
  };

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
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="my-groups" className="gap-2">
                <Users className="w-4 h-4" />
                My Groups
              </TabsTrigger>
              <TabsTrigger value="discover" className="gap-2">
                <Globe className="w-4 h-4" />
                Discover
              </TabsTrigger>
            </TabsList>

            <TabsContent value="my-groups" className="space-y-4">
              {loading ? (
                <Card className="p-8 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="text-muted-foreground">Loading your groups...</p>
                  </div>
                </Card>
              ) : myGroups.length === 0 ? (
                <Card className="p-12 text-center">
                  <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No groups yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Create your first study group or join an existing one
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button onClick={() => setShowCreateModal(true)} className="gap-2">
                      <Plus className="w-4 h-4" />
                      Create Group
                    </Button>
                    <Button onClick={() => setShowJoinModal(true)} variant="outline" className="gap-2">
                      <Search className="w-4 h-4" />
                      Join with Code
                    </Button>
                  </div>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {myGroups.map((group) => (
                    <Card 
                      key={group.id}
                      className="p-6 hover:shadow-lg transition-all duration-200 cursor-pointer border-primary/20 hover:border-primary/40"
                      onClick={() => navigate(`/groups/${group.id}`)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1 line-clamp-1">{group.name}</h3>
                          {group.subject && (
                            <p className="text-sm text-primary font-medium">{group.subject}</p>
                          )}
                        </div>
                        {group.is_private ? (
                          <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        ) : (
                          <Globe className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        )}
                      </div>
                      
                      {group.description && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {group.description}
                        </p>
                      )}
                      
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Users className="w-4 h-4 mr-1" />
                        <span>{group.member_count} {group.member_count === 1 ? 'member' : 'members'}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="discover" className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search groups by name, subject, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {loading ? (
                <Card className="p-8 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="text-muted-foreground">Loading groups...</p>
                  </div>
                </Card>
              ) : filteredGroups.length === 0 ? (
                <Card className="p-12 text-center">
                  <Globe className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">
                    {searchQuery ? "No groups found" : "No public groups available"}
                  </h3>
                  <p className="text-muted-foreground">
                    {searchQuery 
                      ? "Try a different search term" 
                      : "Be the first to create a public study group!"}
                  </p>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredGroups.map((group) => {
                    const isMember = myGroups.some(mg => mg.id === group.id);
                    
                    return (
                      <Card 
                        key={group.id}
                        className="p-6 hover:shadow-lg transition-all duration-200 border-primary/20 hover:border-primary/40"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-1 line-clamp-1">{group.name}</h3>
                            {group.subject && (
                              <p className="text-sm text-primary font-medium">{group.subject}</p>
                            )}
                          </div>
                          <Globe className="w-4 h-4 text-green-600 flex-shrink-0" />
                        </div>
                        
                        {group.description && (
                          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                            {group.description}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Users className="w-4 h-4 mr-1" />
                            <span>{group.member_count} {group.member_count === 1 ? 'member' : 'members'}</span>
                          </div>
                          
                          {isMember ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/groups/${group.id}`)}
                              className="gap-2"
                            >
                              View Group
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleJoinGroup(group.id);
                              }}
                              className="gap-2"
                            >
                              <Plus className="w-4 h-4" />
                              Join
                            </Button>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
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
