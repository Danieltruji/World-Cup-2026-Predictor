"""
WC 2026 Stickerbook — Database Setup
Adds three new tables to the existing stickerbook.db:
  - wc2026_teams    : 48 teams (42 confirmed + 6 TBD)
  - wc2026_players  : all players per team + 1 legend per team
  - user_album      : which slots each user has placed a sticker in
Run this ONCE before running fetch_wc2026_squads.py
"""

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "data", "stickerbook.db")


def get_conn():
    return sqlite3.connect(DB_PATH)


def setup_wc2026_tables():
    conn = get_conn()
    cursor = conn.cursor()

    # ----------------------------------------------------------
    # 1. wc2026_teams
    # ----------------------------------------------------------
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS wc2026_teams (
            id                INTEGER PRIMARY KEY AUTOINCREMENT,
            name              TEXT NOT NULL UNIQUE,
            api_team_id       INTEGER,
            confederation     TEXT,
            federation        TEXT,
            status            TEXT DEFAULT 'confirmed',
            tbd_description   TEXT,
            tbd_teams_json    TEXT,
            tbd_detail        TEXT,
            playoff_date      TEXT
        )
    """)

    # ----------------------------------------------------------
    # 2. wc2026_players  (regular squad + 1 legend per team)
    # ----------------------------------------------------------
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS wc2026_players (
            id                  INTEGER PRIMARY KEY AUTOINCREMENT,
            team_id             INTEGER NOT NULL,
            api_player_id       INTEGER,
            name                TEXT NOT NULL,
            position            TEXT,
            shirt_number        INTEGER,
            photo_url           TEXT,
            slot_number         INTEGER,
            is_legend           INTEGER DEFAULT 0,
            legend_description  TEXT,
            legend_years        TEXT,
            FOREIGN KEY (team_id) REFERENCES wc2026_teams(id)
        )
    """)

    # ----------------------------------------------------------
    # 3. user_album  (stickers placed in the album per user)
    # ----------------------------------------------------------
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_album (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id     INTEGER NOT NULL,
            player_id   INTEGER NOT NULL,
            placed_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, player_id),
            FOREIGN KEY (user_id)  REFERENCES users(id),
            FOREIGN KEY (player_id) REFERENCES wc2026_players(id)
        )
    """)

    conn.commit()
    conn.close()
    print("✅  WC 2026 tables created (wc2026_teams, wc2026_players, user_album).")


if __name__ == "__main__":
    setup_wc2026_tables()
