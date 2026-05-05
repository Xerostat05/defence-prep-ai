import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");

interface InterviewCoaching {
  question: string;
  model_answer: string;
  evaluation_points: string[];
  common_mistakes: string[];
  tips_for_improvement: string[];
  practice_suggestions: string[];
  estimated_response_time: number;
  difficulty_level: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { user_id, exam_type = "SSB", topic, difficulty = "medium" } =
      await req.json();

    if (!user_id || !topic) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Generate interview question and coaching using Groq
    const coachingData = await generateInterviewCoaching(
      exam_type,
      topic,
      difficulty
    );

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    // Store coaching session
    await supabase.from("interview_coaching_sessions").insert({
      user_id,
      exam_type,
      topic,
      difficulty_level: difficulty,
      question: coachingData.question,
      model_answer: coachingData.model_answer,
      evaluation_points: coachingData.evaluation_points,
      common_mistakes: coachingData.common_mistakes,
      tips_for_improvement: coachingData.tips_for_improvement,
      created_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify(coachingData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});

async function generateInterviewCoaching(
  examType: string,
  topic: string,
  difficulty: string
): Promise<InterviewCoaching> {
  const prompt = `You are an expert interview coach for ${examType} exam preparation. Generate a detailed interview coaching session on the topic: "${topic}".

Difficulty level: ${difficulty}

Provide in the following JSON format:
{
  "question": "A realistic interview question related to the topic",
  "model_answer": "A comprehensive model answer (2-3 paragraphs) that demonstrates excellent understanding",
  "evaluation_points": ["Point 1 to evaluate", "Point 2 to evaluate"],
  "common_mistakes": ["Common mistake 1", "Common mistake 2"],
  "tips_for_improvement": ["Tip 1 for better response", "Tip 2 for better response"],
  "practice_suggestions": ["Suggestion 1 for practice", "Suggestion 2 for practice"],
  "estimated_response_time": 120,
  "difficulty_level": "${difficulty}"
}

Ensure the response is authentic, challenging, and helps the candidate prepare effectively.`;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "mixtral-8x7b-32768",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to generate coaching from Groq API");
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content || "{}";

  try {
    return JSON.parse(content);
  } catch {
    // Fallback response if parsing fails
    return {
      question: `Explain your understanding of ${topic} and how it relates to ${
        difficulty === "easy" ? "basic" : difficulty === "hard" ? "advanced" : "intermediate"
      } preparation.`,
      model_answer: `A comprehensive understanding of ${topic} is essential for ${
        difficulty === "easy"
          ? "foundational knowledge"
          : difficulty === "hard"
          ? "expert-level performance"
          : "solid preparation"
      }. Key aspects include clarity of thought, structured communication, and practical application.`,
      evaluation_points: [
        "Clarity and structure of answer",
        "Depth of understanding",
        "Real-world examples provided",
        "Communication effectiveness",
      ],
      common_mistakes: [
        "Providing vague or unclear explanations",
        "Lacking specific examples or evidence",
        "Failing to address the core question",
        "Rambling without structure",
      ],
      tips_for_improvement: [
        "Start with a clear thesis statement",
        "Support with relevant examples",
        "Practice concise articulation",
        "Focus on strengths and positive framing",
      ],
      practice_suggestions: [
        "Record and review your responses",
        "Practice with mock interviews",
        "Study model answers from experts",
        "Get feedback from peers or mentors",
      ],
      estimated_response_time:
        difficulty === "easy" ? 60 : difficulty === "hard" ? 180 : 120,
      difficulty_level: difficulty,
    };
  }
}
