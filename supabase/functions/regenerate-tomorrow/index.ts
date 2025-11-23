import "https://deno.land/x/xhr@0.1.0/mod.ts";
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

    const { 
      timetableId, 
      currentDate, 
      tomorrowDate,
      reflection, 
      selectedTopics,
      incompleteSessions,
      difficultTopics,
      startTime,
      endTime
    } = await req.json();

    console.log('Regenerate tomorrow request:', {
      timetableId,
      currentDate,
      tomorrowDate,
      selectedTopicsCount: selectedTopics?.length || 0,
      incompleteSessionsCount: incompleteSessions?.length || 0,
      difficultTopicsCount: difficultTopics?.length || 0,
      timing: `${startTime} - ${endTime}`
    });

    // Fetch timetable and related data
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

    // Fetch preferences
    const { data: preferences } = await supabase
      .from('study_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Fetch events for tomorrow
    const { data: tomorrowEvents } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', user.id)
      .gte('start_time', `${tomorrowDate}T00:00:00`)
      .lt('start_time', `${tomorrowDate}T23:59:59`);

    // Fetch homework
    const { data: homeworkList } = await supabase
      .from('homeworks')
      .select('*')
      .eq('user_id', user.id)
      .eq('completed', false);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Get day of week for tomorrow
    const tomorrowDayOfWeek = new Date(tomorrowDate).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    // Use provided timing
    const effectiveStartTime = startTime || '09:00';
    const effectiveEndTime = endTime || '17:00';
    const sessionDuration = preferences?.session_duration || 45;
    const breakDuration = preferences?.break_duration || 15;

    // Build comprehensive prompt for AI
    const prompt = `You are an expert study schedule generator. Generate a realistic study schedule for tomorrow with QUALITY over quantity.

**DATE**: ${tomorrowDate} (${tomorrowDayOfWeek})

**TIMING CONSTRAINTS**
- Start Time: ${effectiveStartTime}
- End Time: ${effectiveEndTime}
- Target Session Duration: 60 minutes per topic (can vary 45-90 minutes based on difficulty/confidence)
- Break Duration: ${breakDuration} minutes (use strategically, NOT after every session)

**STUDENT'S REFLECTION FROM TODAY**
"${reflection || 'No reflection provided'}"

**SELECTED TOPICS FOR TOMORROW** (ORDERED BY PRIORITY - first topics are HIGHEST priority)
${JSON.stringify(selectedTopics || [], null, 2)}

**DIFFICULT TOPICS** (Previously marked as challenging - give extra time if selected)
${JSON.stringify(difficultTopics || [], null, 2)}

**INCOMPLETE SESSIONS FROM TODAY** (Consider including if reflection suggests rescheduling)
${JSON.stringify(incompleteSessions || [], null, 2)}

**AVAILABLE HOMEWORK** (Use exact subject/title/duration from this list)
${JSON.stringify(homeworkList?.map(h => ({
  subject: h.subject,
  title: h.title,
  description: h.description,
  dueDate: h.due_date,
  duration: h.duration
})) || [], null, 2)}

**EVENTS TOMORROW** (NEVER overlap with these)
${JSON.stringify(tomorrowEvents?.map(e => ({
  title: e.title,
  startTime: e.start_time,
  endTime: e.end_time
})) || [], null, 2)}

**TEST DAY CHECK**
${timetable.test_dates && Array.isArray(timetable.test_dates) && timetable.test_dates.length > 0 ? 
  (() => {
    const tomorrowDateStr = tomorrowDate;
    const isTestDay = timetable.test_dates.some((test: any) => test.test_date === tomorrowDateStr);
    if (isTestDay) {
      const testsOnDay = timetable.test_dates.filter((test: any) => test.test_date === tomorrowDateStr);
      return `CRITICAL: Tomorrow is a TEST DAY. Return an EMPTY schedule array.
Tests scheduled:
${testsOnDay.map((test: any) => `- ${test.subject}: ${test.test_type}`).join('\n')}

The user CANNOT study on test days. Return: {"schedule": [], "summary": "Tomorrow is a test day - no study sessions scheduled", "reasoning": "Test days are blocked for studying"}`;
    }
    return '';
  })()
: ''}

**CRITICAL SCHEDULING RULES**
1. **FEWER TOPICS, MORE DEPTH**: Schedule 3-5 topics maximum for a productive day. Each topic needs 60+ minutes of focused work.
2. **Prioritize ruthlessly**: First topics in the list get prime time slots and best focus hours.
3. **Realistic breaks**: Add breaks after 2-3 hours of work, or between very different subjects. NOT after every single session.
4. **Difficulty-based timing**: 
   - Low confidence (1-4): 75-90 minutes
   - Medium confidence (5-7): 60-75 minutes  
   - High confidence (8-10): 45-60 minutes
5. **Homework precision**: Use EXACT duration from homework list (already includes time needed)
6. **Event avoidance**: Never schedule during events - work around them completely
7. **Time format**: All times in HH:MM format (00:00-23:59)
8. **Sequential scheduling**: Calculate each start time from previous end time + break (if break added)

**RESPONSE FORMAT**
Return ONLY valid JSON:
{
  "schedule": [
    {
      "time": "HH:MM",
      "subject": "string",
      "topic": "string",
      "duration": number (45-90 for topics, exact from list for homework),
      "type": "study|homework|revision|break",
      "notes": "Brief note about why this was scheduled and why this duration"
    }
  ],
  "summary": "Plain English summary: how many topics scheduled, why these topics were chosen, total study time planned",
  "reasoning": "Why you chose this number of topics and how you allocated time"
}

**EXAMPLE GOOD SCHEDULE** (4 hour window, 3 topics):
09:00 - Topic 1 (high priority, low confidence) - 75 min
10:15 - Topic 2 (high priority, medium confidence) - 60 min  
11:30 - Break - 15 min
11:45 - Homework (from list) - 45 min
12:30 - Topic 3 (medium priority) - 60 min
= 3 topics + 1 homework + 1 strategic break`;

    console.log('Calling AI to generate tomorrow\'s schedule...');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    let aiResponse: Response;
    try {
      aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-lite',
          messages: [
            { 
              role: 'system', 
              content: 'You are an expert study scheduling assistant. Create realistic, balanced schedules that respect student preferences and time constraints. Always return valid JSON.' 
            },
            { role: 'user', content: prompt }
          ],
          max_completion_tokens: 4000,
        }),
        signal: controller.signal,
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        throw new Error('AI request timed out. Please try again in a moment.');
      }
      throw fetchError;
    }

    clearTimeout(timeoutId);

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
    console.log('AI generated schedule:', aiResult);

    // Validate and clean the schedule
    const validatedSchedule = (aiResult.schedule || []).map((session: any) => {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      let sessionTime = session.time || '09:00';
      
      if (!timeRegex.test(sessionTime)) {
        console.warn(`Invalid time format: ${sessionTime}, skipping session`);
        return null;
      }
      
      const [hours, minutes] = sessionTime.split(':').map(Number);
      if (hours >= 24 || minutes >= 60) {
        console.warn(`Time out of range: ${sessionTime}, skipping session`);
        return null;
      }
      
      return {
        time: sessionTime,
        subject: session.subject,
        topic: session.topic,
        duration: session.duration,
        type: session.type || 'study',
        notes: session.notes || 'Generated for tomorrow',
        completed: false
      };
    }).filter(Boolean);

    // Update timetable with new schedule for tomorrow
    const currentSchedule = timetable.schedule as Record<string, any[]>;
    const updatedSchedule = {
      ...currentSchedule,
      [tomorrowDate]: validatedSchedule
    };

    const { error: updateError } = await supabase
      .from('timetables')
      .update({ schedule: updatedSchedule })
      .eq('id', timetableId);

    if (updateError) {
      console.error('Update error:', updateError);
      throw updateError;
    }

    console.log('Tomorrow\'s schedule generated successfully');

    return new Response(JSON.stringify({
      success: true,
      schedule: validatedSchedule,
      summary: aiResult.summary || 'Schedule generated successfully',
      reasoning: aiResult.reasoning,
      tomorrowDate
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in regenerate-tomorrow:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
