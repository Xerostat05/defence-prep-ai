import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const {
      user_id,
      exam_type,
      weak_areas,
      hours_available,
      target_date,
    } = await req.json();

    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY not configured");

    // 1. Generate AI-powered personalized study plan
    const studyPlanPrompt = `
Create a detailed, adaptive study plan for a ${exam_type} candidate with:
- Weak areas: ${weak_areas.join(", ")}
- Available hours: ${hours_available} per week
- Target date: ${target_date}

Return a JSON object with:
{
  "plan_title": "string",
  "duration_days": number,
  "weekly_schedule": [
    {
      "week": number,
      "focus_areas": ["area1", "area2"],
      "daily_schedule": [
        {
          "day": "Monday-Friday",
          "topic": "string",
          "study_duration_hours": number,
          "resources": ["resource1", "resource2"],
          "practice_type": "theory|practice|mock_test",
          "priority": "high|medium|low"
        }
      ],
      "revision_hours": number
    }
  ],
  "milestone_targets": [
    {
      "week": number,
      "target": "description",
      "success_criteria": "description"
    }
  ],
  "adaptive_adjustments": "How to adjust if falling behind",
  "estimated_completion_probability": 0.85
}`;

    const planResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: studyPlanPrompt }],
          temperature: 0.5,
          response_format: { type: "json_object" },
        }),
      }
    );

    const planData = await planResponse.json();
    const studyPlan = JSON.parse(planData.choices[0].message.content);

    // 2. Generate practice questions tailored to weak areas
    const questionsPrompt = `
Generate 10 high-quality practice questions for ${exam_type} focusing on weak areas: ${weak_areas.join(", ")}

Return JSON array:
[
  {
    "id": "q_uuid",
    "question": "string",
    "options": ["A", "B", "C", "D"],
    "correct_answer": "A",
    "explanation": "string",
    "difficulty": "easy|medium|hard",
    "topic": "string",
    "time_limit_seconds": 120,
    "skill_tested": ["skill1", "skill2"]
  }
]`;

    const questionsResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: questionsPrompt }],
          temperature: 0.7,
          response_format: { type: "json_object" },
        }),
      }
    );

    const questionsData = await questionsResponse.json();
    const questions = JSON.parse(questionsData.choices[0].message.content);

    // 3. Generate study materials with AI
    const materialsPrompt = `
Create comprehensive study materials for ${exam_type} weak areas: ${weak_areas.join(", ")}

Return JSON object:
{
  "study_modules": [
    {
      "title": "string",
      "topic": "string",
      "content_summary": "string",
      "key_concepts": ["concept1", "concept2"],
      "mnemonics": ["mnemonic1"],
      "common_mistakes": ["mistake1"],
      "tips_and_tricks": ["tip1"],
      "reference_material": "url or resource"
    }
  ],
  "revision_notes": "consolidated key points",
  "quick_reference": "one-page reference",
  "exam_specific_tips": ["tip1", "tip2"]
}`;

    const materialsResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: materialsPrompt }],
          temperature: 0.5,
          response_format: { type: "json_object" },
        }),
      }
    );

    const materialsData = await materialsResponse.json();
    const studyMaterials = JSON.parse(materialsData.choices[0].message.content);

    // 4. Store in database
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Save study plan
    await supabase.from("study_plans").insert({
      user_id,
      title: studyPlan.plan_title,
      exam_type,
      plan_data: studyPlan,
      start_date: new Date().toISOString().split("T")[0],
      end_date: target_date,
    });

    return new Response(
      JSON.stringify({
        success: true,
        study_plan: studyPlan,
        practice_questions: questions,
        study_materials: studyMaterials,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
