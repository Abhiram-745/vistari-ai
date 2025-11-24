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
    const { text, subjectName, images } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Build the user message content
    const userContent: any[] = [];
    
    // Add text if provided
    if (text) {
      userContent.push({
        type: "text",
        text: `Subject: ${subjectName}\n\nExtract topics from this text:\n${text}`
      });
    }
    
    // Add images if provided
    if (images && Array.isArray(images)) {
      images.forEach((imageData: string) => {
        userContent.push({
          type: "image_url",
          image_url: {
            url: imageData
          }
        });
      });
      
      // Add instruction for images
      userContent.push({
        type: "text",
        text: images.length > 0 && !text 
          ? `Subject: ${subjectName}\n\nExtract all study topics visible in the provided images. Look for checklists, notes, topic lists, or any educational content.` 
          : "\n\nAlso extract any additional topics from the images provided."
      });
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an expert at extracting study topics from text and images. 

Your task:
1. Carefully analyze the provided text and/or images
2. Extract ALL distinct study topics, chapters, or subtopics mentioned
3. Look for: checklists, bullet points, numbered lists, topic headers, chapter names, subject content
4. Return ONLY the topic names - be concise but clear
5. Each topic should be a distinct learning unit

For images: Look for handwritten notes, typed checklists, textbook pages, revision guides, or any educational content.`
          },
          {
            role: 'user',
            content: userContent
          }
        ],
        max_tokens: 2000,
        tools: [
          {
            type: "function",
            function: {
              name: "extract_topics",
              description: "Extract study topics from text and images",
              parameters: {
                type: "object",
                properties: {
                  topics: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" }
                      },
                      required: ["name"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["topics"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_topics" } }
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
    console.log('AI Response:', JSON.stringify(data, null, 2));
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      console.error('No tool call in response. Full response:', data);
      throw new Error('No topics extracted from AI response');
    }

    const parsedTopics = JSON.parse(toolCall.function.arguments);

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
