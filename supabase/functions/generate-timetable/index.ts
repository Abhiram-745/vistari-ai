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
    break_duration: z.number().min(5).max(60),
    duration_mode: z.enum(["fixed", "flexible"]),
    aiNotes: z.string().optional()
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
  }).nullable().optional(),
  aiNotes: z.string().optional(),
  events: z.array(z.object({
    id: z.string().uuid(),
    title: z.string(),
    description: z.string().optional().nullable(),
    start_time: z.string(),
    end_time: z.string()
  })).optional(),
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

    const { subjects, topics, testDates, preferences, startDate, endDate, homeworks = [], topicAnalysis, aiNotes, events = [] } = parsed.data;

    console.log("Generating timetable with:", {
      subjectsCount: subjects.length,
      topicsCount: topics.length,
      testDatesCount: testDates.length,
      homeworksCount: homeworks.length,
      eventsCount: events.length,
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

    const userNotesContext = aiNotes 
      ? `\n\n**USER'S CUSTOM INSTRUCTIONS** (MUST FOLLOW THESE REQUIREMENTS):\n${aiNotes}\n`
      : "";

    const eventsContext = events.length > 0
      ? "\n\n**🚫 SCHEDULED EVENTS - COMPLETELY BLOCKED TIME SLOTS 🚫**\n" +
        "**CRITICAL INSTRUCTION: These times are ABSOLUTELY UNAVAILABLE - you MUST NOT schedule ANY study sessions, breaks, or ANY activities during these exact time ranges. Skip over these times entirely.**\n\n" +
        events
          .map((evt: any) => {
            const startDate = new Date(evt.start_time);
            const endDate = new Date(evt.end_time);
            const durationMins = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));
            return `⛔ ${evt.title}: ${startDate.toLocaleDateString()} from ${startDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} to ${endDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} (${durationMins} minutes) [COMPLETELY BLOCKED - SKIP THIS TIME]${evt.description ? ` - ${evt.description}` : ''}`;
          })
          .join("\n") +
        "\n\n**EXAMPLE**: If an event is scheduled 18:00-21:00, do NOT schedule anything at 18:00, 18:15, 18:30... 20:45. The next session must start at 21:00 or later.\n"
      : "";

    const prompt = `You are an expert study planner for GCSE students. Create a personalized revision timetable with the following details:

SUBJECTS: ${subjectsContext}

**ALL TOPICS TO COVER** (schedule ALL of these topics in the timetable): ${topicsContext}

UPCOMING TESTS: ${testsContext}

HOMEWORK ASSIGNMENTS: ${homeworksContext}
${priorityContext}
${difficultTopicsContext}
${userNotesContext}
${eventsContext}

STUDY PREFERENCES:
- Daily study hours target: ${preferences.daily_study_hours}
- Available study times per day: ${enabledDays}
- Duration mode: ${preferences.duration_mode === "fixed" ? "FIXED - Use exact durations specified below" : "FLEXIBLE - Vary durations intelligently based on task type"}
${preferences.duration_mode === "fixed" 
  ? `- Fixed session duration: ${preferences.session_duration} minutes (MUST use this exact duration for all study sessions)\n- Fixed break duration: ${preferences.break_duration} minutes (MUST use this exact duration for all breaks)` 
  : `- Default session duration: ${preferences.session_duration} minutes (guideline only - adjust intelligently)\n- Default break duration: ${preferences.break_duration} minutes (guideline only - adjust intelligently)`}

**IMPORTANT: Session duration rules based on mode:**
${preferences.duration_mode === "fixed" 
  ? `**FIXED MODE:**
- ALL study sessions (homework, focus topics, regular topics) MUST use EXACTLY ${preferences.session_duration} minutes
- ALL breaks MUST use EXACTLY ${preferences.break_duration} minutes
- NO EXCEPTIONS - consistency is key in fixed mode`
  : `**FLEXIBLE MODE:**
- Homework: Use the EXACT duration specified for each homework assignment
- Focus topics: Use LONGER sessions (60-90 minutes) regardless of default setting
- Regular topics: Use SHORTER sessions (30-45 minutes) regardless of default setting
- Breaks: Use 10-15 minutes between sessions
- The ${preferences.session_duration} minute default is just a guideline - adjust durations intelligently`}

**CRITICAL SESSION STRUCTURE & RECOMMENDED RESOURCES:**

For ALL subjects (except the very first topic of each subject):
- Each topic should have TWO different session types where possible:
  1. **Practice Session** - Active practice using recommended tools:
     - Mathematics: Dr Frost Maths, Corbett Maths
     - Physics: Revisely, SaveMyExams, Isaac Physics
     - Chemistry: Revisely, SaveMyExams
     - Biology: Revisely, SaveMyExams
     - All subjects: SaveMyExams (covers all GCSE subjects)
  
  2. **Exam Questions Session** - Past paper practice:
     - PMT (Physics & Maths Tutor) - all subjects
     - Study Mind - all subjects
     - SaveMyExams - has past papers too
     - Subject-specific exam board papers

**FIRST TOPIC STRUCTURE (for all subjects EXCEPT Mathematics):**
- For the FIRST topic of each non-maths subject, use this structure:
  1. **Revision Notes Session** - Reading and understanding notes
  2. **Exam Questions Session** - Applying knowledge through questions

**MATHEMATICS FIRST TOPIC:**
- First maths topic follows the standard 2-session structure (Practice + Exam Questions)

**FLEXIBLE SESSION ALLOCATION:**
- NOT all topics need exactly 2 sessions
- HIGH PRIORITY/DIFFICULT topics may need 3-4+ sessions (mix of practice and exam questions)
- EASIER/LOWER PRIORITY topics might only need 1 session (combined practice + questions)
- AI should intelligently allocate sessions based on:
  * Time available in the schedule
  * Total number of topics to cover
  * Topic difficulty/priority level
  * Proximity to test dates

**SESSION NOTES FIELD:**
- MUST include the recommended resource in the notes field
- Example: "Practice using Dr Frost Maths exercises"
- Example: "Exam questions from PMT past papers"
- Example: "Revision notes - read and summarize key concepts"

TIMETABLE PERIOD: ${startDate} to ${endDate}

**TEST DAY BLOCKING (CRITICAL):**
${testDates.length > 0 ? `The following dates are TEST DAYS and are COMPLETELY BLOCKED - DO NOT schedule ANY study sessions on these dates:
${testDates.map((td: any) => {
  const subject = subjects.find((s: any) => s.id === td.subject_id);
  return `- ${td.test_date}: ${subject?.name} ${td.test_type} [BLOCKED - NO STUDY SESSIONS]`;
}).join('\n')}

Students cannot study on test days. Schedule all revision BEFORE the test date, never on the test date itself.` : ''}

**🔴 CRITICAL REQUIREMENTS - MUST FOLLOW 🔴:**
${aiNotes ? "0. **FOLLOW USER'S CUSTOM INSTRUCTIONS**: The user has provided specific instructions above. These MUST be followed precisely - they take priority over general guidelines below." : ""}
${events.length > 0 ? `0. **⛔ BLOCKED EVENT TIMES - ABSOLUTELY NO SCHEDULING DURING EVENTS ⛔**: 
   - The times listed in 'SCHEDULED EVENTS - BLOCKED TIME SLOTS' are COMPLETELY UNAVAILABLE
   - You MUST NOT schedule ANY study sessions, breaks, or ANY activity that overlaps with event times
   - When an event blocks time (e.g., 18:00-21:00), skip that ENTIRE period completely
   - Resume scheduling ONLY AFTER the event ends (e.g., start at 21:00 or later, never at 18:15 or 19:00)
   - Work around events by scheduling sessions before events start or after events end
   - Events have ABSOLUTE PRIORITY over all study activities` : ""}
${testDates.length > 0 ? "0. **TEST DAYS ARE COMPLETELY BLOCKED**: DO NOT schedule ANY sessions on the dates listed in 'TEST DAY BLOCKING'. These entire days are unavailable for studying." : ""}
1. **INCLUDE ALL TOPICS**: Every single topic listed in "ALL TOPICS TO COVER" MUST appear in the timetable at least once
2. **TWO-SESSION STRUCTURE**: Where time allows, most topics should have 2 sessions (Practice + Exam Questions), except:
   - First topic in non-maths subjects: Revision Notes + Exam Questions
   - High priority topics: 3-4+ sessions (multiple practice and exam question sessions)
   - Low priority/time-limited topics: May have just 1 combined session
3. **RESOURCE RECOMMENDATIONS**: Every session MUST include appropriate resource recommendations in the notes field (e.g., "Practice using Dr Frost Maths", "Exam questions from PMT")
4. **DURATION MODE COMPLIANCE**: ${preferences.duration_mode === "fixed" 
  ? `FIXED MODE - ALL sessions MUST be EXACTLY ${preferences.session_duration} minutes and ALL breaks MUST be EXACTLY ${preferences.break_duration} minutes. NO EXCEPTIONS.`
  : `FLEXIBLE MODE - Vary durations intelligently: homework (exact specified duration), focus topics (60-90 mins), regular topics (30-45 mins), breaks (10-15 mins)`}
5. **FOCUS TOPICS GET SIGNIFICANTLY MORE TIME**: Topics listed in "FOCUS TOPICS" section need MUCH MORE study time:
   - Schedule the EXACT number of sessions specified for each focus topic (typically 4-6 sessions per focus topic)
   - Use a MIX of practice sessions and exam question sessions for these topics
   ${preferences.duration_mode === "flexible" 
     ? "- Each focus topic session should be LONGER (60-90 minutes)" 
     : `- Each focus topic session uses the fixed ${preferences.session_duration} minute duration`}
   - Distribute these sessions throughout the study period (not all on the same day)
   - Space out focus topic sessions - don't cluster them all together
6. **REGULAR TOPICS**: Topics NOT in the focus list get scheduled with fewer sessions (1-2 sessions each depending on time available)
   ${preferences.duration_mode === "flexible" 
     ? "- Each regular topic session: 30-45 minutes" 
     : `- Each regular topic session: ${preferences.session_duration} minutes (fixed)`}
7. **HOMEWORK DURATION**: ${preferences.duration_mode === "fixed" 
  ? `Each homework session MUST use the fixed ${preferences.session_duration} minute duration. If homework needs more time, split it into multiple ${preferences.session_duration}-minute sessions across different days.`
  : "Each homework session MUST use its exact specified duration (e.g., 150 mins, 60 mins, 30 mins). Large homework (>120 mins) can be split into multiple sessions if needed."}
8. DO NOT schedule any revision for a topic AFTER its test date has passed
9. Prioritize revision for topics with upcoming test dates (schedule more sessions closer to the test)
10. Include the test date in the notes field for sessions related to topics with tests
11. MUST schedule study sessions ONLY within the specified time periods for each day
12. Distribute sessions EVENLY across ALL enabled study days - do not skip any enabled day
10. **HOMEWORK INTEGRATION (CRITICAL)**: 
   - **MANDATORY**: EVERY homework assignment MUST appear in the timetable as dedicated "homework" type sessions
   - Homework is NOT optional - it has hard deadlines and MUST be scheduled
   - **CRITICAL SCHEDULING RULE**: Schedule homework AT LEAST 1-3 days BEFORE the due date, NEVER on the due date itself
   - For homework due on date X, schedule it on date X-1, X-2, or X-3 (earlier is better)
   - Example: If homework is due 2025-11-24, schedule it on 2025-11-23, 2025-11-22, or 2025-11-21 - NOT on 2025-11-24
   - **USE EXACT HOMEWORK DURATION**: The duration field MUST match the homework's specified duration (e.g., 150, 60, 30 mins)
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
   ${preferences.duration_mode === "fixed" 
     ? `- **FIXED DURATION**: Each homework session MUST be ${preferences.session_duration} minutes. Split larger homework into multiple ${preferences.session_duration}-min sessions if needed.`
     : "- **EXACT DURATION**: Set duration field to the homework's specified duration (e.g., 150 mins, 60 mins, 30 mins). Split large homework (>120 mins) into 2-3 sessions if needed."}
   - Use type="homework", include homeworkDueDate, use homework title as topic
2. **🎯 MANDATORY: FILL THE ENTIRE TIME WINDOW TO THE END 🎯**
   - **CRITICAL**: If user requests study until 23:30, you MUST generate sessions that reach 23:30
   - The LAST session must end at or very close to the user's requested end time
   - **NEVER stop early** - if the user wants to study until 23:30, don't stop at 21:00 or 22:00
   - If you run out of selected topics BEFORE reaching the end time, you MUST add more content:
     * Repeat important/difficult topics with additional practice sessions
     * Add extra exam question sessions for topics with upcoming tests
     * Create extended revision sessions for topics that need reinforcement
     * Add more homework sessions if homework exists
     * Add "General Revision" sessions covering multiple topics
   - The schedule MUST fill the ENTIRE time window from start to end for EVERY enabled study day
   - **VERIFICATION**: Check that the last session on each day ends at or near the user's requested end time
   - Work around blocked event times - schedule before events or after events end
3. **IMPLEMENTS TWO-SESSION STRUCTURE**: For each topic, intelligently create appropriate sessions:
   - **Most topics**: 2 sessions (Practice with recommended tools + Exam questions)
   - **First topic in non-maths subjects**: 2 sessions (Revision notes + Exam questions)
   - **High priority/difficult topics**: 3-4+ sessions (mix of practice and exam question sessions)
   - **Low priority/time-limited topics**: 1 session (combined approach)
   - Session type should be indicated in notes field with resource recommendations
4. **INCLUDES EVERY SINGLE TOPIC**: Every topic from "ALL TOPICS TO COVER" must appear at least once
5. **MULTIPLE SESSIONS FOR FOCUS TOPICS**: Topics in the "FOCUS TOPICS" section MUST have:
   - The EXACT number of study sessions specified (typically 4-6 sessions each)
   - A MIX of "practice" and "exam questions" sessions
   ${preferences.duration_mode === "flexible" 
     ? "- Each session using LONGER duration (60-90 minutes per session)"
     : `- Each session using the FIXED ${preferences.session_duration} minute duration`}
   - Sessions distributed throughout the timetable period (spread across different days/weeks)
6. **APPROPRIATE TIME FOR REGULAR TOPICS**: Non-focus topics get 1-2 sessions each (time permitting)
   ${preferences.duration_mode === "flexible" 
     ? "- Each session: 30-45 minutes"
     : `- Each session: ${preferences.session_duration} minutes`}
7. **RESOURCE RECOMMENDATIONS IN NOTES**: Every session must include recommended study resources in the notes field:
   - Practice sessions: "Practice using [Dr Frost Maths / Revisely / SaveMyExams]"
   - Exam questions: "Exam questions from [PMT / Study Mind / SaveMyExams]"
   - Revision notes: "Read and summarize revision notes"
8. **SESSION DURATION COMPLIANCE**: ${preferences.duration_mode === "fixed" 
  ? `ALL sessions must be EXACTLY ${preferences.session_duration} minutes and ALL breaks must be EXACTLY ${preferences.break_duration} minutes. This is a STRICT requirement in fixed mode.`
  : "Session lengths should vary intelligently based on task type (homework exact duration, focus topics 60-90 mins, regular topics 30-45 mins)."}
9. Allocates more time to subjects with upcoming tests
10. Includes regular breaks between study sessions
11. ALWAYS schedules sessions within the specific time periods for each enabled day
12. Balances all subjects to avoid burnout
13. Includes revision of previously covered material
14. STOPS scheduling revision for each topic after its test date
15. Ensures consistent daily coverage on all enabled study days

**HOMEWORK COMPLETION CHECK**: Before finalizing, verify:
1. You've created a homework session for EACH homework assignment listed above
${preferences.duration_mode === "fixed" 
  ? `2. Each homework session uses the FIXED ${preferences.session_duration} minute duration (split larger homework into multiple sessions if needed)`
  : "2. Each homework session uses the EXACT duration specified for that homework"}
3. NO homework session is scheduled ON its due date - all must be scheduled BEFORE the due date

**SESSION STRUCTURE CHECK**: Before finalizing, verify:
1. Most topics have 2 sessions (Practice + Exam Questions) where time permits
2. First topic in non-maths subjects has 2 sessions (Revision Notes + Exam Questions)
3. High priority topics have 3-4+ sessions with mix of practice and exam questions
4. Every session includes resource recommendations in notes field

**FOCUS vs REGULAR TOPICS CHECK**: Before finalizing, verify:
${preferences.duration_mode === "fixed"
  ? `1. Focus topics have 4-6 sessions EACH, all using FIXED ${preferences.session_duration} minute duration, with mix of practice and exam question sessions\n2. Regular (non-focus) topics have 1-2 sessions EACH using FIXED ${preferences.session_duration} minute duration\n3. ALL breaks are EXACTLY ${preferences.break_duration} minutes`
  : "1. Focus topics have 4-6 sessions EACH with LONGER durations (60-90 mins per session), with mix of practice and exam question sessions\n2. Regular (non-focus) topics have 1-2 sessions EACH with appropriate duration (30-45 mins)\n3. Session durations are VARIED and appropriate for each task type\n4. Breaks are 10-15 minutes"}

Return a JSON object with the following structure:
{
  "schedule": {
    "YYYY-MM-DD": [
      {
        "time": "HH:MM",
        "duration": minutes,
        "subject": "subject name",
        "topic": "topic name or homework title",
        "type": "study|break|revision|homework|practice|exam_questions",
        "notes": "MUST include resource recommendations (e.g., 'Practice using Dr Frost Maths', 'Exam questions from PMT') and any specific instructions (MUST include due date for homework, test date for topics with tests)",
        "testDate": "YYYY-MM-DD" (optional, only if this topic has an associated test),
        "homeworkDueDate": "YYYY-MM-DD" (required for homework type)
      }
    ]
  }
}

**PRACTICE SESSION EXAMPLE** (session 1 for a topic):
{
  "time": "09:00",
  "duration": 60,
  "subject": "Mathematics",
  "topic": "Quadratic Equations",
  "type": "practice",
  "notes": "Practice using Dr Frost Maths - Complete 15-20 questions on solving quadratics"
}

**EXAM QUESTIONS SESSION EXAMPLE** (session 2 for a topic):
{
  "time": "10:15",
  "duration": 45,
  "subject": "Mathematics",
  "topic": "Quadratic Equations",
  "type": "exam_questions",
  "notes": "Exam questions from PMT - Past paper questions on quadratic equations"
}

**REVISION NOTES SESSION EXAMPLE** (first session for non-maths subjects):
{
  "time": "11:15",
  "duration": 45,
  "subject": "Biology",
  "topic": "Cell Structure",
  "type": "revision",
  "notes": "Read and summarize revision notes on cell structure - Use SaveMyExams notes"
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
4. IMPLEMENT TWO-SESSION STRUCTURE: Most topics should have 2 sessions (Practice + Exam Questions), except first topic in non-maths subjects (Revision Notes + Exam Questions)
5. RESOURCE RECOMMENDATIONS: Every session MUST include specific resource recommendations in the notes field (Dr Frost Maths, Revisely, SaveMyExams, PMT, Study Mind, etc.)
6. HIGH PRIORITY TOPICS: These need 3-4+ sessions with mix of practice and exam questions

Make the schedule practical, achievable, and effective for GCSE exam preparation.`;

    // Validate date range isn't too long (max 4 weeks)
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff > 28) {
      return new Response(
        JSON.stringify({ 
          error: "Date range too long. Maximum timetable length is 4 weeks. Please create a shorter timetable or split it into multiple timetables." 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Add timeout to prevent hanging - increased for complex generation
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 second timeout for large timetables

    let response;
    try {
      response = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite", // Faster and cheaper for complex tasks
            messages: [
              {
                role: "system",
                content:
                  "You are an expert educational planner specializing in GCSE revision strategies. Always return valid JSON only, no additional text or markdown. If the timetable is very long, prioritize completeness - ensure all days have closing braces.",
              },
              { role: "user", content: prompt },
            ],
            max_completion_tokens: 32000, // Increased for large timetables
            temperature: 0.7, // Add some creativity while maintaining structure
          }),
          signal: controller.signal,
        }
      );
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error("AI request timed out. Please try with a shorter date range or fewer subjects.");
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }

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
    const aiResponse = data.choices?.[0]?.message?.content;

    // Validate that we got a response
    if (!aiResponse || aiResponse.trim() === '') {
      console.error("Empty AI response received");
      throw new Error("AI did not generate a response. Please try again or simplify your request.");
    }

    console.log("AI Response:", aiResponse.substring(0, 200) + "...");

    // Extract JSON from markdown code blocks if present
    let scheduleData;
    try {
      // Try multiple patterns for markdown code fences
      let jsonString = aiResponse.trim();
      
      // Remove markdown code fences if present (supports various formats)
      if (jsonString.includes('```')) {
        jsonString = jsonString
          .replace(/^```(?:json)?\s*/i, '') // Remove opening fence
          .replace(/\s*```\s*$/i, '')        // Remove closing fence
          .trim();
      }
      
      // Advanced JSON repair for truncated responses
      if (!jsonString.endsWith('}')) {
        console.log('JSON appears truncated, attempting comprehensive repair...');
        
        // Remove any incomplete array element at the end
        const lastCompleteObject = jsonString.lastIndexOf('},');
        const lastArrayClose = jsonString.lastIndexOf(']');
        
        if (lastCompleteObject > lastArrayClose) {
          // We're in the middle of an object, find the last complete one
          jsonString = jsonString.substring(0, lastCompleteObject + 1);
        } else if (lastArrayClose > -1) {
          // We have at least one complete array
          jsonString = jsonString.substring(0, lastArrayClose + 1);
        }
        
        // Count opening and closing braces to balance them
        let openBraces = (jsonString.match(/{/g) || []).length;
        let closeBraces = (jsonString.match(/}/g) || []).length;
        let openBrackets = (jsonString.match(/\[/g) || []).length;
        let closeBrackets = (jsonString.match(/\]/g) || []).length;
        
        // Close any open arrays
        while (closeBrackets < openBrackets) {
          jsonString += '\n    ]';
          closeBrackets++;
        }
        
        // Close any open objects
        while (closeBraces < openBraces) {
          jsonString += '\n  }';
          closeBraces++;
        }
        
        console.log('Repair complete - balanced braces and brackets');
      }
      
      // Additional validation that we have some JSON-like content
      if (!jsonString || jsonString.length < 10) {
        throw new Error("AI response is too short to be valid JSON");
      }

      scheduleData = JSON.parse(jsonString);
      
      // Validate that schedule exists in the response
      if (!scheduleData.schedule || typeof scheduleData.schedule !== 'object') {
        throw new Error("AI response missing valid schedule object");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", aiResponse.substring(0, 500));
      console.error("Parse error:", parseError);
      const errorMsg = parseError instanceof Error ? parseError.message : 'Could not parse JSON';
      throw new Error(`Invalid AI response format: ${errorMsg}`);
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
