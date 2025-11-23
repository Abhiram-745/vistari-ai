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
    const prompt = `You are an expert study schedule generator. Generate a complete study schedule for tomorrow from scratch.

**DATE**: ${tomorrowDate} (${tomorrowDayOfWeek})

**TIMING CONSTRAINTS**
- Start Time: ${effectiveStartTime}
- End Time: ${effectiveEndTime}
- Preferred Session Duration: ${sessionDuration} minutes
- Break Duration: ${breakDuration} minutes

**STUDENT'S REFLECTION FROM TODAY**
"${reflection || 'No reflection provided'}"

**SELECTED TOPICS FOR TOMORROW** (These are the student's chosen focus areas)
${JSON.stringify(selectedTopics || [], null, 2)}

**DIFFICULT TOPICS / FOCUS POINTS** (Student previously marked these as challenging - prioritize if selected)
${JSON.stringify(difficultTopics || [], null, 2)}

**INCOMPLETE SESSIONS FROM TODAY** (Include these if student's reflection suggests they need rescheduling)
${JSON.stringify(incompleteSessions || [], null, 2)}

**AVAILABLE HOMEWORK** (Match and schedule if relevant)
${JSON.stringify(homeworkList?.map(h => ({
  subject: h.subject,
  title: h.title,
  description: h.description,
  dueDate: h.due_date,
  duration: h.duration
})) || [], null, 2)}

**EVENTS TOMORROW** (Work around these - do NOT schedule study sessions during events)
${JSON.stringify(tomorrowEvents?.map(e => ({
  title: e.title,
  startTime: e.start_time,
  endTime: e.end_time
})) || [], null, 2)}

**YOUR TASK**
Generate a complete, well-balanced study schedule for tomorrow that:
1. **Prioritizes selected topics** - these are what the student wants to focus on
2. **Extra focus on difficult topics** - if any selected topics match difficult/focus points, give them prime study slots (morning or when student is freshest)
3. **Includes incomplete sessions** if the reflection suggests they should be rescheduled
4. **Works around all events** - never overlap with scheduled events
5. **Respects timing** - all sessions must be between ${effectiveStartTime} and ${effectiveEndTime}
6. **Includes breaks** - add ${breakDuration} minute breaks between sessions
7. **Balances workload** - mix difficult and easier topics throughout the day, put harder topics in morning/peak focus times
8. **Matches homework** - if selected topics mention homework, use correct subject from homework list

**CRITICAL RULES**
✓ All times MUST be HH:MM format between 00:00-23:59
✓ Calculate session start times sequentially (previous end + break)
✓ DO NOT overlap with events
✓ Include realistic break times
✓ Make sessions approximately ${sessionDuration} minutes (can vary slightly for homework)
✓ If homework is mentioned, use the EXACT subject and title from homework list
✓ Generate a balanced, realistic schedule that respects energy levels throughout the day

**RESPONSE FORMAT**
Return ONLY valid JSON:
{
  "schedule": [
    {
      "time": "HH:MM",
      "subject": "string",
      "topic": "string",
      "duration": number,
      "type": "study|homework|revision|break",
      "notes": "Brief note about why this was scheduled"
    }
  ],
  "summary": "Plain English summary explaining the schedule created for tomorrow, what topics were prioritized, and how it works around events and preferences.",
  "reasoning": "Technical explanation of scheduling decisions"
}`;

    console.log('Calling AI to generate tomorrow\'s schedule...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert study scheduling assistant. Create realistic, balanced schedules that respect student preferences and time constraints. Always return valid JSON.' 
          },
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
