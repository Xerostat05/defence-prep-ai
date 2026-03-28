import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TOOLS = [
  {
    type: "function",
    function: {
      name: "generate_study_plan",
      description: "Generate a personalized study plan based on exam type, weak areas, available time, and exam date. Use when the user asks for a study plan, schedule, or preparation roadmap.",
      parameters: {
        type: "object",
        properties: {
          exam_type: { type: "string", description: "The exam: NDA, CDS, AFCAT, INET, CAPF, SSB" },
          weeks: { type: "number", description: "Number of weeks for the plan" },
          hours_per_day: { type: "number", description: "Hours available per day" },
          weak_areas: { type: "array", items: { type: "string" }, description: "Subjects/topics the user is weak in" },
          focus_areas: { type: "array", items: { type: "string" }, description: "Priority subjects" },
        },
        required: ["exam_type"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_practice_questions",
      description: "Generate practice MCQ questions for a specific exam, subject, or topic. Use when user asks for questions, quiz, or practice.",
      parameters: {
        type: "object",
        properties: {
          exam_type: { type: "string" },
          subject: { type: "string", description: "Specific subject like Mathematics, English, GK" },
          topic: { type: "string", description: "Specific topic within the subject" },
          difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
          count: { type: "number", description: "Number of questions (max 5 in chat)" },
        },
        required: ["exam_type"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "analyze_performance",
      description: "Analyze the user's test performance data and provide insights, weak areas, and improvement suggestions. Use when the user asks about their performance, scores, or what to improve.",
      parameters: {
        type: "object",
        properties: {
          scores: { type: "array", items: { type: "object" }, description: "Array of {exam, score, total, date}" },
          exam_type: { type: "string" },
        },
        required: ["exam_type"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "ssb_coaching",
      description: "Provide SSB interview coaching including WAT word practice, SRT situation practice, TAT guidance, GD tips, or PI preparation. Use when user asks about SSB preparation.",
      parameters: {
        type: "object",
        properties: {
          module: { type: "string", enum: ["wat", "tat", "srt", "gd", "pi", "general"], description: "Which SSB module to coach on" },
          request: { type: "string", description: "Specific coaching request" },
        },
        required: ["module"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_daily_recommendation",
      description: "Generate personalized daily study recommendations, motivation, and actionable tasks. Use when user asks what to study today, needs motivation, or wants daily tips.",
      parameters: {
        type: "object",
        properties: {
          exam_type: { type: "string" },
          days_until_exam: { type: "number" },
          recent_activity: { type: "string", description: "What the user has been studying recently" },
        },
        required: ["exam_type"],
      },
    },
  },
];

async function callAI(systemPrompt: string, userPrompt: string, apiKey: string, useTools = false) {
  const body: any = {
    model: "google/gemini-3-flash-preview",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  };

  if (useTools) {
    body.tools = TOOLS;
  }

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return resp;
}

async function handleToolCall(toolName: string, args: any, apiKey: string): Promise<string> {
  switch (toolName) {
    case "generate_study_plan": {
      const resp = await callAI(
        "You are an expert defence exam study planner. Create a detailed, actionable study plan formatted in markdown with daily schedules, resource recommendations, and milestones. Be specific and practical.",
        `Create a ${args.weeks || 4}-week study plan for ${args.exam_type}. Hours/day: ${args.hours_per_day || 4}. Weak areas: ${(args.weak_areas || []).join(", ") || "not specified"}. Focus: ${(args.focus_areas || []).join(", ") || "balanced"}. Include daily breakdown, recommended books, and weekly goals.`,
        apiKey
      );
      const data = await resp.json();
      return data.choices?.[0]?.message?.content || "I created a study plan but couldn't format it. Please try again.";
    }

    case "generate_practice_questions": {
      const count = Math.min(args.count || 3, 5);
      const resp = await callAI(
        "You are a defence exam question setter. Generate realistic MCQ questions with 4 options each. After each question, show the correct answer and a brief explanation. Format in markdown.",
        `Generate ${count} ${args.difficulty || "medium"} difficulty MCQ questions for ${args.exam_type}${args.subject ? `, subject: ${args.subject}` : ""}${args.topic ? `, topic: ${args.topic}` : ""}. Format each as:\n\n**Q1.** [Question]\n- A) [option]\n- B) [option]\n- C) [option]\n- D) [option]\n\n✅ **Answer:** [letter]) [explanation]`,
        apiKey
      );
      const data = await resp.json();
      return data.choices?.[0]?.message?.content || "Couldn't generate questions. Please try again.";
    }

    case "analyze_performance": {
      const resp = await callAI(
        "You are a performance analyst for defence exam aspirants. Provide detailed, actionable analysis with specific improvement strategies. Be encouraging but honest.",
        `Analyze this aspirant's performance for ${args.exam_type}. Scores: ${JSON.stringify(args.scores || [])}. Provide: 1) Overall assessment, 2) Strength areas, 3) Weak areas needing improvement, 4) Specific action items for next 2 weeks, 5) Recommended focus subjects.`,
        apiKey
      );
      const data = await resp.json();
      return data.choices?.[0]?.message?.content || "Couldn't analyze performance. Please try again.";
    }

    case "ssb_coaching": {
      const moduleGuides: Record<string, string> = {
        wat: "Provide 10 WAT (Word Association Test) practice words one at a time. For each word, explain what kind of response shows OLQs. Give examples of good vs bad responses.",
        tat: "Provide a TAT (Thematic Apperception Test) picture description and guide the user on how to write a story showing leadership, initiative, and positive thinking. Give a model story.",
        srt: "Provide 5 SRT (Situation Reaction Test) situations. For each, explain the ideal response approach and give a model answer showing Officer Like Qualities.",
        gd: "Provide Group Discussion tips, common topics for SSB GD, and strategies for making impactful points. Include do's and don'ts.",
        pi: "Provide Personal Interview preparation guidance including common PIQ-based questions, rapid fire tips, and how to handle tough questions. Include sample answers.",
        general: "Provide a comprehensive SSB preparation overview including all stages, OLQ traits to develop, and practical daily exercises for SSB preparation.",
      };
      const resp = await callAI(
        "You are an experienced SSB interview coach who has trained thousands of defence aspirants. Be practical, specific, and motivational. Use markdown formatting.",
        `${moduleGuides[args.module] || moduleGuides.general} ${args.request ? `Specific request: ${args.request}` : ""}`,
        apiKey
      );
      const data = await resp.json();
      return data.choices?.[0]?.message?.content || "Couldn't generate coaching content. Please try again.";
    }

    case "get_daily_recommendation": {
      const resp = await callAI(
        "You are OliveBot, a motivational AI study coach for defence exam aspirants. Be energetic, specific, and practical. Use emojis. Format in markdown.",
        `Generate today's personalized study recommendation for a ${args.exam_type} aspirant. ${args.days_until_exam ? `Days until exam: ${args.days_until_exam}.` : ""} ${args.recent_activity ? `Recent activity: ${args.recent_activity}.` : ""} Include: 1) 🎯 Today's Focus (2-3 subjects), 2) 📚 Specific tasks with time allocation, 3) 💡 Quick tip of the day, 4) 🔥 Motivational quote relevant to defence aspirants.`,
        apiKey
      );
      const data = await resp.json();
      return data.choices?.[0]?.message?.content || "Couldn't generate recommendations. Please try again.";
    }

    default:
      return "I don't know how to handle that action yet.";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, mode } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Mode: "dashboard" returns JSON for dashboard cards
    if (mode === "dashboard") {
      const { exam_type, user_name } = await req.json().catch(() => ({ exam_type: "NDA", user_name: "Aspirant" }));
      
      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            { role: "system", content: "Generate daily AI insights for a defence exam aspirant dashboard. Return JSON only." },
            { role: "user", content: `Generate dashboard insights for ${exam_type} aspirant "${user_name}". Return JSON with: daily_tip (string), motivation_quote (string with author), focus_subjects (array of 3 strings), challenge (object with question:string, options:array, answer:number).` },
          ],
          tools: [{
            type: "function",
            function: {
              name: "dashboard_insights",
              description: "Dashboard AI insights",
              parameters: {
                type: "object",
                properties: {
                  daily_tip: { type: "string" },
                  motivation_quote: { type: "string" },
                  focus_subjects: { type: "array", items: { type: "string" } },
                  challenge: {
                    type: "object",
                    properties: {
                      question: { type: "string" },
                      options: { type: "array", items: { type: "string" } },
                      answer: { type: "number" },
                    },
                  },
                },
                required: ["daily_tip", "motivation_quote", "focus_subjects", "challenge"],
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "dashboard_insights" } },
        }),
      });

      if (!resp.ok) {
        return new Response(JSON.stringify({ error: "Failed to generate insights" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await resp.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      const result = toolCall 
        ? (typeof toolCall.function.arguments === "string" ? JSON.parse(toolCall.function.arguments) : toolCall.function.arguments)
        : { daily_tip: "Practice mock tests daily", motivation_quote: "The only way to do great work is to love what you do.", focus_subjects: ["Mathematics", "English", "GK"], challenge: null };

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mode: "agent" or default — streaming chat with tool calling
    const systemPrompt = `You are OliveBot, the agentic AI mentor for Olive Wings — India's premier AI-powered defence exam preparation platform.

CAPABILITIES (use tools when appropriate):
- 📚 generate_study_plan: Create personalized study plans
- ❓ generate_practice_questions: Generate practice MCQs on any topic
- 📊 analyze_performance: Analyze test scores and suggest improvements
- 🎖️ ssb_coaching: Provide SSB interview coaching (WAT/TAT/SRT/GD/PI)
- 🎯 get_daily_recommendation: Daily study recommendations and motivation

PERSONALITY:
- Friendly, motivational, and knowledgeable about Indian defence exams
- Proactively suggest using tools when relevant to the conversation
- Use markdown formatting for structured responses
- Be concise but comprehensive
- Always encourage and motivate aspirants

When a user asks a question that can be better served by a tool, USE THE TOOL rather than answering from general knowledge. For example:
- "What should I study?" → use get_daily_recommendation
- "Give me questions" → use generate_practice_questions  
- "Make me a plan" → use generate_study_plan
- "Help me with SSB" → use ssb_coaching
- "How am I doing?" → use analyze_performance`;

    // First call: let AI decide whether to use a tool
    const firstResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        tools: TOOLS,
      }),
    });

    if (!firstResponse.ok) {
      if (firstResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (firstResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI service temporarily unavailable. Please try again later." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI service error");
    }

    const firstData = await firstResponse.json();
    const firstChoice = firstData.choices?.[0]?.message;

    // Check if AI wants to call a tool
    if (firstChoice?.tool_calls && firstChoice.tool_calls.length > 0) {
      const toolCall = firstChoice.tool_calls[0];
      const toolArgs = typeof toolCall.function.arguments === "string" 
        ? JSON.parse(toolCall.function.arguments) 
        : toolCall.function.arguments;

      // Execute the tool
      const toolResult = await handleToolCall(toolCall.function.name, toolArgs, LOVABLE_API_KEY);

      // Now stream the final response incorporating the tool result
      const finalResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
            firstChoice,
            {
              role: "tool",
              tool_call_id: toolCall.id,
              content: toolResult,
            },
          ],
          stream: true,
        }),
      });

      if (!finalResponse.ok) throw new Error("Failed to generate final response");

      return new Response(finalResponse.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // No tool call — stream the direct response
    const streamResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!streamResponse.ok) throw new Error("Stream error");

    return new Response(streamResponse.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (e) {
    console.error("ai-agent error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
