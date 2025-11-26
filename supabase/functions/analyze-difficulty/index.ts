import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Bytez from "https://esm.sh/bytez.js@latest";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BYTEZ_API_KEY = "840ecbd12ca7f2cfd93354ebb304535e";

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
    const model = sdk.model("google/gemini-2.5-pro");

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

    console.log('Bytez AI response:', JSON.stringify(output, null, 2));

    if (error) {
      console.error('Bytez AI error:', JSON.stringify(error, null, 2));
      return new Response(JSON.stringify({ error: "AI processing failed", details: error }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract content from Bytez response (handles both direct { role, content } and OpenAI-style formats)
    let responseText: string | undefined;
    
    if (typeof output === "string") {
      responseText = output;
    } else if (output?.content) {
      // Direct { role, content } format from Gemini via Bytez
      responseText = output.content;
    } else if (output?.choices?.[0]?.message?.content) {
      // OpenAI-style fallback
      responseText = output.choices[0].message.content;
    }

    if (!responseText || responseText.trim() === "") {
      console.error('Empty AI response. Raw output:', JSON.stringify(output, null, 2));
      throw new Error('AI did not generate a response. Please try again.');
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
