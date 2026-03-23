import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import { BookOpen, FileText, Video, ExternalLink, ChevronDown, ChevronUp, Shield, Swords, Target, Brain, Users, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

type Material = {
  title: string;
  description: string;
  type: "notes" | "video" | "article" | "guide";
  source: string;
  url?: string;
};

type Category = {
  id: string;
  title: string;
  icon: React.ElementType;
  color: string;
  materials: Material[];
};

const categories: Category[] = [
  {
    id: "nda",
    title: "NDA Preparation",
    icon: Shield,
    color: "bg-primary/10 text-primary",
    materials: [
      { title: "NDA Mathematics Complete Notes", description: "Algebra, Trigonometry, Calculus, Matrices & Determinants — chapter-wise notes with solved examples from previous years.", type: "notes", source: "CDS Journey" },
      { title: "NDA GAT (General Ability Test) Notes", description: "Comprehensive notes covering Physics, Chemistry, Geography, History, Polity, Economics and Current Affairs for NDA GAT.", type: "notes", source: "Troppers" },
      { title: "NDA English Comprehension & Grammar", description: "Grammar rules, vocabulary building, comprehension strategies and previous year English paper analysis.", type: "notes", source: "Mockers" },
      { title: "NDA Previous Year Papers (2018–2025)", description: "Solved previous year question papers with detailed explanations for both Paper I (Maths) and Paper II (GAT).", type: "article", source: "CDS Journey" },
      { title: "NDA Exam Pattern & Syllabus Breakdown", description: "Complete syllabus analysis with topic-wise weightage and preparation strategy for NDA I & II.", type: "guide", source: "Troppers" },
      { title: "NDA Physical Standards & Medical Test Guide", description: "Height, weight, chest, vision and other medical standards required for NDA along with tips to meet them.", type: "guide", source: "CalmChase SSB" },
    ],
  },
  {
    id: "cds",
    title: "CDS Preparation",
    icon: Swords,
    color: "bg-secondary/10 text-secondary",
    materials: [
      { title: "CDS English Paper Strategy", description: "Ordering of sentences, spotting errors, synonyms-antonyms, reading comprehension techniques for CDS exam.", type: "notes", source: "CDS Journey" },
      { title: "CDS General Knowledge Capsule", description: "Monthly updated GK capsule covering national & international events, awards, sports, defence news for CDS.", type: "notes", source: "Mockers" },
      { title: "CDS Elementary Mathematics Notes", description: "Number system, HCF-LCM, percentage, profit-loss, time-speed-distance and geometry for CDS Maths.", type: "notes", source: "CDS Journey" },
      { title: "CDS Previous Year Papers with Solutions", description: "Last 10 years solved papers for English, GK and Mathematics with detailed answer explanations.", type: "article", source: "Troppers" },
      { title: "CDS OTA vs IMA vs AFA — Which to Choose?", description: "Detailed comparison of training academies, lifestyle, career growth and selection process differences.", type: "guide", source: "CalmChase SSB" },
    ],
  },
  {
    id: "afcat",
    title: "AFCAT Preparation",
    icon: Target,
    color: "bg-gold/10 text-gold",
    materials: [
      { title: "AFCAT General Awareness Notes", description: "History, Geography, Polity, Science, Defence & Current Affairs notes specifically curated for AFCAT pattern.", type: "notes", source: "Troppers" },
      { title: "AFCAT Verbal & Numerical Ability", description: "Reasoning, English and numerical ability practice material with shortcuts and tricks for AFCAT.", type: "notes", source: "Mockers" },
      { title: "AFCAT Military Aptitude Test Guide", description: "Spatial reasoning, pattern recognition and military aptitude section strategy with practice sets.", type: "notes", source: "CDS Journey" },
      { title: "AFCAT EKT (Engineering Knowledge Test)", description: "Branch-specific technical notes for Mechanical, Electrical, Electronics and CS streams.", type: "notes", source: "Troppers" },
      { title: "IAF Branches & Career Path Guide", description: "Flying, Technical and Ground Duty branches explained with eligibility, training and career prospects.", type: "guide", source: "CalmChase SSB" },
    ],
  },
  {
    id: "ssb",
    title: "SSB Interview Preparation",
    icon: Users,
    color: "bg-primary/10 text-primary",
    materials: [
      { title: "SSB 5-Day Procedure Complete Guide", description: "Day-by-day breakdown of the SSB interview process: Screening, Psychology, GTO, Interview and Conference.", type: "guide", source: "CalmChase SSB" },
      { title: "OIR (Officer Intelligence Rating) Practice", description: "Verbal and non-verbal reasoning practice sets similar to actual OIR tests at SSB centres.", type: "notes", source: "CalmChase SSB" },
      { title: "TAT, WAT, SRT & Self-Description Tips", description: "Psychology test strategies with sample responses — Thematic Apperception Test, Word Association, Situation Reaction.", type: "notes", source: "CalmChase SSB" },
      { title: "GTO Tasks: GD, GPE, PGT, HGT, Lecturette", description: "Group Testing Officer tasks explained with tips on command tasks, group planning and lecturette topics.", type: "guide", source: "Troppers" },
      { title: "Personal Interview Preparation Guide", description: "Common interview questions, rapid fire round tips, and how to handle the Interviewing Officer.", type: "guide", source: "CDS Journey" },
      { title: "15 Officer Like Qualities (OLQs) Explained", description: "Detailed explanation of all 15 OLQs that SSB assessors look for, with examples of how to demonstrate them.", type: "article", source: "CalmChase SSB" },
    ],
  },
  {
    id: "physical",
    title: "Physical Fitness & Medical",
    icon: Dumbbell,
    color: "bg-secondary/10 text-secondary",
    materials: [
      { title: "1600m Running Training Plan", description: "8-week training plan to achieve the required 1600m run time for Army, Navy and Air Force standards.", type: "guide", source: "Troppers" },
      { title: "Physical Fitness Test (PFT) Standards", description: "Push-ups, sit-ups, chin-ups, rope climbing and other PFT requirements with training routines.", type: "guide", source: "CalmChase SSB" },
      { title: "Medical Test Preparation Guide", description: "Common medical reasons for rejection and how to prepare — vision correction, dental, flat feet, etc.", type: "guide", source: "CDS Journey" },
    ],
  },
  {
    id: "current-affairs",
    title: "Current Affairs & GK",
    icon: Brain,
    color: "bg-gold/10 text-gold",
    materials: [
      { title: "Monthly Defence Current Affairs", description: "Monthly digest covering defence exercises, missile tests, new appointments, and defence deals relevant for exams.", type: "notes", source: "Mockers" },
      { title: "Static GK for Defence Exams", description: "Important static facts — Indian geography, Constitution articles, international organisations, important dates.", type: "notes", source: "CDS Journey" },
      { title: "Awards, Honours & Appointments 2025", description: "Padma awards, Gallantry awards, Param Vir Chakra, Ashoka Chakra recipients and key government appointments.", type: "article", source: "Troppers" },
      { title: "India's Neighbours & Border Disputes", description: "Comprehensive notes on India's border issues, neighbouring country relations, and strategic partnerships.", type: "notes", source: "CalmChase SSB" },
    ],
  },
];

const typeIcons = {
  notes: FileText,
  video: Video,
  article: BookOpen,
  guide: ExternalLink,
};

const typeBadgeColors = {
  notes: "bg-primary/10 text-primary",
  video: "bg-destructive/10 text-destructive",
  article: "bg-gold/10 text-gold",
  guide: "bg-secondary/10 text-secondary",
};

const StudyMaterials = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [expandedCategory, setExpandedCategory] = useState<string | null>("nda");

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-gold border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground">Study Materials & Notes</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Curated study resources for NDA, CDS, AFCAT & SSB preparation
          </p>
        </div>

        <div className="space-y-4">
          {categories.map((cat) => {
            const isExpanded = expandedCategory === cat.id;
            return (
              <div key={cat.id} className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
                <button
                  onClick={() => setExpandedCategory(isExpanded ? null : cat.id)}
                  className="w-full flex items-center justify-between p-5 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${cat.color}`}>
                      <cat.icon className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <h2 className="font-display text-lg font-semibold text-foreground">{cat.title}</h2>
                      <p className="text-xs text-muted-foreground">{cat.materials.length} resources</p>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 grid gap-3 sm:grid-cols-2">
                        {cat.materials.map((mat, i) => {
                          const TypeIcon = typeIcons[mat.type];
                          return (
                            <div
                              key={i}
                              className="bg-background rounded-lg border border-border p-4 hover:shadow-card transition-shadow"
                            >
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h3 className="font-display text-sm font-semibold text-foreground leading-snug">{mat.title}</h3>
                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${typeBadgeColors[mat.type]}`}>
                                  {mat.type}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed mb-3">{mat.description}</p>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-muted-foreground">Source: {mat.source}</span>
                                <TypeIcon className="h-3.5 w-3.5 text-muted-foreground" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default StudyMaterials;
