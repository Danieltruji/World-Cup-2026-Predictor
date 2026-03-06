"""
fetch_wc2026_squads.py
======================
One-time seeding script — fetches national team squads from API-Football
(api-sports.io) and populates the wc2026_teams & wc2026_players tables.

Usage:
    cd backend
    python3 fetch_wc2026_squads.py

Rate limit: FREE tier = 10 requests per minute.
  • 2 API calls per team (search + squad) → ~7-8 teams per minute safely
  • 42 teams total → ~6 minutes to complete
  • Already-fetched teams are skipped on re-runs (safe to stop & resume)

Flags:
    --limit N     Only fetch squads for N teams this session
    --reset       Clear all WC2026 player data and re-fetch
"""

import sqlite3
import requests
import json
import time
import os
import sys
import argparse
from dotenv import load_dotenv

# ── path setup ──────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, SCRIPT_DIR)

load_dotenv(os.path.join(SCRIPT_DIR, ".env"))

from data.wc2026_data import ALL_WC2026_TEAMS, WC2026_CONFIRMED_TEAMS
from wc2026_db_setup import setup_wc2026_tables

DB_PATH = os.path.join(SCRIPT_DIR, "data", "stickerbook.db")

# ── API config ───────────────────────────────────────────────
API_KEY = os.getenv("API-SPORTS")
BASE_URL = "https://v3.football.api-sports.io"
HEADERS = {
    "x-apisports-key": API_KEY,
    "Accept": "application/json"
}

POSITION_MAP = {
    "Goalkeeper": "GK",
    "Defender":   "DEF",
    "Midfielder": "MID",
    "Attacker":   "FWD",
    "Forward":    "FWD",
}

# Free tier = 10 requests/minute → 6s minimum gap, use 7s to be safe
REQUEST_DELAY = 7.0  # seconds between each individual API call


def get_conn():
    return sqlite3.connect(DB_PATH)


# ── API helpers ──────────────────────────────────────────────

def api_get(endpoint, params=None, retry=True):
    """Make an API-Football GET request with rate-limit retry."""
    url = f"{BASE_URL}/{endpoint}"
    try:
        resp = requests.get(url, headers=HEADERS, params=params, timeout=15)
        resp.raise_for_status()
        data = resp.json()
        errors = data.get("errors", {})
        if errors:
            # Rate limit hit — wait a full minute then retry once
            if "rateLimit" in errors and retry:
                print(f"  ⏳  Rate limit hit — waiting 65 seconds...")
                time.sleep(65)
                return api_get(endpoint, params, retry=False)
            print(f"  ⚠️  API errors: {errors}")
            return None
        return data
    except requests.exceptions.RequestException as e:
        print(f"  ❌  Request failed: {e}")
        return None


def search_national_team(team_name):
    """Find the API-Football team ID for a national team by name."""
    # NOTE: 'type' is NOT a valid param for this API — search by name only
    data = api_get("teams", params={"name": team_name})
    time.sleep(REQUEST_DELAY)
    if not data:
        return None
    response = data.get("response", [])
    # Filter for national teams (type == "National") from the results
    national = [r for r in response if r.get("team", {}).get("type") == "National"]
    candidates = national if national else response  # fallback to all results
    if candidates:
        team = candidates[0]["team"]
        print(f"  ✅  Found: {team['name']} (ID: {team['id']})")
        return team["id"]
    print(f"  ⚠️  No result for '{team_name}'")
    return None


def fetch_squad(api_team_id):
    """Fetch the current squad for a team ID."""
    data = api_get("players/squads", params={"team": api_team_id})
    time.sleep(REQUEST_DELAY)
    if not data:
        return []
    response = data.get("response", [])
    if response:
        return response[0].get("players", [])
    return []


# ── DB helpers ───────────────────────────────────────────────

def team_already_seeded(team_name):
    """Return True if this team already has players in the DB."""
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT COUNT(*) FROM wc2026_players p
        JOIN wc2026_teams t ON p.team_id = t.id
        WHERE t.name = ? AND p.is_legend = 0
    """, (team_name,))
    count = cursor.fetchone()[0]
    conn.close()
    return count > 0


def insert_team(team_data):
    """Insert or ignore a team record. Returns the team DB id."""
    conn = get_conn()
    cursor = conn.cursor()

    status = team_data.get("status", "confirmed")
    tbd_teams = team_data.get("tbd_teams", [])

    cursor.execute("""
        INSERT OR IGNORE INTO wc2026_teams
            (name, confederation, federation, status,
             tbd_description, tbd_teams_json, tbd_detail, playoff_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        team_data["name"],
        team_data.get("confederation", ""),
        team_data.get("federation", ""),
        status,
        team_data.get("tbd_description", ""),
        json.dumps(tbd_teams),
        team_data.get("tbd_detail", ""),
        team_data.get("playoff_date", ""),
    ))
    conn.commit()

    cursor.execute("SELECT id FROM wc2026_teams WHERE name = ?", (team_data["name"],))
    row = cursor.fetchone()
    conn.close()
    return row[0] if row else None


def update_team_api_id(team_db_id, api_team_id):
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE wc2026_teams SET api_team_id = ? WHERE id = ?",
        (api_team_id, team_db_id)
    )
    conn.commit()
    conn.close()


def insert_players(team_db_id, players_raw):
    """
    Insert players for a team, ordered by position (GK → DEF → MID → FWD).
    Assigns sequential slot_numbers starting from 1.
    """
    position_order = {"GK": 0, "DEF": 1, "MID": 2, "FWD": 3}

    normalized = []
    for p in players_raw:
        raw_pos = p.get("position", "")
        pos = POSITION_MAP.get(raw_pos, raw_pos or "MID")
        normalized.append({
            "api_player_id": p.get("id"),
            "name":          p.get("name", "Unknown"),
            "position":      pos,
            "shirt_number":  p.get("number"),
            "photo_url":     p.get("photo", ""),
        })

    # Sort by position group, then name within group
    normalized.sort(key=lambda x: (position_order.get(x["position"], 99), x["name"]))

    conn = get_conn()
    cursor = conn.cursor()
    for slot_num, player in enumerate(normalized, start=1):
        cursor.execute("""
            INSERT INTO wc2026_players
                (team_id, api_player_id, name, position, shirt_number,
                 photo_url, slot_number, is_legend)
            VALUES (?, ?, ?, ?, ?, ?, ?, 0)
        """, (
            team_db_id,
            player["api_player_id"],
            player["name"],
            player["position"],
            player["shirt_number"],
            player["photo_url"],
            slot_num,
        ))
    conn.commit()
    conn.close()
    return len(normalized)


def insert_legend(team_db_id, legend_data):
    """Insert the legend card for a team (slot_number = 0, is_legend = 1)."""
    conn = get_conn()
    cursor = conn.cursor()
    # Check if legend already exists
    cursor.execute(
        "SELECT id FROM wc2026_players WHERE team_id = ? AND is_legend = 1",
        (team_db_id,)
    )
    if cursor.fetchone():
        conn.close()
        return  # Already inserted

    cursor.execute("""
        INSERT INTO wc2026_players
            (team_id, name, position, slot_number, is_legend,
             legend_description, legend_years, photo_url)
        VALUES (?, ?, 'LEGEND', 0, 1, ?, ?, '')
    """, (
        team_db_id,
        legend_data["name"],
        legend_data.get("description", ""),
        legend_data.get("years_active", ""),
    ))
    conn.commit()
    conn.close()


def seed_tbd_teams():
    """Seed the 6 TBD placeholder teams (no players, no legend needed yet)."""
    from data.wc2026_data import WC2026_TBD_TEAMS
    for team in WC2026_TBD_TEAMS:
        team_db_id = insert_team(team)
        if team_db_id:
            print(f"  📋  TBD team seeded: {team['name']}")


def reset_wc2026_data():
    """⚠️  Drops and recreates WC2026 data. Also clears user_album."""
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM user_album")
    cursor.execute("DELETE FROM wc2026_players")
    cursor.execute("DELETE FROM wc2026_teams")
    conn.commit()
    conn.close()
    print("⚠️   WC2026 data and user albums cleared.")


# ── Main ─────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Seed WC 2026 squad data")
    parser.add_argument("--limit", type=int, default=None,
                        help="Max number of confirmed teams to fetch this run")
    parser.add_argument("--reset", action="store_true",
                        help="Clear all WC2026 data before seeding")
    args = parser.parse_args()

    print("🔧  Setting up WC2026 tables...")
    setup_wc2026_tables()

    if args.reset:
        reset_wc2026_data()

    print("\n📋  Seeding TBD placeholder teams...")
    seed_tbd_teams()

    print("\n⚽  Fetching confirmed team squads from API-Football...")
    teams_to_fetch = WC2026_CONFIRMED_TEAMS
    if args.limit:
        teams_to_fetch = teams_to_fetch[:args.limit]

    success_count = 0
    skip_count = 0
    fail_count = 0

    for i, team_data in enumerate(teams_to_fetch, 1):
        team_name     = team_data["name"]
        api_name      = team_data.get("api_search_name", team_name)
        legend_data   = team_data.get("legend", {})

        print(f"\n[{i}/{len(teams_to_fetch)}] {team_name}")

        # Insert team record (or skip if exists)
        team_db_id = insert_team(team_data)

        # Always ensure legend is inserted
        if legend_data:
            insert_legend(team_db_id, legend_data)

        # Skip squad fetch if already done
        if team_already_seeded(team_name):
            print(f"  ⏭️   Squad already in DB — skipping API call")
            skip_count += 1
            continue

        # 1) Search for the team's API ID
        api_team_id = search_national_team(api_name)
        if not api_team_id:
            print(f"  ❌  Could not find team in API — skipping squad")
            fail_count += 1
            continue

        update_team_api_id(team_db_id, api_team_id)

        # 2) Fetch squad
        print(f"  📥  Fetching squad (API team ID: {api_team_id})...")
        players = fetch_squad(api_team_id)

        if not players:
            print(f"  ⚠️   No squad data returned — team may need subscription tier")
            fail_count += 1
            continue

        # 3) Insert into DB
        count = insert_players(team_db_id, players)
        print(f"  ✅  Inserted {count} players")
        success_count += 1

    print("\n" + "="*50)
    print(f"✅  Done!  Success: {success_count} | Skipped: {skip_count} | Failed: {fail_count}")
    print("="*50)

    # Print remaining teams not yet seeded
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT t.name FROM wc2026_teams t
        LEFT JOIN wc2026_players p ON t.id = p.team_id AND p.is_legend = 0
        WHERE t.status = 'confirmed' AND p.id IS NULL
        ORDER BY t.name
    """)
    remaining = [row[0] for row in cursor.fetchall()]
    conn.close()

    if remaining:
        print(f"\n⏳  {len(remaining)} teams still need squad data:")
        for name in remaining:
            print(f"   - {name}")
        print("\nJust re-run this script — it will resume from where it left off.")


if __name__ == "__main__":
    main()
