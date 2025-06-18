import pandas as pd
import os

# Load data
matches = pd.read_csv("data/club_world_cup_raw.csv")
ranks = pd.read_csv("data/fifa_ranks.csv")

# Merge FIFA rank to both teams
matches = matches.merge(ranks, left_on='home_team', right_on='team', how='left') \
                 .rename(columns={'rank': 'home_rank'}).drop(columns='team')

matches = matches.merge(ranks, left_on='away_team', right_on='team', how='left') \
                 .rename(columns={'rank': 'away_rank'}).drop(columns='team')

# Compute features
matches["goal_diff"] = matches["home_score"] - matches["away_score"]
matches["rank_diff"] = matches["home_rank"] - matches["away_rank"]

# Encode winner (1 = home win, 0 = away win)
matches["winner"] = matches.apply(lambda row: 1 if row["goal_diff"] > 0 else (0 if row["goal_diff"] < 0 else 0.5), axis=1)

# Optionally encode stages numerically (ordinal)
stage_map = {
    "First Round": 1,
    "Second Round": 2,
    "Semifinal": 3,
    "Third Place": 4,
    "Final": 5
}
matches["stage_encoded"] = matches["stage"].map(stage_map)

# Select features for ML
final_df = matches[[
    "home_team", "away_team", "home_rank", "away_rank",
    "rank_diff", "goal_diff", "stage_encoded", "winner"
]]

# Save output
os.makedirs("data", exist_ok=True)
final_df.to_csv("data/club_wc_features.csv", index=False)
print(f"✅ club_wc_features.csv generated with shape: {final_df.shape}")