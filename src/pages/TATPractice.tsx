import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TATPractice = () => {
    const [image, setImage] = useState<string | null>(null);
    const [story, setStory] = useState('');
    const [analysis, setAnalysis] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // Fetch a random image on component mount
    const fetchRandomImage = async () => {
        try {
            const res = await axios.get('http://localhost:8000/get-tat-image');
            setImage(res.data.image_url);
        } catch (err) {
            console.error("Error fetching TAT image", err);
        }
    };

    useEffect(() => { fetchRandomImage(); }, []);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const response = await axios.post('http://localhost:8000/analyze-tat', {
                story: story,
                image_name: image?.split('/').pop() // Send image ref for context
            });
            setAnalysis(response.data);
        } catch (err) {
            console.error("Analysis failed", err);
        }
        setLoading(false);
    };
    const handleFinishTest = () => {
      // Logic to save session to localStorage (Persistence)
      const existingHistory = JSON.parse(localStorage.getItem("ssb_history") || "[]");
      const newEntry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        type: "TAT",
        data: aiGeneratedAnalysisArray, 
      };
      localStorage.setItem("ssb_history", JSON.stringify([newEntry, ...existingHistory]));

      // Safe navigation with state
      navigate("/ssb-practice", { state: { results: aiGeneratedAnalysisArray } });
    };
    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-4 text-olive-600">TAT Agentic Practice</h2>
            
            {image && (
                <div className="mb-6">
                    <img src={`http://localhost:8000${image}`} alt="TAT Stimulus" className="rounded-lg shadow-lg max-h-96 mx-auto" />
                </div>
            )}

            <textarea 
                className="w-full p-4 border rounded-md h-40 bg-gray-50"
                placeholder="Write your story here (Observe for 30s, write for 4m)..."
                value={story}
                onChange={(e) => setStory(e.target.value)}
            />

            <button 
                onClick={handleSubmit}
                disabled={loading}
                className="mt-4 bg-olive-700 text-white px-6 py-2 rounded hover:bg-olive-800 disabled:opacity-50"
            >
                {loading ? 'Agent Analyzing...' : 'Submit Story'}
            </button>

            {analysis && (
                <div className="mt-8 p-6 bg-white border-l-4 border-olive-500 shadow-sm">
                    <h3 className="font-bold text-lg">AI Insights & Performance Analytics</h3>
                    <p className="mt-2 text-gray-700"><strong>OLQs Detected:</strong> {analysis.olqs.join(', ')}</p>
                    <p className="mt-2"><strong>Psychological Feedback:</strong> {analysis.feedback}</p>
                    <div className="mt-2 text-sm text-gray-500 italic">Saved to Performance Analytics Vault.</div>
                </div>
            )}
            {isAnalysisComplete && (
              <div className="mt-8 flex flex-col items-center gap-4">
                <div className="text-sm text-gray-500 italic">
                  Saved to Performance Analytics Vault.
                </div>
                
                {/* Trigger navigation via the handler */}
                <Button 
                  onClick={handleFinishTest}
                  className="bg-[#d4af37] text-black font-bold hover:bg-amber-500"
                >
                  View Full Performance Report
                </Button>
              </div>
            )}
            
        </div>
    );
};

export default TATPractice;