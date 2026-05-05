import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface PerformancePrediction {
  current_level: number;
  predicted_level_1week: number;
  predicted_level_1month: number;
  estimated_readiness_date: string;
  confidence_level: number;
  required_practice_hours: number;
  focus_areas: string[];
  success_probability: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { user_id, exam_type = "SSB", target_date } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "Missing user_id" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    // Fetch all practice sessions for trend analysis
    const { data: sessions } = await supabase
      .from("practice_sessions")
      .select("*")
      .eq("user_id", user_id)
      .eq("exam_type", exam_type)
      .order("created_at", { ascending: true });

    if (!sessions || sessions.length === 0) {
      return new Response(
        JSON.stringify({ error: "Insufficient practice data" }),
        { status: 404, headers: corsHeaders }
      );
    }

    // Fetch latest analysis results
    const { data: analyses } = await supabase
      .from("ai_analysis_results")
      .select("*")
      .eq("user_id", user_id)
      .eq("exam_type", exam_type)
      .order("created_at", { ascending: false })
      .limit(10);

    const prediction = calculatePerformancePrediction(
      sessions,
      analyses || [],
      target_date
    );

    // Store prediction for tracking
    await supabase.from("performance_predictions").insert({
      user_id,
      exam_type,
      current_level: prediction.current_level,
      predicted_level_1week: prediction.predicted_level_1week,
      predicted_level_1month: prediction.predicted_level_1month,
      estimated_readiness_date: prediction.estimated_readiness_date,
      confidence_level: prediction.confidence_level,
      success_probability: prediction.success_probability,
      created_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify(prediction), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});

function calculatePerformancePrediction(
  sessions: any[],
  analyses: any[],
  target_date?: string
): PerformancePrediction {
  // Calculate current performance level
  const recentScores = analyses.slice(0, 5).map((a) => a.overall_score || 0);
  const currentLevel = recentScores.length > 0
    ? Math.round(recentScores.reduce((a, b) => a + b, 0) / recentScores.length)
    : 50;

  // Calculate trend
  const allScores = analyses.map((a) => a.overall_score || 0).reverse();
  const trendSlope = calculateTrendSlope(allScores);

  // Predict 1 week improvement (7 days)
  const practicePerDay = sessions.length / getDateRange(sessions);
  const expectedPractice7Days = practicePerDay * 7;
  const improvement7Days = Math.min(
    expectedPractice7Days * 0.5,
    40 - (currentLevel - 50) * 0.5
  );
  const predicted1Week = Math.round(currentLevel + improvement7Days);

  // Predict 1 month improvement
  const improvement30Days = Math.min(
    practicePerDay * 30 * 0.4,
    50 - (currentLevel - 50) * 0.3
  );
  const predicted1Month = Math.round(
    Math.min(100, currentLevel + improvement30Days)
  );

  // Estimate readiness date (when expected to reach 80+)
  const targetScore = 80;
  const scoreGap = Math.max(0, targetScore - currentLevel);
  const improvementRate = Math.max(0.5, improvement30Days / 30);
  const daysNeeded = Math.ceil(scoreGap / improvementRate);
  const readinessDate = new Date();
  readinessDate.setDate(readinessDate.getDate() + daysNeeded);

  // Check if target date is provided and adjust
  const estimatedReadinessDate = target_date
    ? new Date(target_date).toISOString().split("T")[0]
    : readinessDate.toISOString().split("T")[0];

  // Calculate confidence level based on data consistency
  const scoreVariance = calculateVariance(allScores);
  const confidenceLevel = Math.max(
    50,
    100 - Math.min(scoreVariance * 2, 50)
  );

  // Calculate required practice hours
  const hoursPracticed = sessions.reduce(
    (total, session) => total + ((session.duration_minutes || 0) / 60),
    0
  );
  const dailyAverageHours = hoursPracticed / getDateRange(sessions);
  const requiredHoursTotal = Math.max(0, 200 - hoursPracticed);
  const requiredDays = Math.ceil(requiredHoursTotal / Math.max(dailyAverageHours, 1));

  // Identify focus areas (weak scores in analyses)
  const focusAreas = identifyFocusAreas(analyses);

  // Calculate success probability
  const successProbability = Math.round(
    (predicted1Month / 100) * 80 + (confidenceLevel / 100) * 20
  );

  return {
    current_level: currentLevel,
    predicted_level_1week: Math.min(100, predicted1Week),
    predicted_level_1month: predicted1Month,
    estimated_readiness_date: estimatedReadinessDate,
    confidence_level: Math.round(confidenceLevel),
    required_practice_hours: Math.round(requiredHoursTotal),
    focus_areas: focusAreas,
    success_probability: Math.min(100, successProbability),
  };
}

function calculateTrendSlope(scores: number[]): number {
  if (scores.length < 2) return 0;

  const n = scores.length;
  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumX2 = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += scores[i];
    sumXY += i * scores[i];
    sumX2 += i * i;
  }

  return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
}

function calculateVariance(scores: number[]): number {
  if (scores.length === 0) return 0;

  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const squareDiffs = scores.map((score) => Math.pow(score - mean, 2));
  return squareDiffs.reduce((a, b) => a + b, 0) / scores.length;
}

function getDateRange(sessions: any[]): number {
  if (sessions.length === 0) return 1;

  const firstDate = new Date(sessions[0].created_at);
  const lastDate = new Date(sessions[sessions.length - 1].created_at);
  const diffTime = Math.abs(lastDate.getTime() - firstDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(1, diffDays);
}

function identifyFocusAreas(analyses: any[]): string[] {
  const focusAreas: string[] = [];

  // Check if OLQs are consistently weak
  const olqFrequency: { [key: string]: number } = {};

  analyses.forEach((analysis) => {
    if (analysis.olq_indicators) {
      analysis.olq_indicators.forEach((olq: string) => {
        olqFrequency[olq] = (olqFrequency[olq] || 0) + 1;
      });
    }
  });

  // OLQs appearing in less than 50% of analyses are weak areas
  const totalAnalyses = analyses.length;
  Object.entries(olqFrequency).forEach(([olq, frequency]) => {
    if ((frequency / totalAnalyses) * 100 < 50) {
      focusAreas.push(`Improve ${olq}`);
    }
  });

  return focusAreas.length > 0
    ? focusAreas
    : ["Maintain consistent practice"];
}
