import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";

const SITUATIONS = ["He was leading a patrol and fire broke out. He...", "His train was late for an interview. He..."];

const SRTPractice = () => {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [response, setResponse] = useState("");
  const [results, setResults] = useState<any[]>([]);

  const handleNext = async () => {
    const res = await fetch("http://127.0.0.1:8000/analyze-ssb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: response, time_taken: 5.0 }),
    });
    const data = await res.json();
    const updated = [...results, { word: `Sit ${index+1}`, response, ...data }];
    
    if (index < SITUATIONS.length - 1) {
        setResults(updated); setIndex(index + 1); setResponse("");
    } else {
        localStorage.setItem("ssb_latest_session", JSON.stringify({ type: 'SRT', results: updated }));
        navigate("/ssb-practice");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-white pt-40 flex flex-col items-center">
      <Navbar />
      <div className="bg-slate-900 p-10 rounded-3xl border-l-8 border-[#d4af37] max-w-2xl w-full">
        <p className="text-2xl italic mb-6">"{SITUATIONS[index]}"</p>
        <textarea className="w-full bg-black p-4 rounded-xl border border-white/10" 
                  value={response} onChange={(e) => setResponse(e.target.value)} placeholder="Action..."/>
        <button onClick={handleNext} className="w-full mt-6 bg-[#d4af37] text-black font-bold h-12 rounded-xl">Next</button>
      </div>
    </div>
  );
};

export default SRTPractice;