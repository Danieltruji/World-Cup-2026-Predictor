"""
stickerbook.py
==============
Club World Cup sticker pack logic — migrated from sqlite3 → psycopg2 (Supabase).
All query placeholders changed from ? → %s.
Row dicts returned via RealDictCursor (no row_factory needed).
"""

import os
import random
import psycopg2 # type: ignore
import psycopg2.extras # type: ignore
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# Rarity probabilities
RARITY_WEIGHTS = {
    'common':    70,
    'rare':      25,
    'legendary':  5,
}


def get_conn():
    return psycopg2.connect(
        DATABASE_URL,
        cursor_factory=psycopg2.extras.RealDictCursor
    )


def get_or_create_user(session_id):
    conn = get_conn()
    cur  = conn.cursor()

    cur.execute(
        "SELECT id, last_opened, packs_opened_today FROM users WHERE session_id = %s",
        (session_id,)
    )
    row = cur.fetchone()

    if row:
        user_id     = row["id"]
        last_opened = str(row["last_opened"]) if row["last_opened"] else ""
        today       = datetime.now().date().isoformat()

        if last_opened != today:
            cur.execute(
                "UPDATE users SET last_opened = %s, packs_opened_today = 0 WHERE id = %s",
                (today, user_id)
            )
            conn.commit()
    else:
        today = datetime.now().date().isoformat()
        cur.execute(
            "INSERT INTO users (session_id, last_opened, packs_opened_today) VALUES (%s, %s, %s) RETURNING id",
            (session_id, today, 0)
        )
        user_id = cur.fetchone()["id"]
        conn.commit()

    cur.close()
    conn.close()
    return user_id


def can_open_pack(user_id):
    conn = get_conn()
    cur  = conn.cursor()
    cur.execute("SELECT packs_opened_today FROM users WHERE id = %s", (user_id,))
    row = cur.fetchone()
    cur.close()
    conn.close()
    return row and row["packs_opened_today"] < 20


def assign_rarity():
    rarities = list(RARITY_WEIGHTS.keys())
    weights  = list(RARITY_WEIGHTS.values())
    return random.choices(rarities, weights=weights)[0]


def open_pack(user_id):
    if not can_open_pack(user_id):
        return []

    conn = get_conn()
    cur  = conn.cursor()
    cur.execute(
        "SELECT id, name, country, image_url, club, flag_url FROM players ORDER BY RANDOM() LIMIT 5"
    )
    players = cur.fetchall()

    cards_with_rarity = []
    for p in players:
        rarity = assign_rarity()
        cards_with_rarity.append({
            "id":       p["id"],
            "name":     p["name"],
            "country":  p["country"],
            "image":    p["image_url"],
            "club":     p["club"],
            "flag_url": p["flag_url"],
            "rarity":   rarity,
        })

    cur.execute(
        "UPDATE users SET packs_opened_today = packs_opened_today + 1 WHERE id = %s",
        (user_id,)
    )
    conn.commit()
    cur.close()
    conn.close()
    return cards_with_rarity


def save_cards(user_id, cards_data):
    conn = get_conn()
    cur  = conn.cursor()

    if cards_data and isinstance(cards_data[0], dict) and "rarity" in cards_data[0]:
        for card in cards_data:
            cur.execute(
                "INSERT INTO collected_cards (user_id, player_id, rarity) VALUES (%s, %s, %s)",
                (user_id, card.get("id"), card.get("rarity", "common"))
            )
    else:
        for pid in cards_data:
            cur.execute(
                "INSERT INTO collected_cards (user_id, player_id, rarity) VALUES (%s, %s, %s)",
                (user_id, pid, "common")
            )

    conn.commit()
    cur.close()
    conn.close()


def get_user_stickerbook(user_id):
    conn = get_conn()
    cur  = conn.cursor()
    cur.execute("""
        SELECT cc.id, p.id AS player_id, p.name, p.country,
               p.image_url, p.club, p.flag_url, cc.rarity
        FROM collected_cards cc
        JOIN players p ON cc.player_id = p.id
        WHERE cc.user_id = %s
    """, (user_id,))
    rows = cur.fetchall()
    cur.close()
    conn.close()

    return [
        {
            "id":        r["id"],
            "player_id": r["player_id"],
            "name":      r["name"],
            "country":   r["country"],
            "image":     r["image_url"],
            "club":      r["club"],
            "flag_url":  r["flag_url"],
            "rarity":    r["rarity"] or "common",
        }
        for r in rows
    ]
