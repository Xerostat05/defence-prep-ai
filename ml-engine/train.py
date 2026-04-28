import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier  # Improved for diversity
from sklearn.metrics import classification_report, accuracy_score
import joblib

# 1. Load the Data
# Ensure dataset.csv is in the same folder
df = pd.read_csv("dataset.csv")

# 2. Split Data (80% Training, 20% Testing)
X_train, X_test, y_train, y_test = train_test_split(
    df['text'], 
    df['label'], # Matches your new column name
    test_size=0.20, 
    random_state=42,
    stratify=df['label'] # Ensures all OLQs are represented in both sets
)

# 3. Text Vectorization (TF-IDF)
# Use ngram_range=(1, 2) to catch phrases like "stood ground" or "blood donation"
vectorizer = TfidfVectorizer(stop_words='english', ngram_range=(1, 2))
X_train_vec = vectorizer.fit_transform(X_train)
X_test_vec = vectorizer.transform(X_test)

# 4. Model Selection & Training
# Random Forest provides better "variety" in predictions
model = RandomForestClassifier(n_estimators=200, random_state=42)
model.fit(X_train_vec, y_train)

# 5. Testing & Evaluation
y_pred = model.predict(X_test_vec)
print(f"Model Accuracy: {accuracy_score(y_test, y_pred) * 100:.2f}%")
print("\nClassification Report:\n")
print(classification_report(y_test, y_pred))

# 6. Save the model and vectorizer
joblib.dump(model, 'olq_classifier.pkl')
joblib.dump(vectorizer, 'tfidf_vectorizer.pkl')

print("✅ Model and Vectorizer saved successfully with expanded OLQ logic!")