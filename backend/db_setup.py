import sqlite3

conn = sqlite3.connect('data/stickerbook.db')
cursor = conn.cursor()

# Create players table
cursor.execute('''
CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY,
    name TEXT,
    country TEXT,
    image_url TEXT
)
''')

# Create users table
cursor.execute('''
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    session_id TEXT,
    packs_opened_today INTEGER DEFAULT 0,
    last_opened DATE
)
''')

# Create collected_cards table
cursor.execute('''
CREATE TABLE IF NOT EXISTS collected_cards (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    player_id INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
)
''')

conn.commit()
conn.close()
