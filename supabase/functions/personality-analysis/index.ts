import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface PersonalityProfile {
  leadership: number;
  communication: number;
  confidence: number;
  initiative: number;
  teamwork: number;
  resilience: number;
  problem_solving: number;
  emotional_intelligence: number;
}

interface PersonalityAnalysis {
  profile: PersonalityProfile;
  strengths: string[];
  development_areas: string[];
  personality_traits: string[];
  overall_readiness: number;
  recommendations: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { user_id, exam_type = "SSB" } = await req.json();

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

    // Fetch all analysis results for the user
    const { data: analyses } = await supabase
      .from("ai_analysis_results")
      .select("*")
      .eq("user_id", user_id)
      .eq("exam_type", exam_type);

    if (!analyses || analyses.length === 0) {
      return new Response(
        JSON.stringify({ error: "No analysis data found" }),
        { status: 404, headers: corsHeaders }
      );
    }

    // Calculate personality profile based on all analyses
    const profile = calculatePersonalityProfile(analyses);
    const strengths = identifyStrengths(profile);
    const developmentAreas = identifyDevelopmentAreas(profile);
    const traits = getPersonalityTraits(profile);
    const readiness = calculateOverallReadiness(profile);
    const recommendations = generateRecommendations(profile, developmentAreas);

    const result: PersonalityAnalysis = {
      profile,
      strengths,
      development_areas: developmentAreas,
      personality_traits: traits,
      overall_readiness: readiness,
      recommendations,
    };

    // Store personality analysis
    await supabase.from("personality_profiles").insert({
      user_id,
      exam_type,
      profile: result.profile,
      strengths: result.strengths,
      development_areas: result.development_areas,
      personality_traits: result.personality_traits,
      overall_readiness: result.overall_readiness,
      created_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});

function calculatePersonalityProfile(analyses: any[]): PersonalityProfile {
  const profile: PersonalityProfile = {
    leadership: 0,
    communication: 0,
    confidence: 0,
    initiative: 0,
    teamwork: 0,
    resilience: 0,
    problem_solving: 0,
    emotional_intelligence: 0,
  };

  analyses.forEach((analysis) => {
    // Map OLQ indicators to personality traits
    if (analysis.olq_indicators) {
      analysis.olq_indicators.forEach((olq: string) => {
        switch (olq.toLowerCase()) {
          case "leadership":
            profile.leadership += 1;
            break;
          case "communication":
            profile.communication += 1;
            break;
          case "confidence":
            profile.confidence += 1;
            break;
          case "initiative":
            profile.initiative += 1;
            break;
          case "teamwork":
            profile.teamwork += 1;
            break;
          case "resilience":
            profile.resilience += 1;
            break;
          case "problem solving":
            profile.problem_solving += 1;
            break;
          case "emotional intelligence":
            profile.emotional_intelligence += 1;
            break;
        }
      });
    }

    // Weight by confidence score
    const confidence = (analysis.confidence_score || 0) / 100;
    Object.keys(profile).forEach((key) => {
      profile[key as keyof PersonalityProfile] *=
        (1 + confidence * 0.2);
    });
  });

  // Normalize scores to 0-100
  Object.keys(profile).forEach((key) => {
    profile[key as keyof PersonalityProfile] = Math.min(
      100,
      (profile[key as keyof PersonalityProfile] / analyses.length) * 10
    );
  });

  return profile;
}

function identifyStrengths(profile: PersonalityProfile): string[] {
  const strengths: string[] = [];

  Object.entries(profile).forEach(([key, value]) => {
    if (value >= 70) {
      strengths.push(`Strong ${key.replace(/_/g, " ")}`);
    }
  });

  return strengths.length > 0
    ? strengths
    : ["Developing personality profile"];
}

function identifyDevelopmentAreas(profile: PersonalityProfile): string[] {
  const areas: string[] = [];

  Object.entries(profile).forEach(([key, value]) => {
    if (value < 50) {
      areas.push(`Improve ${key.replace(/_/g, " ")}`);
    }
  });

  return areas.length > 0 ? areas : ["Continue developing all traits"];
}

function getPersonalityTraits(profile: PersonalityProfile): string[] {
  const traits: string[] = [];

  if (profile.leadership > 60) traits.push("Natural leader");
  if (profile.communication > 60) traits.push("Excellent communicator");
  if (profile.confidence > 60) traits.push("Self-assured");
  if (profile.initiative > 60) traits.push("Self-motivated");
  if (profile.teamwork > 60) traits.push("Team player");
  if (profile.resilience > 60) traits.push("Mentally tough");
  if (profile.problem_solving > 60) traits.push("Quick thinker");
  if (profile.emotional_intelligence > 60)
    traits.push("Emotionally aware");

  return traits.length > 0 ? traits : ["Developing personality profile"];
}

function calculateOverallReadiness(profile: PersonalityProfile): number {
  const values = Object.values(profile);
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

function generateRecommendations(
  profile: PersonalityProfile,
  developmentAreas: string[]
): string[] {
  const recommendations: string[] = [];

  if (profile.leadership < 50) {
    recommendations.push(
      "Take on leadership roles in group discussions and mock interviews"
    );
  }
  if (profile.communication < 50) {
    recommendations.push(
      "Practice clear and concise communication; join toastmasters or similar groups"
    );
  }
  if (profile.confidence < 50) {
    recommendations.push(
      "Build confidence through regular practice and positive self-talk"
    );
  }
  if (profile.initiative < 50) {
    recommendations.push("Take initiative in practice exercises and discussions");
  }
  if (profile.teamwork < 50) {
    recommendations.push("Engage in group discussions and collaborative exercises");
  }
  if (profile.resilience < 50) {
    recommendations.push("Develop mental toughness through challenging exercises");
  }
  if (profile.problem_solving < 50) {
    recommendations.push("Practice analytical thinking and problem-solving exercises");
  }
  if (profile.emotional_intelligence < 50) {
    recommendations.push("Work on empathy and understanding others' perspectives");
  }

  return recommendations.length > 0
    ? recommendations
    : ["Continue consistent practice for optimal results"];
}
