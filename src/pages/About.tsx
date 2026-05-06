import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield, BookOpen, Target, Sparkles } from "lucide-react";

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#07111e] text-slate-100">
      <Navbar />
      <main className="pt-28 pb-16 container mx-auto px-4">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="rounded-[2rem] border border-white/10 bg-slate-900/60 backdrop-blur-xl p-10 shadow-2xl shadow-slate-900/20">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full bg-gold/10 px-4 py-2 text-sm font-semibold text-gold">
                  <Sparkles className="h-4 w-4" /> About Olive Wings
                </p>
                <h1 className="mt-5 text-4xl font-display font-bold text-white tracking-tight">
                  A defence exam AI platform built to train future officers.
                </h1>
                <p className="mt-4 text-slate-300 leading-relaxed text-lg">
                  Olive Wings combines adaptive intelligence, psychological coaching, and exam-focused practice tools to make NDA, CDS, AFCAT, CAPF and SSB preparation smarter, faster, and more effective.
                </p>
              </div>
              <Button className="bg-gold text-black hover:bg-amber-300 font-semibold" onClick={() => navigate("/auth")}>Get Started</Button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                label: "Mission",
                icon: Shield,
                description: "Empower aspirants with AI-driven practice, targeted feedback, and a confidence-building training experience."
              },
              {
                label: "Vision",
                icon: Target,
                description: "Create a defence prep ecosystem where every candidate trains smarter with mentorship, assessment, and action plans."
              },
              {
                label: "Approach",
                icon: BookOpen,
                description: "Blend real exam patterns with agentic AI, psychological insights, and personalized study paths for continuous improvement."
              }
            ].map((item) => (
              <Card key={item.label} className="bg-slate-900/70 border border-white/10 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-white">
                    <item.icon className="h-5 w-5 text-gold" />
                    {item.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-slate-300 text-sm">
                  {item.description}
                </CardContent>
              </Card>
            ))}
          </div>

          <section className="rounded-[2rem] border border-white/10 bg-slate-900/50 backdrop-blur-xl p-10">
            <h2 className="text-3xl font-bold text-white mb-4">What this website does</h2>
            <div className="space-y-5 text-slate-300 leading-relaxed">
              <p>
                Olive Wings is a one-stop preparation portal for defence aspirants. It offers:
              </p>
              <ul className="space-y-3 list-disc list-inside text-slate-300">
                <li>AI-assisted interview and psychological coaching for SSB tasks like WAT, TAT, SRT, GD and PI.</li>
                <li>Smart mock tests and adaptive practice sessions tuned for NDA, CDS, AFCAT, CAPF and more.</li>
                <li>Personalized study planning, flashcards, performance analytics and targeted improvement advice.</li>
                <li>Real-time conversation training with an AI mentor, backed by clean UX and battle-ready readiness steps.</li>
              </ul>
              <p>
                The platform is designed to help students keep their preparation organized, identify strengths and weaknesses, and practice with confidence — all from a single defence-focused dashboard.
              </p>
            </div>
          </section>

          <section className="grid gap-6 md:grid-cols-2">
            <Card className="bg-slate-900/70 border border-white/10 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white">Who can use it?</CardTitle>
              </CardHeader>
              <CardContent className="text-slate-300 leading-relaxed">
                Suitable for aspirants preparing for the armed forces entrance tests and SSB evaluation stages. This includes beginners, repeaters, and students seeking structured AI-powered guidance on exam readiness and psychological development.
              </CardContent>
            </Card>
            <Card className="bg-slate-900/70 border border-white/10 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white">Why it matters</CardTitle>
              </CardHeader>
              <CardContent className="text-slate-300 leading-relaxed">
                Defence preparation is about consistency, clarity and mental preparedness. Olive Wings supports those goals by delivering feedback, accountability, and task planning in a format built for disciplined success.
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </div>
  );
};

export default About;
