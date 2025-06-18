import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score

# Load features
df = pd.read_csv("data/club_wc_features.csv")

# Filter out draws (winner == 0.5)
df = df[df["winner"] != 0.5]


# Define features and label
X = df[["home_rank", "away_rank", "rank_diff", "stage_encoded"]]
y = df["winner"].astype(int)

# Train/test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train model
model = LogisticRegression()
model.fit(X_train, y_train)

# Evaluate
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
print(f"✅ Model trained with accuracy: {accuracy:.2f}")


# Function to use in app.py
def train_model():
    return model

def predict_match(model, team1_elo, team2_elo):
    # Create feature vector based on rank
    rank_diff = team1_elo - team2_elo
    stage_encoded = 1  # e.g., group stage or default
    X_new = pd.DataFrame([{
        "home_rank": team1_elo,
        "away_rank": team2_elo,
        "rank_diff": rank_diff,
        "stage_encoded": stage_encoded
    }])
    
    pred = model.predict(X_new)[0]
    return "team1" if pred == 1 else "team2"