from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
from textblob import TextBlob
import uvicorn

# 1. Load models at the top
try:
    model = joblib.load("olq_classifier.pkl")
    vectorizer = joblib.load("tfidf_vectorizer.pkl")
    print("✅ Models loaded successfully!")
except Exception as e:
    print(f"❌ Error loading models: {e}")

app = FastAPI()

# 2. CORS - Crucial for connecting Supabase frontend to local backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class EvaluationRequest(BaseModel):
    text: str
    time_taken: float = 0.0

# 3. Psych Engine Endpoints (Supports both names to avoid 404)
@app.post("/analyze-ssb")
@app.post("/analyze-wat")
async def analyze_ssb(request: EvaluationRequest):
    blob = TextBlob(request.text)
    sentiment = blob.sentiment.polarity
    
    if sentiment > 0.1:
        base = "Positive/Constructive mindset detected."
    elif sentiment < -0.1:
        base = "Caution: Response leans toward negativity/defeatism."
    else:
        base = "Neutral response."

    latency = ""
    if request.time_taken > 12:
        latency = " High latency suggests possible social masking."
    elif request.time_taken < 4:
        latency = " High spontaneity detected."
    else:
        latency = " Balanced processing time."

    vec = vectorizer.transform([request.text])
    pred = model.predict(vec)[0]

    return {
        "sentiment": round(sentiment, 2),
        "feedback": f"{base}{latency}", 
        "primary_olq": pred,
        "time_taken": request.time_taken,
        "status": "success"
    }

# 4. Flashcard Generation Endpoint
@app.post("/generate-flashcards")
async def generate_flashcards(request: EvaluationRequest):
    try:
        return {
            "status": "success",
            "cards": [
                {"front": f"Core Concept: {request.text}", "back": "Focus on OLQs like Initiative and Speed of Decision."},
                {"front": "Psychological Tip", "back": "Maintain spontaneity to avoid social masking flags."}
            ]
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

# 5. SERVER STARTUP (Must be at the very bottom)
if __name__ == "__main__":
    print("🚀 SSB Psych Engine starting on http://127.0.0.1:8000")
    uvicorn.run(app, host="127.0.0.1", port=8000)