import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Timer, Brain } from "lucide-react";
import Navbar from "@/components/Navbar";

const TATPractice = () => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<"observe" | "write">("observe");
  const [timeLeft, setTimeLeft] = useState(30); 
  const [story, setStory] = useState("");
  const [allStories, setAllStories] = useState<any[]>([]);

  // YOUR ORIGINAL DYNAMIC IMAGE LOGIC
  const sessionImages = useMemo(() => {
  // Look into the public folder
  const imageModules = import.meta.glob("/public/tat/*.{png,jpg,jpeg,webp}", { eager: true });
  
  // Clean paths for the browser (remove "/public")
  const allPaths = Object.keys(imageModules).map(path => path.replace("/public", ""));
  
  // Randomize 11 images and add the Blank Slide
  return [...allPaths].sort(() => Math.random() - 0.5).slice(0, 11).concat("BLANK_SLIDE");
}, []);

  useEffect(() => {
    let timer: any;
    if (timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else {
      phase === "observe" ? (setPhase("write"), setTimeLeft(240)) : handleNext();
    }
    return () => clearTimeout(timer);
  }, [timeLeft]);

  const handleNext = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/analyze-ssb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: story || "No response", time_taken: 240 - timeLeft }),
      });
      const data = await res.json();
      const updated = [...allStories, { word: `Slide ${currentIndex + 1}`, response: story, ...data }];
      
      if (currentIndex < 11) {
        setAllStories(updated);
        setCurrentIndex(prev => prev + 1);
        setStory(""); setPhase("observe"); setTimeLeft(30);
      } else {
        // LOCAL STORAGE BRIDGE
        localStorage.setItem("ssb_latest_session", JSON.stringify({ type: 'TAT', results: updated }));
        navigate("/ssb-practice", { state: { results: updated, type: 'TAT' } });
      }
    } catch (e) { console.error(e); }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-white p-10 pt-32">
      <Navbar />
      <div className="max-w-4xl mx-auto bg-slate-900/50 p-10 rounded-[2rem] border border-white/5">
        <div className="flex justify-between mb-8">
            <h2 className="text-[#d4af37] font-black uppercase">TAT Slide {currentIndex + 1}</h2>
            <div className="flex items-center gap-2"><Timer size={20}/> {timeLeft}s</div>
        </div>
        <div className="grid grid-cols-2 gap-8">
            <div className="rounded-xl overflow-hidden h-64 bg-black border border-white/10">
                {sessionImages[currentIndex] === "BLANK_SLIDE" ? 
                  <div className="h-full flex items-center justify-center font-bold">BLANK SLIDE</div> :
                  <img src={sessionImages[currentIndex]} className={`h-full w-full object-cover ${phase === 'write' ? 'blur-2xl' : ''}`} />
                }
            </div>
            <textarea className="bg-black/40 p-4 rounded-xl border border-white/10 outline-none" 
                value={story} onChange={(e) => setStory(e.target.value)} disabled={phase === 'observe'} placeholder="Write story..."/>
        </div>
        <button onClick={handleNext} className="w-full mt-6 bg-[#d4af37] text-black font-bold h-12 rounded-xl uppercase">Next</button>
      </div>
    </div>
  );
};

export default TATPractice;