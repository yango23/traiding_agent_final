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
    """Creates the tables if they do not exist."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Users table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
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
    
    conn.commit()
    conn.close()

# -------------------------------------------------------------------------
# Password Hashing & Security Helpers
# -------------------------------------------------------------------------
def _hash_pwd(password: str, salt: bytes = None) -> tuple[str, str]:
    """Hashes a password using PBKDF2-HMAC-SHA256."""
    if salt is None:
        salt = secrets.token_bytes(16)
    # 100k iterations is secure and fast enough for a dashboard
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
    """Registers a new user, returning their ID. Raises ValueError on duplicate email."""
    email = email.strip().lower()
    if not email or not password:
        raise ValueError("Email and password are required")
        
    password_hash, salt = _hash_pwd(password)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO users (email, password_hash, salt) VALUES (?, ?, ?);",
            (email, password_hash, salt)
        )
        user_id = cursor.lastrowid
        conn.commit()
        return user_id
    except sqlite3.IntegrityError:
        raise ValueError("Email is already registered")
    finally:
        conn.close()

def login_user(email: str, password: str) -> str:
    """Logs in a user and returns a secure session token. Raises ValueError on invalid credentials."""
    email = email.strip().lower()
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, password_hash, salt FROM users WHERE email = ?;", (email,))
    user = cursor.fetchone()
    if not user:
        conn.close()
        raise ValueError("Invalid email or password")
        
    user_id = user["id"]
    stored_hash = user["password_hash"]
    stored_salt = user["salt"]
    
    if not _verify_pwd(password, stored_salt, stored_hash):
        conn.close()
        raise ValueError("Invalid email or password")
        
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
        # Session expired, purge it
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
# Chat History Sync Operations
# -------------------------------------------------------------------------
def save_chat_message(user_id: int, coin_id: str, role: str, content: str):
    """Saves a single chat message for the user."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO chat_history (user_id, coin_id, role, content) VALUES (?, ?, ?, ?);",
        (user_id, coin_id.lower().strip(), role, content)
    )
    conn.commit()
    conn.close()

def get_chat_history(user_id: int, coin_id: str) -> list[dict]:
    """Returns all chat messages for a user and coin."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT role, content FROM chat_history WHERE user_id = ? AND coin_id = ? ORDER BY id ASC;",
        (user_id, coin_id.lower().strip())
    )
    history = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return history

def clear_chat_history(user_id: int, coin_id: str):
    """Deletes all chat messages for a user and coin."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "DELETE FROM chat_history WHERE user_id = ? AND coin_id = ?;",
        (user_id, coin_id.lower().strip())
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
