import random
from model import train_model, predict_match
import pandas as pd
import json

model = train_model()

# Load team and group structure
with open("data/club_wc_2025_groups.json", "r") as f:
    group_data = json.load(f)

# Define realistic knockout bracket mapping
group_knockout_map = [
    ("A", 1, "B", 2),
    ("B", 1, "A", 2),
    ("C", 1, "D", 2),
    ("D", 1, "C", 2),
    ("E", 1, "F", 2),
    ("F", 1, "E", 2),
    ("G", 1, "H", 2),
    ("H", 1, "G", 2),
]

def simulate_group_stage(strategy="ml"):
    group_results = {}
    advancing_teams = {}

    for full_group_name, teams in group_data.items():
        group_key = full_group_name.replace("Group ", "")  # Normalize: "Group A" -> "A"

        table = {t["name"]: {"points": 0, "W": 0, "D": 0, "L": 0, "rank": t["rank"]} for t in teams}
        matches = []

        for i in range(len(teams)):
            for j in range(i + 1, len(teams)):
                t1, t2 = teams[i], teams[j]

                if strategy == "random":
                    outcome = random.choice(["win", "draw", "loss"])
                else:
                    result = predict_match(model, t1["rank"], t2["rank"])
                    outcome = "win" if result == "team1" else "loss"

                    # 20% chance to make it a draw
                    if random.random() < 0.2:
                        outcome = "draw"

                if outcome == "draw":
                    table[t1["name"]]["points"] += 1
                    table[t2["name"]]["points"] += 1
                    table[t1["name"]]["D"] += 1
                    table[t2["name"]]["D"] += 1
                elif outcome == "win":
                    table[t1["name"]]["points"] += 3
                    table[t1["name"]]["W"] += 1
                    table[t2["name"]]["L"] += 1
                else:
                    table[t2["name"]]["points"] += 3
                    table[t2["name"]]["W"] += 1
                    table[t1["name"]]["L"] += 1

                matches.append({
                    "team1": t1["name"],
                    "team2": t2["name"],
                    "result": outcome
                })

        # Sort and get top 2
        sorted_teams = sorted(teams, key=lambda t: table[t["name"]]["points"], reverse=True)
        top_two = sorted_teams[:2]

        group_results[group_key] = {
            "table": table,
            "matches": matches,
            "advancing": [t["name"] for t in top_two]
        }

        advancing_teams[group_key] = top_two

    return group_results, advancing_teams


def build_knockout_rounds_from_groups(group_results):
    pairings = [
        ("A", 1, "B", 2),
        ("C", 1, "D", 2),
        ("E", 1, "F", 2),
        ("G", 1, "H", 2),
        ("B", 1, "A", 2),
        ("D", 1, "C", 2),
        ("F", 1, "E", 2),
        ("H", 1, "G", 2),
    ]
    r16_pairs = []

    for g1, pos1, g2, pos2 in pairings:
        try:
            t1_name = group_results[g1]["advancing"][pos1 - 1]
            t2_name = group_results[g2]["advancing"][pos2 - 1]
        except KeyError as e:
            raise ValueError(f"Group key missing: {e}")

        # Find ranks to build full team objects
        t1 = {"name": t1_name, "rank": group_results[g1]["table"][t1_name]["rank"]}
        t2 = {"name": t2_name, "rank": group_results[g2]["table"][t2_name]["rank"]}

        r16_pairs.append((t1, t2))

    return r16_pairs

def simulate_knockouts(matchups, strategy="ml", favorite_team=None):
    rounds = {"R16": [], "QF": [], "SF": [], "Final": []}
    knockout_path = []

    current = "R16"
    while len(matchups) > 1:
        next_round = []
        for team1, team2 in matchups:
            result = predict_match(model, team1["rank"], team2["rank"])
            winner = team1 if result == "team1" else team2

            match_data = {
                "team1": team1["name"],
                "team2": team2["name"],
                "winner": winner["name"]
            }
            rounds[current].append(match_data)

            if favorite_team and favorite_team in [team1["name"], team2["name"]]:
                knockout_path.append({"round": current, **match_data})

            next_round.append(winner)

        matchups = [(next_round[i], next_round[i + 1]) for i in range(0, len(next_round), 2)]
        current = "QF" if current == "R16" else "SF" if current == "QF" else "Final"

    final_match = matchups[0]
    result = predict_match(model, final_match[0]["rank"], final_match[1]["rank"])
    final_winner = final_match[0] if result == "team1" else final_match[1]

    final_data = {
        "team1": final_match[0]["name"],
        "team2": final_match[1]["name"],
        "winner": final_winner["name"]
    }
    rounds["Final"].append(final_data)

    if favorite_team and favorite_team in [final_data["team1"], final_data["team2"]]:
        knockout_path.append({"round": "Final", **final_data})

    return final_winner["name"], rounds, knockout_path

def simulate_tournament(favorite_team=None, strategy="ml"):
    group_results, advancing = simulate_group_stage(strategy)
    r16_pairs = build_knockout_rounds_from_groups(group_results)
    final_winner, knockout_rounds, path = simulate_knockouts(r16_pairs, strategy, favorite_team)

    return {
        "final_winner": final_winner,
        "results": knockout_rounds,
        "favorite_path": path,
        "group_results": group_results
    }