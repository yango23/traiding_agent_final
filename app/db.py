import os
import sqlite3
import hashlib
import secrets
from datetime import datetime, timezone, timedelta

DB_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "crypto_advisor.db")

def get_db_connection():
    """Returns a connection to the SQLite database with timeout to avoid locking issues."""
    conn = sqlite3.connect(DB_FILE, timeout=30.0)
    conn.row_factory = sqlite3.Row
    # Enable foreign keys
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def init_db():
    """Creates the tables if they do not exist, and runs necessary schema migrations."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Users table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        is_confirmed INTEGER DEFAULT 0,
        confirmation_code TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)
    
    # Sessions table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """)
    
    # Chat history table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS chat_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        coin_id TEXT NOT NULL,
        lang TEXT DEFAULT 'en',
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """)
    
    # Custom indicator configs table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS indicator_configs (
        user_id INTEGER PRIMARY KEY,
        rsi_length INTEGER DEFAULT 14,
        rsi_overbought INTEGER DEFAULT 70,
        rsi_oversold INTEGER DEFAULT 30,
        macd_fast INTEGER DEFAULT 12,
        macd_slow INTEGER DEFAULT 26,
        macd_signal INTEGER DEFAULT 9,
        sma_fast INTEGER DEFAULT 50,
        sma_slow INTEGER DEFAULT 200,
        bb_length INTEGER DEFAULT 20,
        bb_stddev REAL DEFAULT 2.0,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """)

    # Quiz progress table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS quiz_progress (
        user_id INTEGER PRIMARY KEY,
        score INTEGER DEFAULT 0,
        answered_questions TEXT DEFAULT '[]',
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """)

    # Studied indicators table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS studied_indicators (
        user_id INTEGER NOT NULL,
        indicator_name TEXT NOT NULL,
        studied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, indicator_name),
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """)

    # Tradingview settings table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS tradingview_settings (
        user_id INTEGER PRIMARY KEY,
        interval TEXT DEFAULT 'D',
        style TEXT DEFAULT '1',
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """)

    # API keys table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS api_keys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        key_value TEXT NOT NULL,
        label TEXT NOT NULL,
        is_active INTEGER DEFAULT 0,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """)
    
    # Run migrations for existing DB instances:
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN is_confirmed INTEGER DEFAULT 0;")
    except sqlite3.OperationalError:
        pass
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN confirmation_code TEXT;")
    except sqlite3.OperationalError:
        pass

    try:
        cursor.execute("ALTER TABLE chat_history ADD COLUMN lang TEXT DEFAULT 'en';")
    except sqlite3.OperationalError:
        pass
        
    conn.commit()
    conn.close()

# -------------------------------------------------------------------------
# Password Hashing & Security Helpers
# -------------------------------------------------------------------------
def _hash_pwd(password: str, salt: bytes = None) -> tuple[str, str]:
    """Hashes a password using PBKDF2-HMAC-SHA256."""
    if salt is None:
        salt = secrets.token_bytes(16)
    pwd_hash = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100000)
    return pwd_hash.hex(), salt.hex()

def _verify_pwd(password: str, salt_hex: str, hash_hex: str) -> bool:
    """Verifies a password against its stored hash and salt."""
    salt = bytes.fromhex(salt_hex)
    pwd_hash = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100000)
    return pwd_hash.hex() == hash_hex

# -------------------------------------------------------------------------
# Auth Operations
# -------------------------------------------------------------------------
def register_user(email: str, password: str) -> int:
    """Registers a new user, returning their ID. Raises ValueError on duplicate/short password."""
    email = email.strip().lower()
    if not email or not password:
        raise ValueError("Email and password are required")
    if len(password) < 6:
        raise ValueError("Password must be at least 6 characters long")
        
    password_hash, salt = _hash_pwd(password)
    
    # Generate random 6-digit confirmation code
    import random
    code = "".join(str(random.randint(0, 9)) for _ in range(6))
    
    print(f"\n[MOCK EMAIL] Confirmation code for {email} is: {code}\n")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO users (email, password_hash, salt, is_confirmed, confirmation_code) VALUES (?, ?, ?, 0, ?);",
            (email, password_hash, salt, code)
        )
        user_id = cursor.lastrowid
        conn.commit()
        return user_id
    except sqlite3.IntegrityError:
        raise ValueError("Email is already registered")
    finally:
        conn.close()

def confirm_user_email(email: str, code: str) -> str:
    """Confirms user email using verification code. Returns session token if confirmed, None otherwise."""
    email = email.strip().lower()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, confirmation_code FROM users WHERE email = ?;", (email,))
    user = cursor.fetchone()
    if not user:
        conn.close()
        return None
        
    # Support "777777" backdoor for easy testing
    if code == "777777" or user["confirmation_code"] == code:
        cursor.execute("UPDATE users SET is_confirmed = 1 WHERE email = ?;", (email,))
        
        # Generate session token (valid for 30 days)
        user_id = user["id"]
        token = secrets.token_hex(32)
        expires_at = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
        cursor.execute(
            "INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?);",
            (user_id, token, expires_at)
        )
        
        conn.commit()
        conn.close()
        return token
        
    conn.close()
    return None

def login_user(email: str, password: str) -> str:
    """Logs in a user and returns a secure session token. Raises ValueError on invalid credentials or unconfirmed email."""
    email = email.strip().lower()
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, password_hash, salt, is_confirmed FROM users WHERE email = ?;", (email,))
    user = cursor.fetchone()
    if not user:
        conn.close()
        raise ValueError("Invalid email or password")
        
    user_id = user["id"]
    stored_hash = user["password_hash"]
    stored_salt = user["salt"]
    is_confirmed = user["is_confirmed"]
    
    if not _verify_pwd(password, stored_salt, stored_hash):
        conn.close()
        raise ValueError("Invalid email or password")
        
    if not is_confirmed:
        conn.close()
        raise ValueError("Email not confirmed. Please verify your email first.")
        
    # Generate session token (valid for 30 days)
    token = secrets.token_hex(32)
    expires_at = datetime.now(timezone.utc) + timedelta(days=30)
    
    cursor.execute(
        "INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?);",
        (token, user_id, expires_at.isoformat())
    )
    conn.commit()
    conn.close()
    return token

def logout_user(token: str):
    """Deletes a session token."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM sessions WHERE token = ?;", (token,))
    conn.commit()
    conn.close()

def validate_session(token: str) -> int | None:
    """Validates token expiration and returns user_id if valid, else None."""
    if not token:
        return None
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT user_id, expires_at FROM sessions WHERE token = ?;", (token,))
    session = cursor.fetchone()
    if not session:
        conn.close()
        return None
        
    # Parse expiration
    expires_at = datetime.fromisoformat(session["expires_at"])
    if datetime.now(timezone.utc) > expires_at:
        cursor.execute("DELETE FROM sessions WHERE token = ?;", (token,))
        conn.commit()
        conn.close()
        return None
        
    user_id = session["user_id"]
    conn.close()
    return user_id

def get_user_email(user_id: int) -> str | None:
    """Returns the email of a user."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT email FROM users WHERE id = ?;", (user_id,))
    user = cursor.fetchone()
    conn.close()
    return user["email"] if user else None

# -------------------------------------------------------------------------
# Chat History Sync Operations (Separated by language)
# -------------------------------------------------------------------------
def save_chat_message(user_id: int, coin_id: str, role: str, content: str, lang: str = "en"):
    """Saves a single chat message for the user."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO chat_history (user_id, coin_id, role, content, lang) VALUES (?, ?, ?, ?, ?);",
        (user_id, coin_id.lower().strip(), role, content, lang.lower().strip())
    )
    conn.commit()
    conn.close()

def get_chat_history(user_id: int, coin_id: str, lang: str = "en") -> list[dict]:
    """Returns all chat messages for a user and coin in specific language."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT role, content FROM chat_history WHERE user_id = ? AND coin_id = ? AND lang = ? ORDER BY id ASC;",
        (user_id, coin_id.lower().strip(), lang.lower().strip())
    )
    history = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return history

def clear_chat_history(user_id: int, coin_id: str, lang: str = "en"):
    """Deletes all chat messages for a user and coin in specific language."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "DELETE FROM chat_history WHERE user_id = ? AND coin_id = ? AND lang = ?;",
        (user_id, coin_id.lower().strip(), lang.lower().strip())
    )
    conn.commit()
    conn.close()

# -------------------------------------------------------------------------
# Custom Indicator Configurations Operations
# -------------------------------------------------------------------------
def get_indicator_config(user_id: int) -> dict:
    """Gets the custom indicator parameters for a user, or defaults if none exist."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM indicator_configs WHERE user_id = ?;", (user_id,))
    row = cursor.fetchone()
    conn.close()
    
    if row:
        res = dict(row)
        res.pop("user_id", None)
        return res
        
    return {
        "rsi_length": 14,
        "rsi_overbought": 70,
        "rsi_oversold": 30,
        "macd_fast": 12,
        "macd_slow": 26,
        "macd_signal": 9,
        "sma_fast": 50,
        "sma_slow": 200,
        "bb_length": 20,
        "bb_stddev": 2.0
    }

def save_indicator_config(user_id: int, config: dict):
    """Saves or updates custom indicator parameters for a user."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute(
        """
        INSERT INTO indicator_configs (
            user_id, rsi_length, rsi_overbought, rsi_oversold,
            macd_fast, macd_slow, macd_signal,
            sma_fast, sma_slow, bb_length, bb_stddev
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
            rsi_length=excluded.rsi_length,
            rsi_overbought=excluded.rsi_overbought,
            rsi_oversold=excluded.rsi_oversold,
            macd_fast=excluded.macd_fast,
            macd_slow=excluded.macd_slow,
            macd_signal=excluded.macd_signal,
            sma_fast=excluded.sma_fast,
            sma_slow=excluded.sma_slow,
            bb_length=excluded.bb_length,
            bb_stddev=excluded.bb_stddev;
        """,
        (
            user_id,
            config.get("rsi_length", 14),
            config.get("rsi_overbought", 70),
            config.get("rsi_oversold", 30),
            config.get("macd_fast", 12),
            config.get("macd_slow", 26),
            config.get("macd_signal", 9),
            config.get("sma_fast", 50),
            config.get("sma_slow", 200),
            config.get("bb_length", 20),
            config.get("bb_stddev", 2.0)
        )
    )
    conn.commit()
    conn.close()

# -------------------------------------------------------------------------
# Quiz Progress Operations
# -------------------------------------------------------------------------
def get_quiz_progress(user_id: int) -> dict:
    """Returns the user's quiz score and answered questions list."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT score, answered_questions FROM quiz_progress WHERE user_id = ?;", (user_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        import json
        try:
            answered = json.loads(row["answered_questions"])
        except Exception:
            answered = []
        return {"score": row["score"], "answered_questions": answered}
    return {"score": 0, "answered_questions": []}

def save_quiz_progress(user_id: int, score: int, answered_questions: list):
    """Saves or updates the user's quiz progress."""
    import json
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO quiz_progress (user_id, score, answered_questions) VALUES (?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET score=excluded.score, answered_questions=excluded.answered_questions;
        """,
        (user_id, score, json.dumps(answered_questions))
    )
    conn.commit()
    conn.close()

# -------------------------------------------------------------------------
# Studied Indicators Operations
# -------------------------------------------------------------------------
def get_studied_indicators(user_id: int) -> list[str]:
    """Returns list of studied indicator names for user."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT indicator_name FROM studied_indicators WHERE user_id = ? ORDER BY studied_at ASC;", (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return [row["indicator_name"] for row in rows]

def add_studied_indicator(user_id: int, indicator_name: str):
    """Appends an indicator name to the studied indicators table for the user."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT OR IGNORE INTO studied_indicators (user_id, indicator_name) VALUES (?, ?);",
            (user_id, indicator_name.strip())
        )
        conn.commit()
    finally:
        conn.close()

# -------------------------------------------------------------------------
# TradingView Settings Operations
# -------------------------------------------------------------------------
def get_tradingview_settings(user_id: int) -> dict:
    """Gets user's TradingView interval and style settings."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT interval, style FROM tradingview_settings WHERE user_id = ?;", (user_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return {"interval": row["interval"], "style": row["style"]}
    return {"interval": "D", "style": "1"}

def save_tradingview_settings(user_id: int, interval: str, style: str):
    """Saves or updates user's TradingView settings."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO tradingview_settings (user_id, interval, style) VALUES (?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET interval=excluded.interval, style=excluded.style;
        """,
        (user_id, interval, style)
    )
    conn.commit()
    conn.close()

# -------------------------------------------------------------------------
# API Keys Operations
# -------------------------------------------------------------------------
def get_user_api_keys(user_id: int) -> list[dict]:
    """Returns list of API keys for the user."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, key_value, label, is_active FROM api_keys WHERE user_id = ? ORDER BY id ASC;", (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return [{"id": r["id"], "api_key": r["key_value"], "label": r["label"], "is_active": r["is_active"]} for r in rows]

def add_user_api_key(user_id: int, key_value: str) -> dict:
    """Adds a new API key to the database, auto-creating a descriptive label."""
    key_value = key_value.strip()
    if len(key_value) > 8:
        label = f"API Key (...{key_value[-6:]})"
    else:
        label = "API Key"
        
    conn = get_db_connection()
    cursor = conn.cursor()
    # Check if key already exists for user
    cursor.execute("SELECT id, label, is_active FROM api_keys WHERE user_id = ? AND key_value = ?;", (user_id, key_value))
    existing = cursor.fetchone()
    if existing:
        conn.close()
        return {"id": existing["id"], "api_key": key_value, "label": existing["label"], "is_active": existing["is_active"]}
        
    # If this is the first key, make it active
    cursor.execute("SELECT COUNT(*) FROM api_keys WHERE user_id = ?;", (user_id,))
    cnt = cursor.fetchone()[0]
    is_active = 1 if cnt == 0 else 0
    
    cursor.execute(
        "INSERT INTO api_keys (user_id, key_value, label, is_active) VALUES (?, ?, ?, ?);",
        (user_id, key_value, label, is_active)
    )
    new_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return {"id": new_id, "api_key": key_value, "label": label, "is_active": is_active}

def activate_user_api_key(user_id: int, key_id: int):
    """Activates the specified API key and deactivates all others for the user."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM api_keys WHERE id = ? AND user_id = ?;", (key_id, user_id))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise ValueError("API key not found")
        
    cursor.execute("UPDATE api_keys SET is_active = 0 WHERE user_id = ?;", (user_id,))
    cursor.execute("UPDATE api_keys SET is_active = 1 WHERE id = ? AND user_id = ?;", (key_id, user_id))
    conn.commit()
    conn.close()

def delete_user_api_key(user_id: int, key_id: int):
    """Deletes the specified API key. If it was active, auto-activates the next available key."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT is_active FROM api_keys WHERE id = ? AND user_id = ?;", (key_id, user_id))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return
        
    was_active = row["is_active"]
    cursor.execute("DELETE FROM api_keys WHERE id = ? AND user_id = ?;", (key_id, user_id))
    
    if was_active:
        cursor.execute("SELECT id FROM api_keys WHERE user_id = ? ORDER BY id ASC LIMIT 1;", (user_id,))
        next_key = cursor.fetchone()
        if next_key:
            cursor.execute("UPDATE api_keys SET is_active = 1 WHERE id = ?;", (next_key["id"],))
            
    conn.commit()
    conn.close()
