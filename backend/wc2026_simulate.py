"""
wc2026_simulate.py
==================
Full tournament simulation for the 2026 FIFA World Cup (48 teams).

Format:
  12 groups of 4 → top 2 + 8 best 3rd-place teams = 32 advance
  R32 → R16 → QF → SF → 3rd-place match → Final

Public API:
  simulate_wc2026_tournament(strategy, your_team, seed)  →  full results dict
"""

import json
import os
import random
import itertools
from copy import deepcopy

from wc2026_model import (
    train_wc2026_model,
    predict_wc_match,
    predict_wc_match_with_variance,
)

GROUPS_PATH = os.path.join(os.path.dirname(__file__), "data", "wc2026_groups.json")

# ── R32 bracket structure (FIFA pre-mapped) ──────────────────────────
# Each tuple: (match_num, team_a_source, team_b_source)
# team_a/b_source is a string like "1A" (1st in group A) or "2B" etc.
# 3rd-place slots are filled dynamically by _assign_third_place_teams().
R32_FIXED = [
    (73, "2A", "2B"),
    (75, "1F", "2C"),
    (76, "1C", "2F"),
    (78, "2E", "2I"),
    (83, "2K", "2L"),
    (84, "1H", "2J"),
    (86, "1J", "2H"),
    (88, "2D", "2G"),
]

R32_THIRD_PLACE_SLOTS = [
    (74, "1E", frozenset("ABCDF")),
    (77, "1I", frozenset("CDFGH")),
    (79, "1A", frozenset("CEFHI")),
    (80, "1L", frozenset("EHIJK")),
    (81, "1D", frozenset("BEFIJ")),
    (82, "1G", frozenset("AEHIJ")),
    (85, "1B", frozenset("EFGIJ")),
    (87, "1K", frozenset("DEIJL")),
]

# R16 → Final bracket wiring (match_num → pair of feeder match nums)
R16_WIRING = {
    89: (73, 74), 90: (75, 76), 91: (77, 78), 92: (79, 80),
    93: (81, 82), 94: (83, 84), 95: (85, 86), 96: (87, 88),
}
QF_WIRING = {97: (89, 90), 98: (91, 92), 99: (93, 94), 100: (95, 96)}
SF_WIRING = {101: (97, 98), 102: (99, 100)}
THIRD_PLACE_MATCH = 103
FINAL_MATCH = 104

_model_cache = None


def _get_model():
    global _model_cache
    if _model_cache is None:
        _model_cache = train_wc2026_model()
    return _model_cache


def _load_groups():
    with open(GROUPS_PATH) as f:
        return json.load(f)["groups"]


# ── Group Stage ──────────────────────────────────────────────────────

def _simulate_group_stage(groups, strategy, model, seed_base):
    """
    Round-robin for each group. Returns dict keyed by group letter.
    Each value has 'table', 'matches', 'standings' (sorted list of team dicts).
    """
    all_group_results = {}
    match_seed = seed_base

    for group_letter in sorted(groups.keys()):
        teams = groups[group_letter]
        table = {}
        for t in teams:
            table[t["name"]] = {
                "name": t["name"],
                "rank": t["rank"],
                "confederation": t["confederation"],
                "wc_wins": t.get("wc_wins", 0),
                "played": 0, "W": 0, "D": 0, "L": 0,
                "GF": 0, "GA": 0, "GD": 0, "points": 0,
            }

        matches = []
        h2h = {}

        for i in range(len(teams)):
            for j in range(i + 1, len(teams)):
                t1, t2 = teams[i], teams[j]
                match_seed += 1

                if strategy == "random":
                    rng = random.Random(match_seed)
                    outcomes = ["team1", "draw", "team2"]
                    result_str = rng.choice(outcomes)
                    s1 = rng.randint(0, 3)
                    s2 = rng.randint(0, 3)
                    if result_str == "team1" and s1 <= s2:
                        s1 = s2 + 1
                    elif result_str == "team2" and s2 <= s1:
                        s2 = s1 + 1
                    elif result_str == "draw":
                        s2 = s1
                    pred = {
                        "result": result_str,
                        "predicted_score": [s1, s2],
                        "probabilities": {"team1": 0.33, "draw": 0.34, "team2": 0.33},
                        "team1": t1["name"],
                        "team2": t2["name"],
                        "winner": t1["name"] if result_str == "team1" else (t2["name"] if result_str == "team2" else None),
                    }
                else:
                    pred = predict_wc_match_with_variance(
                        model, t1, t2, "Group", seed=match_seed
                    )

                s1, s2 = pred["predicted_score"]
                result_str = pred["result"]

                for name, gf, ga in [(t1["name"], s1, s2), (t2["name"], s2, s1)]:
                    table[name]["played"] += 1
                    table[name]["GF"] += gf
                    table[name]["GA"] += ga
                    table[name]["GD"] = table[name]["GF"] - table[name]["GA"]

                if result_str == "draw":
                    table[t1["name"]]["D"] += 1
                    table[t2["name"]]["D"] += 1
                    table[t1["name"]]["points"] += 1
                    table[t2["name"]]["points"] += 1
                elif result_str == "team1":
                    table[t1["name"]]["W"] += 1
                    table[t2["name"]]["L"] += 1
                    table[t1["name"]]["points"] += 3
                else:
                    table[t2["name"]]["W"] += 1
                    table[t1["name"]]["L"] += 1
                    table[t2["name"]]["points"] += 3

                pair_key = tuple(sorted([t1["name"], t2["name"]]))
                h2h[pair_key] = {"winner": pred.get("winner"), "score": [s1, s2]}

                matches.append({
                    "team1": t1["name"],
                    "team2": t2["name"],
                    "score": [s1, s2],
                    "result": result_str,
                    "probabilities": pred["probabilities"],
                    "winner": pred.get("winner"),
                })

        standings = sorted(
            table.values(),
            key=lambda t: (t["points"], t["GD"], t["GF"]),
            reverse=True,
        )

        all_group_results[group_letter] = {
            "table": {t["name"]: t for t in standings},
            "matches": matches,
            "standings": standings,
            "advancing": [standings[0]["name"], standings[1]["name"]],
            "third_place": standings[2] if len(standings) > 2 else None,
        }

    return all_group_results


# ── 3rd-place ranking + R32 assignment ───────────────────────────────

def _rank_third_place_teams(group_results):
    """Collect all 3rd-place teams and rank them; top 8 qualify."""
    thirds = []
    for g_letter, g_data in sorted(group_results.items()):
        tp = g_data.get("third_place")
        if tp:
            entry = deepcopy(tp)
            entry["group"] = g_letter
            thirds.append(entry)

    thirds.sort(key=lambda t: (t["points"], t["GD"], t["GF"]), reverse=True)
    return thirds


def _assign_third_place_teams(qualifying_groups):
    """
    Given the set of group letters whose 3rd-place teams qualified,
    assign each 3rd-place team to an R32 slot via backtracking.
    """
    slots = [(m, src, allowed) for m, src, allowed in R32_THIRD_PLACE_SLOTS]
    groups_left = list(qualifying_groups)

    assignment = {}

    def backtrack(idx):
        if idx == len(slots):
            return True
        _, _, allowed = slots[idx]
        for g in groups_left:
            if g in allowed and g not in assignment.values():
                assignment[idx] = g
                if backtrack(idx + 1):
                    return True
                del assignment[idx]
        return False

    if not backtrack(0):
        for i, (_, _, allowed) in enumerate(slots):
            if i not in assignment:
                available = [g for g in groups_left if g not in assignment.values()]
                if available:
                    assignment[i] = available[0]

    return {slots[i][0]: assignment[i] for i in assignment}


# ── Knockout Stage ───────────────────────────────────────────────────

def _build_r32_matchups(group_results, third_place_ranking):
    """Build the 16 R32 matchups using group results and 3rd-place assignment."""
    qualifying_third = third_place_ranking[:8]
    qualifying_groups = frozenset(t["group"] for t in qualifying_third)
    third_by_group = {t["group"]: t for t in qualifying_third}

    slot_assignment = _assign_third_place_teams(qualifying_groups)

    def _get_team(source, group_results):
        pos = int(source[0])
        grp = source[1]
        standings = group_results[grp]["standings"]
        team = standings[pos - 1]
        return {
            "name": team["name"],
            "rank": team["rank"],
            "confederation": team.get("confederation", ""),
            "wc_wins": team.get("wc_wins", 0),
        }

    r32_matches = {}

    for match_num, src_a, src_b in R32_FIXED:
        team_a = _get_team(src_a, group_results)
        team_b = _get_team(src_b, group_results)
        r32_matches[match_num] = (team_a, team_b, src_a, src_b)

    for match_num, src_a, allowed_groups in R32_THIRD_PLACE_SLOTS:
        team_a = _get_team(src_a, group_results)
        assigned_group = slot_assignment.get(match_num)
        if assigned_group and assigned_group in third_by_group:
            tp = third_by_group[assigned_group]
            team_b = {
                "name": tp["name"],
                "rank": tp["rank"],
                "confederation": tp.get("confederation", ""),
                "wc_wins": tp.get("wc_wins", 0),
            }
            src_b = f"3{assigned_group}"
        else:
            team_b = {"name": "TBD", "rank": 50, "confederation": "", "wc_wins": 0}
            src_b = "3?"
        r32_matches[match_num] = (team_a, team_b, src_a, src_b)

    return r32_matches


def _simulate_knockout_round(matchups, stage, strategy, model, seed_base):
    """
    Simulate a list of matches. In knockout, draws are resolved by
    adjusting prediction to force a winner.
    matchups: list of (match_num, team_a_dict, team_b_dict)
    Returns list of match result dicts and dict of winners keyed by match_num.
    """
    results = []
    winners = {}
    match_seed = seed_base

    for match_num, team_a, team_b in matchups:
        match_seed += 1

        if strategy == "random":
            rng = random.Random(match_seed)
            winner_team = rng.choice([team_a, team_b])
            s1 = rng.randint(0, 4)
            s2 = rng.randint(0, 4)
            if winner_team == team_a and s1 <= s2:
                s1 = s2 + 1
            elif winner_team == team_b and s2 <= s1:
                s2 = s1 + 1
            pred = {
                "result": "team1" if winner_team == team_a else "team2",
                "predicted_score": [s1, s2],
                "probabilities": {"team1": 0.5, "draw": 0.0, "team2": 0.5},
                "team1": team_a["name"],
                "team2": team_b["name"],
                "winner": winner_team["name"],
            }
        else:
            pred = predict_wc_match_with_variance(
                model, team_a, team_b, stage, seed=match_seed
            )
            if pred["result"] == "draw":
                if team_a["rank"] <= team_b["rank"]:
                    pred["result"] = "team1"
                    pred["winner"] = team_a["name"]
                else:
                    pred["result"] = "team2"
                    pred["winner"] = team_b["name"]
                s = pred["predicted_score"]
                if s[0] == s[1]:
                    s[0] += 1
                pred["predicted_score"] = s

        winner_data = team_a if pred["result"] == "team1" else team_b
        loser_data = team_b if pred["result"] == "team1" else team_a

        match_result = {
            "match_num": match_num,
            "team1": team_a["name"],
            "team2": team_b["name"],
            "score": pred["predicted_score"],
            "result": pred["result"],
            "probabilities": pred["probabilities"],
            "winner": pred["winner"],
            "winner_data": winner_data,
            "loser_data": loser_data,
        }
        results.append(match_result)
        winners[match_num] = winner_data

    return results, winners


# ── Main Entry Point ─────────────────────────────────────────────────

def simulate_wc2026_tournament(strategy="ml", your_team=None, seed=None):
    """
    Simulate the entire 2026 World Cup.

    Parameters:
        strategy: "ml" or "random"
        your_team: user's selected nation (from AuthContext). Labeled "Your Team".
        seed: int for reproducibility. None → generate random seed.

    Returns:
        {
            "group_results": { "A": { table, matches, standings, advancing, third_place }, ... },
            "third_place_ranking": [...],
            "knockout": {
                "R32": [...], "R16": [...], "QF": [...], "SF": [...],
                "third_place_match": {...}, "Final": {...}
            },
            "final_winner": "...",
            "your_team_path": [...],    # only if your_team provided and found
            "seed": int
        }
    """
    if seed is None:
        seed = random.randint(1, 999999)

    model = _get_model() if strategy == "ml" else None
    groups = _load_groups()

    # ── Group stage ──
    group_results = _simulate_group_stage(groups, strategy, model, seed_base=seed)

    # ── 3rd-place ranking ──
    third_place_ranking = _rank_third_place_teams(group_results)
    third_serializable = []
    for t in third_place_ranking:
        entry = {k: v for k, v in t.items()}
        third_serializable.append(entry)

    # ── Build R32 ──
    r32_matchup_map = _build_r32_matchups(group_results, third_place_ranking)

    r32_ordered = []
    for mn in sorted(r32_matchup_map.keys()):
        ta, tb, src_a, src_b = r32_matchup_map[mn]
        r32_ordered.append((mn, ta, tb))

    knockout = {}

    # ── R32 ──
    r32_results, r32_winners = _simulate_knockout_round(
        r32_ordered, "R32", strategy, model, seed_base=seed + 1000
    )
    knockout["R32"] = _strip_internal(r32_results)

    # ── R16 ──
    r16_matchups = []
    for mn, (f1, f2) in sorted(R16_WIRING.items()):
        r16_matchups.append((mn, r32_winners[f1], r32_winners[f2]))
    r16_results, r16_winners = _simulate_knockout_round(
        r16_matchups, "R16", strategy, model, seed_base=seed + 2000
    )
    knockout["R16"] = _strip_internal(r16_results)

    # ── QF ──
    qf_matchups = []
    for mn, (f1, f2) in sorted(QF_WIRING.items()):
        qf_matchups.append((mn, r16_winners[f1], r16_winners[f2]))
    qf_results, qf_winners = _simulate_knockout_round(
        qf_matchups, "QF", strategy, model, seed_base=seed + 3000
    )
    knockout["QF"] = _strip_internal(qf_results)

    # ── SF ──
    sf_matchups = []
    for mn, (f1, f2) in sorted(SF_WIRING.items()):
        sf_matchups.append((mn, qf_winners[f1], qf_winners[f2]))
    sf_results, sf_winners = _simulate_knockout_round(
        sf_matchups, "SF", strategy, model, seed_base=seed + 4000
    )
    knockout["SF"] = _strip_internal(sf_results)

    sf_losers = {}
    for r in sf_results:
        sf_losers[r["match_num"]] = r["loser_data"]

    # ── 3rd-place match ──
    third_match_teams = [(THIRD_PLACE_MATCH, sf_losers[101], sf_losers[102])]
    third_results, _ = _simulate_knockout_round(
        third_match_teams, "3rd", strategy, model, seed_base=seed + 5000
    )
    knockout["third_place_match"] = _strip_internal(third_results)[0] if third_results else None

    # ── Final ──
    final_teams = [(FINAL_MATCH, sf_winners[101], sf_winners[102])]
    final_results, _ = _simulate_knockout_round(
        final_teams, "Final", strategy, model, seed_base=seed + 6000
    )
    knockout["Final"] = _strip_internal(final_results)[0] if final_results else None

    final_winner = knockout["Final"]["winner"] if knockout["Final"] else "Unknown"

    # ── Your Team path ──
    your_team_path = None
    if your_team:
        your_team_path = _trace_team_path(your_team, group_results, knockout)

    # ── Serialize group results ──
    serializable_groups = {}
    for g_letter, g_data in group_results.items():
        serializable_groups[g_letter] = {
            "table": g_data["table"],
            "matches": g_data["matches"],
            "standings": g_data["standings"],
            "advancing": g_data["advancing"],
        }

    return {
        "group_results": serializable_groups,
        "third_place_ranking": third_serializable,
        "knockout": knockout,
        "final_winner": final_winner,
        "your_team_path": your_team_path,
        "seed": seed,
    }


def _strip_internal(results):
    """Remove internal-only fields (winner_data, loser_data) from match results."""
    cleaned = []
    for r in results:
        cleaned.append({k: v for k, v in r.items() if k not in ("winner_data", "loser_data")})
    return cleaned


def _trace_team_path(team_name, group_results, knockout):
    """Build a journey list for 'Your Team' through the tournament."""
    path = []

    for g_letter, g_data in sorted(group_results.items()):
        team_names = [s["name"] for s in g_data["standings"]]
        if team_name in team_names:
            pos = team_names.index(team_name) + 1
            team_info = g_data["table"].get(team_name, {})
            path.append({
                "round": "Group Stage",
                "group": g_letter,
                "position": pos,
                "points": team_info.get("points", 0),
                "GD": team_info.get("GD", 0),
                "advanced": pos <= 2 or (pos == 3 and team_name in [
                    t["name"] for t in (_rank_third_place_teams(group_results))[:8]
                ]),
            })
            break

    if not path or not path[0].get("advanced"):
        return path if path else None

    for round_name in ["R32", "R16", "QF", "SF"]:
        matches = knockout.get(round_name, [])
        for m in matches:
            if team_name in (m["team1"], m["team2"]):
                path.append({
                    "round": round_name,
                    "match_num": m["match_num"],
                    "opponent": m["team2"] if m["team1"] == team_name else m["team1"],
                    "score": m["score"],
                    "won": m["winner"] == team_name,
                })
                if m["winner"] != team_name:
                    return path
                break

    for special in ["third_place_match", "Final"]:
        m = knockout.get(special)
        if m and team_name in (m["team1"], m["team2"]):
            path.append({
                "round": "3rd Place Match" if special == "third_place_match" else "Final",
                "match_num": m["match_num"],
                "opponent": m["team2"] if m["team1"] == team_name else m["team1"],
                "score": m["score"],
                "won": m["winner"] == team_name,
            })

    return path


# ── CLI test ─────────────────────────────────────────────────────────

if __name__ == "__main__":
    result = simulate_wc2026_tournament("ml", your_team="Argentina", seed=42)
    print(f"Final winner: {result['final_winner']}")
    print(f"Seed: {result['seed']}")
    print(f"R32 matches: {len(result['knockout']['R32'])}")
    print(f"R16 matches: {len(result['knockout']['R16'])}")
    print(f"QF matches: {len(result['knockout']['QF'])}")
    print(f"SF matches: {len(result['knockout']['SF'])}")
    print(f"Final: {result['knockout']['Final']}")
    if result["your_team_path"]:
        print(f"\nArgentina's journey:")
        for step in result["your_team_path"]:
            print(f"  {step}")
