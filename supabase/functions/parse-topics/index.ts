import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENROUTER_API_KEY = "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";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, subjectName, images } = await req.json();

    // Build content array for OpenRouter
    const contentArray: any[] = [];
    
    // Add text instruction
    let instructionText = `Subject: ${subjectName}\n\nExtract ALL distinct study topics from `;
    if (text && images && images.length > 0) {
      instructionText += `the following text and ${images.length} image(s):\n\n${text}`;
    } else if (text) {
      instructionText += `the following text:\n\n${text}`;
    } else if (images && images.length > 0) {
      instructionText += `the ${images.length} image(s) provided.`;
    }
    
    contentArray.push({
      type: "text",
      text: instructionText
    });

    // Add images to content array
    if (images && Array.isArray(images) && images.length > 0) {
      for (const imageUrl of images) {
        contentArray.push({
          type: "image_url",
          image_url: {
            url: imageUrl
          }
        });
      }
    }

    const systemPrompt = `You are an expert at extracting study topics from text and images. 

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
}`;

    // Call OpenRouter API
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-exp:free",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: contentArray
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', response.status, errorText);
      return new Response(JSON.stringify({ error: "AI processing failed", details: errorText }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    console.log('OpenRouter AI response:', JSON.stringify(data, null, 2));

    // Extract content from OpenRouter response
    const responseText = data.choices?.[0]?.message?.content;

    if (!responseText || responseText.trim() === "") {
      console.error('Empty AI response. Raw output:', JSON.stringify(data, null, 2));
      throw new Error('AI did not generate a response. Please try again.');
    }

    // Extract JSON from markdown if present
    let jsonString = responseText;
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (jsonMatch) {
      jsonString = jsonMatch[1];
    }

    const parsedTopics = JSON.parse(jsonString);

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
