import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { exam_type, exam_date, weak_areas, hours_per_day } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "You are an expert study planner for Indian defence exams (NDA, CDS, AFCAT, CAPF, INET, SSB). Generate structured, actionable weekly study plans.",
          },
          {
            role: "user",
            content: `Create a detailed weekly study plan for ${exam_type} exam. Exam date: ${exam_date || 'Not specified'}. Weak areas: ${weak_areas || 'None specified'}. Available hours per day: ${hours_per_day || 4}. Return the plan as a JSON array of objects with fields: week (number), day (string like "Monday"), topics (array of strings), duration_hours (number), priority (high/medium/low). Only return the JSON array, no other text.`,
          },
        ],
        tools: [{
          type: "function",
          function: {
            name: "create_study_plan",
            description: "Create a structured weekly study plan",
            parameters: {
              type: "object",
              properties: {
                plan: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      week: { type: "number" },
                      day: { type: "string" },
                      topics: { type: "array", items: { type: "string" } },
                      duration_hours: { type: "number" },
                      priority: { type: "string", enum: ["high", "medium", "low"] },
                    },
                    required: ["week", "day", "topics", "duration_hours", "priority"],
                  },
                },
                title: { type: "string" },
              },
              required: ["plan", "title"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "create_study_plan" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI service temporarily unavailable." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI service error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    const result = toolCall ? JSON.parse(toolCall.function.arguments) : { plan: [], title: `${exam_type} Study Plan` };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-study-plan error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
