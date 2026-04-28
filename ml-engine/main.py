from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
from textblob import TextBlob
import uvicorn

# --- 1. CONFIGURATION & MODELS ---
try:
    model = joblib.load("olq_classifier.pkl")
    vectorizer = joblib.load("tfidf_vectorizer.pkl")
    print("✅ Models loaded successfully!")
except Exception as e:
    print(f"❌ Error loading models: {e}")

app = FastAPI()

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
    exam_date: str = ""
    weak_areas: str = ""
    hours_per_day: int = 4

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

# --- 5. STUDY PLAN ENDPOINT (The fix is placing this BEFORE startup) ---
@app.post("/generate-study-plan")
async def generate_study_plan(request: StudyPlanRequest):
    # 1. Define specific curriculum based on Exam Type
    test_data = {
        "NDA": {
            "focus": "Mathematics & GAT",
            "topics": ["Trigonometry & Algebra", "English Vocabulary", "Physics/Chemistry Fundamentals"]
        },
        "CDS": {
            "focus": "Advanced GS & Elementary Maths",
            "topics": ["Indian Polity & History", "English Grammar", "Arithmetic & Mensuration"]
        },
        "SSB": {
            "focus": "Psychology & OLQs",
            "topics": ["TAT/WAT/SRT Practice", "Current Affairs Discussion", "GTO Task Visualization"]
        },
        "AFCAT": {
            "focus": "Numerical Ability & Reasoning",
            "topics": ["Verbal Ability", "Spatial Awareness", "Military Aptitude"]
        }
    }

    # 2. Get data for the selected test (fallback to General if not found)
    selected = test_data.get(request.exam_type, {
        "focus": "General Defence Prep",
        "topics": ["Syllabus Overview", "Previous Year Papers"]
    })

    # 3. Add the "Weak Area" into the first day for true personalization
    personal_focus = f"Intensive: {request.weak_areas}" if request.weak_areas else f"Focus: {selected['focus']}"

    return {
        "status": "success",
        "plan_title": f"7-Day {request.exam_type} Personal Fast-Track",
        "schedule": [
            {
                "week": 1, "day": "Monday", 
                "topics": [personal_focus, selected['topics'][0]], 
                "duration_hours": request.hours_per_day, "priority": "high"
            },
            {
                "week": 1, "day": "Tuesday", 
                "topics": [selected['topics'][1], "Daily Current Affairs"], 
                "duration_hours": request.hours_per_day, "priority": "medium"
            },
            {
                "week": 1, "day": "Wednesday", 
                "topics": [selected['topics'][2] if len(selected['topics']) > 2 else "Mock Test", "Error Analysis"], 
                "duration_hours": request.hours_per_day, "priority": "high"
            },
            {
                "week": 1, "day": "Thursday", 
                "topics": ["Physical Conditioning", "Revision of Weak Areas"], 
                "duration_hours": 2, "priority": "low"
            }
        ]
    }

# --- 6. SERVER STARTUP (Always keep this at the absolute bottom) ---
if __name__ == "__main__":
    print("🚀 SSB Psych Engine starting on http://127.0.0.1:8000")
    # Using 0.0.0.0 helps prevent "Connection Refused" errors on some networks
    uvicorn.run(app, host="0.0.0.0", port=8000)