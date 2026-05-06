import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ChatWidget from "@/components/ChatWidget";
import TodoWidget from "@/components/TodoWidget";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import StudyPlanner from "./pages/StudyPlanner";
import MockTest from "./pages/MockTest";
import Analysis from "./pages/Analysis";
import StudyMaterials from "./pages/StudyMaterials";
import ExamDetail from "./pages/ExamDetail";
import AIFeatureDetail from "./pages/AIFeatureDetail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import SSBPractice from "./pages/SSBPractice";
import Flashcards from "./pages/Flashcards";
import WATPractice from "./pages/WATPractice"; // Added import
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import TATPractice from "./pages/TATPractice";
import SRTPractice from "./pages/SRTPractice";
import OIRPractice from "./pages/OIRPractice";
import GDSimulator from "./pages/GDSimulator";
import PIPreparation from "./pages/PIPreparation";
import InterviewCoaching from "./pages/InterviewCoaching";
import HolisticAnalysis from "./pages/HolisticAnalysis";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/study-planner" element={<StudyPlanner />} />
            <Route path="/mock-test" element={<MockTest />} />
            <Route path="/analysis" element={<Analysis />} />
            <Route path="/study-materials" element={<StudyMaterials />} />
            <Route path="/exam/:examType" element={<ExamDetail />} />
            <Route path="/feature/:featureSlug" element={<AIFeatureDetail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/ssb-practice" element={<SSBPractice />} />
            <Route path="/flashcards" element={<Flashcards />} />
            <Route path="/wat-practice" element={<WATPractice />} /> {/* Added route */}
            <Route path="/tat-practice" element={<TATPractice />} />
            <Route path="/srt-practice" element={<SRTPractice />} />
            <Route path="/oir-practice" element={<OIRPractice />} />
            <Route path="/gd-simulator" element={<GDSimulator />} />
            <Route path="/pi-preparation" element={<PIPreparation />} />
            <Route path="/interview-coaching" element={<InterviewCoaching />} />
            <Route path="/about" element={<About />} />
            <Route path="/holistic-analysis" element={<HolisticAnalysis />} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <ChatWidget />
          <TodoWidget />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;