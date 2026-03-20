"""
auth.py
=======
Flask Blueprint for all authentication endpoints.

Endpoints (all prefixed /auth via app.py):
  POST /auth/register       — create account
  POST /auth/login          — log in, returns JWT
  GET  /auth/me             — get current user (JWT required)
  POST /auth/select-team    — set favorite_team once (JWT required, 409 if already set)
"""

import os
import psycopg2
import psycopg2.extras
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity,
)
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

auth_bp = Blueprint("auth", __name__)


# ── DB helpers ────────────────────────────────────────────────

def get_conn():
    return psycopg2.connect(
        DATABASE_URL,
        cursor_factory=psycopg2.extras.RealDictCursor
    )


def get_user_by_id(user_id):
    conn = get_conn()
    cur  = conn.cursor()
    cur.execute(
        "SELECT id, username, email, favorite_team FROM auth_users WHERE id = %s",
        (user_id,)
    )
    row = cur.fetchone()
    cur.close()
    conn.close()
    return dict(row) if row else None


def format_user(row):
    """Return only safe fields — never expose password_hash."""
    return {
        "id":            row["id"],
        "username":      row["username"],
        "email":         row["email"],
        "favorite_team": row["favorite_team"],
    }


# ── POST /auth/register ───────────────────────────────────────

@auth_bp.route("/register", methods=["POST"])
def register():
    data     = request.get_json() or {}
    username = (data.get("username") or "").strip()
    email    = (data.get("email")    or "").strip().lower()
    password = data.get("password", "")

    if not username or not email or not password:
        return jsonify({"error": "username, email, and password are required"}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    password_hash = generate_password_hash(password)

    try:
        conn = get_conn()
        cur  = conn.cursor()
        cur.execute(
            """
            INSERT INTO auth_users (username, email, password_hash)
            VALUES (%s, %s, %s)
            RETURNING id, username, email, favorite_team
            """,
            (username, email, password_hash)
        )
        row = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
    except psycopg2.errors.UniqueViolation:
        return jsonify({"error": "Email or username already in use"}), 409
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    user         = dict(row)
    access_token = create_access_token(identity=str(user["id"]))

    return jsonify({
        "user":         format_user(user),
        "access_token": access_token,
    }), 201


# ── POST /auth/login ──────────────────────────────────────────

@auth_bp.route("/login", methods=["POST"])
def login():
    data     = request.get_json() or {}
    email    = (data.get("email")    or "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "email and password are required"}), 400

    try:
        conn = get_conn()
        cur  = conn.cursor()
        cur.execute(
            "SELECT id, username, email, password_hash, favorite_team FROM auth_users WHERE email = %s",
            (email,)
        )
        row = cur.fetchone()
        cur.close()
        conn.close()
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    if not row or not check_password_hash(row["password_hash"], password):
        return jsonify({"error": "Invalid email or password"}), 401

    user         = dict(row)
    access_token = create_access_token(identity=str(user["id"]))

    return jsonify({
        "user":         format_user(user),
        "access_token": access_token,
    }), 200


# ── GET /auth/me ──────────────────────────────────────────────

@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user_id = get_jwt_identity()
    user    = get_user_by_id(int(user_id))
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"user": user}), 200


# ── POST /auth/select-team ────────────────────────────────────

@auth_bp.route("/select-team", methods=["POST"])
@jwt_required()
def select_team():
    user_id   = get_jwt_identity()
    data      = request.get_json() or {}
    team_name = (data.get("team_name") or "").strip()

    if not team_name:
        return jsonify({"error": "team_name is required"}), 400

    try:
        conn = get_conn()
        cur  = conn.cursor()

        # Check if team already set — one-time only
        cur.execute(
            "SELECT favorite_team FROM auth_users WHERE id = %s",
            (int(user_id),)
        )
        row = cur.fetchone()
        if not row:
            cur.close()
            conn.close()
            return jsonify({"error": "User not found"}), 404

        if row["favorite_team"] is not None:
            cur.close()
            conn.close()
            return jsonify({"error": "Team already selected and cannot be changed"}), 409

        # Save it
        cur.execute(
            "UPDATE auth_users SET favorite_team = %s WHERE id = %s RETURNING favorite_team",
            (team_name, int(user_id))
        )
        updated = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    return jsonify({
        "success":      True,
        "favorite_team": updated["favorite_team"],
    }), 200
