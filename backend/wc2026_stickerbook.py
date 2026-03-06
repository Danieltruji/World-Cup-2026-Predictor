"""
wc2026_stickerbook.py
=====================
All backend logic for the WC 2026 virtual sticker album.

Key functions:
  get_all_teams()           → list of all 48 teams for album navigation
  get_team_page(id, uid)    → full page data (slots + legend + user fill state)
  place_sticker(uid, pid)   → place a card in the album (duplicate-safe)
  get_album_progress(uid)   → per-team and overall completion stats
  open_wc2026_pack(uid)     → draw 5 cards (4 regular + possible legend)
"""

import sqlite3
import random
import json
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "data", "stickerbook.db")

LEGEND_CHANCE = 0.05   # 5% chance that 1 of the 5 pack slots is a legend card
DAILY_PACK_LIMIT = 20  # packs per day (unchanged)

POSITION_ORDER = {"GK": 0, "DEF": 1, "MID": 2, "FWD": 3}


def get_conn():
    return sqlite3.connect(DB_PATH)


# ── helpers ──────────────────────────────────────────────────

def _row_to_dict(cursor, row):
    """Convert a sqlite3 Row to a dict using cursor description."""
    return {col[0]: val for col, val in zip(cursor.description, row)}


# ── album navigation ─────────────────────────────────────────

def get_all_teams():
    """
    Return all 48 teams ordered: confirmed alphabetically, then TBD.
    Each dict includes id, name, confederation, status, and tbd info.
    """
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, name, confederation, federation, status,
               tbd_description, tbd_teams_json, tbd_detail, playoff_date
        FROM wc2026_teams
        ORDER BY
            CASE WHEN status = 'tbd' THEN 1 ELSE 0 END,
            name
    """)
    rows = cursor.fetchall()
    conn.close()

    teams = []
    for row in rows:
        (tid, name, conf, fed, status,
         tbd_desc, tbd_json, tbd_detail, playoff_date) = row
        tbd_teams = json.loads(tbd_json) if tbd_json else []
        teams.append({
            "id":             tid,
            "name":           name,
            "confederation":  conf,
            "federation":     fed,
            "status":         status,
            "tbd_description": tbd_desc,
            "tbd_teams":      tbd_teams,
            "tbd_detail":     tbd_detail,
            "playoff_date":   playoff_date,
        })
    return teams


def get_team_page(team_id, user_id):
    """
    Return full page data for a country, including which slots the user
    has already placed a sticker in.

    Returns:
        {
          "team": { id, name, confederation, federation, status, ... },
          "slots": [
            { slot_number, player_id, name, position, shirt_number,
              photo_url, is_legend, legend_description, legend_years,
              in_album: bool },
            ...
          ]
        }
    """
    conn = get_conn()
    cursor = conn.cursor()

    # ── team metadata ──
    cursor.execute("""
        SELECT id, name, confederation, federation, status,
               tbd_description, tbd_teams_json, tbd_detail, playoff_date
        FROM wc2026_teams WHERE id = ?
    """, (team_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return None

    (tid, name, conf, fed, status,
     tbd_desc, tbd_json, tbd_detail, playoff_date) = row
    tbd_teams = json.loads(tbd_json) if tbd_json else []

    team_info = {
        "id":            tid,
        "name":          name,
        "confederation": conf,
        "federation":    fed,
        "status":        status,
        "tbd_description": tbd_desc,
        "tbd_teams":     tbd_teams,
        "tbd_detail":    tbd_detail,
        "playoff_date":  playoff_date,
    }

    # ── players/slots ──
    cursor.execute("""
        SELECT p.id, p.slot_number, p.name, p.position, p.shirt_number,
               p.photo_url, p.is_legend, p.legend_description, p.legend_years,
               CASE WHEN ua.id IS NOT NULL THEN 1 ELSE 0 END AS in_album
        FROM wc2026_players p
        LEFT JOIN user_album ua
            ON ua.player_id = p.id AND ua.user_id = ?
        WHERE p.team_id = ?
        ORDER BY p.is_legend ASC, p.slot_number ASC
    """, (user_id, team_id))
    player_rows = cursor.fetchall()
    conn.close()

    slots = []
    for pr in player_rows:
        (pid, slot_num, pname, pos, shirt_num,
         photo_url, is_legend, leg_desc, leg_years, in_album) = pr
        slots.append({
            "player_id":          pid,
            "slot_number":        slot_num,
            "name":               pname,
            "position":           pos,
            "shirt_number":       shirt_num,
            "photo_url":          photo_url or "",
            "is_legend":          bool(is_legend),
            "legend_description": leg_desc or "",
            "legend_years":       leg_years or "",
            "in_album":           bool(in_album),
        })

    return {"team": team_info, "slots": slots}


# ── place a sticker ──────────────────────────────────────────

def place_sticker(user_id, player_id):
    """
    Place a sticker into the user's album.
    Returns:
        {"success": True}   if placed
        {"duplicate": True} if already in album
        {"error": "..."}    if player_id invalid
    """
    conn = get_conn()
    cursor = conn.cursor()

    # Verify player exists
    cursor.execute("SELECT id FROM wc2026_players WHERE id = ?", (player_id,))
    if not cursor.fetchone():
        conn.close()
        return {"error": "Invalid player_id"}

    # Check for existing placement
    cursor.execute(
        "SELECT id FROM user_album WHERE user_id = ? AND player_id = ?",
        (user_id, player_id)
    )
    if cursor.fetchone():
        conn.close()
        return {"duplicate": True}

    cursor.execute(
        "INSERT INTO user_album (user_id, player_id) VALUES (?, ?)",
        (user_id, player_id)
    )
    conn.commit()
    conn.close()
    return {"success": True}


# ── album progress ───────────────────────────────────────────

def get_album_progress(user_id):
    """
    Return overall and per-team completion stats for a user.
    """
    conn = get_conn()
    cursor = conn.cursor()

    # Overall totals
    cursor.execute("SELECT COUNT(*) FROM wc2026_players WHERE is_legend = 0")
    total_slots = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM wc2026_players WHERE is_legend = 1")
    total_legend_slots = cursor.fetchone()[0]

    cursor.execute("""
        SELECT COUNT(*) FROM user_album ua
        JOIN wc2026_players p ON ua.player_id = p.id
        WHERE ua.user_id = ? AND p.is_legend = 0
    """, (user_id,))
    filled_slots = cursor.fetchone()[0]

    cursor.execute("""
        SELECT COUNT(*) FROM user_album ua
        JOIN wc2026_players p ON ua.player_id = p.id
        WHERE ua.user_id = ? AND p.is_legend = 1
    """, (user_id,))
    filled_legends = cursor.fetchone()[0]

    # Per-team breakdown
    cursor.execute("""
        SELECT t.id, t.name,
               COUNT(CASE WHEN p.is_legend = 0 THEN 1 END)  AS total_players,
               COUNT(CASE WHEN p.is_legend = 0 AND ua.id IS NOT NULL THEN 1 END) AS placed_players,
               COUNT(CASE WHEN p.is_legend = 1 THEN 1 END)  AS has_legend,
               COUNT(CASE WHEN p.is_legend = 1 AND ua.id IS NOT NULL THEN 1 END) AS legend_placed
        FROM wc2026_teams t
        LEFT JOIN wc2026_players p ON p.team_id = t.id
        LEFT JOIN user_album ua ON ua.player_id = p.id AND ua.user_id = ?
        WHERE t.status = 'confirmed'
        GROUP BY t.id
        ORDER BY t.name
    """, (user_id,))
    team_rows = cursor.fetchall()
    conn.close()

    teams = []
    for row in team_rows:
        (tid, tname, tot_p, placed_p, has_leg, leg_placed) = row
        teams.append({
            "team_id":        tid,
            "name":           tname,
            "total_players":  tot_p,
            "placed_players": placed_p,
            "has_legend":     bool(has_leg),
            "legend_placed":  bool(leg_placed),
            "complete":       (tot_p > 0 and placed_p == tot_p),
        })

    return {
        "total_slots":     total_slots,
        "filled_slots":    filled_slots,
        "total_legends":   total_legend_slots,
        "filled_legends":  filled_legends,
        "percent_complete": round(filled_slots / total_slots * 100, 1) if total_slots > 0 else 0,
        "teams":           teams,
    }


# ── pack opening ─────────────────────────────────────────────

def _can_open_pack(user_id):
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT packs_opened_today, last_opened FROM users WHERE id = ?",
        (user_id,)
    )
    row = cursor.fetchone()
    conn.close()
    if not row:
        return False
    count, last_opened = row
    today = datetime.now().date().isoformat()
    if last_opened != today:
        return True  # day has reset
    return count < DAILY_PACK_LIMIT


def _increment_pack_count(user_id):
    conn = get_conn()
    cursor = conn.cursor()
    today = datetime.now().date().isoformat()
    cursor.execute(
        "SELECT last_opened FROM users WHERE id = ?", (user_id,)
    )
    row = cursor.fetchone()
    if row and row[0] != today:
        cursor.execute(
            "UPDATE users SET packs_opened_today = 1, last_opened = ? WHERE id = ?",
            (today, user_id)
        )
    else:
        cursor.execute(
            "UPDATE users SET packs_opened_today = packs_opened_today + 1 WHERE id = ?",
            (user_id,)
        )
    conn.commit()
    conn.close()


def _get_placed_player_ids(user_id):
    """Return a set of player_ids already in this user's album."""
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT player_id FROM user_album WHERE user_id = ?", (user_id,)
    )
    ids = {row[0] for row in cursor.fetchall()}
    conn.close()
    return ids


def open_wc2026_pack(user_id):
    """
    Draw 5 cards for the user:
      - 4 regular player cards (from confirmed teams with players)
      - 1 slot: 5% chance of being a legend card, 95% regular
    Each card includes an `in_album` flag so the frontend can show
    "Add to Album" or "Duplicate" immediately.

    Returns [] if daily limit reached.
    """
    if not _can_open_pack(user_id):
        return []

    conn = get_conn()
    cursor = conn.cursor()

    # ── draw 4 regular players ──
    cursor.execute("""
        SELECT p.id, p.name, p.position, p.shirt_number, p.photo_url,
               p.slot_number, p.team_id, t.name AS country, t.confederation
        FROM wc2026_players p
        JOIN wc2026_teams t ON p.team_id = t.id
        WHERE p.is_legend = 0 AND t.status = 'confirmed'
        ORDER BY RANDOM()
        LIMIT 50
    """)
    regular_pool = cursor.fetchall()

    # ── draw legend pool ──
    cursor.execute("""
        SELECT p.id, p.name, p.position, p.shirt_number, p.photo_url,
               p.slot_number, p.team_id, t.name AS country, t.confederation,
               p.legend_description, p.legend_years
        FROM wc2026_players p
        JOIN wc2026_teams t ON p.team_id = t.id
        WHERE p.is_legend = 1 AND t.status = 'confirmed'
        ORDER BY RANDOM()
        LIMIT 10
    """)
    legend_pool = cursor.fetchall()
    conn.close()

    already_in_album = _get_placed_player_ids(user_id)

    def build_card(row, is_legend=False):
        if is_legend:
            (pid, name, pos, shirt, photo, slot, team_id,
             country, conf, leg_desc, leg_years) = row
        else:
            (pid, name, pos, shirt, photo, slot,
             team_id, country, conf) = row
            leg_desc = leg_years = ""
        return {
            "id":                 pid,
            "name":               name,
            "country":            country,
            "confederation":      conf,
            "position":           pos or "",
            "shirt_number":       shirt,
            "photo_url":          photo or "",
            "slot_number":        slot,
            "team_id":            team_id,
            "is_legend":          is_legend,
            "legend_description": leg_desc or "",
            "legend_years":       leg_years or "",
            "in_album":           pid in already_in_album,
        }

    if not regular_pool:
        return []

    # Select 5 cards: shuffle pool, pick distinct players
    random.shuffle(regular_pool)
    chosen_regular = []
    seen_ids = set()
    for row in regular_pool:
        if row[0] not in seen_ids:
            chosen_regular.append(row)
            seen_ids.add(row[0])
        if len(chosen_regular) == 5:
            break

    cards = [build_card(r, is_legend=False) for r in chosen_regular]

    # Possibly replace one card with a legend
    if legend_pool and random.random() < LEGEND_CHANCE:
        legend_row = random.choice(legend_pool)
        replace_idx = random.randint(0, len(cards) - 1)
        cards[replace_idx] = build_card(legend_row, is_legend=True)

    _increment_pack_count(user_id)
    return cards
