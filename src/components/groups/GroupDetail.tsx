import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Users, Settings, LogOut, Copy, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Header from "@/components/Header";
import { GroupTimetables } from "./GroupTimetables";
import { GroupResources } from "./GroupResources";

interface GroupMember {
  id: string;
  user_id: string;
  role: string;
  profiles: {
    full_name: string;
  };
}

const GroupDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState<any>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (id) {
      loadGroupDetails();
    }
  }, [id]);

  const loadGroupDetails = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: groupData } = await supabase
        .from('study_groups')
        .select('*')
        .eq('id', id)
        .single();

      if (groupData) {
        setGroup(groupData);
      }

      const { data: membersData } = await supabase
        .from('group_members')
        .select('id, user_id, role')
        .eq('group_id', id);

      if (membersData) {
        const userIds = membersData.map(m => m.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);
        
        const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);
        const enrichedMembers = membersData.map(m => ({
          ...m,
          profiles: { full_name: profilesMap.get(m.user_id)?.full_name || 'Unknown' }
        }));
        
        setMembers(enrichedMembers);
        
        const currentMember = enrichedMembers.find(m => m.user_id === user.id);
        setCurrentUserRole(currentMember?.role || null);
      }
    } catch (error) {
      console.error('Error loading group:', error);
      toast.error('Failed to load group');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveGroup = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('group_members')
        .delete()
        .eq('group_id', id)
        .eq('user_id', user.id);

      toast.success('Left group successfully');
      navigate('/groups');
    } catch (error) {
      console.error('Error leaving group:', error);
      toast.error('Failed to leave group');
    }
  };

  const handleCopyJoinCode = async () => {
    if (group?.join_code) {
      await navigator.clipboard.writeText(group.join_code);
      setCopiedCode(true);
      toast.success("Join code copied!");
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Group not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/groups')}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Groups
        </Button>

        <Card className="p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">{group.name}</h1>
              {group.description && (
                <p className="text-muted-foreground mb-4">{group.description}</p>
              )}
              {group.subject && (
                <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                  {group.subject}
                </span>
              )}
            </div>

            <div className="flex gap-2">
              {currentUserRole === 'admin' && (
                <Button variant="outline" size="sm" className="gap-2">
                  <Settings className="w-4 h-4" /> Settings
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleLeaveGroup}
                className="gap-2"
              >
                <LogOut className="w-4 h-4" /> Leave Group
              </Button>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{members.length} members</span>
          </div>

          {group.is_private && group.join_code && currentUserRole === 'admin' && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-2">Private Group Join Code:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-background rounded text-lg font-bold tracking-wider">
                  {group.join_code}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyJoinCode}
                  className="gap-2"
                >
                  {copiedCode ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Share this code with people you want to invite to the group
              </p>
            </div>
          )}
        </Card>

        <Tabs defaultValue="timetables" className="space-y-6">
          <TabsList>
            <TabsTrigger value="timetables">Timetables</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>

          <TabsContent value="timetables">
            <GroupTimetables groupId={id!} />
          </TabsContent>

          <TabsContent value="members">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Group Members ({members.length})
              </h3>
              
              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">
                          {member.profiles?.full_name?.[0]?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {member.profiles?.full_name || 'Unknown User'}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {member.role}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="resources">
            <GroupResources groupId={id!} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default GroupDetail;
