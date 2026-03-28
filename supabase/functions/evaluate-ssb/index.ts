import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { type, responses } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!type || !responses || !Array.isArray(responses)) {
      return new Response(JSON.stringify({ error: "Invalid input: type and responses array required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (type === "wat") {
      systemPrompt = `You are an expert SSB psychologist evaluating Word Association Test (WAT) responses. 
For each word-response pair, evaluate:
1. Positivity & constructive thinking
2. Officer Like Qualities (OLQ) reflected
3. Response time appropriateness
4. Overall personality indicators

Provide a JSON response with this exact structure:
{"overall_score": <number 1-10>, "olq_indicators": [<string>], "strengths": [<string>], "improvements": [<string>], "detailed_feedback": [{"word": "<string>", "response": "<string>", "score": <number 1-10>, "comment": "<string>"}]}`;
      userPrompt = `Evaluate these WAT responses:\n${responses.map((r: any) => `Word: "${r.word}" → Response: "${r.response}" (Time: ${r.timeTaken}s)`).join("\n")}`;
    } else if (type === "tat") {
      systemPrompt = `You are an expert SSB psychologist evaluating Thematic Apperception Test (TAT) stories.
For each story, evaluate:
1. Story structure (beginning, middle, end)
2. Positive hero with Officer Like Qualities
3. Action orientation and initiative
4. Realistic and practical thinking
5. Emotional maturity

Provide a JSON response with this exact structure:
{"overall_score": <number 1-10>, "olq_indicators": [<string>], "strengths": [<string>], "improvements": [<string>], "detailed_feedback": [{"theme": "<string>", "score": <number 1-10>, "story_quality": "<string>", "olq_shown": [<string>], "suggestion": "<string>"}]}`;
      userPrompt = `Evaluate these TAT stories:\n${responses.map((r: any, i: number) => `Picture ${i + 1} (Theme: ${r.theme}):\n"${r.story}"\nTime taken: ${r.timeTaken}s`).join("\n\n")}`;
    } else if (type === "srt") {
      systemPrompt = `You are an expert SSB psychologist evaluating Situation Reaction Test (SRT) responses.
For each situation-reaction pair, evaluate:
1. Practicality and feasibility
2. Initiative and leadership shown
3. Social adaptability
4. Emotional stability under pressure
5. Officer Like Qualities demonstrated

Provide a JSON response with this exact structure:
{"overall_score": <number 1-10>, "olq_indicators": [<string>], "strengths": [<string>], "improvements": [<string>], "detailed_feedback": [{"situation": "<string>", "reaction": "<string>", "score": <number 1-10>, "olq_shown": [<string>], "suggestion": "<string>"}]}`;
      userPrompt = `Evaluate these SRT responses:\n${responses.map((r: any) => `Situation: "${r.situation}"\nReaction: "${r.reaction}"\nTime: ${r.timeTaken}s`).join("\n\n")}`;
    } else {
      return new Response(JSON.stringify({ error: "Invalid type. Use 'wat', 'tat', or 'srt'" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "submit_evaluation",
            description: "Submit the SSB test evaluation results",
            parameters: {
              type: "object",
              properties: {
                overall_score: { type: "number" },
                olq_indicators: { type: "array", items: { type: "string" } },
                strengths: { type: "array", items: { type: "string" } },
                improvements: { type: "array", items: { type: "string" } },
                detailed_feedback: { type: "array", items: { type: "object" } },
              },
              required: ["overall_score", "olq_indicators", "strengths", "improvements", "detailed_feedback"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "submit_evaluation" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI service temporarily unavailable." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI evaluation failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    let evaluation;
    if (toolCall?.function?.arguments) {
      evaluation = typeof toolCall.function.arguments === "string" 
        ? JSON.parse(toolCall.function.arguments) 
        : toolCall.function.arguments;
    } else {
      // Fallback: try to parse from content
      const content = data.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      evaluation = jsonMatch ? JSON.parse(jsonMatch[0]) : { overall_score: 5, olq_indicators: [], strengths: [], improvements: ["Could not parse evaluation"], detailed_feedback: [] };
    }

    return new Response(JSON.stringify(evaluation), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("evaluate-ssb error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
