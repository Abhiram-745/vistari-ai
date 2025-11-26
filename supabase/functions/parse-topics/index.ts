import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

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

    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY not configured");
    }

    const systemPrompt = `You are an expert at extracting study topics from images and text.

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
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `${systemPrompt}\n\n${userMessage}` }]
          }],
          generationConfig: {
            temperature: 1,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      throw new Error(`Gemini API request failed: ${response.status}`);
    }

    const geminiResult = await response.json();
    console.log('Gemini AI response:', JSON.stringify(geminiResult, null, 2));

    // Extract content from Gemini response
    let responseText: string | undefined;
    if (geminiResult.candidates?.[0]?.content?.parts?.[0]?.text) {
      responseText = geminiResult.candidates[0].content.parts[0].text;
    }

    if (!responseText || responseText.trim() === "") {
      console.error('Empty AI response. Raw result:', JSON.stringify(geminiResult, null, 2));
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
