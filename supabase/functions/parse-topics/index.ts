import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Bytez from "https://esm.sh/bytez.js@latest";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BYTEZ_API_KEY = "476fe6c6dd44210bfce5aba310beb8cb";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, subjectName, images } = await req.json();

    // Build user message
    let userMessage = `Subject: ${subjectName}\n\n`;
    if (text) {
      userMessage += `Extract topics from this text:\n${text}`;
    }
    if (images && Array.isArray(images) && images.length > 0) {
      userMessage += (text ? "\n\n" : "") + `Also extract topics from ${images.length} image(s) provided.`;
    }

    const sdk = new Bytez(BYTEZ_API_KEY);
    const model = sdk.model("openai/gpt-5-mini");

    const { error, output } = await model.run([
      {
        role: 'system',
        content: `You are an expert at extracting study topics from text and images. 

Your task:
1. Carefully analyze the provided text and/or images
2. Extract ALL distinct study topics, chapters, or subtopics mentioned
3. Look for: checklists, bullet points, numbered lists, topic headers, chapter names, subject content
4. Return ONLY the topic names - be concise but clear
5. Each topic should be a distinct learning unit

Return ONLY valid JSON in this format:
{
  "topics": [
    {"name": "Topic 1"},
    {"name": "Topic 2"}
  ]
}`
      },
      {
        role: 'user',
        content: userMessage
      }
    ]);

    if (error) {
      console.error('Bytez AI error:', error);
      return new Response(JSON.stringify({ error: "AI processing failed" }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('AI Response:', JSON.stringify(output, null, 2));
    let responseText = output.choices?.[0]?.message?.content;
    
    if (!responseText) {
      throw new Error('No content in AI response');
    }

    // Extract JSON from markdown if present
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      responseText = jsonMatch[1];
    }

    const parsedTopics = JSON.parse(responseText);

    return new Response(JSON.stringify({ topics: parsedTopics.topics }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in parse-topics:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
