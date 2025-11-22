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
    subject_id: z.string().uuid()
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
        return `${t.name} (${subject?.name}${testInfo})`;
      })
      .join("; ");
    
    const testsContext = testDates
      .map((td: any) => {
        const subject = subjects.find((s: any) => s.id === td.subject_id);
        return `${subject?.name} ${td.test_type} on ${td.test_date}`;
      })
      .join("; ");

    const homeworksContext = homeworks.length > 0 
      ? "\n\n**HOMEWORK ASSIGNMENTS (MUST BE SCHEDULED WITH EXACT DURATIONS):**\n" + homeworks
          .map((hw: any) => `- "${hw.title}" (${hw.subject}) - DUE: ${hw.due_date}, DURATION: ${hw.duration || 60} minutes - MUST schedule EXACTLY ${hw.duration || 60} minutes BEFORE due date`)
          .join("\n")
      : "\n\nNo homework assignments";

    const enabledDays = preferences.day_time_slots
      .filter((slot: any) => slot.enabled)
      .map((slot: any) => `${slot.day} (${slot.startTime}-${slot.endTime})`)
      .join(", ");

    // Add priority analysis context if available - FOCUS topics get SIGNIFICANTLY MORE study time with MULTIPLE sessions
    const priorityContext = topicAnalysis?.priorities 
      ? "\n\n**FOCUS TOPICS** (these topics need SIGNIFICANTLY MORE study time - allocate 60-90 minute sessions and schedule MULTIPLE sessions):\n" + 
        topicAnalysis.priorities
          .sort((a: any, b: any) => b.priority_score - a.priority_score)
          .map((p: any) => {
            const sessions = Math.max(4, Math.ceil(p.priority_score / 1.5));
            const duration = Math.min(90, 45 + (p.priority_score * 5));
            return `${p.topic_name}: Priority ${p.priority_score}/10 - ${p.reasoning}\n  → MUST schedule ${sessions} sessions of ${duration} minutes EACH for this topic throughout the timetable`;
          })
          .join("\n")
      : "";

    const difficultTopicsContext = topicAnalysis?.difficult_topics 
      ? "\n\n**ADDITIONAL FOCUS CONTEXT** (allocate extra time and multiple long sessions):\n" + 
        topicAnalysis.difficult_topics
          .map((dt: any) => `${dt.topic_name}: ${dt.reason}\nStudy Suggestion: ${dt.study_suggestion}\n  → These need longer sessions (60-90 mins each)`)
          .join("\n")
      : "";

    const prompt = `You are an expert study planner for GCSE students. Create a personalized revision timetable with the following details:

SUBJECTS: ${subjectsContext}

**ALL TOPICS TO COVER** (schedule ALL of these topics in the timetable): ${topicsContext}

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

**CRITICAL REQUIREMENTS:**
1. **INCLUDE ALL TOPICS**: Every single topic listed in "ALL TOPICS TO COVER" MUST appear in the timetable at least once
2. **FOCUS TOPICS GET SIGNIFICANTLY MORE TIME**: Topics listed in "FOCUS TOPICS" section need MUCH MORE study time:
   - Schedule the EXACT number of sessions specified for each focus topic (typically 4-6 sessions per focus topic)
   - Each focus topic session should be the EXACT duration specified (60-90 minutes for high-priority topics)
   - Distribute these sessions throughout the study period (not all on the same day)
   - Space out focus topic sessions - don't cluster them all together
3. **REGULAR TOPICS GET MINIMAL TIME**: Topics NOT in the focus list get scheduled with ONLY 1 session of ${preferences.session_duration} minutes each
4. **HOMEWORK USES EXACT DURATION**: Each homework session MUST use its specified duration (not default session duration)
   - If homework specifies 150 minutes, the session must be 150 minutes
   - If homework specifies 60 minutes, the session must be 60 minutes
   - Large homework (>90 mins) can be split into multiple sessions on different days if needed
5. DO NOT schedule any revision for a topic AFTER its test date has passed
6. Prioritize revision for topics with upcoming test dates (schedule more sessions closer to the test)
7. Include the test date in the notes field for sessions related to topics with tests
8. MUST schedule study sessions ONLY within the specified time periods for each day
9. Distribute sessions EVENLY across ALL enabled study days - do not skip any enabled day
10. **HOMEWORK INTEGRATION (CRITICAL)**: 
   - **MANDATORY**: EVERY homework assignment MUST appear in the timetable as dedicated "homework" type sessions
   - Homework is NOT optional - it has hard deadlines and MUST be scheduled
   - **CRITICAL SCHEDULING RULE**: Schedule homework AT LEAST 1-3 days BEFORE the due date, NEVER on the due date itself
   - For homework due on date X, schedule it on date X-1, X-2, or X-3 (earlier is better)
   - Example: If homework is due 2025-11-24, schedule it on 2025-11-23, 2025-11-22, or 2025-11-21 - NOT on 2025-11-24
   - **USE EXACT HOMEWORK DURATION**: The duration field MUST match the homework's specified duration
   - Break large homework (>120 mins) into 2-3 sessions across different days, each using portion of total duration
   - Homework sessions MUST use type="homework" and include homeworkDueDate field
   - Topic field should contain the homework title
   - Subject field should match the homework subject
   - Notes field should describe the homework (e.g., "Complete algebra homework - Due: YYYY-MM-DD")
   - **VERIFICATION**: The number of homework sessions in the schedule MUST equal the number of homework assignments provided
   - Schedule homework earlier rather than later - front-load homework in the schedule
   - **FINAL CHECK**: Verify that NO homework session is scheduled on its due date - all must be BEFORE

Create a detailed, balanced study schedule that:
1. **FIRST AND FOREMOST: Schedule ALL homework assignments** 
   - Homework has HARD DEADLINES and is MANDATORY
   - Count the homework assignments and ensure you create exactly that many homework sessions
   - **CRITICAL**: Schedule each homework 1-3 days BEFORE its due date - NEVER on the due date itself
   - If homework is due on date X, schedule it on X-1, X-2, or X-3 only
   - **USE EXACT DURATION**: Set duration field to the homework's specified duration (e.g., 150 mins, 60 mins, etc.)
   - Split large homework (>120 mins) into 2-3 smaller sessions if needed
   - Use type="homework", include homeworkDueDate, use homework title as topic
2. **INCLUDES EVERY SINGLE TOPIC**: Every topic from "ALL TOPICS TO COVER" must appear at least once
3. **MULTIPLE LONG SESSIONS FOR FOCUS TOPICS**: Topics in the "FOCUS TOPICS" section MUST have:
   - The EXACT number of study sessions specified (typically 4-6 sessions each)
   - Each session using the EXACT duration specified (typically 60-90 minutes per session)
   - Sessions distributed throughout the timetable period (spread across different days/weeks)
   - Example: If a focus topic needs 5 sessions of 75 minutes each, schedule them on 5 different days with 75-minute duration
4. **MINIMAL TIME FOR REGULAR TOPICS**: Non-focus topics get ONLY 1 session of ${preferences.session_duration} minutes each
5. Allocates more time to subjects with upcoming tests
6. Includes regular breaks between study sessions
7. ALWAYS schedules sessions within the specific time periods for each enabled day
8. Balances all subjects to avoid burnout
9. Includes revision of previously covered material
10. STOPS scheduling revision for each topic after its test date
11. Ensures consistent daily coverage on all enabled study days

**HOMEWORK COMPLETION CHECK**: Before finalizing, verify:
1. You've created a homework session for EACH homework assignment listed above
2. Each homework session uses the EXACT duration specified for that homework
3. NO homework session is scheduled ON its due date - all must be scheduled BEFORE the due date

**FOCUS vs REGULAR TOPICS CHECK**: Before finalizing, verify:
1. Focus topics have 4-6 sessions EACH with longer durations (60-90 mins per session)
2. Regular (non-focus) topics have ONLY 1 session EACH with standard duration (${preferences.session_duration} mins)

Return a JSON object with the following structure:
{
  "schedule": {
    "YYYY-MM-DD": [
      {
        "time": "HH:MM",
        "duration": minutes,
        "subject": "subject name",
        "topic": "topic name or homework title",
        "type": "study|break|revision|homework",
        "notes": "any specific instructions (MUST include due date for homework, test date for topics with tests)",
        "testDate": "YYYY-MM-DD" (optional, only if this topic has an associated test),
        "homeworkDueDate": "YYYY-MM-DD" (required for homework type)
      }
    ]
  }
}

**HOMEWORK SESSION EXAMPLE** (use this format):
If homework is due on 2025-11-25, schedule it on 2025-11-23 or 2025-11-24:
{
  "time": "14:00",
  "duration": 60,
  "subject": "Mathematics",
  "topic": "Complete Chapter 5 exercises",
  "type": "homework",
  "notes": "Homework assignment - Complete all questions from Chapter 5 - Due: 2025-11-25",
  "homeworkDueDate": "2025-11-25"
}
NOTE: This example shows the session on a date BEFORE 2025-11-25, NOT on 2025-11-25 itself.

**FINAL REMINDER**: 
1. DO NOT forget to schedule homework! Every homework assignment in the list MUST appear in the timetable as a dedicated session BEFORE its due date
2. Count them: if there are 3 homework assignments, there must be 3 homework sessions in your schedule
3. VERIFY: NO homework session should be scheduled ON its due date - all must be scheduled at least 1 day before

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
      // Try multiple patterns for markdown code fences
      let jsonString = aiResponse;
      
      // Remove markdown code fences if present (supports various formats)
      if (aiResponse.includes('```')) {
        jsonString = aiResponse
          .replace(/^```(?:json)?\s*/i, '') // Remove opening fence
          .replace(/\s*```\s*$/i, '')        // Remove closing fence
          .trim();
      }
      
      scheduleData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("Failed to parse AI response:", aiResponse.substring(0, 500));
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
