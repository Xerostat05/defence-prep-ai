import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import StatsSection from "@/components/StatsSection";
import ExamCategories from "@/components/ExamCategories";
import AIFeaturesSection from "@/components/AIFeaturesSection";
import SSBSection from "@/components/SSBSection";
import PGTSimulatorSection from "@/components/PGTSimulatorSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <StatsSection />
        <ExamCategories />
        <AIFeaturesSection />
        <SSBSection />
        <PGTSimulatorSection />
        <TestimonialsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
