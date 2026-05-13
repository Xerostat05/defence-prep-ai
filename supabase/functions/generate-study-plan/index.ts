import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function parseJsonFromText(text: string) {
  try {
    const match = text.match(/```json\s*([\s\S]*?)```/);
    const payload = match ? match[1].trim() : text.trim();
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { exam_type, exam_date, weak_areas, hours_per_day } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const now = new Date();
    const start_date = now.toISOString().slice(0, 10);
    const examDate = exam_date ? new Date(exam_date) : null;
    const daysLeft = examDate ? Math.max(1, Math.ceil((examDate.getTime() - now.getTime()) / 86400000)) : 42;
    const horizonDescription = examDate
      ? `There are ${daysLeft} days until the exam, so create a targeted schedule from ${start_date} to ${exam_date}.`
      : `No exam date provided. Create a detailed 6-week plan starting from ${start_date}.`;

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
            content: "You are an expert study planner for Indian defence exams (NDA, CDS, AFCAT, CAPF, INET, SSB). Generate structured, actionable study plans that break preparation into daily and weekly work blocks.",
          },
          {
            role: "user",
            content: `Create a practical study plan for ${exam_type || "defence exam"} starting from ${start_date}. ${horizonDescription} Available hours per day: ${hours_per_day || 4}. Weak areas: ${weak_areas?.length ? weak_areas.join(", ") : "general revision and core concepts"}. Provide at least 2-3 focused tasks per day, allocate review sessions, and include a weekly summary item.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_study_plan",
              description: "Create a structured study plan with daily and weekly entries",
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
                        date: { type: "string" },
                        topics: { type: "array", items: { type: "string" } },
                        duration_hours: { type: "number" },
                        priority: { type: "string", enum: ["high", "medium", "low"] },
                        notes: { type: "string" },
                      },
                      required: ["week", "day", "date", "topics", "duration_hours", "priority"],
                    },
                  },
                  title: { type: "string" },
                  start_date: { type: "string" },
                  end_date: { type: "string" },
                },
                required: ["plan", "title", "start_date"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "create_study_plan" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI service temporarily unavailable." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI service error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let result = toolCall ? parseJsonFromText(typeof toolCall.function.arguments === "string" ? toolCall.function.arguments : JSON.stringify(toolCall.function.arguments)) : null;

    if (!result) {
      const fallbackText = data.choices?.[0]?.message?.content || "";
      result = parseJsonFromText(fallbackText) || { plan: [], title: `${exam_type} Study Plan` };
    }

    if (!result.start_date) result.start_date = start_date;
    if (!result.end_date && exam_date) result.end_date = exam_date;

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-study-plan error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
