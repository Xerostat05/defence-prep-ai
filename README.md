# Olive Wings — AI-Powered Defence Exam Preparation

> B.Tech Major Project | Final Year Capstone | NDA / CDS / AFCAT / CAPF / SSB Preparation

## Overview

**Olive Wings** is a modern defence exam preparation platform built as a B.Tech final year major project. It combines a polished React frontend, Supabase backend, AI analysis services, and an interactive training experience to help aspirants prepare smarter.

The platform is designed for:
- **SSB aspirants** preparing TAT, WAT, and SRT
- **Defence exam candidates** preparing for NDA, CDS, AFCAT, CAPF
- **Students** who want adaptive study planning and AI-powered feedback

## What Makes This Project Special

- **AI-driven evaluation** of written responses and practice sessions
- **Adaptive study plans** generated from performance data
- **Interactive practice modules** for TAT, WAT, SRT, SSB and mock tests
- **Detailed analytics and progress tracking** on the dashboard
- **Personalized improvement recommendations** for every learner

## Core AI Features

### 1. Comprehensive Response Analysis
- Evaluates user responses for **leadership**, **initiative**, **communication**, and other OLQs
- Provides **sentiment**, **spontaneity**, and **confidence** scoring
- Generates **detailed written feedback** and actionable recommendations

### 2. Adaptive Study Plan Generator
- Builds personalized study plans based on exam type, weak areas, and available hours
- Includes weekly schedules, practice questions, study resources, and milestone targets

### 3. Performance Prediction
- Calculates readiness score and success probability
- Tracks improvement trends and practice consistency

### 4. Personality & Interview Coaching
- Generates personality profiles from practice inputs
- Produces interview coaching prompts and guidance for SSB/PI

### 5. AI Study Assistant and Chat Support
- Integrated support for learners via AI-powered chat and mentor flows
- Leverages Supabase edge functions for contextual assistance

## Interactive Features

### Practice Modules
- **TAT Practice**: Real-time image prompts, story input, timer, and AI story analysis
- **WAT Practice**: Rapid word associations with instant evaluation
- **SRT Practice**: Situational response practice with behavioral scoring
- **SSB Practice**: Structured SSB training with performance insights
- **Mock Tests**: Full exam simulations with section analytics

### Learning Tools
- **Flashcards**: AI-generated flashcards for targeted revision
- **Study Planner**: Personalized planner for daily and weekly study goals
- **Dashboard**: Visual progress, streaks, focus areas, and readiness metrics
- **Interactive Charts**: OLQ radar, trend graphs, and performance cards

## Architecture

### Frontend
- **React & TypeScript**
- **Vite** for a fast development experience
- **Tailwind CSS** and **shadcn-ui** for polished UI components
- **framer-motion** for animations and interactivity
- **react-router-dom** for single-page navigation

### Backend
- **Supabase** for authentication, database, and edge functions
- **Edge Functions** handle AI workflows and analytics requests
- **Postgres** stores practice sessions, AI analysis, recommendations, and metrics

### Machine Learning Layer
- **Python ML engine** under `ml-engine/`
- Contains training utilities and an API service for advanced model workflows
- Supports continuous learning, dataset management, and experimental analytics

## Key Project Modules

### Frontend Pages
- `src/pages/Dashboard.tsx` — User progress and AI insights
- `src/pages/Analysis.tsx` — Historical trends and recommendation review
- `src/pages/TATPractice.tsx` — TAT training and AI story evaluation
- `src/pages/WATPractice.tsx` — Word association practice
- `src/pages/SRTPractice.tsx` — Situational response practice
- `src/pages/SSBPractice.tsx` — SSB preparation toolkit
- `src/pages/MockTest.tsx` — Mock exam generation and evaluation
- `src/pages/StudyPlanner.tsx` — Adaptive plan creation
- `src/pages/Flashcards.tsx` — AI-driven revision cards

### Backend Functions
- `supabase/functions/comprehensive-analysis/index.ts`
- `supabase/functions/generate-adaptive-study-plan/index.ts`
- `supabase/functions/get-comprehensive-analysis/index.ts`
- `supabase/functions/personality-analysis/index.ts`
- `supabase/functions/performance-prediction/index.ts`
- `supabase/functions/interview-coaching/index.ts`
- `supabase/functions/generate-flashcards/index.ts`
- `supabase/functions/generate-mock-test/index.ts`
- `supabase/functions/ai-agent/index.ts`
- `supabase/functions/chat/index.ts`

### Database and Analytics
- Custom Supabase migrations for AI analytics schema
- Tables for **practice_sessions**, **ai_analysis_results**, **performance_metrics**, **improvement_recommendations**, **question_quality_scores**, **user_progress_summary**, **study_material_quality**, and **training_data_samples**
- Real-time updates and dashboard aggregation

## Why It Works as a B.Tech Final Year Project

This repository demonstrates a strong academic and practical implementation by combining:
- AI-based evaluation and prediction
- Real-time interactive training systems
- Performance analytics for learning improvement
- Full-stack integration with cloud services
- Modern web architecture with React, TypeScript, Supabase, and Python

## Setup and Run Locally

```bash
git clone <YOUR_REPO_URL>
cd defence-prep-ai
npm install
npm run dev
```

To run the Python ML service:

```bash
cd ml-engine
npm run backend
```

> Note: Configure Supabase and any environment variables required by the backend and AI functions before running production features.

## Project Structure at a Glance

- `src/` — React frontend, UI components, pages, and app logic
- `supabase/functions/` — AI and analytics edge functions
- `supabase/migrations/` — database schema and analytics tables
- `ml-engine/` — machine learning training and API code
- `public/` — static assets and simulator content

## Technologies Used

- React
- TypeScript
- Vite
- Tailwind CSS
- Supabase
- Framer Motion
- Radix UI / shadcn-ui
- Python (ML backend)
- Recharts
- Lucide icons
- Axios
- React Query

## Next Steps and Expansion Ideas

- Add **video/voice analysis** for interview practice
- Integrate **larger ML models** for richer feedback
- Add **user role-based dashboards** for mentors and teachers
- Expand exam coverage to additional defence and competitive exams

---

## Notes

This README is intended for use as a GitHub project overview and academic project report. It highlights the AI-first features and interactive learning workflows that make this project suitable as a B.Tech major project.
