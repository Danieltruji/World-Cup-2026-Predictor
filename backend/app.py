from flask import Flask, request, jsonify
from flask_cors import CORS
from model import train_model, predict_match
from simulate_bracket import simulate_tournament
from dotenv import load_dotenv
from datetime import datetime
import json
import os
import requests
import pytz

from stickerbook import (
    get_or_create_user,
    open_pack,
    save_cards,
    get_user_stickerbook
)
from wc2026_stickerbook import (
    get_all_teams,
    get_team_page,
    place_sticker,
    get_album_progress,
    open_wc2026_pack,
)

load_dotenv()
SPORTSDB_API_KEY = os.getenv("SPORTSDB_API_KEY")


app = Flask(__name__)
CORS(app)

# Train the ML model once when the server starts
model = train_model()

@app.route("/predict_match", methods=["POST"])
def predict():
    
    data = request.json
    team1_elo = data.get("team1_elo")
    team2_elo = data.get("team2_elo")
    winner = predict_match(model, team1_elo, team2_elo)
    return jsonify({"winner": winner})

@app.route("/simulate_bracket", methods=["POST"])
def simulate():
    data = request.json
    favorite = data.get("favorite_team")
    strategy = data.get("strategy", "ml")  # default to ML

    result= simulate_tournament(favorite_team=favorite, strategy=strategy)
    return jsonify(result)


@app.route("/simulate_group", methods= ["POST"]) 
def simulate_group():
    data=request.get_json()
    strategy=data.get("strategy","ml")
    favorite_team=data.get("favorite_team",None)

    result = simulate_tournament(strategy=strategy, favorite_team=favorite_team)
    return jsonify(result)


@app.route("/get_club_groups", methods=["GET"])
def get_club_groups():
    try:
        with open(os.path.join("data", "club_wc_2025_groups.json"), "r") as f:
            groups = json.load(f)
        return jsonify(groups)
    except Exception as e:
        return jsonify({"error": str(e)}), 500



@app.route("/live_scores", methods=["GET"])
def get_live_scores():
    try:
        url = f"https://www.thesportsdb.com/api/v1/json/{SPORTSDB_API_KEY}/eventspastleague.php?id=4503"
        response = requests.get(url)
        events = response.json().get("events") or []

        utc = pytz.utc
        eastern = pytz.timezone("US/Eastern")

        formatted_events = []

        for e in events:
            timestamp_str = e.get("strTimestamp")  # Use ISO format if available
            if not timestamp_str:
                continue  # Skip if missing

            try:
                # Parse UTC time
                dt_utc = utc.localize(datetime.strptime(timestamp_str, "%Y-%m-%dT%H:%M:%S"))
                dt_est = dt_utc.astimezone(eastern)

                formatted_date = dt_est.strftime("%b %d, %Y")        # e.g., "Jun 23, 2025"
                formatted_time = dt_est.strftime("%I:%M %p").lstrip("0")  # e.g., "9:00 PM"

                formatted_events.append({
                    "idEvent": e.get("idEvent"),
                    "strEvent": e.get("strEvent"),
                    "dateEvent": formatted_date,
                    "strTime": formatted_time,
                    "intHomeScore": e.get("intHomeScore"),
                    "intAwayScore": e.get("intAwayScore")
                })
            except Exception:
                continue  # skip problematic entries

        return jsonify({"events": formatted_events[:5]})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/upcoming_matches", methods=["GET"])
def get_upcoming_matches():
    try:
        url = f"https://www.thesportsdb.com/api/v1/json/{SPORTSDB_API_KEY}/eventsnextleague.php?id=4503"
        response = requests.get(url)
        events = response.json().get("events") or []

        utc = pytz.utc
        eastern = pytz.timezone("US/Eastern")

        matches = []
        for e in events:
            timestamp_str = e.get("strTimestamp")  # Use ISO datetime string if available
            if not timestamp_str:
                continue

            try:
                # Parse and convert UTC to EST
                dt_utc = utc.localize(datetime.strptime(timestamp_str, "%Y-%m-%dT%H:%M:%S"))
                dt_est = dt_utc.astimezone(eastern)

                formatted_date = dt_est.strftime("%b %d, %Y")
                formatted_time = dt_est.strftime("%I:%M %p").lstrip("0")

                matches.append({
                    "idEvent": e.get("idEvent"),
                    "strEvent": e.get("strEvent"),
                    "dateEvent": formatted_date,
                    "strTime": formatted_time
                })
            except Exception:
                continue  # skip bad entries

        return jsonify({"matches": matches})
    except Exception as e: 
        return jsonify({"error": str(e)}), 500

@app.route("/open_pack", methods=["GET"])
def api_open_pack():
    session_id = request.headers.get('session-id', request.remote_addr)
    user_id = get_or_create_user(session_id)
    pack = open_pack(user_id)
    if not pack:
        return jsonify({"error": "You have reached your daily pack limit (20 packs/day)."}), 403
    return jsonify({"cards": pack})

@app.route("/save_cards", methods=["POST"])
def api_save_cards():
    data = request.json
    session_id = request.headers.get('session-id', request.remote_addr)
    user_id = get_or_create_user(session_id)
    
    # Support both old format (player_ids) and new format (cards with rarity)
    if 'cards_data' in data:
        cards_data = data["cards_data"]
    elif 'cards' in data:
        cards_data = data["cards"]
    else:
        cards_data = data.get("player_ids", [])
    
    save_cards(user_id, cards_data)
    return jsonify({"message": "Cards saved to your stickerbook."})

@app.route("/my_stickerbook", methods=["GET"])
def api_get_stickerbook():
    session_id = request.headers.get('session-id', request.remote_addr)
    user_id = get_or_create_user(session_id)
    cards = get_user_stickerbook(user_id)
    return jsonify({"cards": cards})


@app.route("/match/<event_id>", methods=["GET"])
def get_match_details(event_id):
    url = f"https://www.thesportsdb.com/api/v1/json/{SPORTSDB_API_KEY}/lookupevent.php?id={event_id}"
    response = requests.get(url)
    data = response.json()

  
    return jsonify(data)


# ══════════════════════════════════════════════════════════════
# WC 2026 Virtual Sticker Album Routes
# ══════════════════════════════════════════════════════════════

@app.route("/wc2026/teams", methods=["GET"])
def wc2026_get_teams():
    """All 48 teams for album navigation (confirmed alphabetical + TBD)."""
    try:
        teams = get_all_teams()
        return jsonify({"teams": teams})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/wc2026/team/<int:team_id>", methods=["GET"])
def wc2026_get_team_page(team_id):
    """Full page data for one country: slots + legend + user fill state."""
    session_id = request.headers.get("session-id", request.remote_addr)
    user_id = get_or_create_user(session_id)
    try:
        page = get_team_page(team_id, user_id)
        if page is None:
            return jsonify({"error": "Team not found"}), 404
        return jsonify(page)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/wc2026/place_sticker", methods=["POST"])
def wc2026_place_sticker():
    """Place a card into the user's album. Prevents duplicates."""
    session_id = request.headers.get("session-id", request.remote_addr)
    user_id = get_or_create_user(session_id)
    data = request.json or {}
    player_id = data.get("player_id")
    if player_id is None:
        return jsonify({"error": "player_id required"}), 400
    result = place_sticker(user_id, player_id)
    return jsonify(result)


@app.route("/wc2026/my_progress", methods=["GET"])
def wc2026_my_progress():
    """Overall and per-team album completion stats for the user."""
    session_id = request.headers.get("session-id", request.remote_addr)
    user_id = get_or_create_user(session_id)
    try:
        progress = get_album_progress(user_id)
        return jsonify(progress)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/wc2026/open_pack", methods=["GET"])
def wc2026_open_pack():
    """
    Open a WC 2026 pack — returns 5 player cards.
    Each card has an `in_album` flag so the UI can show Add / Duplicate.
    """
    session_id = request.headers.get("session-id", request.remote_addr)
    user_id = get_or_create_user(session_id)
    cards = open_wc2026_pack(user_id)
    if not cards:
        return jsonify({"error": "You have reached your daily pack limit (20 packs/day)."}), 403
    return jsonify({"cards": cards})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(debug=True, port=port)



