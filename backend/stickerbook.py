import sqlite3
from datetime import datetime
import os
import random

DB_PATH = os.path.join("data", "stickerbook.db")

# Rarity probabilities (should add up to 100)
RARITY_WEIGHTS = {
    'common': 70,     # 70% chance
    'rare': 25,       # 25% chance  
    'legendary': 5    # 5% chance
}

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

def assign_rarity():
    """Randomly assign rarity based on weights"""
    rarities = list(RARITY_WEIGHTS.keys())
    weights = list(RARITY_WEIGHTS.values())
    return random.choices(rarities, weights=weights)[0]

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
    
    # Assign rarity to each card in the pack
    cards_with_rarity = []
    for pid, name, country, image_url, club, flag_url in players:
        rarity = assign_rarity()
        cards_with_rarity.append({
            "id": pid, 
            "name": name, 
            "country": country, 
            "image": image_url, 
            "club": club, 
            "flag_url": flag_url,
            "rarity": rarity
        })
    
    cursor.execute("UPDATE users SET packs_opened_today = packs_opened_today + 1 WHERE id = ?", (user_id,))
    conn.commit()
    conn.close()
    
    return cards_with_rarity

def save_cards(user_id, cards_data):
    """Updated to handle cards with rarity"""
    conn = connect()
    cursor = conn.cursor()
    
    # Handle new format with rarity
    if cards_data and isinstance(cards_data[0], dict) and 'rarity' in cards_data[0]:
        # New format: [{"id": 123, "rarity": "legendary"}, ...]
        for card in cards_data:
            player_id = card.get('id')
            rarity = card.get('rarity', 'common')
            cursor.execute(
                "INSERT INTO collected_cards (user_id, player_id, rarity) VALUES (?, ?, ?)", 
                (user_id, player_id, rarity)
            )
    else:
        # Old format: just player IDs
        for pid in cards_data:
            cursor.execute("INSERT INTO collected_cards (user_id, player_id, rarity) VALUES (?, ?, ?)", 
                          (user_id, pid, 'common'))
    
    conn.commit()
    conn.close()

def get_user_stickerbook(user_id):
    conn = connect()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT collected_cards.id, players.id, players.name, players.country, 
               players.image_url, players.club, players.flag_url, collected_cards.rarity
        FROM collected_cards
        JOIN players ON collected_cards.player_id = players.id
        WHERE collected_cards.user_id = ?
    """, (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return [{"id": row_id, "player_id": pid, "name": name, "country": country, 
             "image": image_url, "club": club, "flag_url": flag_url, "rarity": rarity or 'common'}
            for row_id, pid, name, country, image_url, club, flag_url, rarity in rows]
def update_database_for_rarity():
    """Add rarity column to existing collected_cards table"""
    conn = connect()
    cursor = conn.cursor()
    
    # Check if rarity column exists
    cursor.execute("PRAGMA table_info(collected_cards)")
    columns = [column[1] for column in cursor.fetchall()]
    
    if 'rarity' not in columns:
        cursor.execute("ALTER TABLE collected_cards ADD COLUMN rarity TEXT DEFAULT 'common'")
        print("✅ Added rarity column to collected_cards table.")
        conn.commit()
    else:
        print("✅ Rarity column already exists.")
    
    conn.close()

def assign_random_rarities_to_existing_cards():
    """Assign random rarities to existing cards that have rarity = 'common' or NULL"""
    conn = connect()
    cursor = conn.cursor()
    
    # Get all cards with default/null rarity
    cursor.execute("SELECT id FROM collected_cards WHERE rarity = 'common' OR rarity IS NULL")
    card_ids = [row[0] for row in cursor.fetchall()]
    
    print(f"Found {len(card_ids)} cards to assign rarities to...")
    
    # Assign random rarity to each card
    for card_id in card_ids:
        rarity = assign_rarity()
        cursor.execute("UPDATE collected_cards SET rarity = ? WHERE id = ?", (rarity, card_id))
    
    conn.commit()
    conn.close()
    print(f"✅ Assigned random rarities to {len(card_ids)} existing cards.")

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
    # Update database to support rarity
    update_database_for_rarity()
    
    # Assign random rarities to existing cards (run this once if you have existing cards)
    assign_random_rarities_to_existing_cards()
    
    # Uncomment these if you want to reset/seed players
    # reset_players_table()
    # seed_players()