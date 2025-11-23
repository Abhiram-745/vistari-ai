import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { timetableId } = await req.json();

    // Fetch all reflections for this timetable
    const { data: reflections, error: reflectionsError } = await supabase
      .from('topic_reflections')
      .select('*')
      .eq('timetable_id', timetableId)
      .eq('user_id', user.id);

    if (reflectionsError) {
      console.error('Error fetching reflections:', reflectionsError);
      return new Response(JSON.stringify({ error: 'Failed to fetch reflections' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!reflections || reflections.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'No reflections found',
        message: 'Complete some study sessions and add reflections first!' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Prepare data for AI analysis
    const analysisData = reflections.map(r => ({
      subject: r.subject,
      topic: r.topic,
      easyAspects: r.reflection_data.easyAspects?.filter((a: any) => a.type === 'text').map((a: any) => a.content) || [],
      hardAspects: r.reflection_data.hardAspects?.filter((a: any) => a.type === 'text').map((a: any) => a.content) || [],
      generalNotes: r.reflection_data.generalNotes?.filter((a: any) => a.type === 'text').map((a: any) => a.content) || [],
      overallFeeling: r.reflection_data.overallFeeling || '',
    }));

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const prompt = `You are an educational AI assistant analyzing student study reflections to create a personalized "mindprint" - a comprehensive overview of their learning strengths, challenges, and patterns.

Here are the reflections from ${reflections.length} study sessions:

${JSON.stringify(analysisData, null, 2)}

Analyze these reflections and provide:

1. **Struggling Topics**: Identify 3-5 topics where the student is experiencing the most difficulty, ranked by severity. Include specific quotes from their reflections.

2. **Strong Areas**: Identify 3-5 topics where the student excels or feels confident. Include specific quotes.

3. **Learning Patterns**: What patterns do you notice in how they learn? (e.g., visual learner, struggles with abstract concepts, excels at practical application)

4. **Recommended Focus**: What should they prioritize in upcoming study sessions?

5. **Personalized Tips**: 3-5 specific, actionable tips tailored to their learning style and challenges.

6. **Subject Breakdown**: For each subject, provide a confidence score (1-10) and brief summary.

Format your response as JSON with this structure:
{
  "strugglingTopics": [
    { "topic": "string", "subject": "string", "severity": "high|medium|low", "reason": "string", "quotes": ["string"] }
  ],
  "strongAreas": [
    { "topic": "string", "subject": "string", "reason": "string", "quotes": ["string"] }
  ],
  "learningPatterns": ["string"],
  "recommendedFocus": ["string"],
  "personalizedTips": ["string"],
  "subjectBreakdown": {
    "SubjectName": {
      "confidenceScore": number,
      "summary": "string",
      "topicsCount": number
    }
  },
  "overallSummary": "string"
}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          { role: 'system', content: 'You are an expert educational analyst who creates personalized learning insights.' },
          { role: 'user', content: prompt }
        ],
        max_completion_tokens: 6000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again in a moment.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'Payment required. Please add credits to your Lovable AI workspace.' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    let insightsText = aiData.choices?.[0]?.message?.content;

    if (!insightsText) {
      throw new Error('No content in AI response');
    }

    // Extract JSON from markdown code blocks if present
    const jsonMatch = insightsText.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      insightsText = jsonMatch[1];
    }

    const insights = JSON.parse(insightsText);

    // Save insights to database
    const { error: upsertError } = await supabase
      .from('study_insights')
      .upsert({
        user_id: user.id,
        timetable_id: timetableId,
        insights_data: insights,
      }, {
        onConflict: 'user_id,timetable_id'
      });

    if (upsertError) {
      console.error('Error saving insights:', upsertError);
    }

    return new Response(JSON.stringify({ insights }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-insights:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
