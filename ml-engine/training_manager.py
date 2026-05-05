"""
AI Training & Testing Module for Defence Exam Preparation
Handles ML model training, evaluation, and continuous improvement
"""

import pandas as pd
import numpy as np
from pathlib import Path
import json
from datetime import datetime
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import pickle

class TrainingDataManager:
    """Manages training data collection and preparation"""
    
    def __init__(self, data_dir: str = "./training_data"):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(exist_ok=True)
        
    def collect_training_sample(self, 
                                user_id: str,
                                response_text: str,
                                expected_olqs: list,
                                actual_ai_output: dict,
                                feedback_score: float = None):
        """Collect a training sample from user interactions"""
        
        sample = {
            "timestamp": datetime.now().isoformat(),
            "user_id": user_id,
            "response_text": response_text,
            "expected_olqs": expected_olqs,
            "ai_output": actual_ai_output,
            "feedback_score": feedback_score,  # User rating 1-10
            "is_quality_sample": feedback_score >= 7 if feedback_score else True
        }
        
        # Save sample
        sample_file = self.data_dir / f"sample_{user_id}_{int(datetime.now().timestamp())}.json"
        with open(sample_file, 'w') as f:
            json.dump(sample, f, indent=2)
        
        return sample_file

    def aggregate_training_data(self) -> pd.DataFrame:
        """Load all training samples and create a comprehensive dataset"""
        
        samples = []
        for sample_file in self.data_dir.glob("sample_*.json"):
            try:
                with open(sample_file, 'r') as f:
                    sample = json.load(f)
                    samples.append(sample)
            except Exception as e:
                print(f"Error loading {sample_file}: {e}")
        
        if not samples:
            return pd.DataFrame()
        
        df = pd.DataFrame(samples)
        return df

    def prepare_training_features(self, df: pd.DataFrame) -> tuple:
        """Prepare features and labels for model training"""
        
        if df.empty:
            return None, None
        
        # Extract features from responses
        X = []
        y = []
        
        for idx, row in df.iterrows():
            # Text features (would expand with more sophisticated NLP)
            text_length = len(row['response_text'].split())
            word_complexity = np.mean([len(word) for word in row['response_text'].split()])
            
            # OLQ encoding (one-hot)
            olq_features = self._encode_olqs(row['expected_olqs'])
            
            # Combine features
            features = [text_length, word_complexity] + olq_features
            X.append(features)
            
            # Label (quality assessment)
            y.append(1 if row['is_quality_sample'] else 0)
        
        return np.array(X), np.array(y)

    def _encode_olqs(self, olqs: list, all_olqs: list = None) -> list:
        """One-hot encode OLQs"""
        if all_olqs is None:
            all_olqs = [
                "Leadership", "Communication", "Decisiveness", "Initiative",
                "Social Adaptability", "Team Spirit", "Emotional Stability",
                "Integrity", "Organized", "Presence"
            ]
        
        encoding = [1 if olq in olqs else 0 for olq in all_olqs]
        return encoding


class ModelEvaluator:
    """Evaluates AI model performance"""
    
    def __init__(self, model_path: str = None):
        self.model_path = model_path
        self.model = None
        if model_path:
            self.load_model(model_path)
    
    def evaluate_batch(self, X_test: np.ndarray, y_test: np.ndarray) -> dict:
        """Evaluate model on a batch of test data"""
        
        if self.model is None:
            raise ValueError("No model loaded")
        
        y_pred = self.model.predict(X_test)
        
        metrics = {
            "accuracy": accuracy_score(y_test, y_pred),
            "precision": precision_score(y_test, y_pred, average='weighted', zero_division=0),
            "recall": recall_score(y_test, y_pred, average='weighted', zero_division=0),
            "f1": f1_score(y_test, y_pred, average='weighted', zero_division=0)
        }
        
        return metrics
    
    def load_model(self, model_path: str):
        """Load a trained model"""
        try:
            with open(model_path, 'rb') as f:
                self.model = pickle.load(f)
        except Exception as e:
            print(f"Error loading model: {e}")
    
    def save_model(self, model, output_path: str):
        """Save a trained model"""
        with open(output_path, 'wb') as f:
            pickle.dump(model, f)


class ContinuousLearning:
    """Implements continuous learning from user feedback"""
    
    def __init__(self):
        self.data_manager = TrainingDataManager()
        self.evaluator = ModelEvaluator()
        self.improvement_metrics = []
    
    def update_from_feedback(self, user_feedback: dict):
        """Update training data based on user feedback"""
        
        sample = self.data_manager.collect_training_sample(
            user_id=user_feedback['user_id'],
            response_text=user_feedback['response_text'],
            expected_olqs=user_feedback['olqs'],
            actual_ai_output=user_feedback['ai_analysis'],
            feedback_score=user_feedback.get('feedback_rating', 5)
        )
        
        return sample
    
    def generate_improvement_insights(self) -> dict:
        """Analyze training data to identify improvement areas"""
        
        df = self.data_manager.aggregate_training_data()
        
        if df.empty:
            return {"status": "insufficient_data"}
        
        insights = {
            "total_samples": len(df),
            "quality_samples_ratio": (df['is_quality_sample'].sum() / len(df)) * 100,
            "average_feedback": df['feedback_score'].mean() if 'feedback_score' in df else None,
            "most_common_olqs": self._get_top_olqs(df),
            "improvement_areas": self._identify_improvements(df),
            "model_readiness": len(df) >= 100  # Need minimum data for training
        }
        
        return insights
    
    def _get_top_olqs(self, df: pd.DataFrame) -> dict:
        """Get most frequently detected OLQs"""
        olq_counts = {}
        for olqs in df['expected_olqs']:
            for olq in olqs:
                olq_counts[olq] = olq_counts.get(olq, 0) + 1
        
        return sorted(olq_counts.items(), key=lambda x: x[1], reverse=True)[:5]
    
    def _identify_improvements(self, df: pd.DataFrame) -> list:
        """Identify areas where AI needs improvement"""
        
        low_quality = df[~df['is_quality_sample']]
        
        if len(low_quality) == 0:
            return []
        
        # Analyze patterns in low-quality predictions
        improvements = []
        
        # Check for specific OLQ patterns
        for olqs in low_quality['expected_olqs']:
            for olq in olqs:
                count = low_quality['expected_olqs'].apply(lambda x: olq in x).sum()
                if count > len(low_quality) * 0.5:  # Present in >50% of low-quality samples
                    improvements.append({
                        "area": olq,
                        "type": "olq_detection",
                        "frequency": count / len(low_quality)
                    })
        
        return improvements


# Example usage function
def run_training_cycle():
    """Run a complete training evaluation cycle"""
    
    print("🚀 Starting AI Training & Evaluation Cycle")
    
    # Initialize managers
    data_manager = TrainingDataManager()
    continuous_learning = ContinuousLearning()
    
    # Collect and aggregate data
    print("📊 Aggregating training data...")
    df = data_manager.aggregate_training_data()
    print(f"   Total samples collected: {len(df)}")
    
    if not df.empty:
        # Prepare features
        print("🔧 Preparing features...")
        X, y = data_manager.prepare_training_features(df)
        
        # Generate insights
        print("💡 Generating improvement insights...")
        insights = continuous_learning.generate_improvement_insights()
        
        print("\n📈 Insights Summary:")
        print(f"   Quality Sample Ratio: {insights['quality_samples_ratio']:.1f}%")
        print(f"   Top OLQs: {insights['most_common_olqs']}")
        print(f"   Model Ready: {insights['model_readiness']}")
        
        if insights['improvement_areas']:
            print("\n🎯 Areas for Improvement:")
            for area in insights['improvement_areas']:
                print(f"   - {area['area']}: {area['frequency']:.1%}")
    else:
        print("⚠️ No training data collected yet")
    
    print("\n✅ Training cycle complete")


if __name__ == "__main__":
    run_training_cycle()
