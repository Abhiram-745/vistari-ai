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
    const model = sdk.model("google/gemini-2.5-pro");

    const { error, output } = await model.run([
      {
        role: 'system',
        content: `You are an expert at extracting study topics from images and text.

CRITICAL RULES - READ CAREFULLY:
1. Extract ONLY topics that are explicitly visible in the provided images/text
2. DO NOT generate, infer, or add ANY topics that are not directly shown
3. DO NOT expand topic names beyond what is written
4. DO NOT add related topics, subtopics, or chapters that are not explicitly listed
5. Copy the exact topic names as they appear in the images/text
6. If a checklist, bullet list, or numbered list is shown, extract ONLY those items

Your task:
- Look at the images/text provided
- Find topic names, chapter titles, checklist items, or bullet points
- Extract them EXACTLY as written
- Return ONLY what you can see - nothing more, nothing less

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
