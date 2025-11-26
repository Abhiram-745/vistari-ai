import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Bytez from "https://esm.sh/bytez.js@latest";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BYTEZ_API_KEY = "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";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topics } = await req.json();

    // Format topics for AI analysis
    const topicsList = topics.map((t: any, i: number) => 
      `${i + 1}. ${t.name} (Subject: ${t.subject}, Current Difficulty: ${t.difficulty}, Confidence: ${t.confidence_level}/5)`
    ).join('\n');

    const sdk = new Bytez(BYTEZ_API_KEY);
    const model = sdk.model("google/gemini-2.5-flash");

    const { error, output } = await model.run([
      {
        role: 'system',
        content: `You are an expert GCSE study advisor. Analyze the provided topics and identify which ones should be prioritized in the study timetable based on:
1. Difficulty level (harder topics need more time)
2. Low confidence levels (topics with low confidence need more practice)
3. Topic complexity and interdependencies
4. Typical GCSE exam weightings

Provide a priority score (1-10) for each topic where 10 means highest priority for study time allocation.

Return ONLY valid JSON in this format:
{
  "priorities": [
    {"topic_name": "string", "priority_score": 1-10, "reasoning": "string"}
  ],
  "difficult_topics": [
    {"topic_name": "string", "reason": "string", "study_suggestion": "string"}
  ]
}`
      },
      {
        role: 'user',
        content: `Analyze these GCSE topics and assign priority scores:\n\n${topicsList}`
      }
    ]);

    if (error) {
      console.error('Bytez AI error:', error);
      return new Response(JSON.stringify({ error: "AI processing failed" }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let responseText = output.choices?.[0]?.message?.content;
    
    if (!responseText) {
      throw new Error('No content in AI response');
    }

    // Extract JSON from markdown if present
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      responseText = jsonMatch[1];
    }

    const analysis = JSON.parse(responseText);

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
