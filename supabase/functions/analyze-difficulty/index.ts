import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topics } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Format topics for AI analysis
    const topicsList = topics.map((t: any, i: number) => 
      `${i + 1}. ${t.name} (Subject: ${t.subject}, Current Difficulty: ${t.difficulty}, Confidence: ${t.confidence_level}/5)`
    ).join('\n');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            content: `You are an expert GCSE study advisor. Analyze the provided topics and identify which ones should be prioritized in the study timetable based on:
1. Difficulty level (harder topics need more time)
2. Low confidence levels (topics with low confidence need more practice)
3. Topic complexity and interdependencies
4. Typical GCSE exam weightings

Provide a priority score (1-10) for each topic where 10 means highest priority for study time allocation.`
          },
          {
            role: 'user',
            content: `Analyze these GCSE topics and assign priority scores:\n\n${topicsList}`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "prioritize_topics",
              description: "Assign priority scores to topics for optimal study time allocation",
              parameters: {
                type: "object",
                properties: {
                  priorities: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        topic_name: { type: "string" },
                        priority_score: { type: "integer", minimum: 1, maximum: 10 },
                        reasoning: { type: "string" }
                      },
                      required: ["topic_name", "priority_score", "reasoning"],
                      additionalProperties: false
                    }
                  },
                  difficult_topics: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        topic_name: { type: "string" },
                        reason: { type: "string" },
                        study_suggestion: { type: "string" }
                      },
                      required: ["topic_name", "reason", "study_suggestion"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["priorities", "difficult_topics"],
                additionalProperties: false
              }
            }
          }
        ],
        max_completion_tokens: 2000,
        tool_choice: { type: "function", function: { name: "prioritize_topics" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings → Workspace → Usage." }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No analysis returned from AI');
    }

    const analysis = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-difficulty:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
