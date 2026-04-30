from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
from textblob import TextBlob
import uvicorn
from typing import List, Optional
import uuid
from datetime import datetime
import os
import random
from fastapi.staticfiles import StaticFiles
# --- 1. CONFIGURATION & MODELS ---
try:
    model = joblib.load("olq_classifier.pkl")
    vectorizer = joblib.load("tfidf_vectorizer.pkl")
    print("✅ Models loaded successfully!")
except Exception as e:
    print(f"❌ Error loading models: {e}")

app = FastAPI()
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
tat_path = os.path.join(base_dir, "public", "tat")

app.mount("/tat", StaticFiles(directory=tat_path), name="tat")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 2. REQUEST SCHEMAS ---
class EvaluationRequest(BaseModel):
    text: str
    time_taken: float = 0.0

class StudyPlanRequest(BaseModel):
    exam_type: str
    exam_date: Optional[str] = None
    weak_areas: List[str]
    hours_per_day: int

# --- 3. PSYCH ENGINE ENDPOINTS ---
@app.post("/analyze-ssb")
@app.post("/analyze-wat")
async def analyze_ssb(request: EvaluationRequest):
    blob = TextBlob(request.text)
    sentiment = blob.sentiment.polarity
    
    base = "Neutral response."
    if sentiment > 0.1:
        base = "Positive/Constructive mindset detected."
    elif sentiment < -0.1:
        base = "Caution: Response leans toward negativity/defeatism."

    latency = " Balanced processing time."
    if request.time_taken > 12:
        latency = " High latency suggests possible social masking."
    elif request.time_taken < 4:
        latency = " High spontaneity detected."

    vec = vectorizer.transform([request.text])
    pred = model.predict(vec)[0]

    return {
        "sentiment": round(sentiment, 2),
        "feedback": f"{base}{latency}", 
        "primary_olq": pred,
        "time_taken": request.time_taken,
        "status": "success"
    }

# --- 4. FLASHCARD ENDPOINT ---
@app.post("/generate-flashcards")
async def generate_flashcards(request: EvaluationRequest):
    return {
        "status": "success",
        "cards": [
            {"front": f"Core Concept: {request.text}", "back": "Focus on OLQs like Initiative."},
            {"front": "Psychological Tip", "back": "Maintain spontaneity."}
        ]
    }



# --- 5. STUDY PLAN ENDPOINT (Refined for AI Logic) ---
@app.post("/generate-study-plan")
async def generatePlan(request: StudyPlanRequest):
    # This dictionary acts as the "Knowledge Base" for the AI logic
    test_data = {
        "NDA": {
            "focus": "Mathematics & GAT",
            "topics": ["Trigonometry & Algebra", "English Vocabulary", "Physics/Chemistry"]
        },
        "CDS": {
            "focus": "Advanced GS & Elementary Maths",
            "topics": ["Indian Polity & History", "English Grammar", "Arithmetic"]
        },  
        "SSB": {
            "focus": "Psychology & OLQs",
            "topics": ["TAT/WAT/SRT Practice", "Current Affairs", "GTO Visualization"]
        },
        "AFCAT": {
            "focus": "Numerical Ability & Reasoning",
            "topics": ["Verbal Ability", "Spatial Awareness", "Military Aptitude"]
        }
    }

    selected = test_data.get(request.exam_type, {
        "focus": "General Defence Prep",
        "topics": ["Syllabus Overview", "Previous Year Papers", "General Awareness"]
    })

    # DYNAMIC LOGIC: If user typed a weak area, it overrides the standard focus
    # Join the list of weak areas into a single string for the UI
    weak_areas_str = ", ".join(request.weak_areas) if isinstance(request.weak_areas, list) else request.weak_areas

    primary_task = f"Mastery Session: {weak_areas_str}" if weak_areas_str else f"Core Focus: {selected['focus']}"
    return {
        "id": str(uuid.uuid4()),
        "status": "success",
        "plan_title": f"{request.exam_type} Personal Fast-Track",
        "exam": request.exam_type,
        "date": request.exam_date,
        "schedule": [
            {
                "day": "Monday", 
                "topics": [primary_task, selected['topics'][0]], 
                "hours": request.hours_per_day
            },
            {
                "day": "Tuesday", 
                "topics": [selected['topics'][1], "Psychological Conditioning"], 
                "hours": request.hours_per_day
            }
        ]
    }
    

# --- NEW DATA MODELS ---
class TATRequest(BaseModel):
    story: str
    image_name: str

# Mock Database for Performance Analytics
user_performance_vault = []

# --- TAT LOGIC: DYNAMIC FOLDER ACCESS ---
TAT_IMAGE_DIR = "public/tat"

@app.get("/get-tat-image")
async def get_tat_image():
    if not os.path.exists(TAT_IMAGE_DIR):
        raise HTTPException(status_code=404, detail="TAT directory not found")
    
    # Logic: Filter files to ensure we only pick images, ignoring sequence/names
    images = [f for f in os.listdir(TAT_IMAGE_DIR) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
    
    if not images:
        raise HTTPException(status_code=404, detail="No images in folder")
        
    selected_image = random.choice(images)
    return {"image_url": f"/tat/{selected_image}"}

# --- AGENTIC ANALYSIS & DATA PERSISTENCE ---
@app.post("/analyze-tat")
async def analyze_tat(data: TATRequest):
    # Agentic Simulation: In a real app, you'd call an LLM here
    # This logic acts as the 'Evaluator Agent'
    
    analysis_results = {
        "test_type": "TAT",
        "timestamp": datetime.now().isoformat(),
        "story_preview": data.story[:50],
        "olqs": ["Initiative", "Social Effectiveness", "Self-Confidence"],
        "feedback": "The story shows high level of resourcefulness but needs more emphasis on group cooperation.",
        "sentiment_score": 0.85 # High positivity
    }

    # FEATURE: Save to Performance Analytics Vault
    user_performance_vault.append(analysis_results)
    
    return analysis_results

@app.get("/performance-analytics")
async def get_analytics():
    # Returns all past mock test data for the user
    return user_performance_vault
# --- ADD THIS: Root route for easy debugging ---
@app.get("/")
async def root():
    return {"message": "SSB Psych Engine is Online"}

# --- 6. SERVER STARTUP ---
if __name__ == "__main__":
    # Change host to 127.0.0.1 to match your frontend fetch exactly
    uvicorn.run(app, host="127.0.0.1", port=8000)
