"""
wc2026_model.py
===============
Refined ML model for FIFA World Cup 2026 match predictions.
Uses GradientBoostingClassifier trained on historical WC data (2010-2022).

Features: rank, rank_diff, stage, confederation, historical WC titles.
Supports 3-class output: home win / draw / away win.
Provides probability distributions and predicted scorelines.

Public API:
  train_wc2026_model()  -> trained model object
  predict_wc_match(model, team1, team2, stage)  -> prediction dict
  predict_wc_match_with_variance(model, team1, team2, stage, seed)  -> same with seeded randomness
"""

import os
import math
import random
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "wc2026_historical_matches.csv")

CONF_ENCODING = {
    "UEFA": 1, "CONMEBOL": 2, "CONCACAF": 3,
    "CAF": 4, "AFC": 5, "OFC": 6,
}

WC_TITLES = {
    "Brazil": 5, "Germany": 4, "Italy": 4, "Argentina": 3,
    "France": 2, "Uruguay": 2, "England": 1, "Spain": 1,
}

STAGE_ENCODING = {
    "Group": 1, "R32": 2, "R16": 3, "QF": 4, "SF": 5, "3rd": 5, "Final": 6,
}


def _encode_result(home_score, away_score):
    if home_score > away_score:
        return 1
    if home_score < away_score:
        return 2
    return 0


def _build_features(df):
    """Engineer features from raw match data."""
    df = df.copy()
    df["rank_diff"] = df["home_rank"] - df["away_rank"]
    df["stage_encoded"] = df["stage"].map(STAGE_ENCODING).fillna(1).astype(int)
    df["home_conf"] = df["home_confederation"].map(CONF_ENCODING).fillna(6).astype(int)
    df["away_conf"] = df["away_confederation"].map(CONF_ENCODING).fillna(6).astype(int)
    df["home_wc_wins"] = df["home_team"].map(WC_TITLES).fillna(0).astype(int)
    df["away_wc_wins"] = df["away_team"].map(WC_TITLES).fillna(0).astype(int)
    df["result"] = df.apply(lambda r: _encode_result(r["home_score"], r["away_score"]), axis=1)
    return df


FEATURE_COLS = [
    "home_rank", "away_rank", "rank_diff", "stage_encoded",
    "home_conf", "away_conf", "home_wc_wins", "away_wc_wins",
]


def train_wc2026_model():
    """Load historical CSV, engineer features, train GradientBoosting, return model."""
    df = pd.read_csv(DATA_PATH)
    df = _build_features(df)

    X = df[FEATURE_COLS]
    y = df["result"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    model = GradientBoostingClassifier(
        n_estimators=200,
        max_depth=4,
        learning_rate=0.1,
        random_state=42,
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"WC2026 model trained — accuracy: {acc:.2%} on {len(y_test)} test samples")
    return model


def _make_feature_row(team1, team2, stage_code):
    """Build a single-row DataFrame for prediction."""
    rank_diff = team1["rank"] - team2["rank"]
    return pd.DataFrame([{
        "home_rank": team1["rank"],
        "away_rank": team2["rank"],
        "rank_diff": rank_diff,
        "stage_encoded": stage_code,
        "home_conf": CONF_ENCODING.get(team1.get("confederation", ""), 6),
        "away_conf": CONF_ENCODING.get(team2.get("confederation", ""), 6),
        "home_wc_wins": team1.get("wc_wins", 0),
        "away_wc_wins": team2.get("wc_wins", 0),
    }])


def _poisson_score(strength, rng):
    """Sample a goal count from Poisson distribution given expected goals."""
    lam = max(0.3, min(strength, 4.0))
    return int(rng.poisson(lam))


def _predict_score(probs, rank1, rank2, rng):
    """
    Generate a plausible scoreline based on predicted probabilities and rank gap.
    Uses Poisson sampling anchored on rank-based expected goals.
    """
    rank_gap = rank2 - rank1
    base_goals_1 = 1.2 + max(-1.0, min(1.0, rank_gap / 30.0))
    base_goals_2 = 1.2 - max(-1.0, min(1.0, rank_gap / 30.0))

    base_goals_1 *= (0.6 + probs[1] * 0.8)
    base_goals_2 *= (0.6 + probs[2] * 0.8)

    g1 = _poisson_score(base_goals_1, rng)
    g2 = _poisson_score(base_goals_2, rng)

    predicted_result = max(probs, key=probs.get)
    if predicted_result == 1 and g1 <= g2:
        g1 = g2 + 1
    elif predicted_result == 2 and g2 <= g1:
        g2 = g1 + 1
    elif predicted_result == 0 and g1 != g2:
        g2 = g1

    return [g1, g2]


def predict_wc_match(model, team1_data, team2_data, stage, seed=None):
    """
    Predict a single match.

    Parameters:
        model: trained GradientBoostingClassifier
        team1_data: dict with keys: rank, confederation, wc_wins, name
        team2_data: same
        stage: int (1=group .. 6=final) or str ("Group","R16",...)
        seed: optional int for reproducibility

    Returns dict:
        {
            "result": "team1" | "team2" | "draw",
            "probabilities": {"team1": float, "draw": float, "team2": float},
            "predicted_score": [int, int],
            "team1": str,
            "team2": str,
            "winner": str or None (None for draw)
        }
    """
    if isinstance(stage, str):
        stage_code = STAGE_ENCODING.get(stage, 1)
    else:
        stage_code = stage

    X = _make_feature_row(team1_data, team2_data, stage_code)
    proba = model.predict_proba(X)[0]

    class_map = {c: i for i, c in enumerate(model.classes_)}
    prob_draw = float(proba[class_map.get(0, 0)]) if 0 in class_map else 0.0
    prob_t1 = float(proba[class_map.get(1, 0)]) if 1 in class_map else 0.0
    prob_t2 = float(proba[class_map.get(2, 0)]) if 2 in class_map else 0.0

    probs = {1: prob_t1, 0: prob_draw, 2: prob_t2}
    predicted_result_code = max(probs, key=probs.get)

    rng = np.random.default_rng(seed)
    score = _predict_score(probs, team1_data["rank"], team2_data["rank"], rng)

    if predicted_result_code == 1:
        result_str = "team1"
        winner = team1_data.get("name", "Team 1")
    elif predicted_result_code == 2:
        result_str = "team2"
        winner = team2_data.get("name", "Team 2")
    else:
        result_str = "draw"
        winner = None

    return {
        "result": result_str,
        "probabilities": {
            "team1": round(prob_t1, 3),
            "draw": round(prob_draw, 3),
            "team2": round(prob_t2, 3),
        },
        "predicted_score": score,
        "team1": team1_data.get("name", "Team 1"),
        "team2": team2_data.get("name", "Team 2"),
        "winner": winner,
    }


def predict_wc_match_with_variance(model, team1_data, team2_data, stage, seed):
    """
    Same as predict_wc_match but injects controlled randomness so "Regenerate"
    produces statistically-probable alternative outcomes.

    The seed creates a deterministic RNG that jitters the probabilities before
    selecting the outcome, so the same seed always produces the same result,
    but different seeds may flip close matches.
    """
    if isinstance(stage, str):
        stage_code = STAGE_ENCODING.get(stage, 1)
    else:
        stage_code = stage

    X = _make_feature_row(team1_data, team2_data, stage_code)
    proba = model.predict_proba(X)[0]

    class_map = {c: i for i, c in enumerate(model.classes_)}
    prob_draw = float(proba[class_map.get(0, 0)]) if 0 in class_map else 0.0
    prob_t1 = float(proba[class_map.get(1, 0)]) if 1 in class_map else 0.0
    prob_t2 = float(proba[class_map.get(2, 0)]) if 2 in class_map else 0.0

    rng = np.random.default_rng(seed)

    jitter_t1 = prob_t1 + rng.normal(0, 0.08)
    jitter_draw = prob_draw + rng.normal(0, 0.06)
    jitter_t2 = prob_t2 + rng.normal(0, 0.08)

    total = max(jitter_t1, 0.01) + max(jitter_draw, 0.01) + max(jitter_t2, 0.01)
    jitter_t1 = max(jitter_t1, 0.01) / total
    jitter_draw = max(jitter_draw, 0.01) / total
    jitter_t2 = max(jitter_t2, 0.01) / total

    probs = {1: jitter_t1, 0: jitter_draw, 2: jitter_t2}
    predicted_result_code = max(probs, key=probs.get)

    score = _predict_score(probs, team1_data["rank"], team2_data["rank"], rng)

    if predicted_result_code == 1:
        result_str = "team1"
        winner = team1_data.get("name", "Team 1")
    elif predicted_result_code == 2:
        result_str = "team2"
        winner = team2_data.get("name", "Team 2")
    else:
        result_str = "draw"
        winner = None

    return {
        "result": result_str,
        "probabilities": {
            "team1": round(prob_t1, 3),
            "draw": round(prob_draw, 3),
            "team2": round(prob_t2, 3),
        },
        "predicted_score": score,
        "team1": team1_data.get("name", "Team 1"),
        "team2": team2_data.get("name", "Team 2"),
        "winner": winner,
    }


if __name__ == "__main__":
    m = train_wc2026_model()
    result = predict_wc_match(
        m,
        {"rank": 3, "confederation": "CONMEBOL", "wc_wins": 3, "name": "Argentina"},
        {"rank": 7, "confederation": "UEFA", "wc_wins": 2, "name": "France"},
        1,
    )
    print(f"\nSample prediction: Argentina vs France (group stage)")
    print(f"  Result: {result['result']}")
    print(f"  Probabilities: {result['probabilities']}")
    print(f"  Predicted score: {result['predicted_score']}")
    print(f"  Winner: {result['winner']}")

    result2 = predict_wc_match_with_variance(
        m,
        {"rank": 3, "confederation": "CONMEBOL", "wc_wins": 3, "name": "Argentina"},
        {"rank": 7, "confederation": "UEFA", "wc_wins": 2, "name": "France"},
        1,
        seed=42,
    )
    print(f"\nWith variance (seed=42):")
    print(f"  Result: {result2['result']}, Score: {result2['predicted_score']}")
