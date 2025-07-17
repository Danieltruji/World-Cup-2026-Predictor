import sqlite3
from datetime import datetime
import os

DB_PATH = os.path.join("data", "stickerbook.db")

def connect():
    return sqlite3.connect(DB_PATH)

def get_or_create_user(session_id):
    conn = connect()
    cursor = conn.cursor()
    cursor.execute("SELECT id, last_opened, packs_opened_today FROM users WHERE session_id = ?", (session_id,))
    row = cursor.fetchone()
    if row:
        user_id, last_opened, packs_opened_today = row
        if last_opened != datetime.now().date().isoformat():
            cursor.execute("UPDATE users SET last_opened = ?, packs_opened_today = 0 WHERE id = ?",
                           (datetime.now().date().isoformat(), user_id))
            conn.commit()
        conn.close()
        return user_id
    else:
        cursor.execute("INSERT INTO users (session_id, last_opened, packs_opened_today) VALUES (?, ?, ?)",
                       (session_id, datetime.now().date().isoformat(), 0))
        conn.commit()
        user_id = cursor.lastrowid
        conn.close()
        return user_id

def can_open_pack(user_id):
    conn = connect()
    cursor = conn.cursor()
    cursor.execute("SELECT packs_opened_today FROM users WHERE id = ?", (user_id,))
    count = cursor.fetchone()[0]
    conn.close()
    return count < 20

def open_pack(user_id):
    if not can_open_pack(user_id):
        return []
    conn = connect()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, name, country, image_url, club, flag_url 
        FROM players 
        ORDER BY RANDOM() LIMIT 5
    """)
    players = cursor.fetchall()
    cursor.execute("UPDATE users SET packs_opened_today = packs_opened_today + 1 WHERE id = ?", (user_id,))
    conn.commit()
    conn.close()
    return [{"id": pid, "name": name, "country": country, "image": image_url, "club": club, "flag_url": flag_url}
            for pid, name, country, image_url, club, flag_url in players]

def save_cards(user_id, player_ids):
    conn = connect()
    cursor = conn.cursor()
    for pid in player_ids:
        cursor.execute("INSERT INTO collected_cards (user_id, player_id) VALUES (?, ?)", (user_id, pid))
    conn.commit()
    conn.close()

def get_user_stickerbook(user_id):
    conn = connect()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT players.id, players.name, players.country, players.image_url, players.club, players.flag_url
        FROM collected_cards
        JOIN players ON collected_cards.player_id = players.id
        WHERE collected_cards.user_id = ?
    """, (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return [{"id": pid, "name": name, "country": country, "image": image_url, "club": club, "flag_url": flag_url}
            for pid, name, country, image_url, club, flag_url in rows]

def seed_players():
    players = [
        {"name": "Lionel Messi", "country": "Argentina", "image_url": "/player-cards/messi.png",
         "club": "Inter Miami", "flag_url": "/flags/argentina.png"},
        {"name": "Kylian Mbappé", "country": "France", "image_url": "/player-cards/mbappe.png",
         "club": "PSG", "flag_url": "/flags/france.png"},
        {"name": "Bukayo Saka", "country": "England", "image_url": "/player-cards/saka.png",
         "club": "Arsenal", "flag_url": "/flags/england.png"},
        {"name": "Vinícius Jr", "country": "Brazil", "image_url": "/player-cards/vini.png",
         "club": "Real Madrid", "flag_url": "/flags/brazil.png"},
        {"name": "Jude Bellingham", "country": "England", "image_url": "/player-cards/bellingham.png",
         "club": "Real Madrid", "flag_url": "/flags/england.png"},
        {"name": "Erling Haaland", "country": "Norway", "image_url": "/player-cards/haaland.png",
         "club": "Manchester City", "flag_url": "/flags/norway.png"}
    ]
    conn = connect()
    cursor = conn.cursor()
    for player in players:
        cursor.execute("""
            INSERT OR IGNORE INTO players (name, country, image_url, club, flag_url)
            VALUES (?, ?, ?, ?, ?)
        """, (player["name"], player["country"], player["image_url"], player["club"], player["flag_url"]))
    conn.commit()
    conn.close()
    print("✅ Players seeded successfully with club and flag.")

def reset_players_table():
    conn = connect()
    cursor = conn.cursor()
    cursor.execute("DROP TABLE IF EXISTS players;")
    cursor.execute("""
        CREATE TABLE players (
            id INTEGER PRIMARY KEY,
            name TEXT,
            country TEXT,
            image_url TEXT,
            club TEXT,
            flag_url TEXT
        );
    """)
    conn.commit()
    conn.close()
    print("✅ Players table dropped and recreated.")

if __name__ == "__main__":
    reset_players_table()
    seed_players()
