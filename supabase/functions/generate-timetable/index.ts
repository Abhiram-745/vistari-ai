import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const inputSchema = z.object({
  subjects: z.array(z.object({
    id: z.string().uuid(),
    name: z.string().max(100),
    exam_board: z.string().max(50)
  })).max(20),
  topics: z.array(z.object({
    name: z.string().max(200),
    subject_id: z.string().uuid(),
    difficulty: z.string().max(20),
    confidence_level: z.number().min(1).max(5)
  })).max(500),
  testDates: z.array(z.object({
    subject_id: z.string().uuid(),
    test_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    test_type: z.string().max(50)
  })).max(50),
  preferences: z.object({
    daily_study_hours: z.number().min(0).max(12),
    day_time_slots: z.array(z.object({
      day: z.string(),
      startTime: z.string(),
      endTime: z.string(),
      enabled: z.boolean()
    })),
    session_duration: z.number().min(15).max(180),
    break_duration: z.number().min(5).max(60)
  }),
  homeworks: z.array(z.object({
    id: z.string().uuid().optional(),
    title: z.string(),
    subject: z.string(),
    due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    duration: z.number().optional(),
    description: z.string().optional()
  })).optional(),
  topicAnalysis: z.object({
    priorities: z.array(z.object({
      topic_name: z.string(),
      priority_score: z.number(),
      reasoning: z.string()
    })).optional(),
    difficult_topics: z.array(z.object({
      topic_name: z.string(),
      reason: z.string(),
      study_suggestion: z.string()
    })).optional()
  }).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('Authentication error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate input data
    const requestBody = await req.json();
    const parsed = inputSchema.safeParse(requestBody);
    
    if (!parsed.success) {
      console.error('Validation error:', parsed.error);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input data',
          details: parsed.error.errors 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { subjects, topics, testDates, preferences, startDate, endDate, homeworks = [], topicAnalysis } = parsed.data;

    console.log("Generating timetable with:", {
      subjectsCount: subjects.length,
      topicsCount: topics.length,
      testDatesCount: testDates.length,
      homeworksCount: homeworks.length,
      hasAnalysis: !!topicAnalysis,
      dateRange: `${startDate} to ${endDate}`,
    });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context for AI
    const subjectsContext = subjects
      .map((s: any) => `${s.name} (${s.exam_board})`)
      .join(", ");
    
    const topicsContext = topics
      .map((t: any) => {
        const subject = subjects.find((s: any) => s.id === t.subject_id);
        const relatedTests = testDates.filter((td: any) => td.subject_id === t.subject_id);
        const testInfo = relatedTests.length > 0 
          ? ` - TEST DATE: ${relatedTests[0].test_date}` 
          : '';
        return `${t.name} (${subject?.name}, difficulty: ${t.difficulty}, confidence: ${t.confidence_level}/5${testInfo})`;
      })
      .join("; ");
    
    const testsContext = testDates
      .map((td: any) => {
        const subject = subjects.find((s: any) => s.id === td.subject_id);
        return `${subject?.name} ${td.test_type} on ${td.test_date}`;
      })
      .join("; ");

    const homeworksContext = homeworks.length > 0 
      ? homeworks
          .map((hw: any) => `${hw.title} (${hw.subject}) - Due: ${hw.due_date}${hw.duration ? `, Est. ${hw.duration} mins` : ''}`)
          .join("; ")
      : "No homework assignments";

    const enabledDays = preferences.day_time_slots
      .filter((slot: any) => slot.enabled)
      .map((slot: any) => `${slot.day} (${slot.startTime}-${slot.endTime})`)
      .join(", ");

    // Add priority analysis context if available
    const priorityContext = topicAnalysis?.priorities 
      ? "\n\nAI-ANALYZED TOPIC PRIORITIES (1-10 scale, higher = needs more time):\n" + 
        topicAnalysis.priorities
          .sort((a: any, b: any) => b.priority_score - a.priority_score)
          .map((p: any) => `${p.topic_name}: Priority ${p.priority_score}/10 - ${p.reasoning}`)
          .join("\n")
      : "";

    const difficultTopicsContext = topicAnalysis?.difficult_topics 
      ? "\n\nIDENTIFIED DIFFICULT TOPICS (allocate extra time):\n" + 
        topicAnalysis.difficult_topics
          .map((dt: any) => `${dt.topic_name}: ${dt.reason}\nStudy Suggestion: ${dt.study_suggestion}`)
          .join("\n")
      : "";

    const prompt = `You are an expert study planner for GCSE students. Create a personalized revision timetable with the following details:

SUBJECTS: ${subjectsContext}

TOPICS TO COVER: ${topicsContext}

UPCOMING TESTS: ${testsContext}

HOMEWORK ASSIGNMENTS: ${homeworksContext}
${priorityContext}
${difficultTopicsContext}

STUDY PREFERENCES:
- Daily study hours target: ${preferences.daily_study_hours}
- Available study times per day: ${enabledDays}
- Session duration: ${preferences.session_duration} minutes
- Break duration: ${preferences.break_duration} minutes

TIMETABLE PERIOD: ${startDate} to ${endDate}

CRITICAL REQUIREMENTS:
1. USE THE AI PRIORITY SCORES to allocate study time - topics with higher priority scores should get more sessions and longer duration
2. ALLOCATE EXTRA TIME to difficult topics identified in the analysis
3. DO NOT schedule any revision for a topic AFTER its test date has passed
4. Prioritize revision for topics with upcoming test dates (schedule more sessions closer to the test)
5. Include the test date in the notes field for sessions related to topics with tests
6. MUST schedule study sessions ONLY within the specified time periods for each day
7. Distribute sessions EVENLY across ALL enabled study days - do not skip any enabled day
8. INTEGRATE homework assignments into the timetable, scheduling them before their due dates
9. Consider homework duration estimates when scheduling

Create a detailed, balanced study schedule that:
1. PRIORITIZES topics based on the AI priority scores (8-10 = high priority, needs most time)
2. Allocates EXTRA sessions and time for difficult topics
3. Prioritizes topics with lower confidence levels and harder difficulty
4. Allocates more time to subjects with upcoming tests
3. Includes regular breaks between study sessions
4. ALWAYS schedules sessions within the specific time periods for each enabled day
5. Balances all subjects to avoid burnout
6. Includes revision of previously covered material
7. STOPS scheduling revision for each topic after its test date
8. Ensures consistent daily coverage on all enabled study days
9. Schedules homework tasks before their due dates with appropriate time allocation
10. Marks homework sessions with type "homework" in the schedule

Return a JSON object with the following structure:
{
  "schedule": {
    "YYYY-MM-DD": [
      {
        "time": "HH:MM",
        "duration": minutes,
        "subject": "subject name",
        "topic": "topic name",
        "type": "study|break|revision|homework",
        "notes": "any specific instructions (include test date if applicable)",
        "testDate": "YYYY-MM-DD" (optional, only if this topic has an associated test),
        "homeworkId": "homework-id" (optional, only for homework tasks)
      }
    ]
  }
}

Make the schedule practical, achievable, and effective for GCSE exam preparation.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content:
                "You are an expert educational planner specializing in GCSE revision strategies. Always return valid JSON.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({
            error: "Rate limits exceeded, please try again later.",
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({
            error:
              "Payment required, please add funds to your Lovable AI workspace.",
          }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log("AI Response:", aiResponse);

    // Extract JSON from markdown code blocks if present
    let scheduleData;
    try {
      const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/) || 
                       aiResponse.match(/```\n([\s\S]*?)\n```/);
      const jsonString = jsonMatch ? jsonMatch[1] : aiResponse;
      scheduleData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("Failed to parse AI response:", aiResponse);
      throw new Error("Invalid AI response format");
    }

    return new Response(JSON.stringify(scheduleData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-timetable:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
