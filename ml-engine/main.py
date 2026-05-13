from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
from textblob import TextBlob
import uvicorn
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
import os
import random
from fastapi.staticfiles import StaticFiles
import sqlite3
import json
from contextlib import contextmanager
# --- 1. CONFIGURATION & MODELS ---
# Database Setup
DB_FILE = "ssb_performance.db"

def init_db():
    """Initialize SQLite database with performance tables"""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS performance_records (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            session_type TEXT,
            score REAL,
            details TEXT,
            timestamp TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()

@contextmanager
def get_db():
    """Context manager for database connections"""
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

def save_performance_record(user_id: str, session_type: str, score: float, details: dict, timestamp: str):
    """Save a performance record to the database"""
    record_id = str(uuid.uuid4())
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO performance_records (id, user_id, session_type, score, details, timestamp)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (record_id, user_id, session_type, score, json.dumps(details), timestamp))
        conn.commit()
    return record_id

def get_performance_records(user_id: Optional[str] = None, session_type: Optional[str] = None):
    """Retrieve performance records from the database"""
    with get_db() as conn:
        cursor = conn.cursor()
        query = "SELECT * FROM performance_records WHERE 1=1"
        params = []
        
        if user_id:
            query += " AND user_id = ?"
            params.append(user_id)
        if session_type:
            query += " AND session_type = ?"
            params.append(session_type)
        
        query += " ORDER BY timestamp DESC"
        cursor.execute(query, params)
        rows = cursor.fetchall()
    
    records = []
    for row in rows:
        record = dict(row)
        if record['details']:
            record['details'] = json.loads(record['details'])
        records.append(record)
    return records

# Initialize database on startup
init_db()

try:
    model = joblib.load("olq_classifier.pkl")
    vectorizer = joblib.load("tfidf_vectorizer.pkl")
    print("Models loaded successfully")
except Exception as e:
    print(f"Error loading models: {e}")

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
    user_id: Optional[str] = None
    session_type: Optional[str] = None

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

    analysis_record = {
        "user_id": request.user_id,
        "session_type": request.session_type or "SRT/WAT",
        "score": round((sentiment + 1) * 50, 1),
        "details": {
            "feedback": f"{base}{latency}",
            "primary_olq": pred,
            "time_taken": request.time_taken,
            "text": request.text
        },
        "timestamp": datetime.now().isoformat()
    }
    save_performance_record(analysis_record["user_id"], analysis_record["session_type"], 
                           analysis_record["score"], analysis_record["details"], 
                           analysis_record["timestamp"])
    user_performance_vault.append(analysis_record)

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
    test_data = {
        "NDA": {
            "focus": "Mathematics & GAT",
            "topics": ["Trigonometry & Algebra", "English Vocabulary", "Physics/Chemistry", "General Studies"]
        },
        "CDS": {
            "focus": "Advanced GS & Elementary Maths",
            "topics": ["Indian Polity & History", "English Grammar", "Arithmetic", "Current Affairs"]
        },
        "SSB": {
            "focus": "Psychology & OLQs",
            "topics": ["TAT/WAT/SRT Practice", "Current Affairs", "GTO Visualization", "Leadership Reflection"]
        },
        "AFCAT": {
            "focus": "Numerical Ability & Reasoning",
            "topics": ["Verbal Ability", "Spatial Awareness", "Military Aptitude", "English Comprehension"]
        },
        "CAPF": {
            "focus": "General Studies & Physical Prep",
            "topics": ["Polity & Law", "History", "Quantitative Aptitude", "Physical Fitness"]
        },
        "INET": {
            "focus": "Service Knowledge & Mental Agility",
            "topics": ["Service Rules", "Essay Writing", "Current Affairs", "Logical Reasoning"]
        }
    }

    selected = test_data.get(request.exam_type, {
        "focus": "General Defence Prep",
        "topics": ["Syllabus Overview", "Previous Year Papers", "General Awareness", "Study Strategy"]
    })
    weak_areas = [area.strip() for area in request.weak_areas if area and area.strip()]
    weak_areas_str = ", ".join(weak_areas)

    start_date = datetime.now().date()
    if request.exam_date:
        try:
            exam_target = datetime.fromisoformat(request.exam_date).date()
            days_left = max((exam_target - start_date).days, 7)
        except Exception:
            exam_target = None
            days_left = 28
    else:
        exam_target = None
        days_left = 28

    if days_left < 28:
        days_left = max(days_left, 14)
    weeks = min(max((days_left + 6) // 7, 4), 8)
    total_days = weeks * 7

    plan_days = []
    core_topics = selected["topics"][:]
    if weak_areas:
        for weak in weak_areas:
            if weak not in core_topics:
                core_topics.insert(0, f"Weak Area Focus: {weak}")

    for day_index in range(total_days):
        current_date = start_date + timedelta(days=day_index)
        weekday = current_date.strftime("%A")
        week_number = (day_index // 7) + 1
        topic_idx = day_index % len(core_topics)
        base_topic = core_topics[topic_idx]
        secondary_topic = core_topics[(topic_idx + 1) % len(core_topics)]

        if weekday in ["Saturday", "Sunday"]:
            session_topics = ["Weekly review & practice test", f"Revisit: {base_topic}"]
            priority = "high" if weak_areas else "medium"
            notes = "Use weekend days for consolidation, self-assessment, and focused revision."
        else:
            session_topics = [base_topic, secondary_topic]
            priority = "high" if any(weak.lower() in base_topic.lower() for weak in weak_areas) else "medium"
            notes = "Keep the session active with practice questions and revision notes."

        if week_number == weeks and weekday in ["Friday", "Saturday", "Sunday"]:
            session_topics = ["Final revision", "Mock exam simulation", "Exam readiness checklist"]
            priority = "high"
            notes = "Wrap up the month with focused revision and stress-management practice."

        plan_days.append({
            "week": week_number,
            "day": weekday,
            "date": current_date.isoformat(),
            "topics": session_topics,
            "duration_hours": request.hours_per_day,
            "priority": priority,
            "notes": notes
        })

    plan_title = f"{request.exam_type} {weak_areas_str + ' ' if weak_areas_str else ''}Roadmap {start_date.strftime('%b %d')}"
    return {
        "status": "success",
        "title": plan_title,
        "exam_type": request.exam_type,
        "start_date": start_date.isoformat(),
        "end_date": exam_target.isoformat() if exam_target else (start_date + timedelta(days=total_days - 1)).isoformat(),
        "plan": plan_days,
        "summary": {
            "weeks": weeks,
            "total_days": total_days,
            "hours_per_day": request.hours_per_day,
            "weak_areas": weak_areas,
            "focus": selected["focus"]
        }
    }
    

# --- NEW DATA MODELS ---
class TATRequest(BaseModel):
    story: str
    image_name: str
    user_id: Optional[str] = None

class PerformanceLogRequest(BaseModel):
    user_id: str
    session_type: str
    score: Optional[float] = None
    details: dict
    timestamp: Optional[str] = None

class OIRAnalysisRequest(BaseModel):
    user_id: str
    answers: List[dict]
    time_taken: float = 0.0

class GDRequest(BaseModel):
    user_id: str
    topic: str
    user_input: Optional[str] = None

class PIAnalysisRequest(BaseModel):
    user_id: str
    question: str
    answer: str

# --- COMPREHENSIVE WAT WORD POOL ---
WAT_WORD_POOL = [
    "Risk", "Team", "Failure", "Enemy", "Mission", "Friend", "Lead", "Duty", 
    "Conflict", "Victory", "Fear", "Discipline", "Home", "Order", "Success", 
    "Brother", "Country", "Challenge", "Goal", "Attack", "Peace", "Company", 
    "Loyalty", "Mistake", "Problem", "Command", "Action", "Responsibility",
    "Courage", "Honor", "Sacrifice", "Unity", "Strength", "Wisdom", "Trust",
    "Justice", "Duty", "Service", "Excellence", "Perseverance", "Innovation",
    "Leadership", "Communication", "Decision", "Crisis", "Success", "Failure",
    "Growth", "Change", "Opportunity", "Threat", "Alliance", "Authority",
    "Weakness", "Strength", "Defense", "Offense", "Retreat", "Advance",
    "Protocol", "Innovation", "Tradition", "Progress", "Heritage", "Future"
]

# --- COMPREHENSIVE SRT SITUATIONS ---
SRT_SITUATIONS = [
    "He was leading a patrol and enemy fire broke out suddenly. He...",
    "His subordinate made a critical mistake during an operation. He...",
    "He realized his unit was running low on ammunition and supplies. He...",
    "A fellow officer criticized his leadership in front of the troops. He...",
    "He received an order that he thought was strategically unsound. He...",
    "During a difficult mission, one of his soldiers got severely injured. He...",
    "He discovered that a team member had stolen military supplies. He...",
    "His commanding officer rejected his operational plan without explanation. He...",
    "He faced a situation where he had to choose between two conflicting duties. He...",
    "He noticed that some soldiers were not following proper protocol. He...",
    "He was promoted suddenly over more senior officers. He...",
    "He had to make a critical decision with incomplete information. He...",
    "A subordinate questioned his authority in front of the entire unit. He...",
    "He discovered a security breach in his unit. He...",
    "He was assigned a mission that seemed impossible with limited resources. He...",
    "He had to deliver bad news to his team. He...",
    "He witnessed corruption among his peer officers. He...",
    "He was blamed for a failure that wasn't entirely his responsibility. He...",
    "He had to train a group of poorly motivated soldiers. He...",
    "He faced a dilemma between following orders and protecting his men. He..."
]

# Mock Database for Performance Analytics
user_performance_vault = []

# --- WAT ENDPOINT ---
@app.get("/get-wat-words")
async def get_wat_words(count: int = 10):
    """Get random WAT words for the test"""
    if count > len(WAT_WORD_POOL):
        count = len(WAT_WORD_POOL)
    
    selected_words = random.sample(WAT_WORD_POOL, count)
    return {
        "status": "success",
        "words": selected_words,
        "count": len(selected_words),
        "time_per_word": 15  # seconds
    }

# --- SRT ENDPOINT ---
@app.get("/get-srt-situations")
async def get_srt_situations(count: int = 10):
    """Get random SRT situations for the test"""
    if count > len(SRT_SITUATIONS):
        count = len(SRT_SITUATIONS)
    
    selected_situations = random.sample(SRT_SITUATIONS, count)
    return {
        "status": "success",
        "situations": selected_situations,
        "count": len(selected_situations),
        "time_per_situation": 120  # seconds (2 minutes)
    }


# --- TAT LOGIC: DYNAMIC FOLDER ACCESS ---
TAT_IMAGE_DIR = tat_path

@app.get("/get-tat-image")
async def get_tat_image():
    if not os.path.exists(TAT_IMAGE_DIR):
        raise HTTPException(status_code=404, detail=f"TAT directory not found: {TAT_IMAGE_DIR}")

    images = [f for f in os.listdir(TAT_IMAGE_DIR) if f.lower().endswith((".png", ".jpg", ".jpeg"))]
    if not images:
        raise HTTPException(status_code=404, detail=f"No images in folder: {TAT_IMAGE_DIR}")

    selected_image = random.choice(images)
    return {"image_url": f"http://127.0.0.1:8000/tat/{selected_image}"}

# --- AGENTIC ANALYSIS & DATA PERSISTENCE ---
@app.post("/analyze-tat")
async def analyze_tat(data: TATRequest):
    # Agentic Simulation: In a real app, you'd call an LLM here
    # This logic acts as the 'Evaluator Agent'
    
    analysis_results = {
        "session_type": "TAT",
        "user_id": data.user_id,
        "timestamp": datetime.now().isoformat(),
        "story_preview": data.story[:50],
        "olqs": ["Initiative", "Social Effectiveness", "Self-Confidence"],
        "feedback": "The story shows high level of resourcefulness but needs more emphasis on group cooperation.",
        "sentiment_score": 0.85 # High positivity
    }

    # FEATURE: Save to Performance Analytics Vault
    performance_record = {
        "user_id": data.user_id,
        "session_type": "TAT",
        "score": analysis_results["sentiment_score"] * 100,
        "details": {
            "story_preview": analysis_results["story_preview"],
            "olqs": analysis_results["olqs"],
            "feedback": analysis_results["feedback"]
        },
        "timestamp": analysis_results["timestamp"]
    }
    save_performance_record(performance_record["user_id"], performance_record["session_type"],
                           performance_record["score"], performance_record["details"],
                           performance_record["timestamp"])
    user_performance_vault.append(performance_record)

    return analysis_results

@app.get("/performance-analytics")
async def get_analytics(user_id: Optional[str] = None):
    records = get_performance_records(user_id=user_id)
    if not records:
        records = [record for record in user_performance_vault if not user_id or record.get("user_id") == user_id]
    return records

@app.get("/get-comprehensive-analysis")
async def get_comprehensive_analysis(user_id: Optional[str] = None, exam_type: Optional[str] = None):
    ssb_types = ["WAT", "SRT", "TAT", "OIR", "PI", "GD"]
    records = []

    if exam_type == "SSB":
        records = get_performance_records(user_id=user_id)
        records = [record for record in records if record.get("session_type") in ssb_types]
    else:
        records = get_performance_records(user_id=user_id, session_type=exam_type)

    if not records:
        if exam_type == "SSB":
            records = [
                record for record in user_performance_vault
                if (not user_id or record.get("user_id") == user_id)
                and record.get("session_type") in ssb_types
            ]
        else:
            records = [
                record for record in user_performance_vault
                if (not user_id or record.get("user_id") == user_id)
                and (not exam_type or record.get("session_type") == exam_type)
            ]

    scores = [record.get("score", 0) for record in records if record.get("score") is not None]
    
    # Transform records to include frontend-expected fields
    transformed_records = []
    for record in records:
        details = record.get("details") or {}
        transformed = {
            "created_at": record.get("timestamp", datetime.now().isoformat()),
            "overall_score": record.get("score", 0) / 10,  # Scale down to 0-10
            "sentiment_score": (record.get("score", 0) / 50) - 1,  # Convert back to -1 to 1 range
            "spontaneity_score": record.get("score", 60),
            "confidence_score": record.get("score", 60),
            "olq_indicators": details.get("olqs", []) or details.get("primary_olq", []) or [],
            "primary_finding": details.get("feedback", ""),
            "detailed_analysis": details.get("feedback", ""),
        }
        transformed_records.append(transformed)
    
    metrics = {
        "total_attempts": len(records),
        "average_score": round(sum(scores) / len(scores), 2) if scores else 0,
        "best_score": round(max(scores), 2) if scores else 0,
        "total_practice_sessions": len(records),
        "improvement_rate": 0,
        "weak_areas": list({record.get("details", {}).get("weak_area") for record in records if record.get("details", {}).get("weak_area")})
    }
    
    return {
        "metrics": [metrics],
        "analyses": transformed_records,
        "recommendations": []
    }

@app.post("/log-performance")
async def log_performance(entry: PerformanceLogRequest):
    if not entry.timestamp:
        entry.timestamp = datetime.now().isoformat()
    record = entry.dict()
    save_performance_record(entry.user_id, entry.session_type, entry.score or 0, 
                           entry.details, entry.timestamp)
    user_performance_vault.append(record)
    return {"status": "success", "record": record}

@app.get("/generate-oir-questions")
async def generate_oir_questions(count: int = 5):
    question_pool = [
        {"id": 1, "question": "You must choose between helping a team member and finishing your own task on time. What do you do?", "options": ["Help the team member first", "Finish your task first", "Ask for help", "Delay both until later"]},
        {"id": 2, "question": "Your unit is behind schedule. Your senior insists on a conservative plan. What do you do?", "options": ["Follow the senior's plan", "Present a faster plan", "Begin a quiet alternative", "Delay decision"]},
        {"id": 3, "question": "A colleague is taking undue credit for your work. How do you react?", "options": ["Speak up calmly", "Confront aggressively", "Let it go", "Document and escalate"]},
        {"id": 4, "question": "A new command order seems unclear. You should...", "options": ["Seek clarification immediately", "Guess and act", "Wait for more details", "Ask a peer"]},
        {"id": 5, "question": "You have to decide quickly between two risky options. You...", "options": ["Choose the safer one", "Choose the one with higher reward", "Consult a teammate", "Avoid decision"]},
        {"id": 6, "question": "Your team members have conflicting opinions during a critical mission. You...", "options": ["Listen to all and make a clear decision", "Side with the most senior person", "Delay until consensus emerges", "Let them decide themselves"]},
        {"id": 7, "question": "You notice a protocol violation by your peer officer. The best course is to...", "options": ["Address it immediately and privately", "Report directly to commanding officer", "Ignore it to maintain harmony", "Warn them once then report"]},
        {"id": 8, "question": "During a stressful operation, a subordinate makes a critical error. You would...", "options": ["Correct it calmly and focus on prevention", "Blame them in front of others", "Wait until later to discuss", "Assume responsibility and move forward"]},
        {"id": 9, "question": "You're offered a high-profile assignment that conflicts with your unit's current priority. You...", "options": ["Discuss with your senior before deciding", "Accept immediately for career growth", "Reject it to stay loyal to your unit", "Ask a peer for advice"]},
        {"id": 10, "question": "A junior officer asks for your mentorship on a sensitive matter. You...", "options": ["Provide honest guidance based on experience", "Tell them to ask their direct superior only", "Refer them to a handbook", "Decline to avoid complications"]},
        {"id": 11, "question": "Resources are scarce and two departments need them urgently. As coordinator, you...", "options": ["Allocate fairly based on mission criticality", "Give more to the senior department", "Split equally regardless of need", "Ask higher authority to decide"]},
        {"id": 12, "question": "You discover a system inefficiency that could improve operations significantly. You...", "options": ["Propose the improvement through proper channels", "Implement it without approval", "Keep it to yourself to avoid blame", "Suggest it informally to peers"]},
    ]
    return {"status": "success", "questions": random.sample(question_pool, min(count, len(question_pool)))}

@app.post("/analyze-oir")
async def analyze_oir(data: OIRAnalysisRequest):
    score = 0
    decisions = []
    olq_indicators = {"leadership": 0, "adaptability": 0, "team_focus": 0, "ethics": 0, "decisiveness": 0}
    
    for answer in data.answers:
        chosen = answer.get("selected_option", "")
        # Leadership & Ethics: Speak up, seek clarity, address issues privately
        if any(kw in chosen.lower() for kw in ["speak", "clarify", "immediately", "private", "honest"]):
            score += 2.5
            olq_indicators["leadership"] += 1
            olq_indicators["ethics"] += 1
            decisions.append("Leadership Initiative")
        # Team Focus: Help, consult, listen
        elif any(kw in chosen.lower() for kw in ["help", "listen", "consult", "fair", "all"]):
            score += 2.2
            olq_indicators["team_focus"] += 1
            decisions.append("Team Synergy")
        # Adaptability & Decisiveness
        elif any(kw in chosen.lower() for kw in ["calmly", "focus", "prevent", "propose"]):
            score += 2.0
            olq_indicators["adaptability"] += 1
            olq_indicators["decisiveness"] += 1
            decisions.append("Adaptive Decision")
        # Caution / Indecisiveness
        elif any(kw in chosen.lower() for kw in ["delay", "avoid", "decline", "ask"]):
            score += 1.0
            decisions.append("Cautious Approach")
        else:
            score += 1.5
            decisions.append("Balanced Response")

    normalized = round((score / (len(data.answers) * 2.5)) * 100, 1)
    normalized = min(100, max(0, normalized))
    
    # Multi-factor feedback
    if normalized >= 85:
        feedback = "Excellent OIR profile: strong leadership, ethics, and team orientation. You demonstrate clear judgment and initiative."
        strength = "Initiative & Ethics"
    elif normalized >= 75:
        feedback = "Very good OIR performance: solid decision-making and team focus. Enhance assertiveness in ethical situations."
        strength = "Team Synergy"
    elif normalized >= 60:
        feedback = "Moderate OIR score: balance decisiveness with team collaboration. Work on clearer leadership voice."
        strength = "Adaptability"
    else:
        feedback = "OIR needs improvement: focus on assertive leadership, ethical clarity, and team-first thinking."
        strength = "Decisiveness"
    
    analysis = {
        "session_type": "OIR",
        "timestamp": datetime.now().isoformat(),
        "score": normalized,
        "analysis": {
            "summary": feedback,
            "strength": strength,
            "recommended_focus": list(sorted(olq_indicators.items(), key=lambda x: -x[1]))[:3] if any(olq_indicators.values()) else ["Leadership clarity", "Team decision-making", "Ethical judgment"],
            "decisions": decisions
        }
    }
    save_performance_record(data.user_id, "OIR", normalized,
                           {"answers": data.answers, "analysis": analysis["analysis"]},
                           analysis["timestamp"])
    user_performance_vault.append({
        "user_id": data.user_id,
        "session_type": "OIR",
        "score": normalized,
        "details": {"answers": data.answers, "analysis": analysis["analysis"]},
        "timestamp": analysis["timestamp"]
    })
    return analysis

@app.post("/simulate-gd")
async def simulate_gd(request: GDRequest):
    participants = [
        {"name": "Leader", "style": "assertive"},
        {"name": "Analyst", "style": "logical"},
        {"name": "Diplomat", "style": "consensus"},
        {"name": "Implementer", "style": "action-focused"}
    ]
    
    topic_responses = {
        "Leadership in challenging field conditions": [
            "Leader: Clear vision and adaptive strategies are essential. We need defined hierarchy but with flexibility for field realities.",
            "Analyst: Data shows adaptive leaders perform better. Key metrics: response time, team cohesion, mission success rate.",
            "Diplomat: I agree, but we must balance decisiveness with team input. Psychological safety increases effectiveness.",
            "Implementer: Right. Let's outline: clear orders, regular feedback loops, and empowered team members. That's proven."
        ],
        "Balancing individual goals with unit mission": [
            "Leader: Unit mission always comes first. Individual aspirations must align with collective objectives.",
            "Analyst: Studies show personal investment in goals improves performance by 40%. Integration is key.",
            "Diplomat: We can achieve both. Career growth paths aligned with unit needs create win-win scenarios.",
            "Implementer: Mentorship programs work well. Senior officers guide juniors toward aligned goals."
        ],
        "Adapting to sudden changes in operational plans": [
            "Leader: Quick decision-making is critical. We need clear contingencies and empowered sub-leaders.",
            "Analyst: Change management frameworks show transition time is minimized with clear communication.",
            "Diplomat: Team morale matters in transitions. Transparent reasoning reduces anxiety and builds trust.",
            "Implementer: Simulation drills and cross-training prepare teams for rapid pivots."
        ],
        "Maintaining morale during extended deployments": [
            "Leader: Maintain purpose and pride in mission. Regular communication about impact is crucial.",
            "Analyst: Research shows morale correlates with autonomy, purpose, and peer support. Address all three.",
            "Diplomat: Personal connection with team members matters. One-on-one check-ins build resilience.",
            "Implementer: Structured recreation, fair duty rotation, and recognition programs are proven morale drivers."
        ],
        "Integrating technology with troop readiness": [
            "Leader: Technology is a force multiplier. Training must be thorough before operational deployment.",
            "Analyst: New tech adoption curves show 60-day training minimum for full competency.",
            "Diplomat: We must balance tech adoption with job security concerns. Change management communication is vital.",
            "Implementer: Phased rollout with peer champions accelerates adoption and identifies issues early."
        ]
    }
    
    topic_key = request.topic if request.topic in topic_responses else list(topic_responses.keys())[0]
    base_responses = topic_responses[topic_key]
    
    responses = list(base_responses)
    if request.user_input:
        sentiment_score = TextBlob(request.user_input).sentiment.polarity
        if "agree" in request.user_input.lower() or sentiment_score > 0.3:
            reactions = ["Diplomat: Excellent point! That builds on what was said.", "Leader: I concur. That's constructive thinking."]
        elif "disagree" in request.user_input.lower() or sentiment_score < -0.2:
            reactions = ["Analyst: Interesting perspective. Let's examine the data.", "Diplomat: Fair point. Let's explore that further."]
        else:
            reactions = ["Leader: Good thinking. Let's develop that.", "Implementer: That's practical. How do we operationalize it?"]
        responses.append(f"You: {request.user_input}")
        responses.append(random.choice(reactions))
    
    # Scoring based on user participation quality
    collab_base = 70
    lead_base = 65
    comm_base = 75
    
    if request.user_input and len(request.user_input) > 20:
        collab_base += 15
        lead_base += 12
        comm_base += 10
    
    return {
        "topic": request.topic,
        "conversation": responses,
        "summary": {
            "collaboration_score": round(collab_base + random.randint(-5, 5), 1),
            "leadership_score": round(lead_base + random.randint(-5, 5), 1),
            "communication_score": round(comm_base + random.randint(-5, 5), 1)
        },
        "feedback": f"GD performance on '{topic_key}': Your engagement level and perspective contributed to the discussion. Focus on adding 2-3 key points and inviting others' views for stronger presence."
    }

@app.get("/generate-piqs")
async def generate_piqs(count: int = 6):
    piqs = [
        "Why do you want to join the armed forces?",
        "Tell us about a time you led a team under pressure.",
        "What are your strengths and weaknesses?",
        "How would you handle a conflict within your squad?",
        "Describe a situation where you had to make a quick decision.",
        "What values are most important to you as an officer?",
        "Give an example of when you showed initiative and took responsibility.",
        "Tell us about a failure and how you overcame it.",
        "How do you stay motivated during difficult times?",
        "Describe your approach to team motivation and discipline.",
        "What is your understanding of service and sacrifice?",
        "How do you balance personal ambitions with team objectives?",
        "Tell us about a time you had to make an ethical decision.",
        "How would you handle a senior officer's unreasonable order?",
        "What preparation have you done for armed forces service?",
        "Describe your academic and sports achievements and their relevance.",
        "How do you manage stress and maintain composure in crisis?",
        "What does patriotism mean to you in practical terms?",
        "Tell us about your family background and its influence on you.",
        "How would you contribute to unit cohesion and camaraderie?"
    ]
    return {"status": "success", "piqs": random.sample(piqs, min(count, len(piqs)))}

@app.post("/analyze-pi")
async def analyze_pi(data: PIAnalysisRequest):
    answer_text = data.answer.lower()
    blob = TextBlob(data.answer)
    sentiment = blob.sentiment.polarity
    
    # Multi-factor scoring
    score = 50  # baseline
    factors = {}
    recommendations = []
    
    # 1. Sentiment & Tone (positive language)
    if sentiment > 0.3:
        score += 15
        factors["Tone"] = "Positive & Confident"
    elif sentiment > 0:
        score += 8
        factors["Tone"] = "Neutral"
    else:
        factors["Tone"] = "Could be more positive"
        recommendations.append("Use more positive, confident language and avoid negative framing.")
    
    # 2. Clarity & Structure
    sentences = [s.strip() for s in data.answer.split(".") if s.strip()]
    if 4 <= len(sentences) <= 8:
        score += 12
        factors["Structure"] = "Well-organized"
    elif len(sentences) >= 9:
        factors["Structure"] = "Good, but consider being more concise"
        recommendations.append("Structure your answer in 4-6 clear, focused sentences for maximum impact.")
    else:
        factors["Structure"] = "Too brief"
        recommendations.append("Expand your answer with examples and details. Aim for 4-6 sentences.")
    
    # 3. Service & Leadership Keywords
    service_keywords = ["serve", "country", "leadership", "responsibility", "team", "mission", "duty", "sacrifice", "commitment"]
    service_count = sum(1 for kw in service_keywords if kw in answer_text)
    if service_count >= 4:
        score += 15
        factors["Values"] = "Strong service orientation"
    elif service_count >= 2:
        score += 8
        factors["Values"] = "Adequate values articulation"
    else:
        factors["Values"] = "Limited service focus"
        recommendations.append("Emphasize service to nation, leadership values, team commitment, and personal duty.")
    
    # 4. Personal Examples (length indicates detail)
    if len(data.answer.split()) > 60:
        score += 10
        factors["Examples"] = "Rich with examples"
    elif len(data.answer.split()) >= 40:
        score += 5
        factors["Examples"] = "Has some specifics"
    else:
        factors["Examples"] = "Needs more concrete examples"
        recommendations.append("Include specific personal examples or anecdotes to illustrate your points.")
    
    # Normalize score
    score = round(min(100, max(0, score)), 1)
    
    # Tier-based feedback
    if score >= 85:
        primary_feedback = "Excellent answer: Clear structure, strong values, and confident delivery. You demonstrate readiness for officer training."
    elif score >= 75:
        primary_feedback = "Very good answer: Good values and structure. Minor enhancements in examples or conciseness would strengthen it further."
    elif score >= 60:
        primary_feedback = "Moderate answer: The core is there, but needs sharper focus on service values and concrete examples. Work on structured delivery."
    else:
        primary_feedback = "Needs improvement: Focus on clarity, positive tone, and articulating your service motivation with specific examples."
    
    if not recommendations:
        recommendations = [
            "Maintain this confident, structured approach in interviews.",
            "Your values-driven perspective will resonate with interviewers.",
            "Practice concise, impactful delivery under time pressure."
        ]
    
    result = {
        "session_type": "PI",
        "timestamp": datetime.now().isoformat(),
        "question": data.question,
        "answer": data.answer,
        "score": score,
        "feedback": primary_feedback,
        "factors": factors,
        "recommendations": recommendations
    }
    save_performance_record(data.user_id, "PI", score,
                           {"question": data.question, "answer": data.answer, 
                            "feedback": primary_feedback, "factors": factors},
                           result["timestamp"])
    user_performance_vault.append({
        "user_id": data.user_id,
        "session_type": "PI",
        "score": score,
        "details": {"question": data.question, "answer": data.answer, "feedback": primary_feedback, "factors": factors},
        "timestamp": result["timestamp"]
    })
    return result

# --- ADD THIS: Root route for easy debugging ---
@app.get("/")
async def root():
    return {"message": "SSB Psych Engine is Online"}

@app.get("/user-test-history")
async def get_user_test_history(user_id: str, session_type: Optional[str] = None):
    """Get all test history for a specific user, optionally filtered by session type"""
    records = get_performance_records(user_id=user_id, session_type=session_type)
    return {
        "status": "success",
        "user_id": user_id,
        "session_type": session_type,
        "records": records,
        "total_count": len(records)
    }

@app.get("/user-performance-summary")
async def get_user_performance_summary(user_id: str):
    """Get performance summary statistics for a user"""
    records = get_performance_records(user_id=user_id)
    
    if not records:
        return {
            "status": "success",
            "user_id": user_id,
            "total_sessions": 0,
            "sessions_by_type": {},
            "average_scores": {},
            "best_scores": {},
            "recent_sessions": []
        }
    
    sessions_by_type = {}
    scores_by_type = {}
    best_scores_by_type = {}
    
    for record in records:
        session_type = record.get("session_type", "Unknown")
        score = record.get("score", 0)
        
        if session_type not in sessions_by_type:
            sessions_by_type[session_type] = 0
            scores_by_type[session_type] = []
            best_scores_by_type[session_type] = score
        
        sessions_by_type[session_type] += 1
        scores_by_type[session_type].append(score)
        best_scores_by_type[session_type] = max(best_scores_by_type[session_type], score)
    
    average_scores = {k: round(sum(v) / len(v), 2) for k, v in scores_by_type.items()}
    
    return {
        "status": "success",
        "user_id": user_id,
        "total_sessions": len(records),
        "sessions_by_type": sessions_by_type,
        "average_scores": average_scores,
        "best_scores": best_scores_by_type,
        "recent_sessions": records[:5]
    }


# --- 6. SERVER STARTUP ---
if __name__ == "__main__":
    # Change host to 127.0.0.1 to match your frontend fetch exactly
    # Enable reload for development so changes to this file take effect automatically.
    # Use import string format for reload to work properly
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
