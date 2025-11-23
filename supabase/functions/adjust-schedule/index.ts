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

    const { timetableId, currentDate, reflection, completedSessionIndices, incompleteSessions } = await req.json();

    console.log('Adjust schedule request:', {
      timetableId,
      currentDate,
      reflectionLength: reflection?.length || 0,
      completedCount: completedSessionIndices?.length || 0,
      incompleteCount: incompleteSessions?.length || 0
    });

    // Fetch the timetable
    const { data: timetable, error: timetableError } = await supabase
      .from('timetables')
      .select('*')
      .eq('id', timetableId)
      .eq('user_id', user.id)
      .single();

    if (timetableError || !timetable) {
      console.error('Timetable error:', timetableError);
      return new Response(JSON.stringify({ error: 'Timetable not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const schedule = timetable.schedule as Record<string, any[]>;
    const currentDateObj = new Date(currentDate);
    
    // Get all dates after current date within timetable range
    const endDate = new Date(timetable.end_date);
    const futureDates = Object.keys(schedule)
      .filter(date => {
        const d = new Date(date);
        return d > currentDateObj && d <= endDate;
      })
      .sort();

    if (futureDates.length === 0 || incompleteSessions.length === 0) {
      return new Response(JSON.stringify({
        message: 'No future dates available or no incomplete sessions',
        updatedSchedule: schedule
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Use AI to intelligently reschedule
    const prompt = `You are a study scheduling AI. A student has completed some sessions but not others.

**Current Date**: ${currentDate}
**Reflection**: ${reflection || 'No reflection provided'}
**Incomplete Sessions**: ${JSON.stringify(incompleteSessions, null, 2)}

**Available Future Dates**: ${futureDates.join(', ')}
**Current Schedule for Future Dates**: 
${futureDates.map(date => `${date}: ${schedule[date]?.length || 0} sessions`).join('\n')}

**Task**: 
1. Analyze which incomplete sessions should be prioritized
2. Find the best slots to reschedule them (spread across multiple days if needed)
3. Return a JSON object mapping dates to sessions to add

Return ONLY valid JSON in this format:
{
  "rescheduledSessions": {
    "YYYY-MM-DD": [
      {
        "subject": "string",
        "topic": "string",
        "duration": number,
        "type": "string",
        "notes": "Rescheduled from ${currentDate} - [reason]"
      }
    ]
  },
  "reasoning": "Brief explanation of scheduling decisions"
}

**Guidelines**:
- Don't overload any single day (max 2-3 rescheduled sessions per day)
- Prioritize sessions closer to test dates if mentioned
- Consider the student's reflection when prioritizing
- Spread sessions across available days for better retention`;

    console.log('Calling AI for schedule adjustment...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an expert study scheduling assistant. Always return valid JSON.' },
          { role: 'user', content: prompt }
        ],
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
    let responseText = aiData.choices?.[0]?.message?.content;

    if (!responseText) {
      throw new Error('No content in AI response');
    }

    // Extract JSON from markdown if present
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      responseText = jsonMatch[1];
    }

    const aiResult = JSON.parse(responseText);
    console.log('AI scheduling result:', aiResult);

    // Apply the rescheduled sessions
    const updatedSchedule = { ...schedule };
    
    if (aiResult.rescheduledSessions) {
      Object.entries(aiResult.rescheduledSessions).forEach(([date, sessions]: [string, any]) => {
        if (!updatedSchedule[date]) {
          updatedSchedule[date] = [];
        }
        
        // Add rescheduled sessions to the date
        (sessions as any[]).forEach((session: any) => {
          // Find a good time slot (after existing sessions)
          const existingSessions = updatedSchedule[date];
          let startTime = '09:00';
          
          if (existingSessions.length > 0) {
            const lastSession = existingSessions[existingSessions.length - 1];
            const lastEndTime = lastSession.time || '09:00';
            const [hours, minutes] = lastEndTime.split(':').map(Number);
            const lastDuration = lastSession.duration || 60;
            const totalMinutes = hours * 60 + minutes + lastDuration + 15; // Add 15 min break
            startTime = `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`;
          }
          
          updatedSchedule[date].push({
            time: startTime,
            subject: session.subject,
            topic: session.topic,
            duration: session.duration,
            type: session.type || 'study',
            notes: session.notes || `Rescheduled from ${currentDate}`,
          });
        });
      });
    }

    // Update the timetable
    const { error: updateError } = await supabase
      .from('timetables')
      .update({ schedule: updatedSchedule })
      .eq('id', timetableId);

    if (updateError) {
      console.error('Update error:', updateError);
      throw updateError;
    }

    console.log('Schedule updated successfully');

    return new Response(JSON.stringify({
      success: true,
      rescheduledSessions: aiResult.rescheduledSessions,
      reasoning: aiResult.reasoning,
      updatedSchedule
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in adjust-schedule:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
