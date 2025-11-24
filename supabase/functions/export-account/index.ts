import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.83.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Starting export for user:', user.email);

    // Fetch all user data in parallel
    const [
      profileData,
      preferencesData,
      subjectsData,
      topicsData,
      timetablesData,
      homeworkData,
      eventsData,
      sessionsData,
      testScoresData,
      resourcesData,
      progressData,
      reflectionsData,
      goalsData,
      streaksData,
      analyticsData,
      insightsData,
      achievementsData,
    ] = await Promise.all([
      supabaseClient.from('profiles').select('*').eq('id', user.id).single(),
      supabaseClient.from('study_preferences').select('*').eq('user_id', user.id).single(),
      supabaseClient.from('subjects').select('*').eq('user_id', user.id),
      supabaseClient.from('topics').select('*, subjects!inner(user_id)').eq('subjects.user_id', user.id),
      supabaseClient.from('timetables').select('*').eq('user_id', user.id),
      supabaseClient.from('homeworks').select('*').eq('user_id', user.id),
      supabaseClient.from('events').select('*').eq('user_id', user.id),
      supabaseClient.from('study_sessions').select('*').eq('user_id', user.id),
      supabaseClient.from('test_scores').select('*').eq('user_id', user.id),
      supabaseClient.from('session_resources').select('*').eq('user_id', user.id),
      supabaseClient.from('topic_progress').select('*').eq('user_id', user.id),
      supabaseClient.from('topic_reflections').select('*').eq('user_id', user.id),
      supabaseClient.from('weekly_goals').select('*').eq('user_id', user.id),
      supabaseClient.from('study_streaks').select('*').eq('user_id', user.id),
      supabaseClient.from('session_analytics').select('*').eq('user_id', user.id),
      supabaseClient.from('study_insights').select('*').eq('user_id', user.id),
      supabaseClient.from('user_achievements').select('*').eq('user_id', user.id),
    ]);

    // Build export JSON
    const exportData = {
      export_version: '1.0',
      export_date: new Date().toISOString(),
      user_email: user.email,
      data: {
        profile: profileData.data || null,
        study_preferences: preferencesData.data || null,
        subjects: subjectsData.data || [],
        topics: topicsData.data || [],
        timetables: timetablesData.data || [],
        homework: homeworkData.data || [],
        events: eventsData.data || [],
        study_sessions: sessionsData.data || [],
        test_scores: testScoresData.data || [],
        session_resources: resourcesData.data || [],
        topic_progress: progressData.data || [],
        topic_reflections: reflectionsData.data || [],
        weekly_goals: goalsData.data || [],
        study_streaks: streaksData.data || [],
        session_analytics: analyticsData.data || [],
        study_insights: insightsData.data || [],
        user_achievements: achievementsData.data || [],
      },
      metadata: {
        total_timetables: timetablesData.data?.length || 0,
        total_subjects: subjectsData.data?.length || 0,
        total_homework: homeworkData.data?.length || 0,
        total_events: eventsData.data?.length || 0,
        total_study_sessions: sessionsData.data?.length || 0,
      },
    };

    console.log('Export completed successfully');

    return new Response(JSON.stringify(exportData), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="vistari-export-${user.email}-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error: any) {
    console.error('Export error:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Export failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
