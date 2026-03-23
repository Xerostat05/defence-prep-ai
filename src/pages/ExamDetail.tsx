import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, BookOpen, Target, Brain, Clock, FileText, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";

const examData: Record<string, {
  name: string;
  full: string;
  description: string;
  eligibility: string[];
  subjects: { name: string; topics: string[] }[];
  pattern: { section: string; questions: number; marks: number; duration: string }[];
  tips: string[];
}> = {
  nda: {
    name: "NDA",
    full: "National Defence Academy",
    description: "The NDA exam is conducted by UPSC twice a year for admission to Army, Navy and Air Force wings of the National Defence Academy. It is the gateway for candidates who wish to join the Indian Armed Forces after completing their 10+2.",
    eligibility: [
      "Unmarried male & female candidates",
      "Age: 16.5 to 19.5 years",
      "Education: 12th pass or appearing (PCM for Air Force & Navy)",
      "Physical standards as per service requirements",
    ],
    subjects: [
      { name: "Mathematics", topics: ["Algebra", "Matrices & Determinants", "Trigonometry", "Analytical Geometry (2D & 3D)", "Differential Calculus", "Integral Calculus", "Vector Algebra", "Statistics & Probability"] },
      { name: "General Ability Test (GAT)", topics: ["English", "Physics", "Chemistry", "General Science", "History", "Geography", "Current Affairs", "Freedom Movement"] },
      { name: "SSB Interview", topics: ["OIR", "TAT", "WAT", "SRT", "Group Discussion", "Personal Interview", "Conference"] },
    ],
    pattern: [
      { section: "Mathematics", questions: 120, marks: 300, duration: "2.5 hours" },
      { section: "GAT", questions: 150, marks: 600, duration: "2.5 hours" },
      { section: "SSB Interview", questions: 0, marks: 900, duration: "5 days" },
    ],
    tips: [
      "Start with NCERT books for Physics, Chemistry & Maths",
      "Practice 50+ MCQs daily from previous year papers",
      "Read newspapers daily for Current Affairs section",
      "Focus on speed and accuracy — there is negative marking",
      "Begin SSB preparation alongside written exam prep",
    ],
  },
  cds: {
    name: "CDS",
    full: "Combined Defence Services",
    description: "The CDS examination is conducted by UPSC twice a year for recruitment into the Indian Military Academy (IMA), Officers Training Academy (OTA), Indian Naval Academy (INA), and Indian Air Force Academy (AFA).",
    eligibility: [
      "Unmarried male & female candidates (OTA accepts both)",
      "Age: 19 to 25 years (varies by academy)",
      "Education: Graduation (any stream for IMA/OTA, Engineering for INA/AFA)",
      "Must not be married at the time of joining",
    ],
    subjects: [
      { name: "English", topics: ["Comprehension", "Vocabulary", "Grammar", "Sentence Correction", "Synonyms & Antonyms", "Idioms & Phrases", "Spotting Errors", "Ordering of Sentences"] },
      { name: "General Knowledge", topics: ["History", "Geography", "Polity", "Economics", "Physics", "Chemistry", "Biology", "Current Affairs", "Defence & Security"] },
      { name: "Elementary Mathematics", topics: ["Number System", "HCF & LCM", "Profit & Loss", "Percentage", "Time & Work", "Geometry", "Mensuration", "Trigonometry", "Statistics"] },
    ],
    pattern: [
      { section: "English", questions: 120, marks: 100, duration: "2 hours" },
      { section: "General Knowledge", questions: 120, marks: 100, duration: "2 hours" },
      { section: "Mathematics", questions: 100, marks: 100, duration: "2 hours" },
      { section: "SSB Interview", questions: 0, marks: 300, duration: "5 days" },
    ],
    tips: [
      "English section is scoring — focus on grammar rules and vocabulary",
      "Read Lucent's GK and stay updated with monthly current affairs",
      "Practice RS Aggarwal for Mathematics",
      "Solve previous 10 years' papers for pattern familiarity",
      "Time management is key — allocate time per question wisely",
    ],
  },
  afcat: {
    name: "AFCAT",
    full: "Air Force Common Admission Test",
    description: "AFCAT is conducted by the Indian Air Force twice a year for selection of officers in flying, technical, and ground duty branches. It is the primary entry point for graduates aspiring to join the IAF.",
    eligibility: [
      "Indian citizens, men and women",
      "Age: 20 to 24 years (Flying), 20 to 26 years (Ground Duty/Technical)",
      "Education: Graduation with 60% (varies by branch)",
      "Engineering degree for Technical branch",
    ],
    subjects: [
      { name: "General Awareness", topics: ["History", "Geography", "Polity", "Economics", "Sports", "Art & Culture", "Current Affairs", "Defence Awareness", "Basic Science"] },
      { name: "Verbal Ability (English)", topics: ["Comprehension", "Error Detection", "Sentence Completion", "Synonyms & Antonyms", "Idioms", "Analogies"] },
      { name: "Numerical Ability", topics: ["Decimal & Fractions", "Ratio & Proportion", "Percentage", "Average", "Profit & Loss", "Simple & Compound Interest", "Time & Distance"] },
      { name: "Reasoning & Military Aptitude", topics: ["Verbal Reasoning", "Non-verbal Reasoning", "Spatial Ability", "Series", "Coding-Decoding", "Blood Relations", "Direction Sense"] },
    ],
    pattern: [
      { section: "General Awareness", questions: 25, marks: 75, duration: "Part of 2 hours" },
      { section: "Verbal Ability", questions: 25, marks: 75, duration: "Part of 2 hours" },
      { section: "Numerical Ability", questions: 18, marks: 54, duration: "Part of 2 hours" },
      { section: "Reasoning", questions: 32, marks: 96, duration: "Part of 2 hours" },
    ],
    tips: [
      "Focus heavily on Reasoning — it carries the most marks",
      "Read Arihant's AFCAT guide for comprehensive preparation",
      "Practice spatial reasoning and figure-based questions daily",
      "Stay updated on IAF-related current affairs",
      "Work on EKT separately if applying for Technical branch",
    ],
  },
  inet: {
    name: "INET",
    full: "Indian Navy Entrance Test",
    description: "INET is conducted by the Indian Navy for selection of officers in Executive, Technical, and Education branches. It replaced the earlier separate entry schemes with a unified examination.",
    eligibility: [
      "Indian citizens",
      "Age: 19 to 24 years (varies by branch)",
      "Education: B.E./B.Tech for Technical, Any graduation for Executive",
      "Minimum 60% aggregate in graduation",
    ],
    subjects: [
      { name: "English", topics: ["Comprehension", "Grammar", "Vocabulary", "Word Substitution", "Sentence Rearrangement"] },
      { name: "Reasoning & Numerical Ability", topics: ["Spatial Reasoning", "Series", "Analogy", "Data Interpretation", "Percentage", "Time & Work"] },
      { name: "General Knowledge", topics: ["History", "Geography", "Polity", "Defence", "Science & Technology", "Current Affairs"] },
      { name: "General Science", topics: ["Physics", "Chemistry", "Biology", "Computer Science", "Marine Engineering Basics"] },
    ],
    pattern: [
      { section: "English", questions: 25, marks: 25, duration: "Part of 2 hours" },
      { section: "Reasoning & Numerical Ability", questions: 25, marks: 25, duration: "Part of 2 hours" },
      { section: "General Knowledge", questions: 25, marks: 25, duration: "Part of 2 hours" },
      { section: "General Science", questions: 25, marks: 25, duration: "Part of 2 hours" },
    ],
    tips: [
      "Focus on General Science — especially Physics and basic engineering",
      "Study Indian Navy-related facts and recent developments",
      "Practice reasoning with previous SSC CGL-level questions",
      "Time management is crucial with 100 questions in 2 hours",
      "Keep notes on maritime geography and naval operations",
    ],
  },
  "ssb-interview": {
    name: "SSB Interview",
    full: "Services Selection Board",
    description: "The SSB Interview is a 5-day assessment process conducted by the Indian Armed Forces to evaluate Officer Like Qualities (OLQs) in candidates. It tests psychological, group, and interview-based competencies.",
    eligibility: [
      "Must have cleared the written exam (NDA/CDS/AFCAT/INET/CAPF)",
      "Must meet physical and medical standards",
      "Candidates can appear for SSB from multiple entries",
      "Previous conference-out candidates can re-apply after specified gap",
    ],
    subjects: [
      { name: "Screening (Day 1)", topics: ["OIR Test (Verbal & Non-verbal)", "PPDT (Picture Perception & Discussion Test)"] },
      { name: "Psychological Tests (Day 2)", topics: ["TAT (Thematic Apperception Test)", "WAT (Word Association Test)", "SRT (Situation Reaction Test)", "Self Description Test"] },
      { name: "GTO Tasks (Day 3-4)", topics: ["Group Discussion", "Group Planning Exercise", "Progressive Group Task", "Half Group Task", "Individual Obstacles", "Command Task", "Lecturette"] },
      { name: "Personal Interview", topics: ["PIQ-based questions", "Current Affairs", "Rapid Fire Round", "Situational Questions", "Life History Analysis"] },
    ],
    pattern: [
      { section: "Screening", questions: 0, marks: 0, duration: "Day 1" },
      { section: "Psychology", questions: 0, marks: 0, duration: "Day 2" },
      { section: "GTO", questions: 0, marks: 0, duration: "Day 3-4" },
      { section: "Interview + Conference", questions: 0, marks: 0, duration: "Day 4-5" },
    ],
    tips: [
      "Be genuine — SSB tests your personality, not memorized answers",
      "Practice WAT (60 words in 60 seconds) and SRT (60 situations in 30 min) daily",
      "Develop Officer Like Qualities: Initiative, Courage, Determination, Group Influence",
      "Read newspapers and be ready to discuss current affairs confidently",
      "Stay physically fit — GTO outdoor tasks require stamina and agility",
    ],
  },
  capf: {
    name: "CAPF",
    full: "Central Armed Police Forces",
    description: "The CAPF (AC) exam is conducted by UPSC for recruitment of Assistant Commandants in CRPF, BSF, ITBP, CISF, and SSB. It consists of a written exam followed by physical tests and an interview.",
    eligibility: [
      "Indian citizens",
      "Age: 20 to 25 years",
      "Education: Bachelor's degree from a recognized university",
      "Physical fitness as per CAPF standards",
    ],
    subjects: [
      { name: "General Studies", topics: ["History", "Geography", "Polity", "Economics", "Science & Technology", "Current Affairs", "Internal Security", "Disaster Management"] },
      { name: "General Ability & Intelligence", topics: ["Comprehension", "Communication Skills", "Logical Reasoning", "Analytical Ability", "Data Interpretation", "Basic Numeracy"] },
      { name: "Descriptive (Essay & Comprehension)", topics: ["Essay Writing", "Precis Writing", "Comprehension of Passages", "Report Writing"] },
    ],
    pattern: [
      { section: "Paper I - General Ability", questions: 125, marks: 250, duration: "2 hours" },
      { section: "Paper II - General Studies", questions: 125, marks: 250, duration: "2 hours" },
      { section: "Paper III - Descriptive", questions: 0, marks: 200, duration: "3 hours" },
    ],
    tips: [
      "Paper III (Essay/Comprehension) is the differentiator — practice writing daily",
      "Study Indian polity and internal security topics thoroughly",
      "Use UPSC CSE material for General Studies preparation",
      "Stay updated on border security and paramilitary force operations",
      "Physical fitness preparation should start months before the PET",
    ],
  },
};

const ExamDetail = () => {
  const { examType } = useParams<{ examType: string }>();
  const navigate = useNavigate();
  const exam = examType ? examData[examType] : null;

  if (!exam) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 pt-24 pb-12 text-center">
          <h1 className="font-display text-3xl font-bold text-foreground mb-4">Exam Not Found</h1>
          <Button onClick={() => navigate("/")} className="bg-gold text-accent-foreground hover:bg-gold-light">
            Go Home
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        {/* Hero */}
        <section className="bg-primary py-16 relative overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gold rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
          </div>
          <div className="container mx-auto px-4 relative z-10">
            <Button variant="ghost" onClick={() => navigate("/#exams")} className="text-primary-foreground/60 hover:text-gold hover:bg-gold/10 mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Exams
            </Button>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <span className="text-sm font-semibold tracking-widest text-gold uppercase">{exam.name}</span>
              <h1 className="font-display text-4xl md:text-5xl font-bold text-primary-foreground mt-2 mb-4">{exam.full}</h1>
              <p className="text-primary-foreground/70 max-w-2xl font-body text-lg">{exam.description}</p>
              <div className="flex gap-3 mt-8">
                <Button onClick={() => navigate("/mock-test")} className="bg-gold text-accent-foreground hover:bg-gold-light font-semibold shadow-gold">
                  <Target className="mr-2 h-4 w-4" /> Take Mock Test
                </Button>
                <Button variant="outline" onClick={() => navigate("/study-materials")} className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
                  <BookOpen className="mr-2 h-4 w-4" /> Study Materials
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-12 space-y-16">
          {/* Eligibility */}
          <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-gold/10"><Users className="h-5 w-5 text-gold" /></div>
              <h2 className="font-display text-2xl font-bold text-foreground">Eligibility</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {exam.eligibility.map((item, i) => (
                <div key={i} className="flex items-start gap-3 bg-card rounded-lg border border-border p-4">
                  <div className="w-6 h-6 rounded-full bg-gold/10 text-gold flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i + 1}</div>
                  <p className="text-sm text-muted-foreground font-body">{item}</p>
                </div>
              ))}
            </div>
          </motion.section>

          {/* Subjects & Syllabus */}
          <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-gold/10"><BookOpen className="h-5 w-5 text-gold" /></div>
              <h2 className="font-display text-2xl font-bold text-foreground">Syllabus & Subjects</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {exam.subjects.map((subject) => (
                <div key={subject.name} className="bg-card rounded-xl border border-border p-6">
                  <h3 className="font-display text-lg font-semibold text-foreground mb-4">{subject.name}</h3>
                  <ul className="space-y-2">
                    {subject.topics.map((topic) => (
                      <li key={topic} className="flex items-center gap-2 text-sm text-muted-foreground font-body">
                        <div className="w-1.5 h-1.5 rounded-full bg-gold shrink-0" />
                        {topic}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </motion.section>

          {/* Exam Pattern */}
          <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-gold/10"><FileText className="h-5 w-5 text-gold" /></div>
              <h2 className="font-display text-2xl font-bold text-foreground">Exam Pattern</h2>
            </div>
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="grid grid-cols-4 gap-4 p-4 bg-muted/50 font-display text-sm font-semibold text-foreground">
                <span>Section</span><span>Questions</span><span>Marks</span><span>Duration</span>
              </div>
              {exam.pattern.map((row, i) => (
                <div key={i} className="grid grid-cols-4 gap-4 p-4 border-t border-border text-sm text-muted-foreground font-body">
                  <span className="font-medium text-foreground">{row.section}</span>
                  <span>{row.questions || "—"}</span>
                  <span>{row.marks || "—"}</span>
                  <span>{row.duration}</span>
                </div>
              ))}
            </div>
          </motion.section>

          {/* Tips */}
          <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-gold/10"><Brain className="h-5 w-5 text-gold" /></div>
              <h2 className="font-display text-2xl font-bold text-foreground">Preparation Tips</h2>
            </div>
            <div className="space-y-4">
              {exam.tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-4 bg-card rounded-lg border border-border p-5">
                  <div className="w-8 h-8 rounded-full bg-gold/10 text-gold flex items-center justify-center text-sm font-bold shrink-0">{i + 1}</div>
                  <p className="text-muted-foreground font-body">{tip}</p>
                </div>
              ))}
            </div>
          </motion.section>

          {/* CTA */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center bg-primary rounded-2xl p-10">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-primary-foreground mb-4">
              Ready to crack {exam.name}?
            </h2>
            <p className="text-primary-foreground/60 mb-8 font-body">Start your AI-powered preparation journey today</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={() => navigate("/mock-test")} className="bg-gold text-accent-foreground hover:bg-gold-light font-semibold shadow-gold">
                Start Mock Test <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button onClick={() => navigate("/study-planner")} variant="outline" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
                <Clock className="mr-2 h-4 w-4" /> Create Study Plan
              </Button>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default ExamDetail;
