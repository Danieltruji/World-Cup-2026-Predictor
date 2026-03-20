"""
db_setup.py
===========
Run this ONCE on Supabase to create / migrate all tables.

Usage:
  DATABASE_URL=postgresql://... python db_setup.py

Tables created / migrated:
  auth_users      — registered users (username, email, password_hash, favorite_team)
  players         — Club WC sticker players  (unchanged schema)
  users           — session-based users for sticker packs (unchanged schema)
  collected_cards — Club WC collected cards  (unchanged schema)
  wc2026_teams    — WC 2026 teams (must be populated separately via fetch script)
  wc2026_players  — WC 2026 player slots (must be populated separately)
  user_album      — WC 2026 sticker placements per user
"""

import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL env var is not set. Add it to backend/.env")


def get_conn():
    return psycopg2.connect(DATABASE_URL)


def run_migration():
    conn = get_conn()
    cur  = conn.cursor()

    # ── auth_users — registered accounts ──────────────────────────
    cur.execute("""
        CREATE TABLE IF NOT EXISTS auth_users (
            id             SERIAL PRIMARY KEY,
            username       TEXT NOT NULL UNIQUE,
            email          TEXT NOT NULL UNIQUE,
            password_hash  TEXT NOT NULL,
            favorite_team  TEXT DEFAULT NULL,
            is_active      BOOLEAN DEFAULT TRUE,
            created_at     TIMESTAMPTZ DEFAULT NOW()
        )
    """)

    # ── session users — for anonymous sticker packs ────────────────
    # (used by stickerbook.py and wc2026_stickerbook.py)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id                  SERIAL PRIMARY KEY,
            session_id          TEXT UNIQUE,
            packs_opened_today  INTEGER DEFAULT 0,
            last_opened         DATE
        )
    """)

    # ── Club WC players ────────────────────────────────────────────
    cur.execute("""
        CREATE TABLE IF NOT EXISTS players (
            id        SERIAL PRIMARY KEY,
            name      TEXT,
            country   TEXT,
            image_url TEXT,
            club      TEXT,
            flag_url  TEXT
        )
    """)

    # ── Club WC collected cards ────────────────────────────────────
    cur.execute("""
        CREATE TABLE IF NOT EXISTS collected_cards (
            id         SERIAL PRIMARY KEY,
            user_id    INTEGER REFERENCES users(id),
            player_id  INTEGER REFERENCES players(id),
            rarity     TEXT DEFAULT 'common',
            timestamp  TIMESTAMPTZ DEFAULT NOW()
        )
    """)

    # ── WC 2026 teams ──────────────────────────────────────────────
    cur.execute("""
        CREATE TABLE IF NOT EXISTS wc2026_teams (
            id               SERIAL PRIMARY KEY,
            name             TEXT NOT NULL UNIQUE,
            confederation    TEXT,
            federation       TEXT,
            status           TEXT DEFAULT 'confirmed',
            tbd_description  TEXT,
            tbd_teams_json   TEXT,
            tbd_detail       TEXT,
            playoff_date     TEXT,
            api_team_id      INTEGER
        )
    """)

    # Patch existing table if columns/constraints were added after initial creation
    cur.execute("""
        ALTER TABLE wc2026_teams
        ADD COLUMN IF NOT EXISTS api_team_id INTEGER
    """)
    cur.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint
                WHERE conname = 'wc2026_teams_name_key'
                  AND conrelid = 'wc2026_teams'::regclass
            ) THEN
                ALTER TABLE wc2026_teams ADD CONSTRAINT wc2026_teams_name_key UNIQUE (name);
            END IF;
        END $$;
    """)

    # ── WC 2026 players / slots ────────────────────────────────────
    cur.execute("""
        CREATE TABLE IF NOT EXISTS wc2026_players (
            id                 SERIAL PRIMARY KEY,
            team_id            INTEGER REFERENCES wc2026_teams(id),
            api_player_id      INTEGER,
            slot_number        INTEGER,
            name               TEXT,
            position           TEXT,
            shirt_number       INTEGER,
            photo_url          TEXT,
            is_legend          BOOLEAN DEFAULT FALSE,
            legend_description TEXT,
            legend_years       TEXT
        )
    """)

    # Patch existing table — add api_player_id if missing
    cur.execute("""
        ALTER TABLE wc2026_players
        ADD COLUMN IF NOT EXISTS api_player_id INTEGER
    """)

    # ── WC 2026 user album placements ──────────────────────────────
    cur.execute("""
        CREATE TABLE IF NOT EXISTS user_album (
            id         SERIAL PRIMARY KEY,
            user_id    INTEGER REFERENCES users(id),
            player_id  INTEGER REFERENCES wc2026_players(id),
            placed_at  TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(user_id, player_id)
        )
    """)

    conn.commit()
    cur.close()
    conn.close()
    print("✅ All tables created / verified successfully.")


if __name__ == "__main__":
    run_migration()
