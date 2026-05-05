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
      practice_type,
      duration_minutes,
      raw_response,
      session_id,
    } = await req.json();

    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY not configured");

    // 1. Create practice session record
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const sessionRecord = session_id || (
      await supabase
        .from("practice_sessions")
        .insert({
          user_id,
          exam_type,
          practice_type,
          duration_minutes,
          raw_response,
          status: "completed",
        })
        .select()
        .single()
    ).data.id;

    // 2. Generate comprehensive AI analysis
    const analysisPrompt = `
You are an expert military entrance exam evaluator. Provide a comprehensive analysis of this ${practice_type} response.

Response: ${raw_response}

Return a JSON object with:
{
  "overall_score": (1-10),
  "confidence_score": (0-100),
  "olq_indicators": ["OLQ1", "OLQ2", ...],
  "olq_strengths": {"OLQ": "explanation"},
  "olq_weaknesses": {"OLQ": "explanation"},
  "sentiment_score": (-1 to 1),
  "tone_analysis": "description",
  "spontaneity_score": (1-10),
  "psychological_indicators": {"indicator": "value"},
  "detailed_analysis": "comprehensive feedback",
  "primary_finding": "main insight"
}`;

    const analysisResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: analysisPrompt }],
          temperature: 0.2,
          response_format: { type: "json_object" },
        }),
      }
    );

    if (!analysisResponse.ok)
      throw new Error("Analysis API failed");

    const analysisData = await analysisResponse.json();
    const analysisResult = JSON.parse(
      analysisData.choices[0].message.content
    );

    // 3. Store AI analysis
    const analysisRecord = (
      await supabase
        .from("ai_analysis_results")
        .insert({
          user_id,
          practice_session_id: sessionRecord,
          analysis_type:
            practice_type === "TAT"
              ? "OLQ"
              : practice_type === "SSB"
                ? "PSYCHOLOGICAL"
                : "VERBAL",
          overall_score: analysisResult.overall_score,
          confidence_score: analysisResult.confidence_score,
          olq_indicators: analysisResult.olq_indicators,
          olq_strengths: analysisResult.olq_strengths,
          olq_weaknesses: analysisResult.olq_weaknesses,
          sentiment_score: analysisResult.sentiment_score,
          tone_analysis: analysisResult.tone_analysis,
          spontaneity_score: analysisResult.spontaneity_score,
          psychological_indicators: analysisResult.psychological_indicators,
          detailed_analysis: analysisResult.detailed_analysis,
          primary_finding: analysisResult.primary_finding,
          raw_feedback: analysisData.choices[0].message.content,
          ai_model: "llama-3.3-70b",
        })
        .select()
        .single()
    ).data;

    // 4. Generate personalized recommendations
    const recommendationPrompt = `
Based on this OLQ analysis:
${JSON.stringify(analysisResult)}

Generate 2-3 specific improvement recommendations as a JSON array:
[
  {
    "area_of_improvement": "specific area",
    "recommendation_category": "OLQ|BEHAVIORAL|VERBAL",
    "priority_level": "high|medium|low",
    "description": "what to improve",
    "actionable_steps": ["step1", "step2", "step3"],
    "estimated_improvement_days": 7
  }
]`;

    const recResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: recommendationPrompt }],
          temperature: 0.3,
          response_format: { type: "json_object" },
        }),
      }
    );

    const recData = await recResponse.json();
    const recommendations = JSON.parse(
      recData.choices[0].message.content
    );

    // 5. Insert recommendations
    for (const rec of recommendations) {
      await supabase.from("improvement_recommendations").insert({
        user_id,
        ai_analysis_id: analysisRecord.id,
        area_of_improvement: rec.area_of_improvement,
        recommendation_category: rec.recommendation_category,
        priority_level: rec.priority_level,
        description: rec.description,
        actionable_steps: rec.actionable_steps,
        estimated_improvement_days: rec.estimated_improvement_days,
        status: "active",
      });
    }

    // 6. Update performance metrics
    const existingMetrics = await supabase
      .from("performance_metrics")
      .select("*")
      .eq("user_id", user_id)
      .eq("exam_type", exam_type)
      .single();

    const metrics = {
      user_id,
      exam_type,
      practice_type,
      total_attempts: (existingMetrics.data?.total_attempts || 0) + 1,
      average_score:
        ((existingMetrics.data?.average_score || 0) +
          analysisResult.overall_score) /
        2,
      best_score: Math.max(
        existingMetrics.data?.best_score || 0,
        analysisResult.overall_score
      ),
      worst_score: Math.min(
        existingMetrics.data?.worst_score || 10,
        analysisResult.overall_score
      ),
      average_sentiment:
        ((existingMetrics.data?.average_sentiment || 0) +
          analysisResult.sentiment_score) /
        2,
      average_spontaneity:
        ((existingMetrics.data?.average_spontaneity || 0) +
          analysisResult.spontaneity_score) /
        2,
      last_attempt_at: new Date().toISOString(),
    };

    if (existingMetrics.data) {
      await supabase
        .from("performance_metrics")
        .update(metrics)
        .eq("user_id", user_id)
        .eq("exam_type", exam_type);
    } else {
      await supabase.from("performance_metrics").insert(metrics);
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis: analysisResult,
        recommendations,
        session_id: sessionRecord,
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
