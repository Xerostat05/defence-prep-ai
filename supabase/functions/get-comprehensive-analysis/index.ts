import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const user_id = url.searchParams.get("user_id");
    const exam_type = url.searchParams.get("exam_type");

    if (!user_id) throw new Error("user_id required");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Get all performance data
    const { data: metrics } = await supabase
      .from("performance_metrics")
      .select("*")
      .eq("user_id", user_id)
      .eq("exam_type", exam_type || undefined);

    // 2. Get all AI analysis results
    const { data: analyses } = await supabase
      .from("ai_analysis_results")
      .select("*")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false })
      .limit(20);

    // 3. Get recommendations
    const { data: recommendations } = await supabase
      .from("improvement_recommendations")
      .select("*")
      .eq("user_id", user_id)
      .order("priority_level");

    // 4. Get practice sessions history
    const { data: sessions } = await supabase
      .from("practice_sessions")
      .select("*")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false })
      .limit(50);

    // 5. Calculate aggregated insights
    const insights = calculateInsights(
      metrics || [],
      analyses || [],
      recommendations || [],
      sessions || []
    );

    // 6. Get user progress summary
    const { data: progressSummary } = await supabase
      .from("user_progress_summary")
      .select("*")
      .eq("user_id", user_id)
      .single();

    return new Response(
      JSON.stringify({
        success: true,
        metrics: metrics || [],
        analyses: analyses || [],
        recommendations: recommendations || [],
        sessions: sessions || [],
        insights,
        progress_summary: progressSummary,
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

function calculateInsights(metrics: any[], analyses: any[], recommendations: any[], sessions: any[]) {
  if (!metrics.length) return {};

  const latestMetrics = metrics[0];

  // Calculate trends
  const scores = analyses
    .map((a: any) => a.overall_score)
    .filter((s: any) => s !== null);
  const scoreTrend =
    scores.length >= 2
      ? scores[0] - scores[scores.length - 1]
      : 0;

  // Identify pattern
  const olqFrequency: { [key: string]: number } = {};
  analyses.forEach((a: any) => {
    a.olq_indicators?.forEach((olq: string) => {
      olqFrequency[olq] = (olqFrequency[olq] || 0) + 1;
    });
  });

  // Get top issues and recommendations
  const activeRecs = recommendations.filter(
    (r: any) => r.status === "active" || r.status === "in_progress"
  );

  const sessionFrequency = sessions.length;
  const avgSessionDuration =
    sessions.reduce((sum: number, s: any) => sum + (s.duration_minutes || 0), 0) /
    sessions.length || 0;

  return {
    score_improvement: scoreTrend,
    score_trend_direction: scoreTrend > 0 ? "improving" : scoreTrend < 0 ? "declining" : "stable",
    strongest_olqs: Object.entries(olqFrequency)
      .sort(([, a]: any, [, b]: any) => b - a)
      .slice(0, 3)
      .map(([olq]) => olq),
    weakest_olqs: Object.entries(olqFrequency)
      .sort(([, a]: any, [, b]: any) => a - b)
      .slice(0, 3)
      .map(([olq]) => olq),
    active_recommendations: activeRecs.length,
    engagement_level: sessionFrequency > 10 ? "high" : sessionFrequency > 5 ? "medium" : "low",
    consistency_check: avgSessionDuration > 30 ? "focused" : "brief",
    readiness_estimate:
      latestMetrics.average_score > 7 ? "above_average" : latestMetrics.average_score > 5 ? "average" : "needs_improvement",
  };
}
