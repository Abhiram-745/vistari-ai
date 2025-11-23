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

    // Fetch all homework to match against mentions in reflection
    const { data: homeworkList, error: homeworkError } = await supabase
      .from('homeworks')
      .select('*')
      .eq('user_id', user.id)
      .eq('completed', false);

    // Fetch all events to match against mentions
    const { data: eventsList, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', user.id);

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

    // Build comprehensive context for AI
    const futureScheduleDetails = futureDates.slice(0, 7).map(date => {
      const sessions = schedule[date] || [];
      return {
        date,
        sessionCount: sessions.length,
        sessions: sessions.map((s: any) => ({
          time: s.time,
          subject: s.subject,
          topic: s.topic,
          duration: s.duration,
          type: s.type
        }))
      };
    });

    // Use AI to intelligently reschedule
    const prompt = `You are a study scheduling AI assistant. A student has completed some sessions but not others and needs their schedule reorganized.

**Current Date**: ${currentDate}
**Student's Reflection**: ${reflection || 'No reflection provided'}

**Incomplete Sessions from Today**:
${JSON.stringify(incompleteSessions, null, 2)}

**Available Homework Tasks** (match these if student mentions them):
${JSON.stringify(homeworkList?.map(h => ({
  subject: h.subject,
  title: h.title,
  description: h.description,
  dueDate: h.due_date,
  duration: h.duration
})) || [], null, 2)}

**Upcoming Events** (reference these if relevant):
${JSON.stringify(eventsList?.map(e => ({
  title: e.title,
  description: e.description,
  startTime: e.start_time,
  endTime: e.end_time
}))?.slice(0, 10) || [], null, 2)}

**Next 7 Days Schedule**:
${JSON.stringify(futureScheduleDetails, null, 2)}

**Your Task**:
1. **Match Tasks**: If the student mentions homework/tasks by name (e.g., "metals theory"), find the matching homework from the list and use the CORRECT subject
2. **Smart Rescheduling**: Reorganize the schedule intelligently - don't just append to the end
3. **Time Validation**: All times MUST be between 00:00 and 23:59. Calculate proper times by finding gaps in the schedule
4. **Respect User Intent**: If the student asks to remove or skip certain tasks, do so
5. **Insert Strategically**: Insert tasks into appropriate time slots throughout the day, not just at the end

Return ONLY valid JSON in this exact format:
{
  "rescheduledSessions": {
    "YYYY-MM-DD": [
      {
        "time": "HH:MM",
        "subject": "string",
        "topic": "string",
        "duration": number,
        "type": "study|homework|revision",
        "notes": "Rescheduled from ${currentDate} - [reason]"
      }
    ]
  },
  "sessionsToRemove": {
    "YYYY-MM-DD": [0, 2, 5]  // Indices of sessions to remove if user requested it
  },
  "reasoning": "Brief explanation of your scheduling decisions and any task matching you did"
}

**Critical Rules**:
- Match mentioned tasks to existing homework/events data
- Times must be HH:MM format between 00:00-23:59
- Find gaps in the schedule, don't just append
- Distribute across multiple days (max 3 new sessions per day)
- Respect the student's preferences from the reflection`;

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

    // Apply the changes
    const updatedSchedule = { ...schedule };
    
    // First, remove sessions if requested
    if (aiResult.sessionsToRemove) {
      Object.entries(aiResult.sessionsToRemove).forEach(([date, indices]: [string, any]) => {
        if (updatedSchedule[date]) {
          // Sort indices in reverse to remove from end first
          const sortedIndices = (indices as number[]).sort((a, b) => b - a);
          sortedIndices.forEach(index => {
            updatedSchedule[date].splice(index, 1);
          });
        }
      });
    }
    
    // Then, add rescheduled sessions at specified times
    if (aiResult.rescheduledSessions) {
      Object.entries(aiResult.rescheduledSessions).forEach(([date, sessions]: [string, any]) => {
        if (!updatedSchedule[date]) {
          updatedSchedule[date] = [];
        }
        
        // Add each session with the AI-specified time
        (sessions as any[]).forEach((session: any) => {
          // Validate time format
          const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
          let sessionTime = session.time || '09:00';
          
          if (!timeRegex.test(sessionTime)) {
            console.warn(`Invalid time format: ${sessionTime}, defaulting to 09:00`);
            sessionTime = '09:00';
          }
          
          // Check if time is within valid range
          const [hours, minutes] = sessionTime.split(':').map(Number);
          if (hours >= 24 || minutes >= 60) {
            console.warn(`Time out of range: ${sessionTime}, defaulting to 09:00`);
            sessionTime = '09:00';
          }
          
          updatedSchedule[date].push({
            time: sessionTime,
            subject: session.subject,
            topic: session.topic,
            duration: session.duration,
            type: session.type || 'study',
            notes: session.notes || `Rescheduled from ${currentDate}`,
            completed: false
          });
        });
        
        // Sort sessions by time
        updatedSchedule[date].sort((a: any, b: any) => {
          const timeA = a.time || '00:00';
          const timeB = b.time || '00:00';
          return timeA.localeCompare(timeB);
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
