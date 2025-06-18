import random
from model import train_model, predict_match
import pandas as pd
import json

model = train_model()

# Load teams & group structure
with open("data/club_wc_2025_groups.json", "r") as f:
    group_data = json.load(f)

def predict_group_winners(group_name, teams, strategy="ml"):
    results = []
    for i in range(len(teams)):
        for j in range(i + 1, len(teams)):
            t1 = teams[i]
            t2 = teams[j]

            if strategy == "random":
                winner = random.choice([t1, t2])
            else:
                team1_elo = t1["rank"]
                team2_elo = t2["rank"]
                winner = t1 if predict_match(model, team1_elo, team2_elo) == "team1" else t2

            results.append(winner)

    # Count wins
    win_counts = {t["name"]: 0 for t in teams}
    for win in results:
        win_counts[win["name"]] += 1

    # Return top 2
    sorted_teams = sorted(teams, key=lambda x: win_counts[x["name"]], reverse=True)
    return sorted_teams[:2]

def build_knockout_rounds(top_teams):
    r16 = []
    for i in range(0, 16, 2):
        r16.append((top_teams[i], top_teams[i + 1]))
    return r16

def simulate_tournament(favorite_team=None, strategy="ml"):
    top_teams = []
    for group_name, teams in group_data.items():
        winners = predict_group_winners(group_name, teams, strategy)
        top_teams.extend(winners)

    rounds = {"R16": [], "QF": [], "SF": [], "Final": []}
    matchups = build_knockout_rounds(top_teams)

    current_round = "R16"
    while len(matchups) > 1:
        next_round = []
        for team1, team2 in matchups:
            winner = team1 if predict_match(model, team1["rank"], team2["rank"]) == "team1" else team2
            rounds[current_round].append({"team1": team1["name"], "team2": team2["name"], "winner": winner["name"]})
            next_round.append(winner)

        matchups = [(next_round[i], next_round[i + 1]) for i in range(0, len(next_round), 2)]
        current_round = "QF" if current_round == "R16" else "SF" if current_round == "QF" else "Final"

    final_match = matchups[0]
    final_winner = final_match[0] if predict_match(model, final_match[0]["rank"], final_match[1]["rank"]) == "team1" else final_match[1]
    rounds["Final"].append({"team1": final_match[0]["name"], "team2": final_match[1]["name"], "winner": final_winner["name"]})

    # Track favorite progress
    knockout_path = []
    if favorite_team:
        for rnd in ["R16", "QF", "SF", "Final"]:
            for match in rounds[rnd]:
                if favorite_team in [match["team1"], match["team2"]]:
                    knockout_path.append({"round": rnd, **match})

    return final_winner["name"], rounds, knockout_path