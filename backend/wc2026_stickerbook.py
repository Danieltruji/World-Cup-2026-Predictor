"""
wc2026_stickerbook.py
=====================
WC 2026 virtual sticker album logic — migrated from sqlite3 → psycopg2 (Supabase).
All placeholders changed from ? → %s. RealDictCursor replaces row_factory.

Key functions:
  get_all_teams()           → list of all 48 teams for album navigation
  get_team_page(id, uid)    → full page data (slots + legend + user fill state)
  place_sticker(uid, pid)   → place a card in the album (duplicate-safe)
  get_album_progress(uid)   → per-team and overall completion stats
  open_wc2026_pack(uid)     → draw 5 cards (4 regular + possible legend)
"""

import os
import random
import json
import psycopg2 # type: ignore
import psycopg2.extras # type: ignore
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

LEGEND_CHANCE    = 0.05
DAILY_PACK_LIMIT = 20


def get_conn():
    return psycopg2.connect(
        DATABASE_URL,
        cursor_factory=psycopg2.extras.RealDictCursor
    )


# ── album navigation ──────────────────────────────────────────

def get_all_teams():
    conn = get_conn()
    cur  = conn.cursor()
    cur.execute("""
        SELECT id, name, confederation, federation, status,
               tbd_description, tbd_teams_json, tbd_detail, playoff_date
        FROM wc2026_teams
        ORDER BY
            CASE WHEN status = 'tbd' THEN 1 ELSE 0 END,
            name
    """)
    rows = cur.fetchall()
    cur.close()
    conn.close()

    teams = []
    for row in rows:
        tbd_teams = json.loads(row["tbd_teams_json"]) if row["tbd_teams_json"] else []
        teams.append({
            "id":              row["id"],
            "name":            row["name"],
            "confederation":   row["confederation"],
            "federation":      row["federation"],
            "status":          row["status"],
            "tbd_description": row["tbd_description"],
            "tbd_teams":       tbd_teams,
            "tbd_detail":      row["tbd_detail"],
            "playoff_date":    row["playoff_date"],
        })
    return teams


def get_team_page(team_id, user_id):
    conn = get_conn()
    cur  = conn.cursor()

    cur.execute("""
        SELECT id, name, confederation, federation, status,
               tbd_description, tbd_teams_json, tbd_detail, playoff_date
        FROM wc2026_teams WHERE id = %s
    """, (team_id,))
    row = cur.fetchone()
    if not row:
        cur.close()
        conn.close()
        return None

    tbd_teams = json.loads(row["tbd_teams_json"]) if row["tbd_teams_json"] else []
    team_info = {
        "id":              row["id"],
        "name":            row["name"],
        "confederation":   row["confederation"],
        "federation":      row["federation"],
        "status":          row["status"],
        "tbd_description": row["tbd_description"],
        "tbd_teams":       tbd_teams,
        "tbd_detail":      row["tbd_detail"],
        "playoff_date":    row["playoff_date"],
    }

    cur.execute("""
        SELECT p.id, p.slot_number, p.name, p.position, p.shirt_number,
               p.photo_url, p.is_legend, p.legend_description, p.legend_years,
               CASE WHEN ua.id IS NOT NULL THEN true ELSE false END AS in_album
        FROM wc2026_players p
        LEFT JOIN user_album ua
            ON ua.player_id = p.id AND ua.user_id = %s
        WHERE p.team_id = %s
        ORDER BY p.is_legend ASC, p.slot_number ASC
    """, (user_id, team_id))
    player_rows = cur.fetchall()
    cur.close()
    conn.close()

    slots = []
    for pr in player_rows:
        slots.append({
            "player_id":          pr["id"],
            "slot_number":        pr["slot_number"],
            "name":               pr["name"],
            "position":           pr["position"],
            "shirt_number":       pr["shirt_number"],
            "photo_url":          pr["photo_url"] or "",
            "is_legend":          bool(pr["is_legend"]),
            "legend_description": pr["legend_description"] or "",
            "legend_years":       pr["legend_years"] or "",
            "in_album":           bool(pr["in_album"]),
        })

    return {"team": team_info, "slots": slots}


# ── place a sticker ───────────────────────────────────────────

def place_sticker(user_id, player_id):
    conn = get_conn()
    cur  = conn.cursor()

    cur.execute("SELECT id FROM wc2026_players WHERE id = %s", (player_id,))
    if not cur.fetchone():
        cur.close()
        conn.close()
        return {"error": "Invalid player_id"}

    cur.execute(
        "SELECT id FROM user_album WHERE user_id = %s AND player_id = %s",
        (user_id, player_id)
    )
    if cur.fetchone():
        cur.close()
        conn.close()
        return {"duplicate": True}

    cur.execute(
        "INSERT INTO user_album (user_id, player_id) VALUES (%s, %s)",
        (user_id, player_id)
    )
    conn.commit()
    cur.close()
    conn.close()
    return {"success": True}


# ── album progress ────────────────────────────────────────────

def get_album_progress(user_id):
    conn = get_conn()
    cur  = conn.cursor()

    cur.execute("SELECT COUNT(*) AS cnt FROM wc2026_players WHERE is_legend = false")
    total_slots = cur.fetchone()["cnt"]

    cur.execute("SELECT COUNT(*) AS cnt FROM wc2026_players WHERE is_legend = true")
    total_legend_slots = cur.fetchone()["cnt"]

    cur.execute("""
        SELECT COUNT(*) AS cnt FROM user_album ua
        JOIN wc2026_players p ON ua.player_id = p.id
        WHERE ua.user_id = %s AND p.is_legend = false
    """, (user_id,))
    filled_slots = cur.fetchone()["cnt"]

    cur.execute("""
        SELECT COUNT(*) AS cnt FROM user_album ua
        JOIN wc2026_players p ON ua.player_id = p.id
        WHERE ua.user_id = %s AND p.is_legend = true
    """, (user_id,))
    filled_legends = cur.fetchone()["cnt"]

    cur.execute("""
        SELECT t.id, t.name,
               COUNT(CASE WHEN p.is_legend = false THEN 1 END)                       AS total_players,
               COUNT(CASE WHEN p.is_legend = false AND ua.id IS NOT NULL THEN 1 END) AS placed_players,
               COUNT(CASE WHEN p.is_legend = true  THEN 1 END)                       AS has_legend,
               COUNT(CASE WHEN p.is_legend = true  AND ua.id IS NOT NULL THEN 1 END) AS legend_placed
        FROM wc2026_teams t
        LEFT JOIN wc2026_players p ON p.team_id = t.id
        LEFT JOIN user_album ua ON ua.player_id = p.id AND ua.user_id = %s
        WHERE t.status = 'confirmed'
        GROUP BY t.id, t.name
        ORDER BY t.name
    """, (user_id,))
    team_rows = cur.fetchall()
    cur.close()
    conn.close()

    teams = []
    for row in team_rows:
        tot_p    = row["total_players"]
        placed_p = row["placed_players"]
        teams.append({
            "team_id":        row["id"],
            "name":           row["name"],
            "total_players":  tot_p,
            "placed_players": placed_p,
            "has_legend":     bool(row["has_legend"]),
            "legend_placed":  bool(row["legend_placed"]),
            "complete":       (tot_p > 0 and placed_p == tot_p),
        })

    return {
        "total_slots":      total_slots,
        "filled_slots":     filled_slots,
        "total_legends":    total_legend_slots,
        "filled_legends":   filled_legends,
        "percent_complete": round(filled_slots / total_slots * 100, 1) if total_slots > 0 else 0,
        "teams":            teams,
    }


# ── pack opening ──────────────────────────────────────────────

def _can_open_pack(user_id):
    conn = get_conn()
    cur  = conn.cursor()
    cur.execute(
        "SELECT packs_opened_today, last_opened FROM users WHERE id = %s",
        (user_id,)
    )
    row = cur.fetchone()
    cur.close()
    conn.close()
    if not row:
        return False
    today = datetime.now().date().isoformat()
    if str(row["last_opened"]) != today:
        return True
    return row["packs_opened_today"] < DAILY_PACK_LIMIT


def _increment_pack_count(user_id):
    conn  = get_conn()
    cur   = conn.cursor()
    today = datetime.now().date().isoformat()
    cur.execute("SELECT last_opened FROM users WHERE id = %s", (user_id,))
    row = cur.fetchone()
    if row and str(row["last_opened"]) != today:
        cur.execute(
            "UPDATE users SET packs_opened_today = 1, last_opened = %s WHERE id = %s",
            (today, user_id)
        )
    else:
        cur.execute(
            "UPDATE users SET packs_opened_today = packs_opened_today + 1 WHERE id = %s",
            (user_id,)
        )
    conn.commit()
    cur.close()
    conn.close()


def _get_placed_player_ids(user_id):
    conn = get_conn()
    cur  = conn.cursor()
    cur.execute("SELECT player_id FROM user_album WHERE user_id = %s", (user_id,))
    ids = {row["player_id"] for row in cur.fetchall()}
    cur.close()
    conn.close()
    return ids


def open_wc2026_pack(user_id):
    """
    Draw 5 cards: 4 regular + 1 slot with 5% legend chance.
    Each card includes an `in_album` flag.
    Returns [] if daily limit reached.
    """
    if not _can_open_pack(user_id):
        return []

    conn = get_conn()
    cur  = conn.cursor()

    cur.execute("""
        SELECT p.id, p.name, p.position, p.shirt_number, p.photo_url,
               p.slot_number, p.team_id, t.name AS country, t.confederation
        FROM wc2026_players p
        JOIN wc2026_teams t ON p.team_id = t.id
        WHERE p.is_legend = false AND t.status = 'confirmed'
        ORDER BY RANDOM()
        LIMIT 50
    """)
    regular_pool = list(cur.fetchall())

    cur.execute("""
        SELECT p.id, p.name, p.position, p.shirt_number, p.photo_url,
               p.slot_number, p.team_id, t.name AS country, t.confederation,
               p.legend_description, p.legend_years
        FROM wc2026_players p
        JOIN wc2026_teams t ON p.team_id = t.id
        WHERE p.is_legend = true AND t.status = 'confirmed'
        ORDER BY RANDOM()
        LIMIT 10
    """)
    legend_pool = list(cur.fetchall())
    cur.close()
    conn.close()

    already_in_album = _get_placed_player_ids(user_id)

    def build_card(row, is_legend=False):
        return {
            "id":                 row["id"],
            "name":               row["name"],
            "country":            row["country"],
            "confederation":      row["confederation"],
            "position":           row["position"] or "",
            "shirt_number":       row["shirt_number"],
            "photo_url":          row["photo_url"] or "",
            "slot_number":        row["slot_number"],
            "team_id":            row["team_id"],
            "is_legend":          is_legend,
            "legend_description": row["legend_description"] if is_legend else "",
            "legend_years":       row["legend_years"]       if is_legend else "",
            "in_album":           row["id"] in already_in_album,
        }

    if not regular_pool:
        return []

    random.shuffle(regular_pool)
    chosen, seen_ids = [], set()
    for row in regular_pool:
        if row["id"] not in seen_ids:
            chosen.append(row)
            seen_ids.add(row["id"])
        if len(chosen) == 5:
            break

    cards = [build_card(r, is_legend=False) for r in chosen]

    if legend_pool and random.random() < LEGEND_CHANCE:
        legend_row  = random.choice(legend_pool)
        replace_idx = random.randint(0, len(cards) - 1)
        cards[replace_idx] = build_card(legend_row, is_legend=True)

    _increment_pack_count(user_id)
    return cards
