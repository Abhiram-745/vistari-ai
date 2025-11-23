import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Clock, Target, TrendingUp, Award } from "lucide-react";

interface AnalyticsData {
  total_planned_minutes: number;
  total_actual_minutes: number;
  sessions_completed: number;
  sessions_skipped: number;
  average_focus_score: number;
  subjects_studied: { subject: string; minutes: number }[];
}

export const SessionAnalytics = () => {
  const [weeklyData, setWeeklyData] = useState<AnalyticsData | null>(null);
  const [monthlyData, setMonthlyData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Weekly analytics
      const { data: weeklyAnalytics } = await supabase
        .from('session_analytics')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', weekAgo.toISOString().split('T')[0])
        .lte('date', now.toISOString().split('T')[0]);

      // Monthly analytics
      const { data: monthlyAnalytics } = await supabase
        .from('session_analytics')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', monthAgo.toISOString().split('T')[0])
        .lte('date', now.toISOString().split('T')[0]);

      if (weeklyAnalytics) {
        setWeeklyData(aggregateData(weeklyAnalytics));
      }

      if (monthlyAnalytics) {
        setMonthlyData(aggregateData(monthlyAnalytics));
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const aggregateData = (analytics: any[]): AnalyticsData => {
    const total = analytics.reduce((acc, curr) => ({
      total_planned_minutes: acc.total_planned_minutes + (curr.total_planned_minutes || 0),
      total_actual_minutes: acc.total_actual_minutes + (curr.total_actual_minutes || 0),
      sessions_completed: acc.sessions_completed + (curr.sessions_completed || 0),
      sessions_skipped: acc.sessions_skipped + (curr.sessions_skipped || 0),
      average_focus_score: acc.average_focus_score + (curr.average_focus_score || 0),
      subjects_studied: acc.subjects_studied
    }), {
      total_planned_minutes: 0,
      total_actual_minutes: 0,
      sessions_completed: 0,
      sessions_skipped: 0,
      average_focus_score: 0,
      subjects_studied: [] as { subject: string; minutes: number }[]
    });

    total.average_focus_score = analytics.length > 0 
      ? total.average_focus_score / analytics.length 
      : 0;

    // Aggregate subjects
    const subjectsMap = new Map<string, number>();
    analytics.forEach(a => {
      if (Array.isArray(a.subjects_studied)) {
        a.subjects_studied.forEach((s: any) => {
          const current = subjectsMap.get(s.subject) || 0;
          subjectsMap.set(s.subject, current + s.minutes);
        });
      }
    });

    total.subjects_studied = Array.from(subjectsMap.entries()).map(([subject, minutes]) => ({
      subject,
      minutes
    }));

    return total;
  };

  const completionRate = (data: AnalyticsData | null) => {
    if (!data || (data.sessions_completed + data.sessions_skipped) === 0) return 0;
    return Math.round((data.sessions_completed / (data.sessions_completed + data.sessions_skipped)) * 100);
  };

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

  if (loading) {
    return <div className="text-center py-8">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Study Analytics</h2>

      <Tabs defaultValue="weekly">
        <TabsList>
          <TabsTrigger value="weekly">Last 7 Days</TabsTrigger>
          <TabsTrigger value="monthly">Last 30 Days</TabsTrigger>
        </TabsList>

        {['weekly', 'monthly'].map(period => {
          const data = period === 'weekly' ? weeklyData : monthlyData;
          
          return (
            <TabsContent key={period} value={period} className="space-y-6">
              <div className="grid md:grid-cols-4 gap-4">
                <Card className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Clock className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Study Time</p>
                      <p className="text-2xl font-bold text-foreground">
                        {Math.floor((data?.total_actual_minutes || 0) / 60)}h{' '}
                        {(data?.total_actual_minutes || 0) % 60}m
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-500/10 rounded-lg">
                      <Target className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Completion</p>
                      <p className="text-2xl font-bold text-foreground">
                        {completionRate(data)}%
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-500/10 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Sessions</p>
                      <p className="text-2xl font-bold text-foreground">
                        {data?.sessions_completed || 0}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-yellow-500/10 rounded-lg">
                      <Award className="w-6 h-6 text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Focus</p>
                      <p className="text-2xl font-bold text-foreground">
                        {data?.average_focus_score?.toFixed(1) || '0'}/10
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              {data && data.subjects_studied.length > 0 && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Study Time by Subject
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={data.subjects_studied}
                        dataKey="minutes"
                        nameKey="subject"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={(entry) => `${entry.subject} (${Math.floor(entry.minutes / 60)}h)`}
                      >
                        {data.subjects_studied.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};
