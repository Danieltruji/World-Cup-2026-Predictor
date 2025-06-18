from flask import Flask, request, jsonify
from flask_cors import CORS
from model import train_model, predict_match
from simulate_bracket import simulate_tournament
import json
import os

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

    final_winner, results, path = simulate_tournament(favorite_team=favorite, strategy=strategy)
    return jsonify({
        "final_winner": final_winner,
        "results": results,
        "favorite_path": path
    })

@app.route("/get_club_groups", methods=["GET"])
def get_club_groups():
    try:
        with open(os.path.join("data", "club_wc_2025_groups.json"), "r") as f:
            groups = json.load(f)
        return jsonify(groups)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)